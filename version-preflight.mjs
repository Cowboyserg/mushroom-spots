import assert from 'node:assert/strict';
import { readFileSync } from 'node:fs';
import { join } from 'node:path';

const ROOT = new URL('.', import.meta.url).pathname;

function read(path) {
  return readFileSync(join(ROOT, path), 'utf8');
}

function matchOne(text, regexp, label) {
  const match = text.match(regexp);
  assert.ok(match, `version preflight: missing ${label}`);
  return match[1];
}

function assertIncludes(text, expected, label) {
  assert.ok(
    text.includes(expected),
    `version preflight: ${label} must include ${JSON.stringify(expected)}`
  );
}

function warnIfProjectPathVersionLooksStale({ version, sprint }) {
  let projectPath;
  try {
    projectPath = read('PROJECT_PATH.md');
  } catch {
    console.warn('Version preflight warning: PROJECT_PATH.md is missing; runtime guards still passed.');
    return;
  }

  const line = projectPath
    .split(/\r?\n/)
    .find((candidate) => candidate.trim().startsWith('Current application version:'));
  if (!line) {
    console.warn('Version preflight warning: PROJECT_PATH.md has no Current application version line; runtime guards still passed.');
    return;
  }

  if (!line.includes(version) || !line.includes(sprint)) {
    console.warn(
      `Version preflight warning: PROJECT_PATH.md current version line looks stale: ${JSON.stringify(line.trim())}`
    );
  }
}

function parseProjectVersion() {
  const appJs = read('app.js');
  const indexHtml = read('index.html');
  const appVersion = matchOne(
    appJs,
    /const APP_VERSION = ['"]([^'"]+)['"];/,
    'app.js APP_VERSION'
  );
  const indexLabel = matchOne(
    indexHtml,
    /<p id="appVersion">([^<]+)<\/p>/,
    'index.html #appVersion label'
  ).trim();
  const indexLabelMatch = indexLabel.match(/^v(.+?) · (Sprint [0-9.]+)$/);
  assert.ok(indexLabelMatch, `version preflight: index appVersion has unexpected format: ${indexLabel}`);
  assert.equal(indexLabelMatch[1], appVersion, 'version preflight: index visible version must match app.js APP_VERSION');
  return { version: appVersion, sprint: indexLabelMatch[2], label: indexLabel };
}

function parsePackageJson() {
  return JSON.parse(read('package.json'));
}

function parsePackageLock() {
  return JSON.parse(read('package-lock.json'));
}

function getE2eVersionRegex() {
  const e2e = read('e2e-smoke.spec.mjs');
  const source = matchOne(
    e2e,
    /const EXPECTED_APP_VERSION = \/(.+)\/;/,
    'e2e EXPECTED_APP_VERSION regex'
  );
  return new RegExp(source);
}

function checkE2eVersionGuard({ label, version }) {
  const e2e = read('e2e-smoke.spec.mjs');
  const expectedRegex = getE2eVersionRegex();
  assert.ok(
    expectedRegex.test(label),
    `version preflight: e2e EXPECTED_APP_VERSION must match runtime label ${JSON.stringify(label)}`
  );

  const exportedBackupVersionExpectations = [...e2e.matchAll(/expect\(backup\.appVersion\)\.toBe\(['"]([^'"]+)['"]\)/g)]
    .map((match) => match[1]);
  for (const expected of exportedBackupVersionExpectations) {
    assert.equal(
      expected,
      version,
      'version preflight: backup export appVersion expectation must match app.js APP_VERSION'
    );
  }
}

function checkVersionedAssets({ version }) {
  const indexHtml = read('index.html');
  for (const asset of [
    'manifest.webmanifest',
    'apple-touch-icon.svg',
    'styles.css',
    'leaflet-offline-lite.js',
    'config.js',
    'app.js'
  ]) {
    assertIncludes(indexHtml, `${asset}?v=${version}`, `index.html asset ${asset}`);
  }
}

function checkRuntimeAndSettingsLabels({ version, sprint, label }) {
  const appJs = read('app.js');
  const indexHtml = read('index.html');
  const swJs = read('sw.js');
  const packageJson = parsePackageJson();
  const lock = parsePackageLock();

  const swAssetVersion = matchOne(
    swJs,
    /const APP_ASSET_VERSION = ['"]([^'"]+)['"];/,
    'sw.js APP_ASSET_VERSION'
  );

  assert.equal(swAssetVersion, version, 'version preflight: sw.js APP_ASSET_VERSION must match app.js APP_VERSION');
  assert.equal(packageJson.version, version, 'version preflight: package.json version must match app.js APP_VERSION');
  assert.equal(lock.version, version, 'version preflight: package-lock root version must match package.json');
  assert.equal(lock.packages?.['']?.version, version, 'version preflight: package-lock package version must match package.json');

  assertIncludes(appJs, `v\${APP_VERSION} · ${sprint}`, 'app.js runtime appVersion label');
  assertIncludes(indexHtml, label, 'index.html visible appVersion label');
  assertIncludes(indexHtml, `v${version}`, 'settings version label');
  assertIncludes(indexHtml, sprint, 'settings sprint label');
  assertIncludes(indexHtml, `mushroom-spots-v${version}`, 'settings cache label');
  assertIncludes(swJs, `mushroom-spots-v${version}`, 'service worker cache name');
}

function main() {
  const info = parseProjectVersion();
  checkRuntimeAndSettingsLabels(info);
  checkVersionedAssets(info);
  checkE2eVersionGuard(info);
  warnIfProjectPathVersionLooksStale(info);
  console.log(`Version preflight passed for v${info.version} / ${info.sprint}`);
}

main();
