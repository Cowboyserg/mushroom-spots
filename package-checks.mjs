import assert from 'node:assert/strict';
import { existsSync, mkdtempSync, readdirSync, readFileSync, rmSync, statSync } from 'node:fs';
import { basename, extname, join, relative, resolve } from 'node:path';
import { spawnSync } from 'node:child_process';
import { tmpdir } from 'node:os';

const ROOT = new URL('.', import.meta.url).pathname;
const FORBIDDEN_PACKAGE_NAMES = new Set([
  'config.js',
  'config.json',
  'offline-map-packages.json',
  '.DS_Store',
]);
const REPO_ONLY_NAMES = new Set([
  '.git',
  '.github',
  '__MACOSX',
  'node_modules',
  'test-results',
  'playwright-report',
  'offline-test.pmtiles',
  'offline-map-packages.json',
  '.DS_Store',
  'config.js',
  'config.json',
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
  'apple-touch-icon.svg',
  'icon.svg',
  'package.json',
  'ci-checks.mjs',
  'package-checks.mjs',
  'version-preflight.mjs',
  'geo.test.mjs',
  'package-lock.json',
  'serve-static.mjs',
  'playwright.config.mjs',
  'e2e-smoke.spec.mjs',
];

function walk(dir, result = []) {
  for (const entry of readdirSync(dir)) {
    if (REPO_ONLY_NAMES.has(entry)) continue;
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

function read(path) {
  return readFileSync(path, 'utf8');
}

function matchOne(text, regexp, label) {
  const match = text.match(regexp);
  assert.ok(match, `Missing ${label}`);
  return match[1];
}

function readVersionInfoFromDirectory(dir) {
  const appJs = read(join(dir, 'app.js'));
  const indexHtml = read(join(dir, 'index.html'));
  const version = matchOne(appJs, /const APP_VERSION = ['"]([^'"]+)['"];/, 'APP_VERSION');
  const sprintMatch = indexHtml.match(new RegExp(`v${version.replaceAll('.', '\\.')}` + String.raw`\s*·\s*(Sprint\s+[0-9.]+)`));
  return { version, sprint: sprintMatch?.[1] ?? null };
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
  const { version, sprint } = readVersionInfoFromDirectory(dir);
  const swJs = read(join(dir, 'sw.js'));
  const indexHtml = read(join(dir, 'index.html'));
  const packageJson = JSON.parse(read(join(dir, 'package.json')));

  const swVersion = matchOne(swJs, /const APP_ASSET_VERSION = ['"]([^'"]+)['"];/, 'APP_ASSET_VERSION');
  assert.equal(swVersion, version, 'sw.js APP_ASSET_VERSION must match app.js APP_VERSION');
  assert.equal(packageJson.version, version, 'package.json version must match app.js APP_VERSION');
  assert.ok(swJs.includes(`mushroom-spots-v${version}`), 'sw.js cache name must include current version');
  assert.ok(indexHtml.includes(`app.js?v=${version}`), 'index.html must version app.js');
  assert.ok(indexHtml.includes(`styles.css?v=${version}`), 'index.html must version styles.css');
  assert.ok(indexHtml.includes(`leaflet-offline-lite.js?v=${version}`), 'index.html must version leaflet-offline-lite.js');
  assert.ok(indexHtml.includes(`manifest.webmanifest?v=${version}`), 'index.html must version manifest.webmanifest');
  if (sprint) assert.ok(indexHtml.includes(sprint), 'index.html must show current sprint label');
}

function checkDirectoryPackage(dir) {
  const entries = walk(dir).map((full) => relative(dir, full).replaceAll('\\', '/')).sort();
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
  const { version, sprint } = readVersionInfoFromDirectory(ROOT);
  console.log(`Package directory checks passed for v${version}${sprint ? ` / ${sprint}` : ''}`);
} else if (extname(target).toLowerCase() === '.zip') {
  checkZipPackage(target);
  console.log(`Package ZIP checks passed for ${target}`);
} else if (existsSync(target) && statSync(target).isDirectory()) {
  checkDirectoryPackage(target);
  console.log(`Package directory checks passed for ${target}`);
} else {
  throw new Error(`Unsupported package check target: ${target}`);
}
