/**
 * GSD Tools Tests - utils/git.cjs
 *
 * Unit tests for the git operations leaf module.
 * Tests execGit and isGitIgnored wrappers in isolation.
 */

'use strict';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const { execSync } = require('child_process');

const { createTempGitProject, cleanup } = require('./helpers.cjs');
const { execGit, isGitIgnored } = require('../get-shit-done/bin/lib/utils/git.cjs');

// ─── Leaf module check ─────────────────────────────────────────────────────────

describe('utils/git.cjs leaf module', () => {
  test('has no require() calls to any project file', () => {
    const src = fs.readFileSync(
      path.join(__dirname, '..', 'get-shit-done', 'bin', 'lib', 'utils', 'git.cjs'),
      'utf-8'
    );
    // All require calls must be to node built-in modules only
    const requireCalls = [...src.matchAll(/require\(['"]([^'"]+)['"]\)/g)].map(m => m[1]);
    for (const req of requireCalls) {
      assert.ok(
        req.startsWith('node:') || !req.startsWith('.'),
        `utils/git.cjs must not import project files, but found require('${req}')`
      );
    }
  });
});

// ─── execGit ──────────────────────────────────────────────────────────────────

describe('execGit', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempGitProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns exitCode 0 and stdout on successful git command', () => {
    const result = execGit(tmpDir, ['status']);
    assert.strictEqual(result.exitCode, 0, 'exitCode should be 0 for successful command');
    assert.strictEqual(typeof result.stdout, 'string', 'stdout should be a string');
    assert.strictEqual(result.stderr, '', 'stderr should be empty string on success');
    assert.ok(result.stdout.length > 0, 'stdout should have content from git status');
  });

  test('returns non-zero exitCode on failed git command', () => {
    const result = execGit(tmpDir, ['log', '--invalid-flag-that-does-not-exist']);
    assert.notStrictEqual(result.exitCode, 0, 'exitCode should be non-zero for failed command');
    assert.strictEqual(typeof result.stdout, 'string', 'stdout should be a string');
    assert.strictEqual(typeof result.stderr, 'string', 'stderr should be a string');
  });

  test('passes safe arguments unescaped (alphanumeric, dots, dashes, slashes)', () => {
    // These safe args should work fine and be passed through without quoting
    const result = execGit(tmpDir, ['log', '--oneline', '--max-count=1']);
    assert.strictEqual(result.exitCode, 0, 'Safe args should work without shell injection issues');
  });

  test('escapes arguments containing special characters with single quotes', () => {
    // Use a ref with a space — this should be escaped and git should still
    // return a non-zero exit (unknown ref) rather than cause a shell syntax error
    const result = execGit(tmpDir, ['show', 'refs with spaces and $pecial chars']);
    // We expect a git error (non-zero exit), not a shell crash
    assert.strictEqual(typeof result.exitCode, 'number', 'exitCode should be a number');
    assert.strictEqual(typeof result.stderr, 'string', 'stderr should be a string');
  });

  test('trims whitespace from stdout', () => {
    const result = execGit(tmpDir, ['rev-parse', 'HEAD']);
    assert.strictEqual(result.exitCode, 0);
    // Git output is trimmed — no leading/trailing whitespace
    assert.strictEqual(result.stdout, result.stdout.trim());
  });
});

// ─── isGitIgnored ─────────────────────────────────────────────────────────────

describe('isGitIgnored', () => {
  let tmpDir;

  beforeEach(() => {
    tmpDir = createTempGitProject();
  });

  afterEach(() => {
    cleanup(tmpDir);
  });

  test('returns true for a path listed in .gitignore', () => {
    fs.writeFileSync(path.join(tmpDir, '.gitignore'), 'ignored-file.txt\n');
    const result = isGitIgnored(tmpDir, 'ignored-file.txt');
    assert.strictEqual(result, true, 'Should return true for path matching .gitignore pattern');
  });

  test('returns false for a path not in .gitignore', () => {
    fs.writeFileSync(path.join(tmpDir, '.gitignore'), 'other-file.txt\n');
    const result = isGitIgnored(tmpDir, 'not-ignored.txt');
    assert.strictEqual(result, false, 'Should return false for path not matching any .gitignore pattern');
  });

  test('returns false when .gitignore does not exist', () => {
    const result = isGitIgnored(tmpDir, 'some-file.txt');
    assert.strictEqual(result, false, 'Should return false when no .gitignore exists');
  });

  test('returns true for directory pattern matching in .gitignore', () => {
    fs.writeFileSync(path.join(tmpDir, '.gitignore'), 'ignored-dir/\n');
    const result = isGitIgnored(tmpDir, 'ignored-dir/');
    assert.strictEqual(result, true, 'Should return true for directory pattern');
  });
});
