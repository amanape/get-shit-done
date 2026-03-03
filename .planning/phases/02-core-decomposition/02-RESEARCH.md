# Phase 2: Core Decomposition - Research

**Researched:** 2026-03-03
**Domain:** CJS module decomposition — extracting domain utilities from a multi-responsibility hub module into independently importable leaf modules
**Confidence:** HIGH

## Summary

`core.cjs` is a 428-line hub module that currently serves four distinct responsibilities: (1) phase filesystem utilities, (2) roadmap/milestone context utilities, (3) model profile resolution, and (4) re-exporting utilities from the already-extracted Phase 1 leaf modules (`utils/git.cjs`, `utils/io.cjs`, `utils/output.cjs`, `utils/paths.cjs`). The goal of Phase 2 is to reduce `core.cjs` to responsibility (4) only — a thin re-export facade — by extracting the first three into dedicated, independently importable modules.

The most nuanced requirement is CORE-05: `writeStateMd` currently lives in `state.cjs`, and `phase.cjs` imports it from there. `state.cjs` in turn imports `loadConfig`, `getMilestoneInfo`, and `getMilestonePhaseFilter` from `core.cjs`. Once those functions migrate out of `core.cjs` into their own modules, the `phase → state` import chain must still be safe. The fix is to extract `writeStateMd` (plus its sync helpers) from `state.cjs` into a new `state/frontmatter-sync.cjs` module so that `phase.cjs` can import it without pulling in all of `state.cjs`. This is the only non-trivial dependency-graph concern in the phase.

madge confirms zero circular dependencies currently exist across the lib. The baseline test suite passes at 528 tests / 0 failures. Both conditions must remain true after every extraction PR.

**Primary recommendation:** Extract in dependency order — `phase-utils.cjs` first (no new deps), then `milestone-utils.cjs` (may need `paths.cjs`), then `model.cjs` (needs `paths.cjs` for `loadConfig`), then `frontmatter-sync.cjs` (needs `frontmatter.cjs`), then reduce `core.cjs` to a re-export facade. Update consumers last.

<phase_requirements>
## Phase Requirements

| ID | Description | Research Support |
|----|-------------|-----------------|
| CORE-01 | Extract phase-related utilities from `core.cjs` into `phase-utils.cjs` | Functions identified: `escapeRegex`, `normalizePhaseName`, `comparePhaseNum`, `searchPhaseInDir`, `findPhaseInternal`, `getArchivedPhaseDirs`. These are self-contained — depend only on `fs`, `path`, and `utils/paths.cjs`. |
| CORE-02 | Extract milestone-related utilities from `core.cjs` into `milestone-utils.cjs` | Functions identified: `getMilestoneInfo`, `getMilestonePhaseFilter`, `generateSlugInternal`, `pathExistsInternal`, `toPosixPath`. These depend on `fs`, `path`, and `utils/paths.cjs` only. |
| CORE-03 | Extract model profile logic from `core.cjs` into `model.cjs` | Functions identified: `MODEL_PROFILES` (const), `loadConfig`, `resolveModelInternal`. `loadConfig` uses `_configPath` from `utils/paths.cjs` and `fs`. No circular risk. |
| CORE-04 | Reduce `core.cjs` to a thin re-export facade | After CORE-01–03, `core.cjs` exports only re-exports from `utils/` leaf modules plus re-exports from the three new domain modules. Zero logic, zero `require`-time side effects. |
| CORE-05 | Resolve `writeStateMd` cross-file dependency (extract `frontmatter-sync.cjs`) | `phase.cjs` imports `writeStateMd` from `state.cjs`; `state.cjs` imports from `core.cjs`. Solution: extract `writeStateMd`, `syncStateFrontmatter`, `buildStateFrontmatter`, `stripFrontmatter` into `state/frontmatter-sync.cjs`. `phase.cjs` then imports from `state/frontmatter-sync.cjs` directly. `state.cjs` re-exports `writeStateMd` for backward compatibility. |
</phase_requirements>

