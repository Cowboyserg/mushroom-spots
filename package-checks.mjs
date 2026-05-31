import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { basename, dirname, extname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const VERSION = '0.7.6';
const SPRINT = 'Sprint 5.6';
const ROOT = new URL('.', import.meta.url).pathname;
const FORBIDDEN_PACKAGE_NAMES = new Set([
  'config.js',
  'config.json',
  'offline-map-packages.json',
  '.DS_Store',
]);
const REQUIRED_PACKAGE_FILES = [
  'index.html',
  'app.js',
  'styles.css',
  'sw.js',
  'manifest.webmanifest',
  'leaflet-offline-lite.js',
  'geo.js',
  'db.js',
  'map.js',
  'export.js',
  'README.md',
  'SPRINTS.md',
  'EXTERNAL_MEMORY.md',
  'UX_ROADMAP.md',
  'package.json',
  'ci-checks.mjs',
  'package-checks.mjs',
  'geo.test.mjs',
  'ci.workflow.yml',
  'GITHUB_ACTIONS_SETUP.md',
  'SPRINT_5_6_CI_SOURCE_VS_PACKAGE_RULES_FIX.md',
];

function walk(dir, result = []) {
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    const stat = statSync(full);
    if (stat.isDirectory()) {
      walk(full, result);
    } else {
      result.push(full);
    }
  }
  return result;
}

function run(command, args, options = {}) {
  const result = spawnSync(command, args, { encoding: 'utf8', ...options });
  if (result.status !== 0) {
    throw new Error(`${command} ${args.join(' ')} failed\nSTDOUT:\n${result.stdout}\nSTDERR:\n${result.stderr}`);
  }
  return result.stdout;
}

function checkEntriesAreFlat(entries) {
  const nested = entries.filter((entry) => entry.includes('/'));
  assert.deepEqual(nested, [], `Flat GitHub-upload ZIP must not contain nested paths: ${nested.join(', ')}`);
}

function checkForbiddenPackageEntries(entries) {
  const forbidden = entries.filter((entry) => {
    const name = basename(entry);
    return FORBIDDEN_PACKAGE_NAMES.has(name) || entry.endsWith('.pmtiles');
  });
  assert.deepEqual(forbidden, [], `Flat ZIP must not include user/private/map files: ${forbidden.join(', ')}`);
}

function checkRequiredPackageEntries(entries) {
  const entrySet = new Set(entries);
  const missing = REQUIRED_PACKAGE_FILES.filter((file) => !entrySet.has(file));
  assert.deepEqual(missing, [], `Flat ZIP is missing required files: ${missing.join(', ')}`);
}

function checkVersionInDirectory(dir) {
  const appJs = readFileSync(join(dir, 'app.js'), 'utf8');
  const swJs = readFileSync(join(dir, 'sw.js'), 'utf8');
  const indexHtml = readFileSync(join(dir, 'index.html'), 'utf8');
  const readme = readFileSync(join(dir, 'README.md'), 'utf8');
  const sprints = readFileSync(join(dir, 'SPRINTS.md'), 'utf8');
  const memory = readFileSync(join(dir, 'EXTERNAL_MEMORY.md'), 'utf8');

  assert.ok(appJs.includes(`const APP_VERSION = '${VERSION}'`), 'app.js must contain current APP_VERSION');
  assert.ok(swJs.includes(`const APP_ASSET_VERSION = '${VERSION}'`), 'sw.js must contain current APP_ASSET_VERSION');
  assert.ok(indexHtml.includes(`app.js?v=${VERSION}`), 'index.html must version app.js');
  assert.ok(readme.includes(`v${VERSION} / ${SPRINT}`), 'README must contain current version/sprint');
  assert.ok(sprints.includes(`Version: ${VERSION}`), 'SPRINTS must contain current version');
  assert.ok(memory.includes(`v${VERSION}`), 'EXTERNAL_MEMORY must contain current version');
}

function checkDirectoryPackage(dir) {
  const entries = walk(dir).map((full) => relative(dir, full).replaceAll('\\', '/')).sort();
  checkEntriesAreFlat(entries);
  checkForbiddenPackageEntries(entries);
  checkRequiredPackageEntries(entries);
  checkVersionInDirectory(dir);
}

function checkZipPackage(zipPath) {
  const entries = run('unzip', ['-Z1', zipPath])
    .split('\n')
    .map((entry) => entry.trim())
    .filter(Boolean)
    .filter((entry) => !entry.endsWith('/'))
    .sort();

  checkEntriesAreFlat(entries);
  checkForbiddenPackageEntries(entries);
  checkRequiredPackageEntries(entries);

  const tempRoot = mkdtempSync(join(tmpdir(), 'mushroom-package-check-'));
  try {
    run('unzip', ['-q', resolve(zipPath), '-d', tempRoot]);
    checkVersionInDirectory(tempRoot);
    run('npm', ['run', 'ci'], { cwd: tempRoot });
  } finally {
    rmSync(tempRoot, { recursive: true, force: true });
  }
}

const target = process.argv[2];
if (!target) {
  checkDirectoryPackage(ROOT);
  console.log(`Package directory checks passed for v${VERSION} / ${SPRINT}`);
} else if (extname(target).toLowerCase() === '.zip') {
  checkZipPackage(target);
  console.log(`Package ZIP checks passed for ${target}`);
} else if (existsSync(target) && statSync(target).isDirectory()) {
  checkDirectoryPackage(target);
  console.log(`Package directory checks passed for ${target}`);
} else {
  throw new Error(`Unsupported package check target: ${target}`);
}
