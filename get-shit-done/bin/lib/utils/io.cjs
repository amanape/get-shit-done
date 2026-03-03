'use strict';

/**
 * utils/io.cjs — Safe file system wrappers
 *
 * Leaf module: imports only Node built-ins. No project file imports.
 */

const fs = require('node:fs');

/**
 * Read a file as UTF-8 text. Returns null on any error.
 * @param {string} filePath
 * @returns {string|null}
 */
function safeReadFile(filePath) {
  try {
    return fs.readFileSync(filePath, 'utf-8');
  } catch {
    return null;
  }
}

/**
 * Write data to a file as UTF-8 text.
 * @param {string} filePath
 * @param {string} data
 */
function safeWrite(filePath, data) {
  fs.writeFileSync(filePath, data, 'utf-8');
}

/**
 * Check whether a path exists.
 * @param {string} filePath
 * @returns {boolean}
 */
function safeExists(filePath) {
  return fs.existsSync(filePath);
}

/**
 * Create a directory (and any missing parents) recursively.
 * @param {string} dirPath
 */
function safeMkdir(dirPath) {
  fs.mkdirSync(dirPath, { recursive: true });
}

/**
 * Read directory entries. Returns an empty array on any error.
 * @param {string} dirPath
 * @param {object} [opts]
 * @returns {string[]|import('fs').Dirent[]}
 */
function safeReaddir(dirPath, opts) {
  try {
    return fs.readdirSync(dirPath, opts);
  } catch {
    return [];
  }
}

/**
 * Stat a path. Returns null on any error.
 * @param {string} filePath
 * @returns {import('fs').Stats|null}
 */
function safeStat(filePath) {
  try {
    return fs.statSync(filePath);
  } catch {
    return null;
  }
}

module.exports = {
  safeReadFile,
  safeWrite,
  safeExists,
  safeMkdir,
  safeReaddir,
  safeStat,
};
