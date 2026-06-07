import assert from 'node:assert/strict';
import { existsSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { extname, join, relative } from 'node:path';

const ROOT = new URL('.', import.meta.url).pathname;
const ALLOWED_PMTILES_FIXTURES = new Map([
  ['offline-test.pmtiles', 5 * 1024 * 1024],
]);
const IGNORED_DIRS = new Set(['.git', 'node_modules', '__MACOSX', 'test-results', 'playwright-report', 'blob-report', '.playwright']);

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

function getProjectVersionInfo() {
  const appJs = read('app.js');
  const indexHtml = read('index.html');

  const version = matchOne(
    appJs,
    /const APP_VERSION = ['"]([^'"]+)['"];/,
    'APP_VERSION'
  );

  const visibleSprintMatch = indexHtml.match(new RegExp(`v${version.replaceAll('.', '\\.')}` + String.raw`\s*·\s*(Sprint\s+[0-9.]+)`));
  const sprint = visibleSprintMatch?.[1] ?? null;

  return { version, sprint };
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
    'version-preflight.mjs',
    'geo.test.mjs',
    'package-lock.json',
    'serve-static.mjs',
    'playwright.config.mjs',
    'e2e-smoke.spec.mjs',
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
    assert.ok(
      size <= maxBytes,
      `${rel} is allowed only as a small diagnostic fixture; size ${size} exceeds ${maxBytes} bytes`
    );
  }

  assert.deepEqual(
    forbidden,
    [],
    `Only offline-test.pmtiles may exist as a small diagnostic fixture; forbidden PMTiles files: ${forbidden.join(', ')}`
  );
}

function checkGitignoreGuard() {
  if (!pathExists('.gitignore')) {
    console.warn('Warning: .gitignore is missing; skipping gitignore guard check.');
    return;
  }

  const gitignore = read('.gitignore');
  assertIncludes(gitignore, '*.pmtiles', '.gitignore PMTiles guard');
  assertIncludes(gitignore, '.DS_Store', '.gitignore macOS metadata guard');
}

function checkVersionConsistency() {
  const { version, sprint } = getProjectVersionInfo();
  const swJs = read('sw.js');
  const indexHtml = read('index.html');
  const packageJson = JSON.parse(read('package.json'));

  const swVersion = matchOne(
    swJs,
    /const APP_ASSET_VERSION = ['"]([^'"]+)['"];/,
    'APP_ASSET_VERSION'
  );

  assert.equal(swVersion, version, 'sw.js APP_ASSET_VERSION must match app.js APP_VERSION');
  assert.equal(packageJson.version, version, 'package.json version must match app.js APP_VERSION');

  assertIncludes(swJs, `mushroom-spots-v${version}`, 'Service Worker cache name');
  assertIncludes(indexHtml, `<p id="appVersion">v${version}</p>`, 'index exact public version');
  assert.ok(!indexHtml.includes('· Sprint'), 'public version labels must not include Sprint');
  assert.ok(!indexHtml.includes('<span class="label">Спринт</span>'), 'settings must not render Sprint');
  assertIncludes(read('app.js'), "$('appVersion').textContent = `v${APP_VERSION}`;", 'runtime version-only label');

  if (sprint) {
    assertIncludes(read('app.js'), sprint, 'app.js visible sprint label');
    assertIncludes(indexHtml, sprint, 'index visible sprint label');
  }
}

function checkVersionedAppShellAssets() {
  const { version } = getProjectVersionInfo();
  const indexHtml = read('index.html');
  const versionedAssets = [
    'manifest.webmanifest',
    'apple-touch-icon.svg',
    'styles.css',
    'leaflet-offline-lite.js',
    'app.js',
  ];

  for (const asset of versionedAssets) {
    assertIncludes(indexHtml, `${asset}?v=${version}`, `index.html versioned asset ${asset}`);
  }
}


function sliceBetween(text, startToken, endToken, label) {
  const start = text.indexOf(startToken);
  assert.ok(start >= 0, `${label} must include ${startToken}`);
  const end = text.indexOf(endToken, start + startToken.length);
  assert.ok(end >= 0, `${label} must include ${endToken} after ${startToken}`);
  return text.slice(start, end);
}