## Standard Stack

### Core

| Library | Version | Purpose | Why Standard |
|---------|---------|---------|--------------|
| Node.js `fs` | built-in | File system reads/writes | Already in use throughout codebase |
| Node.js `path` | built-in | Cross-platform path joining | Already in use throughout codebase |
| Node.js `node:test` | built-in (Node 18+) | Test runner for new test files | Existing test infrastructure uses this exclusively |
| `madge` | 8.0.0 (via npx) | Circular dependency verification | Used in CI gate; already installed globally |

### Supporting

| Library | Version | Purpose | When to Use |
|---------|---------|---------|-------------|
| `node:assert` | built-in | Assertions in tests | Every test file uses this |
| `c8` | project devDep | Coverage reporting | Used via `npm run test:coverage` |

### Alternatives Considered

| Instead of | Could Use | Tradeoff |
|------------|-----------|----------|
| Manual extraction | Automated codemods | Manual is safer here — files are small and the logic is domain-specific; codemods would add tooling overhead for no gain |
| Single PR per module | One big PR | Single-PR-per-extraction approach is the established project pattern (PRs for 01-01 through 01-05); keep it |

**Installation:** No new packages required. All tooling is built-in or already present.

## Architecture Patterns

### Recommended Project Structure

After Phase 2 completes:

```
get-shit-done/bin/lib/
├── utils/                    # Phase 1 leaf modules (no domain knowledge)
│   ├── git.cjs
│   ├── io.cjs
│   ├── output.cjs
│   └── paths.cjs
├── state/                    # New: state sub-modules (CORE-05)
│   └── frontmatter-sync.cjs  # writeStateMd + sync helpers
├── core.cjs                  # Thin re-export facade (CORE-04)
├── phase-utils.cjs           # Phase filesystem utilities (CORE-01)
├── milestone-utils.cjs       # Roadmap/milestone context utilities (CORE-02)
├── model.cjs                 # Model profile resolution + loadConfig (CORE-03)
├── phase.cjs                 # Unchanged import surface, now imports from new modules
├── state.cjs                 # Unchanged import surface, re-exports writeStateMd
└── [other domain files...]
```

### Pattern 1: Extract-Then-Redirect (Thin Facade)

**What:** Create the new module with the full implementation. Update `core.cjs` to `require` the new module and re-export the same names. All existing consumers of `core.cjs` continue to work without changes until a separate consumer-migration PR.

**When to use:** For CORE-01, CORE-02, CORE-03. Decouples the extraction from the consumer migration, making each PR reviewable and safe.

**Example:**

```javascript
// phase-utils.cjs (new file)
const fs = require('node:fs');
const path = require('node:path');
const { phasesDir: _phasesDir, planningDir: _planningDir } = require('./utils/paths.cjs');

function escapeRegex(value) { ... }
function normalizePhaseName(phase) { ... }
// ... all phase utility functions

module.exports = { escapeRegex, normalizePhaseName, comparePhaseNum,
                   searchPhaseInDir, findPhaseInternal, getArchivedPhaseDirs };
```

```javascript
// core.cjs (after extraction — re-export bridge)
const { escapeRegex, normalizePhaseName, comparePhaseNum,
        searchPhaseInDir, findPhaseInternal, getArchivedPhaseDirs } = require('./phase-utils.cjs');
// ... other re-exports

module.exports = { escapeRegex, normalizePhaseName, ... }; // same surface as before
```

### Pattern 2: Subdirectory Sub-Module (CORE-05 Only)

**What:** Place `frontmatter-sync.cjs` under `state/` to signal it is an internal sub-module of the state domain, not a peer module at the lib root.

**When to use:** Only for `frontmatter-sync.cjs`. Keeps the state domain's write-path logic co-located with state, avoids polluting the lib root with more top-level files.

**Example:**

