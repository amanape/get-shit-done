'use strict';

const { test, describe } = require('node:test');
const assert = require('node:assert');
const fs = require('fs');
const path = require('path');

const CONSTANTS_PATH = path.join(__dirname, '..', 'get-shit-done', 'bin', 'lib', 'constants.cjs');

describe('constants.cjs', () => {
  test('module loads without error', () => {
    const constants = require(CONSTANTS_PATH);
    assert.ok(constants, 'module should export an object');
  });

  test('all expected constants are exported', () => {
    const constants = require(CONSTANTS_PATH);
    const expected = [
      'PLANNING_DIR',
      'PHASES_DIR',
      'MILESTONES_DIR',
      'ROADMAP_FILE',
      'STATE_FILE',
      'REQUIREMENTS_FILE',
      'CONFIG_FILE',
      'PROJECT_FILE',
    ];
    for (const name of expected) {
      assert.ok(Object.prototype.hasOwnProperty.call(constants, name), `should export ${name}`);
    }
  });

  test('each exported value is a non-empty string', () => {
    const constants = require(CONSTANTS_PATH);
    const expected = [
      'PLANNING_DIR',
      'PHASES_DIR',
      'MILESTONES_DIR',
      'ROADMAP_FILE',
      'STATE_FILE',
      'REQUIREMENTS_FILE',
      'CONFIG_FILE',
      'PROJECT_FILE',
    ];
    for (const name of expected) {
      assert.strictEqual(typeof constants[name], 'string', `${name} should be a string`);
      assert.ok(constants[name].length > 0, `${name} should be non-empty`);
    }
  });

  test('PLANNING_DIR equals ".planning"', () => {
    const { PLANNING_DIR } = require(CONSTANTS_PATH);
    assert.strictEqual(PLANNING_DIR, '.planning');
  });

  test('ROADMAP_FILE equals "ROADMAP.md"', () => {
    const { ROADMAP_FILE } = require(CONSTANTS_PATH);
    assert.strictEqual(ROADMAP_FILE, 'ROADMAP.md');
  });

  test('STATE_FILE equals "STATE.md"', () => {
    const { STATE_FILE } = require(CONSTANTS_PATH);
    assert.strictEqual(STATE_FILE, 'STATE.md');
  });

  test('CONFIG_FILE equals "config.json"', () => {
    const { CONFIG_FILE } = require(CONSTANTS_PATH);
    assert.strictEqual(CONFIG_FILE, 'config.json');
  });

  test('PHASES_DIR equals "phases"', () => {
    const { PHASES_DIR } = require(CONSTANTS_PATH);
    assert.strictEqual(PHASES_DIR, 'phases');
  });

  test('MILESTONES_DIR equals "milestones"', () => {
    const { MILESTONES_DIR } = require(CONSTANTS_PATH);
    assert.strictEqual(MILESTONES_DIR, 'milestones');
  });

  test('REQUIREMENTS_FILE equals "REQUIREMENTS.md"', () => {
    const { REQUIREMENTS_FILE } = require(CONSTANTS_PATH);
    assert.strictEqual(REQUIREMENTS_FILE, 'REQUIREMENTS.md');
  });

  test('PROJECT_FILE equals "PROJECT.md"', () => {
    const { PROJECT_FILE } = require(CONSTANTS_PATH);
    assert.strictEqual(PROJECT_FILE, 'PROJECT.md');
  });

  test('module has no require() calls to any project file (leaf module check)', () => {
    const source = fs.readFileSync(CONSTANTS_PATH, 'utf-8');
    // Must not require any relative project files
    assert.ok(
      !source.includes("require('./") && !source.includes('require("./'),
      'module must not require any local project files'
    );
    assert.ok(
      !source.includes("require('../") && !source.includes('require("../'),
      'module must not require any parent project files'
    );
  });
});
