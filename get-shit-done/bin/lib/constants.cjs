'use strict';

/**
 * Constants — Single source of truth for planning directory magic strings.
 *
 * This is a pure leaf module: no require() calls to any project file.
 */

const PLANNING_DIR = '.planning';
const PHASES_DIR = 'phases';
const MILESTONES_DIR = 'milestones';
const ROADMAP_FILE = 'ROADMAP.md';
const STATE_FILE = 'STATE.md';
const REQUIREMENTS_FILE = 'REQUIREMENTS.md';
const CONFIG_FILE = 'config.json';
const PROJECT_FILE = 'PROJECT.md';

module.exports = {
  PLANNING_DIR,
  PHASES_DIR,
  MILESTONES_DIR,
  ROADMAP_FILE,
  STATE_FILE,
  REQUIREMENTS_FILE,
  CONFIG_FILE,
  PROJECT_FILE,
};
