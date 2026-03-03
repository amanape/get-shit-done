'use strict';

const { test, describe, beforeEach, afterEach } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');
const os = require('os');

// Module under test — will not exist yet (RED phase)
const { output, error } = require('../get-shit-done/bin/lib/utils/output.cjs');

let tmpDir;
let origStdoutWrite;
let origStderrWrite;
let origExit;

beforeEach(() => {
  tmpDir = fs.mkdtempSync(path.join(os.tmpdir(), 'gsd-test-'));
  origStdoutWrite = process.stdout.write.bind(process.stdout);
  origStderrWrite = process.stderr.write.bind(process.stderr);
  origExit = process.exit;
});

afterEach(() => {
  process.stdout.write = origStdoutWrite;
  process.stderr.write = origStderrWrite;
  process.exit = origExit;
  fs.rmSync(tmpDir, { recursive: true, force: true });
});

describe('utils/output.cjs', () => {
  describe('output()', () => {
    test('writes JSON to stdout for normal result', () => {
      const captured = [];
      let exitCode = null;

      process.stdout.write = (chunk) => { captured.push(String(chunk)); return true; };
      process.exit = (code) => { exitCode = code; };

      const data = { hello: 'world', num: 42 };
      output(data, false, undefined);

      assert.strictEqual(exitCode, 0, 'should call process.exit(0)');
      assert.ok(captured.length > 0, 'should write to stdout');
      const written = captured.join('');
      const parsed = JSON.parse(written);
      assert.deepStrictEqual(parsed, data);
    });

    test('writes rawValue to stdout in raw mode', () => {
      const captured = [];
      let exitCode = null;

      process.stdout.write = (chunk) => { captured.push(String(chunk)); return true; };
      process.exit = (code) => { exitCode = code; };

      output(null, true, 'raw-string-value');

      assert.strictEqual(exitCode, 0);
      assert.strictEqual(captured.join(''), 'raw-string-value');
    });

    test('writes to tmpfile and outputs @file: path for large JSON (>50KB)', () => {
      const captured = [];
      let exitCode = null;

      process.stdout.write = (chunk) => { captured.push(String(chunk)); return true; };
      process.exit = (code) => { exitCode = code; };

      // Generate a payload that exceeds 50000 characters when JSON-serialized
      const bigArray = new Array(5001).fill('x'.repeat(10));
      output(bigArray, false, undefined);

      assert.strictEqual(exitCode, 0);
      const written = captured.join('');
      assert.ok(written.startsWith('@file:'), `expected @file: prefix, got: ${written.slice(0, 80)}`);
      const tmpFilePath = written.slice('@file:'.length);
      assert.ok(fs.existsSync(tmpFilePath), 'tmpfile should exist');
      const content = fs.readFileSync(tmpFilePath, 'utf-8');
      const parsed = JSON.parse(content);
      assert.strictEqual(parsed.length, bigArray.length);
    });
  });

  describe('error()', () => {
    test('writes formatted error message to stderr and exits with 1', () => {
      const captured = [];
      let exitCode = null;

      process.stderr.write = (chunk) => { captured.push(String(chunk)); return true; };
      process.exit = (code) => { exitCode = code; };

      error('something went wrong');

      assert.strictEqual(exitCode, 1, 'should call process.exit(1)');
      assert.strictEqual(captured.join(''), 'Error: something went wrong\n');
    });
  });

  describe('leaf module check', () => {
    test('module has no require() calls to any project file', () => {
      const outputPath = path.join(__dirname, '..', 'get-shit-done', 'bin', 'lib', 'utils', 'output.cjs');
      const src = fs.readFileSync(outputPath, 'utf-8');
      const requireCalls = src.match(/require\(['"][^'"]+['"]\)/g) || [];
      for (const call of requireCalls) {
        const mod = call.match(/require\(['"]([^'"]+)['"]\)/)[1];
        assert.ok(
          !mod.startsWith('.') && !mod.startsWith('/'),
          `output.cjs must not require project file: ${mod}`
        );
      }
    });
  });
});