function checkOfflineMapsUxContract() {
  const indexHtml = read('index.html');

  const builderStart = indexHtml.indexOf('id="offlineRegionBuilderSection"');
  const systemStart = indexHtml.indexOf('id="offlineSystemDetails"');
  assert.ok(builderStart >= 0, 'Offline screen must include visible region builder section');
  assert.ok(systemStart >= 0, 'Offline screen must include system information details');
  assert.ok(
    builderStart < systemStart,
    'Offline region rectangle preparation must stay in the visible user flow before System information'
  );

  const builderHtml = sliceBetween(
    indexHtml,
    'id="offlineRegionBuilderSection"',
    'id="offlineAddMapPanel"',
    'Offline region builder section'
  );
  assertIncludes(builderHtml, 'id="startBboxExportBtn"', 'visible offline region builder');
  assertIncludes(builderHtml, 'id="useVisibleBboxBtn"', 'visible offline region builder');
  assertIncludes(builderHtml, 'id="bboxCommandOutput"', 'visible offline region builder');

  const systemHtml = indexHtml.slice(systemStart);
  assertIncludes(systemHtml, 'id="probePmtilesBtn"', 'System information PMTiles diagnostics');
  assertIncludes(systemHtml, 'id="offlinePackageSelect"', 'System information technical package select');
  assertIncludes(read('app.js'), 'groupOfflineRegionPackagesByCountry', 'offline catalog country grouping');
  assertIncludes(read('app.js'), 'countryId', 'offline package country metadata');
  const appJs = read('app.js');
  const stylesCss = read('styles.css');
  assertIncludes(stylesCss, '.offline-country-folder', 'offline catalog country folder styles');
  assertIncludes(stylesCss, '.offline-country-folder-icon', 'Notes-like offline country folder icon');
  assertIncludes(appJs, 'folder.open = offlineOpenCountryFolderIds.has(group.id);', 'offline country folders start collapsed unless explicitly opened');
  assert.ok(!appJs.includes('!offlineCountryFoldersInitialized && groupIndex === 0'), 'offline catalog must not auto-open the first country folder');
  assert.ok(
    !systemHtml.includes('id="startBboxExportBtn"'),
    'System information must not hide the user-facing rectangle preparation action'
  );

  const catalogSourceDetails = sliceBetween(
    indexHtml,
    'offline-catalog-source-details',
    'id="offlineRegionCatalogStatus"',
    'Offline catalog source details'
  );
  assertIncludes(catalogSourceDetails, 'id="offlineManifestUrlInput"', 'catalog source details');
}

function checkManualPmtilesImportProgressContract() {
  const appJs = read('app.js');
  const indexHtml = read('index.html');
  const stylesCss = read('styles.css');

  assertIncludes(appJs, 'const LOCAL_PMTILES_IMPORT_CHUNK_BYTES = 8 * 1024 * 1024;', 'manual PMTiles import chunk size');
  assertIncludes(appJs, 'async function writePmtilesFileToOpfs(file, storageName, options = {})', 'streamed OPFS manual import');
  assertIncludes(appJs, 'readPmtilesBlobChunk(file.slice(receivedBytes, end))', 'manual PMTiles chunk reads');
  assertIncludes(appJs, 'bytes: bytes.buffer', 'WebKit-compatible IndexedDB ArrayBuffer persistence');
  assert.ok(!appJs.includes('blob: new Blob(parts'), 'IndexedDB fallback must not persist Blob parts on WebKit');
  assertIncludes(appJs, 'function cancelLocalPmtilesImport()', 'manual PMTiles import cancellation');
  assertIncludes(appJs, 'await deletePmtilesFileFromOpfs(storageName);', 'partial OPFS import cleanup');
  assertIncludes(appJs, 'status: \'verifying\'', 'manual PMTiles verification progress phase');
  assert.ok(!appJs.includes('const bytes = await fileToArrayBuffer(file);'), 'manual PMTiles import must not buffer the whole file before OPFS write');

  for (const id of [
    'localPmtilesImportProgress',
    'localPmtilesImportProgressBar',
    'localPmtilesImportProgressText',
    'cancelLocalPmtilesImportBtn'
  ]) {
    assertIncludes(indexHtml, `id="${id}"`, `manual PMTiles import UI ${id}`);
  }
  assertIncludes(stylesCss, '.local-pmtiles-import-progress-bar', 'manual PMTiles import progress styles');
  assertIncludes(stylesCss, '--local-pmtiles-import-progress', 'manual PMTiles import progress width variable');
}


