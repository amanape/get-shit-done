'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const PATHS_MODULE = path.join(__dirname, '..', 'get-shit-done', 'bin', 'lib', 'utils', 'paths.cjs');

describe('utils/paths.cjs', () => {
  test('module loads without error', () => {
    const paths = require(PATHS_MODULE);
    assert.ok(paths, 'module should export an object');
  });

  test('planningDir returns correct path', () => {
    const { planningDir } = require(PATHS_MODULE);
    assert.strictEqual(planningDir('/project'), '/project/.planning');
  });

  test('phasesDir returns correct path', () => {
    const { phasesDir } = require(PATHS_MODULE);
    assert.strictEqual(phasesDir('/project'), '/project/.planning/phases');
  });

  test('roadmapPath returns correct path', () => {
    const { roadmapPath } = require(PATHS_MODULE);
    assert.strictEqual(roadmapPath('/project'), '/project/.planning/ROADMAP.md');
  });

  test('statePath returns correct path', () => {
    const { statePath } = require(PATHS_MODULE);
    assert.strictEqual(statePath('/project'), '/project/.planning/STATE.md');
  });

  test('configPath returns correct path', () => {
    const { configPath } = require(PATHS_MODULE);
    assert.strictEqual(configPath('/project'), '/project/.planning/config.json');
  });

  test('projectPath returns correct path', () => {
    const { projectPath } = require(PATHS_MODULE);
    assert.strictEqual(projectPath('/project'), '/project/.planning/PROJECT.md');
  });

  test('phaseDir returns correct path', () => {
    const { phaseDir } = require(PATHS_MODULE);
    assert.strictEqual(phaseDir('/project', '01-foundation'), '/project/.planning/phases/01-foundation');
  });

  test('toPosixPath converts backslashes to forward slashes', () => {
    const { toPosixPath } = require(PATHS_MODULE);
    assert.strictEqual(toPosixPath('a\\b\\c'), 'a/b/c');
  });

  test('toPosixPath is a no-op on forward-slash paths', () => {
    const { toPosixPath } = require(PATHS_MODULE);
    assert.strictEqual(toPosixPath('a/b/c'), 'a/b/c');
  });

  test('all expected functions are exported', () => {
    const paths = require(PATHS_MODULE);
    const expected = [
      'planningDir',
      'phasesDir',
      'roadmapPath',
      'statePath',
      'configPath',
      'projectPath',
      'phaseDir',
      'toPosixPath',
    ];
    for (const name of expected) {
      assert.strictEqual(typeof paths[name], 'function', `should export function ${name}`);
    }
  });

  test('module imports only from ../constants.cjs and node built-ins (no domain module imports)', () => {
    const source = fs.readFileSync(PATHS_MODULE, 'utf-8');
    // Extract all require() arguments
    const requirePattern = /require\(['"]([^'"]+)['"]\)/g;
    let match;
    const imports = [];
    while ((match = requirePattern.exec(source)) !== null) {
      imports.push(match[1]);
    }
    for (const imp of imports) {
      const isNodeBuiltin = imp.startsWith('node:') || !imp.startsWith('.');
      const isAllowedRelative = imp === '../constants.cjs';
      assert.ok(
        isNodeBuiltin || isAllowedRelative,
        `unexpected import: ${imp} — only node built-ins and ../constants.cjs are allowed`
      );
    }
  });
});