```javascript
// state/frontmatter-sync.cjs (new file)
const fs = require('node:fs');
const { extractFrontmatter, reconstructFrontmatter } = require('../frontmatter.cjs');
// ... getMilestoneInfo imported from milestone-utils.cjs (not core.cjs)

function buildStateFrontmatter(bodyContent, cwd) { ... }
function syncStateFrontmatter(content, cwd) { ... }
function writeStateMd(statePath, content, cwd) { ... }

module.exports = { writeStateMd, syncStateFrontmatter, buildStateFrontmatter, stripFrontmatter };
```

```javascript
// state.cjs — keep re-exporting writeStateMd for backward compat
const { writeStateMd, ... } = require('./state/frontmatter-sync.cjs');
// ... rest of state.cjs unchanged
module.exports = { writeStateMd, ... }; // existing consumers unaffected
```

```javascript
// phase.cjs — update import source
const { writeStateMd } = require('./state/frontmatter-sync.cjs'); // was './state.cjs'
```

### Pattern 3: `node:` Protocol Prefix for Built-ins

**What:** Use `require('node:fs')` rather than `require('fs')` in all new modules.

**When to use:** All new modules created in this phase. This is an established project decision from Phase 1 (see STATE.md decision log).

**Anti-Patterns to Avoid**

- **Mixing extraction and consumer migration in one PR**: Makes the diff large and harder to review. Extract first, migrate consumers in a follow-up.
- **Leaving logic in `core.cjs` after extraction**: The facade must contain only `require` and `module.exports` statements — no function bodies, no `require`-time computations.
- **Importing from `core.cjs` inside the new leaf modules**: `phase-utils.cjs`, `milestone-utils.cjs`, `model.cjs` must not `require('./core.cjs')`. They must import directly from `utils/` leaf modules.
- **Solving CORE-05 before CORE-02/03**: `frontmatter-sync.cjs` uses `getMilestoneInfo` and `getMilestonePhaseFilter`. If those still live in `core.cjs` when frontmatter-sync.cjs is written, it creates a `state/frontmatter-sync → core` dependency that defeats the purpose. Extract milestone-utils.cjs first.

## Don't Hand-Roll

| Problem | Don't Build | Use Instead | Why |
|---------|-------------|-------------|-----|
| Circular dependency detection | Custom graph walker | `npx madge --circular` | madge is already present at v8.0.0; it handles CJS require() graphs correctly |
| Test isolation | Custom test sandbox | `os.tmpdir()` + `fs.mkdtempSync` pattern | Already established pattern in all test files; no framework overhead needed |
| Module re-export bridging | Proxy objects or Reflect | Direct destructure + re-export | CJS re-export via `const { fn } = require('./x')` + `module.exports = { fn }` is the proven pattern used in Phase 1 (core.cjs already does this for git/io/output/paths) |

**Key insight:** The extraction pattern is already proven in this codebase — core.cjs itself already does it for utils/git.cjs, utils/io.cjs, etc. Phase 2 applies the same pattern one level up for the domain-specific functions.

## Common Pitfalls

### Pitfall 1: `loadConfig` Depends on `_configPath` from `utils/paths.cjs`

**What goes wrong:** `model.cjs` extracts `loadConfig` but forgets to import `configPath` from `utils/paths.cjs`, leading to a runtime ReferenceError.
**Why it happens:** `loadConfig` uses `_configPath(cwd)` internally. The alias `_configPath` is declared at the top of `core.cjs` via the paths import. When copying `loadConfig` to `model.cjs`, the import must accompany it.
**How to avoid:** The new module must include `const { configPath: _configPath } = require('./utils/paths.cjs');`
**Warning signs:** `ReferenceError: _configPath is not defined` in test run.

### Pitfall 2: `buildStateFrontmatter` Uses `getMilestoneInfo` and `getMilestonePhaseFilter`