function checkManualRegionDownloadHandoffContract() {
  const appJs = read('app.js');
  const indexHtml = read('index.html');
  const stylesCss = read('styles.css');

  for (const id of [
    'offlineRegionManualInstallDialog',
    'offlineRegionManualInstallTitle',
    'offlineRegionManualInstallFileName',
    'offlineRegionManualDownloadStartBtn',
    'offlineRegionManualChooseFileBtn',
    'offlineRegionManualInstallCloseBtn'
  ]) {
    assertIncludes(indexHtml, `id="${id}"`, `manual region download handoff UI ${id}`);
  }
  assertIncludes(appJs, 'function openOfflineRegionManualInstallDialog(packageId)', 'manual region download dialog opener');
  assertIncludes(appJs, "startIn: 'downloads'", 'Downloads-first file picker hint');
  assertIncludes(appJs, "typeof window.showOpenFilePicker === 'function'", 'modern file picker branch');
  assertIncludes(appJs, "typeof input.showPicker === 'function'", 'file input showPicker fallback');
  assertIncludes(appJs, "openLocalPmtilesInputFallback('add')", 'manual region input fallback');
  assertIncludes(appJs, 'catalogPackageId: catalogPackage?.id', 'manual region import catalog linkage');
  assertIncludes(appJs, 'Выбран другой файл: ожидался', 'manual region selected-file size guard');
  assertIncludes(stylesCss, '.dialog-actions a', 'manual download link dialog styling');
}

function checkRuntimeStateDeclarations() {
  const appJs = read('app.js');
  assertIncludes(appJs, 'let selectedMapObject = null;', 'selectedMapObject runtime state declaration');
}

function checkOnlineMapControlsContract() {
  const indexHtml = read('index.html');
  const stylesCss = read('styles.css');

  assertIncludes(indexHtml, 'id="mapExpandBtn" class="map-expand-btn map-control-btn', 'online map expand unified control class');
  assertIncludes(indexHtml, 'id="startGpsBtn" class="map-fab map-control-btn', 'online map GPS unified control class');
  assertIncludes(indexHtml, 'id="centerMeBtn" class="map-fab map-control-btn', 'online map center unified control class');
  assertIncludes(indexHtml, 'aria-label="Ко мне"', 'online map center accessible label');
  assertIncludes(stylesCss, '--online-map-control-size', 'online map shared control size variable');
  assertIncludes(stylesCss, '.map-wrap-home .leaflet-control-zoom a', 'Leaflet zoom button unified control styling');
  assertIncludes(stylesCss, '.map-wrap-home .map-control-btn', 'online map app button unified control styling');
}

