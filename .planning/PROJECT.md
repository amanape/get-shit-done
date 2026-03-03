# GSD Codebase Refactor

## What This Is

A systematic refactoring of GSD's .cjs tooling scripts (~6K lines across 12 source files) to improve code architecture, reduce duplication, and enhance readability. Delivered incrementally as focused PRs that each leave tests green. The target audience is current and future contributors who need to navigate, understand, and modify this codebase.

## Core Value

Every source file has a single clear responsibility, with shared patterns extracted into reusable utilities — so any contributor can find, understand, and safely modify code.

## Requirements

### Validated

(None yet — ship to validate)

### Active

- [ ] Extract duplicated patterns (file I/O, path resolution, JSON read/write) into shared utilities
- [ ] Break god files (phase.cjs 901L, verify.cjs 773L, state.cjs 732L, init.cjs 710L) into focused modules
- [ ] Improve naming — functions, variables, and files should communicate intent
- [ ] Reduce function sizes — long functions split into named, composable pieces
- [ ] Clarify module boundaries — each file does one thing, exports a clean API
- [ ] Existing tests stay green after each refactor PR (update tests when structure demands it)
- [ ] Maintain .cjs (CommonJS) format throughout — no module format migration

### Out of Scope

- TypeScript migration — adds format churn, not the goal here
- ESM migration — staying .cjs to keep scope focused
- New features or behavior changes — pure refactor
- Performance optimization — not the driver (but welcome side effects)
- Changing the CLI interface or command signatures — consumers shouldn't notice

## Context

The GSD project provides CLI tooling for Claude Code project planning and execution. The core logic lives in `get-shit-done/bin/lib/` with an entry point at `get-shit-done/bin/gsd-tools.cjs`.

**Current source files (by size):**
| File | Lines | Role |
|------|-------|------|
| phase.cjs | 901 | Phase management |
| verify.cjs | 773 | Verification logic |
| state.cjs | 732 | State management |
| init.cjs | 710 | Project initialization |
| gsd-tools.cjs | 592 | CLI entry/dispatcher |
| commands.cjs | 548 | Command execution |
| core.cjs | 483 | Core utilities |
| frontmatter.cjs | 299 | YAML frontmatter parsing |
| roadmap.cjs | 298 | Roadmap operations |
| milestone.cjs | 267 | Milestone management |
| template.cjs | 222 | Template handling |
| config.cjs | 162 | Config management |

**Test suite:** ~10K lines across 15 test files. Tests are the safety net — they must stay green through each refactor PR.

**Known issues:**
- God files doing too many things
- Duplicated patterns across files (file I/O, JSON handling, path resolution)
- Poor readability in large functions
- Unclear module boundaries

## Constraints

- **Format**: Stay .cjs (CommonJS) — no module format changes
- **Compatibility**: CLI interface and command behavior must not change
- **Incremental**: Each PR must be self-contained and leave tests passing
- **PR size**: Keep PRs reviewable — prefer smaller focused changes over massive rewrites

## Key Decisions

| Decision | Rationale | Outcome |
|----------|-----------|---------|
| Stay .cjs | Keeps scope focused on design, avoids format migration churn | — Pending |
| Bottom-up refactoring | Extract shared utilities first, then refactor consumers — safer and creates foundation | — Pending |
| PR-by-PR delivery | Reduces risk, keeps changes reviewable, allows course correction | — Pending |

---
*Last updated: 2026-03-03 after initialization*