**What goes wrong:** `frontmatter-sync.cjs` is written before `milestone-utils.cjs` exists. It imports `getMilestoneInfo`/`getMilestonePhaseFilter` from `core.cjs`, creating `state/frontmatter-sync → core`, meaning `state.cjs` still transitively depends on `core.cjs` via a longer path.
**Why it happens:** `buildStateFrontmatter` in `state.cjs` (line 587, 602) calls `getMilestoneInfo` and `getMilestonePhaseFilter`. If these haven't moved to `milestone-utils.cjs` yet, `frontmatter-sync.cjs` has nowhere to import them from except `core.cjs`.
**How to avoid:** Complete CORE-02 (`milestone-utils.cjs`) before CORE-05 (`frontmatter-sync.cjs`). Then `frontmatter-sync.cjs` imports milestone utils from `./milestone-utils.cjs`.
**Warning signs:** `frontmatter-sync.cjs` has a `require('./core.cjs')` in it.

### Pitfall 3: Breaking the `toPosixPath` Export

**What goes wrong:** `toPosixPath` is currently exported from `core.cjs` and may have consumers outside the lib. Moving it to `milestone-utils.cjs` without keeping the re-export in the facade breaks those consumers.
**Why it happens:** `toPosixPath` is used inside `searchPhaseInDir` (phase-utils territory) but is also exported from `core.cjs`. It may have been placed there rather than in `utils/paths.cjs` for historical reasons.
**How to avoid:** Check all external consumers of `toPosixPath` before deciding its destination module. Since `searchPhaseInDir` uses it, placing it in `phase-utils.cjs` is cleanest; `core.cjs` facade re-exports it under the same name.
**Warning signs:** `TypeError: toPosixPath is not a function` in any consumer file.

### Pitfall 4: Consumer of `core.cjs` in `gsd-tools.cjs` Imports `error` (not a domain util)

**What goes wrong:** `gsd-tools.cjs` imports `error` from `./lib/core.cjs`. `error` is a re-export from `utils/output.cjs`. When the facade is thinned, if `error` is accidentally dropped from `module.exports`, the dispatcher breaks.
**Why it happens:** `error` is not a domain utility — it's a re-export bridge. It's easy to omit when rewriting the facade exports list.
**How to avoid:** Audit the full current `module.exports` of `core.cjs` (28 exports) and ensure every name appears in the new facade's `module.exports` list. Run full test suite after facade step.
**Warning signs:** `TypeError: error is not a function` at startup of `gsd-tools.cjs`.

### Pitfall 5: Tests Import Directly from `core.cjs`

**What goes wrong:** `tests/core.test.cjs` imports 15 named exports directly from `core.cjs`. If the facade's re-exports are incomplete or an export name changes, tests fail with `undefined is not a function`.
**Why it happens:** The test file tests `core.cjs` as the public API, not the new individual modules. This is intentional for backward-compat testing.
**How to avoid:** Keep `core.cjs` exporting all 28 current names after each step. Add new test files (e.g., `phase-utils.test.cjs`) only if testing module-internal behavior not covered by existing tests. Never delete exports from `core.cjs` during Phase 2 — that is Phase 3/4 work.
**Warning signs:** Any failure in `tests/core.test.cjs` during Phase 2.

## Code Examples

Verified patterns from this codebase (Phase 1 precedent):

### New Module Structure (Phase 1 pattern, from utils/git.cjs)

```javascript
// phase-utils.cjs — follow this pattern
const fs = require('node:fs');
const path = require('node:path');
const { phasesDir: _phasesDir, planningDir: _planningDir } = require('./utils/paths.cjs');

// ... function implementations (copied verbatim from core.cjs)

module.exports = {
  escapeRegex,
  normalizePhaseName,
  comparePhaseNum,
  searchPhaseInDir,
  findPhaseInternal,
  getArchivedPhaseDirs,
};
```

### Facade Re-export Pattern (already in core.cjs for utils)