function checkGpsDesktopFallbackContract() {
  const appJs = read('app.js');
  assertIncludes(appJs, 'GPS_PRIMARY_POSITION_OPTIONS', 'GPS primary position options');
  assertIncludes(appJs, 'GPS_DESKTOP_FALLBACK_POSITION_OPTIONS', 'GPS desktop fallback position options');
  assertIncludes(appJs, 'function requestCurrentPositionWithDesktopFallback', 'GPS desktop fallback helper');
  assertIncludes(appJs, 'isRetryableGeolocationError(primaryError)', 'GPS fallback must only retry recoverable errors');
  assertIncludes(appJs, 'enableHighAccuracy: false, timeout: 30000, maximumAge: 120000', 'GPS fallback lower-accuracy longer timeout options');
  assertIncludes(appJs, "fallbackUsed ? 'GPS fallback' : 'GPS'", 'main GPS diagnostic must report fallback use');
  assertIncludes(appJs, "void startGps(false, { silent: true, reason: 'startup' });", 'application startup GPS request');
  assertIncludes(appJs, 'if (!silent) alert(`GPS ошибка:', 'startup GPS denial must stay non-blocking while manual retry can alert');
  assertIncludes(appJs, 'function ensureGpsWatch()', 'GPS watch starts after a successful location request');
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


function checkMapMarkerIdentityContract() {
  const app = read('app.js');
  const styles = read('styles.css');
  const e2e = read('e2e-smoke.spec.mjs');
  assertIncludes(app, 'function buildUniqueMapNameLabels', 'unique map name prefix algorithm');
  assertIncludes(app, "shortLabel: row.mapLabel", 'offline friend short label');
  assertIncludes(app, "makeMapIcon('friend', row.mapLabel)", 'online friend short label');
  assertIncludes(app, "'text-field': ['get', 'shortLabel']", 'offline marker label field');
  assertIncludes(styles, '.map-dot-user { background:#2563eb; }', 'current user marker color');
  assertIncludes(styles, '.map-dot-friend { background:#f97316;', 'friend marker color');
  assertIncludes(styles, '.map-dot-spot { background:#16a34a; }', 'saved spot marker color');
  assertIncludes(styles, '.map-dot-chat { background:#7c3aed;', 'chat marker color');
  assertIncludes(e2e, 'map participant labels use unique name prefixes and shared semantic colors', 'marker identity E2E oracle');
}

function checkSharedSectionStatusContract() {
  const app = read('app.js');
  const indexHtml = read('index.html');
  const styles = read('styles.css');
  const e2e = read('e2e-smoke.spec.mjs');

  for (const section of ['Map', 'Spots', 'Group', 'Offline', 'Settings']) {
    assertIncludes(indexHtml, `id="sectionStatus${section}"`, `${section} shared section status`);
  }
  assertIncludes(indexHtml, 'class="section-status"', 'shared section status markup');
  assertIncludes(styles, '.section-status[hidden]', 'ready-state section status hiding');
  assertIncludes(styles, '.section-status[data-state="working"]', 'working section status styling');
  assertIncludes(styles, '.section-status[data-state="offline"]', 'offline section status styling');
  assertIncludes(styles, '.section-status[data-state="error"]', 'error section status styling');
  assertIncludes(app, 'function setSectionStatus(section, spec = null)', 'shared section status renderer');
  assertIncludes(app, 'function updateSectionStatuses()', 'shared section status decision layer');
  assertIncludes(app, "setHidden('saveFlowState', true);", 'map status replaces save-flow guidance while visible');
  assertIncludes(app, "setHidden('saveFlowState', false);", 'map save-flow guidance returns when status clears');
  assertIncludes(app, "setSectionStatus('group', groupStatus);", 'group section status integration');
  assertIncludes(app, "setSectionStatus('offline', currentOfflineSectionStatus());", 'offline section status integration');
  assertIncludes(e2e, 'shared section status is uniform and hidden until a section needs action', 'shared section status structure E2E oracle');
  assertIncludes(e2e, 'offline section status explains catalog failure without blocking local map tools', 'offline section status E2E oracle');
  assertIncludes(e2e, 'settings section status keeps a dismissed PWA update discoverable', 'settings update section status E2E oracle');
  assertIncludes(app, 'function updateMapWorkspaceClearance()', 'map workspace bottom-navigation clearance');
  assertIncludes(app, 'function scheduleMapWorkspaceClearance()', 'scheduled map workspace clearance');
  assertIncludes(styles, '--map-workspace-height', 'runtime map workspace height override');
  assertIncludes(e2e, 'map workspace recomputes bottom-nav clearance when section status changes', 'map workspace clearance E2E oracle');
  assertIncludes(app, 'async function ensureOfflineMapWorkspaceVisibleOnOpen', 'offline active map restore transition');
  assertIncludes(app, "void ensureOfflineMapWorkspaceVisibleOnOpen('offline screen navigation');", 'offline screen automatic map restore integration');
  assertIncludes(e2e, 'opening offline screen restores the last active installed map automatically', 'offline active map restore E2E oracle');
}

function checkControlledPwaUpdateContract() {
  const app = read('app.js');
  const indexHtml = read('index.html');
  const styles = read('styles.css');
  const sw = read('sw.js');
  const e2e = read('e2e-smoke.spec.mjs');

  assertIncludes(indexHtml, 'id="appUpdateBanner"', 'PWA update banner');
  assertIncludes(indexHtml, 'id="applyAppUpdateBtn"', 'PWA update apply action');
  assertIncludes(indexHtml, 'id="dismissAppUpdateBtn"', 'PWA update later action');
  assertIncludes(styles, '.app-update-banner', 'PWA update banner styling');
  assertIncludes(app, 'async function registerAppServiceWorker()', 'controlled Service Worker registration');
  assertIncludes(app, "pendingAppUpdateWorker.postMessage({ type: 'MUSHROOM_ACTIVATE_UPDATE' });", 'explicit update activation message');
  assertIncludes(app, "navigator.serviceWorker.addEventListener('controllerchange'", 'update controller handoff');
  assertIncludes(app, 'void checkForAppUpdate();', 'foreground update recheck');
  assertIncludes(sw, "data.type === 'MUSHROOM_ACTIVATE_UPDATE'", 'Service Worker activation message handler');
  assertIncludes(sw, 'event.waitUntil(self.skipWaiting());', 'Service Worker explicit skipWaiting');
  assert.ok(!/cache\.addAll\(APP_SHELL\)[\s\S]{0,100}self\.skipWaiting\(\)/.test(sw), 'Service Worker install must not auto-activate updates');
  assertIncludes(e2e, 'waiting PWA update offers an explicit user-controlled reload', 'controlled PWA update E2E oracle');
  if (pathExists('TEMP_UX_ROADMAP_2026-06-07.md')) {
    const roadmap = read('TEMP_UX_ROADMAP_2026-06-07.md');
    assertIncludes(roadmap, '# Temporary UX Roadmap — 2026-06-07', 'temporary dated UX roadmap header');
    assertIncludes(roadmap, '## Sprint 5.57 — Offline Maps MVP Release', 'temporary dated UX roadmap release gate');
    assertIncludes(roadmap, '## Sprint 5.58 — Shared Section Status Component', 'temporary dated UX roadmap next UX sprint');
  }
}

function checkDependencyAndLockfilePolicy() {
  const packageJson = JSON.parse(read('package.json'));
  const hasDependencies = Boolean(
    Object.keys(packageJson.dependencies || {}).length ||
    Object.keys(packageJson.devDependencies || {}).length
  );

  if (hasDependencies) {
    assert.ok(pathExists('package-lock.json'), 'package-lock.json is required when package.json has dependencies');
    const lock = JSON.parse(read('package-lock.json'));
    assert.equal(lock.name, packageJson.name, 'package-lock.json name must match package.json');
    assert.equal(lock.version, packageJson.version, 'package-lock.json version must match package.json');
    assertIncludes(read('package-lock.json'), 'https://registry.npmjs.org/', 'package-lock public npm registry URLs');
  }

  if (packageJson.devDependencies?.['@playwright/test']) {
    assert.ok(pathExists('playwright.config.mjs'), 'Playwright config is required when @playwright/test is installed');
    assert.ok(pathExists('e2e-smoke.spec.mjs'), 'Playwright smoke spec is required when @playwright/test is installed');
    assertIncludes(JSON.stringify(packageJson.scripts || {}), 'node version-preflight.mjs', 'version preflight script');
    assertIncludes(JSON.stringify(packageJson.scripts || {}), 'playwright test', 'Playwright test script');
    assertIncludes(JSON.stringify(packageJson.scripts || {}), 'npm run check:version && npm run ci && npm run test:e2e', 'E2E CI script');
    const playwrightConfig = read('playwright.config.mjs');
    assertIncludes(playwrightConfig, "name: 'desktop-chromium'", 'Playwright desktop project');
    assertIncludes(playwrightConfig, "name: 'android-chromium'", 'Playwright Android project');
    assertIncludes(playwrightConfig, "name: 'iphone-webkit'", 'Playwright iPhone project');
    assertIncludes(playwrightConfig, "devices['Pixel 5']", 'Playwright Android device profile');
    assertIncludes(playwrightConfig, "devices['iPhone 13']", 'Playwright iPhone device profile');
  }
}

function checkWorkflowTemplate() {
  const workflowCandidates = [
    '.github/workflows/ci.yml',
    'ci.workflow.yml',
  ];
  const workflowPath = workflowCandidates.find((candidate) => pathExists(candidate));

  if (!workflowPath) {
    console.warn('Warning: no GitHub Actions workflow/template found; skipping workflow check.');
    return;
  }

  const workflow = read(workflowPath);
  assert.ok(/actions\/checkout@v[4-9]/.test(workflow), 'GitHub Actions checkout step must use a supported major version');
  assert.ok(/actions\/setup-node@v[4-9]/.test(workflow), 'GitHub Actions Node setup step must use a supported major version');
  assertIncludes(workflow, 'node-version: "22"', 'GitHub Actions Node version');
  assertIncludes(workflow, 'npm ci', 'GitHub Actions dependency install command');
  assertIncludes(workflow, 'npx playwright install --with-deps chromium webkit', 'GitHub Actions Playwright browser install command');
  assertIncludes(workflow, 'npm run ci:e2e', 'GitHub Actions E2E CI command');
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
checkOfflineMapsUxContract();
checkManualPmtilesImportProgressContract();
checkManualRegionDownloadHandoffContract();
checkRuntimeStateDeclarations();
checkOnlineMapControlsContract();
checkMapMarkerIdentityContract();
checkGpsDesktopFallbackContract();
checkServiceWorkerCacheRules();
checkControlledPwaUpdateContract();
checkSharedSectionStatusContract();
checkDependencyAndLockfilePolicy();
checkWorkflowTemplate();
checkNoUnexpectedBinaryFixtures();

const { version, sprint } = getProjectVersionInfo();
console.log(`Source CI checks passed for v${version}${sprint ? ` / ${sprint}` : ''}`);
