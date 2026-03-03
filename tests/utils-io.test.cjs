'use strict';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Module under test — will not exist yet (RED phase)
const {
  safeReadFile,
  safeWrite,
  safeExists,
  safeMkdir,
  safeReaddir,
  safeStat,
} = require('../get-shit-done/bin/lib/utils/io.cjs');

let tmpDir;
beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-test-'));
});
afterEach(() => {
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('utils/io.cjs', () => {
  describe('safeReadFile', () => {
    test('returns file contents for an existing file', () => {
      const filePath = path.join(tmpDir, 'hello.txt');
      fs.writeFileSync(filePath, 'hello world', 'utf-8');
      assert.strictEqual(safeReadFile(filePath), 'hello world');
    });

    test('returns null for a non-existent file', () => {
      const filePath = path.join(tmpDir, 'nonexistent.txt');
      assert.strictEqual(safeReadFile(filePath), null);
    });
  });

  describe('safeWrite', () => {
    test('creates a file with given contents', () => {
      const filePath = path.join(tmpDir, 'output.txt');
      safeWrite(filePath, 'test content');
      assert.strictEqual(fs.readFileSync(filePath, 'utf-8'), 'test content');
    });

    test('overwrites an existing file', () => {
      const filePath = path.join(tmpDir, 'output.txt');
      fs.writeFileSync(filePath, 'old content', 'utf-8');
      safeWrite(filePath, 'new content');
      assert.strictEqual(fs.readFileSync(filePath, 'utf-8'), 'new content');
    });
  });

  describe('safeExists', () => {
    test('returns true for an existing file', () => {
      const filePath = path.join(tmpDir, 'exists.txt');
      fs.writeFileSync(filePath, '', 'utf-8');
      assert.strictEqual(safeExists(filePath), true);
    });

    test('returns false for a missing file', () => {
      const filePath = path.join(tmpDir, 'missing.txt');
      assert.strictEqual(safeExists(filePath), false);
    });
  });

  describe('safeMkdir', () => {
    test('creates nested directories', () => {
      const dirPath = path.join(tmpDir, 'a', 'b', 'c');
      safeMkdir(dirPath);
      assert.ok(fs.existsSync(dirPath));
      assert.ok(fs.statSync(dirPath).isDirectory());
    });

    test('does not throw if directory already exists', () => {
      const dirPath = path.join(tmpDir, 'existing');
      fs.mkdirSync(dirPath);
      assert.doesNotThrow(() => safeMkdir(dirPath));
    });
  });

  describe('safeReaddir', () => {
    test('returns entries for an existing directory', () => {
      fs.writeFileSync(path.join(tmpDir, 'file1.txt'), '', 'utf-8');
      fs.writeFileSync(path.join(tmpDir, 'file2.txt'), '', 'utf-8');
      const entries = safeReaddir(tmpDir);
      assert.ok(Array.isArray(entries));
      assert.ok(entries.includes('file1.txt'));
      assert.ok(entries.includes('file2.txt'));
    });

    test('returns empty array for a non-existent directory', () => {
      const result = safeReaddir(path.join(tmpDir, 'no-such-dir'));
      assert.deepStrictEqual(result, []);
    });
  });

  describe('safeStat', () => {
    test('returns stats object for an existing file', () => {
      const filePath = path.join(tmpDir, 'stat-me.txt');
      fs.writeFileSync(filePath, 'data', 'utf-8');
      const stats = safeStat(filePath);
      assert.ok(stats !== null);
      assert.ok(typeof stats.size === 'number');
    });

    test('returns null for a missing file', () => {
      const result = safeStat(path.join(tmpDir, 'missing.txt'));
      assert.strictEqual(result, null);
    });
  });

  describe('leaf module check', () => {
    test('module has no require() calls to any project file', () => {
      const ioPath = path.join(__dirname, '..', 'get-shit-done', 'bin', 'lib', 'utils', 'io.cjs');
      const src = fs.readFileSync(ioPath, 'utf-8');
      // Should not require any sibling or parent project modules
      // Allowed: node:fs, fs, node:path, path, node:os, os
      const requireCalls = src.match(/require\(['"][^'"]+['"]\)/g) || [];
      for (const call of requireCalls) {
        const mod = call.match(/require\(['"]([^'"]+)['"]\)/)[1];
        // Must be a built-in node module (no relative paths to project files)
        assert.ok(
          !mod.startsWith('.') && !mod.startsWith('/'),
          `io.cjs must not require project file: ${mod}`
        );
      }
    });
  });
});
