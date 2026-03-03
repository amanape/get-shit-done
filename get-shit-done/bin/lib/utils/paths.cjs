'use strict';

/**
 * Path helpers — Named helpers replacing raw path.join constructions.
 *
 * Imports only from node:path and ../constants.cjs — no domain module imports.
 */

const path = require('node:path');
const {
  PLANNING_DIR,
  PHASES_DIR,
  ROADMAP_FILE,
  STATE_FILE,
  CONFIG_FILE,
  PROJECT_FILE,
} = require('../constants.cjs');

/** Returns the absolute path to the .planning directory for a given project root. */
function planningDir(cwd) {
  return path.join(cwd, PLANNING_DIR);
}

/** Returns the absolute path to the phases directory. */
function phasesDir(cwd) {
  return path.join(cwd, PLANNING_DIR, PHASES_DIR);
}

/** Returns the absolute path to ROADMAP.md. */
function roadmapPath(cwd) {
  return path.join(cwd, PLANNING_DIR, ROADMAP_FILE);
}

/** Returns the absolute path to STATE.md. */
function statePath(cwd) {
  return path.join(cwd, PLANNING_DIR, STATE_FILE);
}

/** Returns the absolute path to config.json. */
function configPath(cwd) {
  return path.join(cwd, PLANNING_DIR, CONFIG_FILE);
}

/** Returns the absolute path to PROJECT.md. */
function projectPath(cwd) {
  return path.join(cwd, PLANNING_DIR, PROJECT_FILE);
}

/** Returns the absolute path to a named phase directory. */
function phaseDir(cwd, name) {
  return path.join(cwd, PLANNING_DIR, PHASES_DIR, name);
}

/** Normalize a relative path to always use forward slashes (cross-platform). */
function toPosixPath(p) {
  return p.split('\\').join('/');
}

module.exports = {
  planningDir,
  phasesDir,
  roadmapPath,
  statePath,
  configPath,
  projectPath,
  phaseDir,
  toPosixPath,
};