```javascript
// core.cjs — after CORE-01 extraction
const { escapeRegex, normalizePhaseName, comparePhaseNum,
        searchPhaseInDir, findPhaseInternal, getArchivedPhaseDirs } = require('./phase-utils.cjs');

// ... other domain imports

module.exports = {
  // phase utilities (now re-exported from phase-utils.cjs)
  escapeRegex,
  normalizePhaseName,
  comparePhaseNum,
  searchPhaseInDir,
  findPhaseInternal,
  getArchivedPhaseDirs,
  // ... all other 22 exports unchanged
};
```

### frontmatter-sync.cjs Dependency Resolution

```javascript
// state/frontmatter-sync.cjs
const fs = require('node:fs');
const { phasesDir } = require('../utils/paths.cjs');
const { extractFrontmatter, reconstructFrontmatter } = require('../frontmatter.cjs');
// After CORE-02 is done:
const { getMilestoneInfo, getMilestonePhaseFilter } = require('../milestone-utils.cjs');

// Copy buildStateFrontmatter, syncStateFrontmatter, stripFrontmatter, writeStateMd
// verbatim from state.cjs — zero behavior change

module.exports = { writeStateMd, syncStateFrontmatter, buildStateFrontmatter, stripFrontmatter };
```

## State of the Art

| Old Approach | Current Approach | When Changed | Impact |
|--------------|------------------|--------------|--------|
| `require('fs')` bare specifier | `require('node:fs')` with node: prefix | Phase 1 decision (STATE.md) | Makes built-in vs. npm module boundary unambiguous |
| Monolithic core.cjs with all shared utilities | Phase 1: utils/ leaf modules extracted | Phase 1 complete | `core.cjs` now already delegates io/git/output/paths |
| Consumer imports from core.cjs (single import) | After Phase 2: consumers import from specific module | Phase 2 (consumer migration step) | Consumers gain fine-grained dependency graph |

**Deprecated/outdated:**
- Direct `require('./core.cjs')` for phase utilities: After Phase 2, prefer `require('./phase-utils.cjs')` in new code (existing consumers get migrated in a follow-up step or Phase 3).

## Open Questions

