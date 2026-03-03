'use strict';

/**
 * utils/output.cjs — CLI output and error helpers
 *
 * Leaf module: imports only Node built-ins. No project file imports.
 */

const fs = require('node:fs');
const path = require('node:path');
const os = require('node:os');

/**
 * Write a result to stdout as JSON (or raw value) and exit 0.
 * Large payloads (>50KB) are written to a tmpfile; the path is emitted
 * with an "@file:" prefix so callers can detect and read it.
 *
 * @param {*} result
 * @param {boolean} [raw]
 * @param {*} [rawValue]
 */
function output(result, raw, rawValue) {
  if (raw && rawValue !== undefined) {
    process.stdout.write(String(rawValue));
  } else {
    const json = JSON.stringify(result, null, 2);
    // Large payloads exceed Claude Code's Bash tool buffer (~50KB).
    // Write to tmpfile and output the path prefixed with @file: so callers can detect it.
    if (json.length > 50000) {
      const tmpPath = path.join(os.tmpdir(), `gsd-${Date.now()}.json`);
      fs.writeFileSync(tmpPath, json, 'utf-8');
      process.stdout.write('@file:' + tmpPath);
    } else {
      process.stdout.write(json);
    }
  }
  process.exit(0);
}

/**
 * Write an error message to stderr and exit 1.
 *
 * @param {string} message
 */
function error(message) {
  process.stderr.write('Error: ' + message + '\n');
  process.exit(1);
}

module.exports = { output, error };
