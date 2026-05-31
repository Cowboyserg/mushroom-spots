import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const ROOT = new URL('.', import.meta.url).pathname;
const VERSION = '0.7.6';
const SPRINT = 'Sprint 5.6';
const CACHE_SUFFIX = 'sprint5.6';
const ALLOWED_PMTILES_FIXTURES = new Map([
  ['offline-test.pmtiles', 5 * 1024 * 1024],
]);
const IGNORED_DIRS = new Set(['.git', 'node_modules', '__MACOSX']);

function pathExists(path) {
  return existsSync(join(ROOT, path));
}

function read(path) {
  return readFileSync(join(ROOT, path), 'utf8');
}

function assertIncludes(text, expected, label) {
  assert.ok(text.includes(expected), `${label} must include ${expected}`);
}

function matchOne(text, regexp, label) {
  const match = text.match(regexp);
  assert.ok(match, `Missing ${label}`);
  return match[1];
}

function walk(dir = ROOT, result = []) {
  for (const entry of readdirSync(dir)) {
    if (IGNORED_DIRS.has(entry)) continue;
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

function uniqueDuplicateValues(values) {
  const seen = new Set();
  const duplicates = new Set();
  for (const value of values) {
    if (seen.has(value)) duplicates.add(value);
    seen.add(value);
  }
  return [...duplicates].sort();
}

function extractStringLiteralsFromArraySource(source) {
  return [...source.matchAll(/['`]([^'`]+)['`]|"([^"]+)"/g)]
    .map((match) => match[1] ?? match[2]);
}

function checkRequiredProjectFiles() {
  for (const path of [
    'index.html',
    'app.js',
    'styles.css',
    'sw.js',
    'leaflet-offline-lite.js',
    'geo.js',
    'db.js',
    'map.js',
    'export.js',
    'manifest.webmanifest',
    'package.json',
    'ci-checks.mjs',
    'package-checks.mjs',
    'geo.test.mjs',
    'ci.workflow.yml',
    'GITHUB_ACTIONS_SETUP.md',
  ]) {
    assert.ok(pathExists(path), `Required project file is missing: ${path}`);
  }
}

function checkPmtilesSourcePolicy() {
  const pmtilesFiles = walk()
    .map((full) => relative(ROOT, full).replaceAll('\\', '/'))
    .filter((rel) => rel.endsWith('.pmtiles'));

  const forbidden = [];
  for (const rel of pmtilesFiles) {
    const basename = rel.split('/').at(-1);
    const maxBytes = ALLOWED_PMTILES_FIXTURES.get(basename);
    if (maxBytes == null) {
      forbidden.push(rel);
      continue;
    }

    const size = statSync(join(ROOT, rel)).size;
    assert.ok(size <= maxBytes, `${rel} is allowed only as a small diagnostic fixture; size ${size} exceeds ${maxBytes} bytes`);
  }

  assert.deepEqual(forbidden, [], `Only offline-test.pmtiles may exist as a small diagnostic fixture; forbidden PMTiles files: ${forbidden.join(', ')}`);
}

function checkGitignoreGuard() {
  const gitignore = read('.gitignore');
  assertIncludes(gitignore, '*.pmtiles', '.gitignore PMTiles guard');
  assertIncludes(gitignore, '.DS_Store', '.gitignore macOS metadata guard');
}

function checkVersionConsistency() {
  const appJs = read('app.js');
  const swJs = read('sw.js');
  const indexHtml = read('index.html');
  const packageJson = read('package.json');
  const readme = read('README.md');
  const sprints = read('SPRINTS.md');
  const memory = read('EXTERNAL_MEMORY.md');

  assert.equal(matchOne(appJs, /const APP_VERSION = ['"]([^'"]+)['"];/, 'APP_VERSION'), VERSION);
  assert.equal(matchOne(swJs, /const APP_ASSET_VERSION = ['"]([^'"]+)['"];/, 'APP_ASSET_VERSION'), VERSION);
  assertIncludes(swJs, `mushroom-spots-v${VERSION}-${CACHE_SUFFIX}`, 'Service Worker cache name');
  assertIncludes(indexHtml, `v${VERSION} · ${SPRINT}`, 'index visible version');
  assert.ok(appJs.includes('v${APP_VERSION}') && appJs.includes(SPRINT), `app.js must render visible version with ${SPRINT}`);
  assertIncludes(packageJson, `"version": "${VERSION}"`, 'package.json version');
  assertIncludes(readme, `v${VERSION} / ${SPRINT}`, 'README current version');
  assertIncludes(sprints, `Version: ${VERSION}`, 'SPRINTS current version');
  assertIncludes(memory, `v${VERSION}`, 'EXTERNAL_MEMORY current version');
}

function checkVersionedAppShellAssets() {
  const indexHtml = read('index.html');
  const versionedAssets = [
    'manifest.webmanifest',
    'apple-touch-icon.svg',
    'styles.css',
    'leaflet-offline-lite.js',
    'app.js',
  ];

  for (const asset of versionedAssets) {
    assertIncludes(indexHtml, `${asset}?v=${VERSION}`, `index.html versioned asset ${asset}`);
  }
}

function checkDomIdContracts() {
  const indexHtml = read('index.html');
  const appJs = read('app.js');
  const ids = [...indexHtml.matchAll(/\bid=["']([^"']+)["']/g)].map((match) => match[1]);
  const idSet = new Set(ids);
  const duplicates = uniqueDuplicateValues(ids);

  assert.deepEqual(duplicates, [], `DOM ids must be unique: ${duplicates.join(', ')}`);

  const dollarRefs = [...appJs.matchAll(/\$\(['"]([^'"]+)['"]\)/g)]
    .map((match) => match[1]);
  const missingDollarRefs = [...new Set(dollarRefs)]
    .filter((id) => !idSet.has(id))
    .sort();

  assert.deepEqual(missingDollarRefs, [], `All $() DOM references must exist in index.html: ${missingDollarRefs.join(', ')}`);

  const screenNames = [...indexHtml.matchAll(/data-app-screen=["']([^"']+)["']/g)].map((match) => match[1]);
  const duplicateScreens = uniqueDuplicateValues(screenNames);
  assert.deepEqual(duplicateScreens, [], `App screen names must be unique: ${duplicateScreens.join(', ')}`);

  const screenSet = new Set(screenNames);
  const navTargets = [...indexHtml.matchAll(/data-screen-target=["']([^"']+)["']/g)].map((match) => match[1]);
  const missingTargets = [...new Set(navTargets)]
    .filter((target) => !screenSet.has(target))
    .sort();

  assert.deepEqual(missingTargets, [], `Every bottom-nav target must have a matching app screen: ${missingTargets.join(', ')}`);
}

function checkServiceWorkerCacheRules() {
  const swJs = read('sw.js');
  const appShellMatch = swJs.match(/const APP_SHELL = \[([\s\S]*?)\];/);
  assert.ok(appShellMatch, 'Service Worker must declare APP_SHELL');
  const appShellEntries = extractStringLiteralsFromArraySource(appShellMatch[1]);
  const forbiddenCacheEntries = appShellEntries.filter((entry) => (
    entry.includes('config.js') ||
    entry.includes('config.json') ||
    entry.includes('offline-map-packages.json') ||
    entry.includes('.pmtiles')
  ));

  assert.deepEqual(forbiddenCacheEntries, [], `APP_SHELL must not cache user/private/map files: ${forbiddenCacheEntries.join(', ')}`);
  assertIncludes(swJs, "req.method !== 'GET'", 'Service Worker non-GET bypass');
  assertIncludes(swJs, "req.headers.has('range')", 'Service Worker range request bypass');
  assertIncludes(swJs, "url.pathname.endsWith('.pmtiles')", 'Service Worker PMTiles bypass');
  assertIncludes(swJs, "url.pathname.endsWith('/config.js')", 'Service Worker config.js bypass');
  assertIncludes(swJs, "url.pathname.endsWith('/config.json')", 'Service Worker config.json bypass');
  assertIncludes(swJs, "url.pathname.endsWith('/offline-map-packages.json')", 'Service Worker manifest bypass');
  assertIncludes(swJs, "cache: 'reload'", 'Service Worker Android app-shell reload fetch');
}

function checkWorkflowTemplate() {
  const workflowPath = pathExists('.github/workflows/ci.yml')
    ? '.github/workflows/ci.yml'
    : 'ci.workflow.yml';
  const workflow = read(workflowPath);

  assertIncludes(workflow, 'actions/checkout@v4', 'GitHub Actions checkout step');
  assertIncludes(workflow, 'actions/setup-node@v4', 'GitHub Actions Node setup step');
  assertIncludes(workflow, 'node-version: "22"', 'GitHub Actions Node version');
  assertIncludes(workflow, 'npm run ci', 'GitHub Actions CI command');
}

function checkNoUnexpectedBinaryFixtures() {
  const binaryLike = walk()
    .map((full) => relative(ROOT, full).replaceAll('\\', '/'))
    .filter((rel) => ['.zip', '.mbtiles'].includes(extname(rel)));

  assert.deepEqual(binaryLike, [], `Patch/source tree must not contain generated archives or map databases: ${binaryLike.join(', ')}`);
}

checkRequiredProjectFiles();
checkPmtilesSourcePolicy();
checkGitignoreGuard();
checkVersionConsistency();
checkVersionedAppShellAssets();
checkDomIdContracts();
checkServiceWorkerCacheRules();
checkWorkflowTemplate();
checkNoUnexpectedBinaryFixtures();

console.log(`Source CI checks passed for v${VERSION} / ${SPRINT}`);