1. **Where does `toPosixPath` belong?**
   - What we know: It is exported from `core.cjs` and used in `searchPhaseInDir`. It could logically live in `utils/paths.cjs` (general path helper) or `phase-utils.cjs` (used by phase search).
   - What's unclear: Whether any consumer outside of `core.cjs` imports it directly, or whether it was already available in Phase 1 via `utils/paths.cjs`.
   - Recommendation: Place it in `phase-utils.cjs` (smallest change — it goes where it's used). The `core.cjs` facade re-exports it. If a later audit shows it belongs in `utils/paths.cjs`, that move is a separate PR.

2. **Should `loadConfig` stay in `model.cjs` or get its own `config.cjs`?**
   - What we know: CORE-03 says "model profile logic" into `model.cjs`. `loadConfig` is used by state.cjs, commands.cjs, init.cjs — it's broader than just model profiles.
   - What's unclear: Whether the planner interprets CORE-03 as "model.cjs contains only MODEL_PROFILES and resolveModelInternal" with `loadConfig` going elsewhere.
   - Recommendation: Follow the requirement literally — put `loadConfig`, `MODEL_PROFILES`, and `resolveModelInternal` all in `model.cjs`. `loadConfig` feeds `resolveModelInternal` and they are logically coupled. If separation is needed, that is a Phase 4 polish decision.

## Validation Architecture

### Test Framework

| Property | Value |
|----------|-------|
| Framework | Node.js built-in `node:test` |
| Config file | `scripts/run-tests.cjs` (custom runner) |
| Quick run command | `node --test tests/core.test.cjs` |
| Full suite command | `node scripts/run-tests.cjs` |

### Phase Requirements → Test Map

| Req ID | Behavior | Test Type | Automated Command | File Exists? |
|--------|----------|-----------|-------------------|-------------|
| CORE-01 | `phase-utils.cjs` exports all phase functions independently | unit | `node --test tests/core.test.cjs` (existing tests via facade) | Existing — `tests/core.test.cjs` covers all extracted functions via `core.cjs` facade |
| CORE-01 | `phase-utils.cjs` has no `require('./core.cjs')` dependency | structural | `npx madge --circular get-shit-done/bin/lib/phase-utils.cjs` | Wave 0: create module |
| CORE-02 | `milestone-utils.cjs` exports getMilestoneInfo, getMilestonePhaseFilter etc. independently | unit | `node --test tests/core.test.cjs` (existing tests via facade) | Existing — covered via facade |
| CORE-03 | `model.cjs` exports MODEL_PROFILES, loadConfig, resolveModelInternal independently | unit | `node --test tests/core.test.cjs` (existing tests via facade) | Existing — covered via facade |
| CORE-04 | `core.cjs` contains only re-export statements | structural | `node -e "const src = require('fs').readFileSync('./get-shit-done/bin/lib/core.cjs','utf-8'); console.log(src.includes('function ') ? 'FAIL' : 'PASS')"` | Wave 0: structural check script |
| CORE-05 | `state/frontmatter-sync.cjs` exists and `phase.cjs` imports writeStateMd from it | structural | `node -e "require('./get-shit-done/bin/lib/state/frontmatter-sync.cjs')"` | Wave 0: create module |
| CORE-05 | `phase.cjs` does not import from `state.cjs` for writeStateMd | structural | `node -e "const src=require('fs').readFileSync('./get-shit-done/bin/lib/phase.cjs','utf-8'); console.log(src.match(/writeStateMd.*state\.cjs/) ? 'FAIL':'PASS')"` | Wave 0: structural check |
| All | No circular dependencies | integration | `npx madge --circular get-shit-done/bin/lib/` | Existing tool |
| All | All 528 tests remain green | regression | `node scripts/run-tests.cjs` | Existing — 528 passing |

### Sampling Rate

- **Per task commit:** `node --test tests/core.test.cjs && npx madge --circular get-shit-done/bin/lib/`
- **Per wave merge:** `node scripts/run-tests.cjs`
- **Phase gate:** Full suite green (528/528) + `npx madge --circular` reports zero before `/gsd:verify-work`

### Wave 0 Gaps

- [ ] No new test files required — existing `tests/core.test.cjs` covers all extracted functions via the `core.cjs` facade (backward-compat testing strategy). New modules are validated structurally.
- [ ] Structural check for CORE-04 (facade purity) is a one-liner, not a test file. Wave 0 can inline this as a verify step in PLAN.md.

## Sources

### Primary (HIGH confidence)

- Direct code inspection: `get-shit-done/bin/lib/core.cjs` (428 lines) — full function inventory and export surface analyzed
- Direct code inspection: `get-shit-done/bin/lib/state.cjs` (735 lines) — `writeStateMd` and `buildStateFrontmatter` location confirmed; `getMilestoneInfo`/`getMilestonePhaseFilter` dependency confirmed at lines 587, 602
- Direct code inspection: `get-shit-done/bin/lib/phase.cjs` — `writeStateMd` import from `state.cjs` confirmed at line 11
- `npx madge --circular` output — zero circular dependencies confirmed across all lib files
- `node scripts/run-tests.cjs` output — 528 tests, 0 failures baseline confirmed
- `tests/core.test.cjs` (804 lines) — full test coverage of `core.cjs` exports inventoried; 15 named imports from `core.cjs` confirmed

### Secondary (MEDIUM confidence)

- `.planning/STATE.md` decision log — `node:` protocol prefix convention, Phase 1 extraction patterns, aliased import convention all confirmed as established project decisions

### Tertiary (LOW confidence)

- None. All claims are based on direct code inspection of the target codebase.

## Metadata

**Confidence breakdown:**
- Standard stack: HIGH — no new libraries; all tooling verified present in project
- Architecture: HIGH — extraction pattern is already proven in this codebase (Phase 1)
- Pitfalls: HIGH — derived from direct dependency graph analysis and code inspection, not speculation

**Research date:** 2026-03-03
**Valid until:** 2026-04-03 (stable refactoring domain; no external dependencies that could change)
