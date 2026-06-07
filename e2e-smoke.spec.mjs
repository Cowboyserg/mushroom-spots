import { expect, test } from '@playwright/test';

const EXPECTED_APP_VERSION = /^v0\.8\.9$/;

const EXTERNAL_RUNTIME_HOSTS = [
  'unpkg.com',
  'cdn.jsdelivr.net',
  'basemaps.cartocdn.com',
  'a.basemaps.cartocdn.com',
  'b.basemaps.cartocdn.com',
  'c.basemaps.cartocdn.com',
  'd.basemaps.cartocdn.com'
];

async function bootApp(page, options = {}) {
  const pageErrors = [];
  page.on('pageerror', (error) => pageErrors.push(error.message));

  if (options.fakeWaitingServiceWorker) {
    await page.addInitScript(() => {
      const waitingWorker = {
        state: 'installed',
        postMessage(message) {
          window.__lastServiceWorkerMessage = message;
        },
        addEventListener() {}
      };
      const registration = new EventTarget();
      registration.waiting = waitingWorker;
      registration.installing = null;
      registration.update = async () => undefined;

      const serviceWorkerContainer = new EventTarget();
      serviceWorkerContainer.controller = { scriptURL: 'fake-active-sw.js' };
      serviceWorkerContainer.register = async () => registration;
      Object.defineProperty(Navigator.prototype, 'serviceWorker', {
        configurable: true,
        get() { return serviceWorkerContainer; }
      });
    });
  }

  if (options.forceNoOpfs) {
    await page.addInitScript(() => {
      try {
        if (typeof StorageManager !== 'undefined' && StorageManager.prototype) {
          Object.defineProperty(StorageManager.prototype, 'getDirectory', {
            configurable: true,
            value: undefined
          });
        }
        if (navigator.storage) {
          Object.defineProperty(navigator.storage, 'getDirectory', {
            configurable: true,
            value: undefined
          });
        }
      } catch (_) { /* no-op */ }
    });
  }

  if (options.slowLocalFileReads) {
    await page.addInitScript(() => {
      const originalSlice = Blob.prototype.slice;
      Blob.prototype.slice = function patchedSlice(...args) {
        const part = originalSlice.apply(this, args);
        const originalArrayBuffer = part.arrayBuffer.bind(part);
        part.arrayBuffer = async () => {
          await new Promise((resolve) => setTimeout(resolve, 180));
          return originalArrayBuffer();
        };
        return part;
      };
    });
  }


  if (options.fakeManualPmtilesPicker) {
    await page.addInitScript(() => {
      const content = `PMTiles fake ${'x'.repeat(256)}`;
      Object.defineProperty(window, 'showOpenFilePicker', {
        configurable: true,
        value: async () => [{
          async getFile() {
            return new File([content], 'central-fed-district.pmtiles', {
              type: 'application/octet-stream',
              lastModified: Date.now()
            });
          }
        }]
      });
    });
  }

  if (options.fakePmtilesRuntime) {
    await page.addInitScript(() => {
      class FakeMapLibreMap {
        constructor(options = {}) {
          this.options = options;
          this.container = typeof options.container === 'string' ? document.getElementById(options.container) : options.container;
          this.handlers = new Map();
          this.sources = new Map();
          this.layers = new Set();
          this.zoom = options.zoom || 12;
          this.center = options.center || [24.1052, 56.9496];
          window.__lastMapLibreStyle = options.style || null;
          window.__lastMapLibreStyleLayerIds = (options.style?.layers || []).map((layer) => layer.id).filter(Boolean);
          window.__lastMapLibreStyleSourceLayers = (options.style?.layers || []).map((layer) => layer['source-layer']).filter(Boolean);
          if (this.container) {
            this.container.dataset.fakeMaplibre = 'ready';
            this.container.dataset.fakeMaplibreStyleLayerIds = window.__lastMapLibreStyleLayerIds.join(',');
            this.container.dataset.fakeMaplibreStyleSourceLayers = window.__lastMapLibreStyleSourceLayers.join(',');
            this.container.addEventListener('click', () => {
              this.emit('click', { point: { x: 80, y: 80 }, lngLat: { lng: 24.1065, lat: 56.9505 } });
            });
          }
          setTimeout(() => this.emit('load', {}), 0);
          setTimeout(() => this.emit('idle', {}), 10);
        }
        on(name, handler) {
          if (!this.handlers.has(name)) this.handlers.set(name, []);
          this.handlers.get(name).push(handler);
          return this;
        }
        once(name, handler) {
          const wrapped = (event) => {
            this.handlers.set(name, (this.handlers.get(name) || []).filter((item) => item !== wrapped));
            handler(event);
          };
          return this.on(name, wrapped);
        }
        emit(name, event) {
          for (const handler of this.handlers.get(name) || []) handler(event);
        }
        addControl() {}
        resize() {}
        triggerRepaint() {}
        remove() { if (this.container) this.container.innerHTML = ''; }
        fitBounds() { this.center = [24.1065, 56.9505]; }
        setCenter(center) { this.center = center; }
        setZoom(zoom) { this.zoom = zoom; }
        getZoom() { return this.zoom; }
        easeTo(options = {}) { if (options.center) this.center = options.center; if (options.zoom) this.zoom = options.zoom; }
        jumpTo(options = {}) { if (options.center) this.center = options.center; if (options.zoom) this.zoom = options.zoom; }
        isStyleLoaded() { return true; }
        addSource(id, source) {
          const stored = { ...source, setData(data) { this.data = data; } };
          this.sources.set(id, stored);
        }
        getSource(id) { return this.sources.get(id) || null; }
        queryRenderedFeatures() { return window.__fakeMapLibreHitFeature ? [window.__fakeMapLibreHitFeature] : []; }
        addLayer(layer) { this.layers.add(layer.id); }
        getLayer(id) { return this.layers.has(id) ? { id } : null; }
      }
      window.maplibregl = {
        Map: FakeMapLibreMap,
        NavigationControl: class {},
        addProtocol() {}
      };
      window.pmtiles = {
        Protocol: class { constructor() { this.tile = () => {}; } add() {} },
        PMTiles: class {
          constructor() {}
          async getHeader() {
            return {
              tileType: 1,
              minZoom: 0,
              maxZoom: 14,
              minLon: 24,
              minLat: 56,
              maxLon: 25,
              maxLat: 57,
              centerLon: 24.1065,
              centerLat: 56.9505,
              centerZoom: 12
            };
          }
          async getMetadata() {
            return {
              name: 'Test offline map',
              bounds: '24,56,25,57',
              vector_layers: [
                { id: 'landcover' },
                { id: 'landuse' },
                { id: 'park' },
                { id: 'water' },
                { id: 'waterway' },
                { id: 'boundary' },
                { id: 'transportation' },
                { id: 'transportation_name' },
                { id: 'building' },
                { id: 'place' }
              ]
            };
          }
        }
      };
    });
  }

  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());

    if (options.fakePmtilesRuntime && url.pathname.endsWith('/offline-test.pmtiles')) {
      const fakeBytes = `PMTiles fake ${'x'.repeat(160)}`;
      await route.fulfill({
        status: 200,
        contentType: 'application/octet-stream',
        headers: { 'accept-ranges': 'bytes', 'content-length': String(fakeBytes.length) },
        body: route.request().method() === 'HEAD' ? '' : fakeBytes
      });
      return;
    }

    if (url.pathname.endsWith('/config.js')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: options.fakeSupabase
          ? `window.MUSHROOM_CONFIG = { SUPABASE_URL: 'https://fake.supabase.test', SUPABASE_ANON_KEY: 'fake-anon-key' };`
          : 'window.MUSHROOM_CONFIG = {};'
      });
      return;
    }

    if (options.fakeOfflineManifest && url.pathname.endsWith('.pmtiles')) {
      if (options.fakeOfflineAssetError) {
        await route.abort('failed');
        return;
      }
      const fakeBytes = Buffer.from(`PMTiles fake ${'x'.repeat(256)}`);
      await route.fulfill({
        status: 200,
        contentType: 'application/octet-stream',
        headers: { 'accept-ranges': 'bytes', 'content-length': String(fakeBytes.length) },
        body: fakeBytes
      });
      return;
    }

    if (options.fakeOfflineManifest && url.pathname.endsWith('/offline-map-packages.json')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/json',
        body: JSON.stringify({
          schemaVersion: 1,
          releaseTag: 'maps-2026-06-02',
          packages: [
            {
              id: 'central-fed-district',
              name: 'Центральный федеральный округ',
              fileName: 'central-fed-district.pmtiles',
              url: 'https://github.com/test-owner/mushroom-spots/releases/download/maps-2026-06-02/central-fed-district.pmtiles',
              sourceType: 'github-release-asset',
              version: 'maps-2026-06-02',
              sizeBytes: options.fakeOfflineManifestSmallSizes ? Buffer.byteLength(`PMTiles fake ${'x'.repeat(256)}`) : 1155000283,
              enabled: true,
              role: 'regional-map',
              schema: 'openmaptiles-planetiler',
              description: 'Офлайн-карта: Центральный федеральный округ.'
            },
            {
              id: 'kaliningrad',
              name: 'Калининградская область',
              fileName: 'kaliningrad.pmtiles',
              url: 'https://github.com/test-owner/mushroom-spots/releases/download/maps-2026-06-02/kaliningrad.pmtiles',
              sourceType: 'github-release-asset',
              version: 'maps-2026-06-02',
              sizeBytes: options.fakeOfflineManifestSmallSizes ? Buffer.byteLength(`PMTiles fake ${'x'.repeat(256)}`) : 37574071,
              enabled: true,
              role: 'regional-map',
              schema: 'openmaptiles-planetiler',
              description: 'Офлайн-карта: Калининградская область.'
            },
            ...(options.fakeOfflineManifestCountries ? [{
              id: 'madrid',
              name: 'Испания · Мадрид',
              fileName: 'madrid.pmtiles',
              url: 'https://github.com/test-owner/mushroom-spots/releases/download/maps-2026-06-02/madrid.pmtiles',
              sourceType: 'github-release-asset',
              version: 'maps-2026-06-02',
              sizeBytes: options.fakeOfflineManifestSmallSizes ? Buffer.byteLength(`PMTiles fake ${'x'.repeat(256)}`) : 81234567,
              enabled: true,
              role: 'regional-map',
              schema: 'openmaptiles-planetiler',
              countryId: 'spain',
              countryName: 'Испания',
              regionId: 'madrid',
              geofabrikId: 'europe/spain/madrid',
              description: 'Офлайн-карта: Испания · Мадрид.'
            }] : [])
          ]
        })
      });
      return;
    }

    if (options.fakeSupabase && url.hostname === 'fake.supabase.test' && url.pathname.startsWith('/rest/v1/')) {
      const method = route.request().method();
      if (typeof options.fakeSupabaseHandler === 'function') {
        const handled = await options.fakeSupabaseHandler(route, { url, method });
        if (handled) return;
      }
      if (method === 'GET') {
        await route.fulfill({ status: 200, contentType: 'application/json', body: '[]' });
      } else {
        await route.fulfill({ status: 204, body: '' });
      }
      return;
    }

    if (EXTERNAL_RUNTIME_HOSTS.some((host) => url.hostname === host || url.hostname.endsWith(`.${host}`))) {
      await route.abort();
      return;
    }
    await route.continue();
  });

  await page.goto(options.path || '/');
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);
  await expect(page.locator('#map')).toHaveAttribute('data-map-runtime', 'leaflet-offline-lite');
  expect(pageErrors, 'app must not throw fatal page errors during boot').toEqual([]);
}


async function openOfflineCountryFolder(page, countryId = 'russia') {
  const folder = page.locator(`.offline-country-folder[data-country-id="${countryId}"]`);
  await expect(folder).toHaveCount(1);
  if ((await folder.getAttribute('open')) === null) {
    await folder.locator('summary').first().click();
  }
  await expect(folder).toHaveAttribute('open', '');
  return folder;
}

async function expectJoinedGroupReady(page, expectedGroup) {
  await expect.poll(async () => page.evaluate(() => {
    const groupStateText = document.querySelector('#groupStateText');
    const joinedActions = document.querySelector('#groupJoinedActions');
    const joinButton = document.querySelector('#joinGroupBtn');
    const groupInput = document.querySelector('#groupId');
    return {
      stateText: groupStateText?.textContent || '',
      joinedActionsHidden: Boolean(joinedActions?.hidden),
      joinButtonDisabled: Boolean(joinButton?.disabled),
      liveValue: document.querySelector('#liveName')?.value || '',
      groupValue: groupInput?.value || '',
      persistedGroup: localStorage.getItem('mushroom_live_group_id') || '',
      buttonStatus: document.querySelector('#buttonApiStatus')?.textContent || ''
    };
  }), {
    message: 'group join diagnostic oracle: state/localStorage/button flags must agree after join click'
  }).toMatchObject({
    stateText: expect.stringContaining('Ты в группе'),
    joinedActionsHidden: false,
    joinButtonDisabled: true,
    groupValue: expectedGroup,
    persistedGroup: expectedGroup
  });
}

async function pickMapPoint(page) {
  const map = page.locator('#map');
  await expect(map).toBeVisible();
  const box = await map.boundingBox();
  expect(box, 'map must have visible bounds').not.toBeNull();
  await map.click({ button: 'right', position: { x: Math.floor(box.width / 2), y: Math.floor(box.height / 2) } });
  await expect(page.locator('#saveFlowTitle')).toContainText('Выбрано место на карте');
  await expect(page.locator('.map-wrap-home #mapObjectCard')).toBeVisible();
  await expect(page.locator('#mapObjectTitle')).toHaveText('Карточка выбранной точки');
  await expect(page.locator('#mapObjectPrimaryBtn')).toHaveText('☆ Сохранить');
  await expect(page.locator('#saveSpotDetails')).toHaveCount(0);
  await expect(page.locator('#savePlaceDialog')).toBeHidden();
}

async function seedSpots(page) {
  await page.evaluate(async () => {
    window.dispatchEvent(new Event('pagehide'));
    const DB_NAME = 'mushroom-spots-db';
    const DB_VERSION = 4;
    const SPOTS_STORE = 'spots';
    const SETTINGS_STORE = 'settings';
    const TRACKS_STORE = 'tracks';
    const OFFLINE_MAP_FILES_STORE = 'offlineMapFiles';
    const spots = [
      {
        id: 'e2e-white-spot',
        name: 'Белые у ручья',
        mushroomType: 'Белые',
        note: 'Рядом старый мостик',
        lat: 56.9501,
        lon: 24.1061,
        accuracy: null,
        source: 'map-picked',
        collection: 'Грибные места',
        photo: null,
        createdAt: '2026-05-31T08:00:00.000Z',
        updatedAt: '2026-05-31T08:00:00.000Z',
        appVersion: '0.7.14'
      },
      {
        id: 'e2e-chanterelle-spot',
        name: 'Лисички у тропы',
        mushroomType: 'Лисички',
        note: 'Солнечная поляна',
        lat: 56.9511,
        lon: 24.1071,
        accuracy: null,
        source: 'map-picked',
        collection: 'Разведка',
        photo: null,
        createdAt: '2026-05-31T09:00:00.000Z',
        updatedAt: '2026-05-31T09:00:00.000Z',
        appVersion: '0.7.14'
      },
      {
        id: 'e2e-birch-spot',
        name: 'Подберёзовики за домом',
        mushroomType: 'Подберёзовики',
        note: 'Берёзы и мох',
        lat: 56.9521,
        lon: 24.1081,
        accuracy: null,
        source: 'map-picked',
        collection: 'Ягоды',
        photo: null,
        createdAt: '2026-05-31T07:00:00.000Z',
        updatedAt: '2026-05-31T07:00:00.000Z',
        appVersion: '0.7.14'
      }
    ];

    await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(SPOTS_STORE)) db.createObjectStore(SPOTS_STORE, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
        if (!db.objectStoreNames.contains(TRACKS_STORE)) db.createObjectStore(TRACKS_STORE, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(OFFLINE_MAP_FILES_STORE)) db.createObjectStore(OFFLINE_MAP_FILES_STORE, { keyPath: 'id' });
      };
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction(SPOTS_STORE, 'readwrite');
        const store = tx.objectStore(SPOTS_STORE);
        for (const spot of spots) store.put(spot);
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error || new Error('Seed write transaction failed'));
        tx.onabort = () => reject(tx.error || new Error('Seed write transaction aborted'));
      };
    });

    const savedCount = await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction(SPOTS_STORE, 'readonly');
        const store = tx.objectStore(SPOTS_STORE);
        const countReq = store.count();
        let count = 0;
        countReq.onsuccess = () => { count = countReq.result; };
        countReq.onerror = () => reject(countReq.error);
        tx.oncomplete = () => { db.close(); resolve(count); };
        tx.onerror = () => reject(tx.error || countReq.error);
        tx.onabort = () => reject(tx.error || new Error('Seed verification transaction aborted'));
      };
    });
    if (savedCount < spots.length) throw new Error(`Seed verification failed: ${savedCount}/${spots.length} spots written`);
  });
}


async function seedSingleTrack(page) {
  await page.evaluate(async () => {
    const DB_NAME = 'mushroom-spots-db';
    const DB_VERSION = 4;
    const TRACKS_STORE = 'tracks';
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    await new Promise((resolve, reject) => {
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction(TRACKS_STORE, 'readwrite');
        tx.objectStore(TRACKS_STORE).put({
          id: 'e2e-preserved-track',
          name: 'Маршрут для проверки удаления карты',
          points: [
            { lat: 56.95, lon: 24.10, timestamp: '2026-06-07T08:00:00.000Z' },
            { lat: 56.951, lon: 24.101, timestamp: '2026-06-07T08:01:00.000Z' }
          ],
          pointCount: 2,
          distanceMeters: 140,
          startedAt: '2026-06-07T08:00:00.000Z',
          endedAt: '2026-06-07T08:01:00.000Z',
          createdAt: '2026-06-07T08:01:00.000Z',
          updatedAt: '2026-06-07T08:01:00.000Z',
          appVersion: '0.8.9'
        });
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error || new Error('Track seed failed'));
        tx.onabort = () => reject(tx.error || new Error('Track seed aborted'));
      };
    });
  });
}

async function readLocalBackupState(page) {
  return page.evaluate(async () => {
    const DB_NAME = 'mushroom-spots-db';
    const DB_VERSION = 4;
    const SPOTS_STORE = 'spots';
    const SETTINGS_STORE = 'settings';
    const CUSTOM_COLLECTIONS_KEY = 'spot_custom_collections_v1';
    const TRACKS_STORE = 'tracks';
    const OFFLINE_MAP_FILES_STORE = 'offlineMapFiles';

    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const opened = req.result;
        if (!opened.objectStoreNames.contains(SPOTS_STORE)) opened.createObjectStore(SPOTS_STORE, { keyPath: 'id' });
        if (!opened.objectStoreNames.contains(SETTINGS_STORE)) opened.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
        if (!opened.objectStoreNames.contains(TRACKS_STORE)) opened.createObjectStore(TRACKS_STORE, { keyPath: 'id' });
        if (!opened.objectStoreNames.contains(OFFLINE_MAP_FILES_STORE)) opened.createObjectStore(OFFLINE_MAP_FILES_STORE, { keyPath: 'id' });
      };
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
    });

    try {
      return await new Promise((resolve, reject) => {
        const tx = db.transaction([SPOTS_STORE, SETTINGS_STORE, TRACKS_STORE], 'readonly');
        const spotStore = tx.objectStore(SPOTS_STORE);
        const settingStore = tx.objectStore(SETTINGS_STORE);
        const trackStore = tx.objectStore(TRACKS_STORE);
        const spotsReq = spotStore.getAll();
        const customReq = settingStore.get(CUSTOM_COLLECTIONS_KEY);
        const tracksReq = trackStore.getAll();
        let spots = [];
        let customCollections = [];
        let tracks = [];
        spotsReq.onsuccess = () => { spots = Array.isArray(spotsReq.result) ? spotsReq.result : []; };
        customReq.onsuccess = () => { customCollections = Array.isArray(customReq.result?.value) ? customReq.result.value : []; };
        tracksReq.onsuccess = () => { tracks = Array.isArray(tracksReq.result) ? tracksReq.result : []; };
        spotsReq.onerror = () => reject(spotsReq.error);
        customReq.onerror = () => reject(customReq.error);
        tracksReq.onerror = () => reject(tracksReq.error);
        tx.oncomplete = () => resolve({ spots, tracks, customCollections });
        tx.onerror = () => reject(tx.error || new Error('State read failed'));
        tx.onabort = () => reject(tx.error || new Error('State read aborted'));
      });
    } finally {
      db.close();
    }
  });
}

async function resetLocalSpotsAndCollections(page) {
  await page.evaluate(async () => {
    const DB_NAME = 'mushroom-spots-db';
    const DB_VERSION = 4;
    const SPOTS_STORE = 'spots';
    const SETTINGS_STORE = 'settings';
    const CUSTOM_COLLECTIONS_KEY = 'spot_custom_collections_v1';
    const TRACKS_STORE = 'tracks';
    const OFFLINE_MAP_FILES_STORE = 'offlineMapFiles';

    const db = await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onupgradeneeded = () => {
        const opened = req.result;
        if (!opened.objectStoreNames.contains(SPOTS_STORE)) opened.createObjectStore(SPOTS_STORE, { keyPath: 'id' });
        if (!opened.objectStoreNames.contains(SETTINGS_STORE)) opened.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
        if (!opened.objectStoreNames.contains(TRACKS_STORE)) opened.createObjectStore(TRACKS_STORE, { keyPath: 'id' });
        if (!opened.objectStoreNames.contains(OFFLINE_MAP_FILES_STORE)) opened.createObjectStore(OFFLINE_MAP_FILES_STORE, { keyPath: 'id' });
      };
      req.onerror = () => reject(req.error);
      req.onsuccess = () => resolve(req.result);
    });

    try {
      await new Promise((resolve, reject) => {
        const tx = db.transaction([SPOTS_STORE, SETTINGS_STORE, TRACKS_STORE], 'readwrite');
        tx.objectStore(SPOTS_STORE).clear();
        tx.objectStore(TRACKS_STORE).clear();
        tx.objectStore(SETTINGS_STORE).delete(CUSTOM_COLLECTIONS_KEY);
        tx.oncomplete = () => resolve();
        tx.onerror = () => reject(tx.error || new Error('State reset failed'));
        tx.onabort = () => reject(tx.error || new Error('State reset aborted'));
      });
    } finally {
      db.close();
    }
  });
}

async function installBackupExportCapture(page) {
  await page.evaluate(() => {
    if (window.__mushroomOriginalCreateObjectURL) return;
    window.__mushroomBackupExports = [];
    window.__mushroomOriginalCreateObjectURL = URL.createObjectURL.bind(URL);
    URL.createObjectURL = (blob) => {
      window.__mushroomBackupExports.push({
        type: blob?.type || '',
        textPromise: typeof blob?.text === 'function' ? blob.text() : Promise.resolve('')
      });
      return window.__mushroomOriginalCreateObjectURL(blob);
    };
  });
}

async function readLastCapturedBackupJson(page) {
  const text = await page.evaluate(async () => {
    const exports = window.__mushroomBackupExports || [];
    const last = exports[exports.length - 1];
    if (!last) throw new Error('No JSON export was captured');
    return last.textPromise;
  });
  return JSON.parse(text);
}

async function exportBackupViaSettings(page) {
  await installBackupExportCapture(page);
  await page.getByRole('button', { name: 'Настройки' }).click();
  await expect(page.locator('#screen-settings')).toBeVisible();
  await page.locator('#exportAllBtn').click();
  return readLastCapturedBackupJson(page);
}

async function importJsonFileViaSettings(page, content, expectedMessage) {
  await page.getByRole('button', { name: 'Настройки' }).click();
  await expect(page.locator('#screen-settings')).toBeVisible();
  const dialogPromise = page.waitForEvent('dialog');
  await page.locator('#importFile').setInputFiles({
    name: 'mushroom-spots-backup-test.json',
    mimeType: 'application/json',
    buffer: Buffer.from(typeof content === 'string' ? content : JSON.stringify(content, null, 2))
  });
  const dialog = await dialogPromise;
  expect(dialog.message()).toMatch(expectedMessage);
  await dialog.accept();
}


async function expectOfflinePreviewNearViewportTop(page) {
  await expect.poll(async () => page.locator('#pmtilesPreviewPanel').evaluate((el) => {
    const rect = el.getBoundingClientRect();
    return Math.round(rect.top);
  }), {
    message: 'opened offline map should scroll/reveal the preview panel near the top of the viewport'
  }).toBeLessThan(160);
}

test('app loads and bottom navigation switches screens', async ({ page }) => {
  await bootApp(page);

  await expect(page.locator('#appVersion')).toHaveText('v0.8.9');
  await expect(page.locator('#appVersion')).not.toContainText('Sprint');

  await expect(page.locator('#saveSpotFlowCard')).toBeVisible();
  await expect(page.locator('#trackRecorderCard')).toBeVisible();
  await expect(page.locator('#saveSpotDetails')).toHaveCount(0);
  await expect(page.locator('#saveTargetPill')).toContainText('нет точки');
  await expect(page.locator('#pickedMapPointHint')).toBeHidden();
  const saveBox = await page.locator('#saveSpotFlowCard').boundingBox();
  const trackBox = await page.locator('#trackRecorderCard').boundingBox();
  expect(saveBox, 'save-place card must have visible bounds').not.toBeNull();
  expect(trackBox, 'route recorder card must have visible bounds').not.toBeNull();
  expect(saveBox.y, 'save-place card should be above route recorder').toBeLessThan(trackBox.y);

  await page.getByRole('button', { name: 'Точки' }).click();
  await expect(page.locator('#screen-spots')).toBeVisible();
  await expect(page.locator('#screen-map')).toBeHidden();

  await page.getByRole('button', { name: 'Группа' }).click();
  await expect(page.locator('#screen-group')).toBeVisible();

  await page.getByRole('button', { name: 'Карта' }).click();
  await expect(page.locator('#screen-map')).toBeVisible();
  await expect(page.locator('#screen-map .map-title-row')).toBeHidden();
});

test('waiting PWA update offers an explicit user-controlled reload', async ({ page }) => {
  await bootApp(page, { fakeWaitingServiceWorker: true });

  const banner = page.locator('#appUpdateBanner');
  await expect(banner).toBeVisible();
  await expect(banner).toContainText('Доступна новая версия');
  await expect(page.locator('#appUpdateMessage')).toContainText('не удалит локальные точки, карты, маршруты и профиль');

  await page.locator('#dismissAppUpdateBtn').click();
  await expect(banner).toBeHidden();

  await page.reload();
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);
  await expect(banner).toBeVisible();

  await page.evaluate(() => localStorage.setItem('e2e-update-preserve', 'yes'));
  await page.locator('#applyAppUpdateBtn').click();
  await expect(page.locator('#applyAppUpdateBtn')).toHaveText('Обновляю…');
  await expect.poll(() => page.evaluate(() => window.__lastServiceWorkerMessage)).toEqual({ type: 'MUSHROOM_ACTIVATE_UPDATE' });
  await expect.poll(() => page.evaluate(() => localStorage.getItem('e2e-update-preserve'))).toBe('yes');
});

test('shared section status is uniform and hidden until a section needs action', async ({ page }) => {
  await bootApp(page);

  const statuses = page.locator('[data-section-status]');
  await expect(statuses).toHaveCount(5);
  expect(await page.evaluate(() => [...document.querySelectorAll('[data-app-screen]')].every((screen) => {
    const heading = screen.querySelector(':scope > .screen-heading');
    const status = screen.querySelector(':scope > [data-section-status]');
    return Boolean(heading && status && heading.nextElementSibling === status);
  }))).toBe(true);

  await page.getByRole('button', { name: 'Точки' }).click();
  await expect(page.locator('#sectionStatusSpots')).toBeHidden();

  await page.getByRole('button', { name: 'Группа' }).click();
  const groupStatus = page.locator('#sectionStatusGroup');
  await expect(groupStatus).toBeVisible();
  await expect(groupStatus).toHaveAttribute('data-state', 'action-needed');
  await expect(groupStatus).toContainText('Выбери профиль на этом устройстве');
  await groupStatus.getByRole('button', { name: 'Указать имя' }).click();
  await expect(page.locator('#liveName')).toBeFocused();
});

test('offline section status explains catalog failure without blocking local map tools', async ({ page, context }) => {
  await bootApp(page);

  await context.setOffline(true);
  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  const offlineStatus = page.locator('#sectionStatusOffline');
  await expect(offlineStatus).toBeVisible();
  await expect(offlineStatus).toHaveAttribute('data-state', 'offline');
  await expect(offlineStatus).toContainText('Каталог регионов недоступен без сети');
  await expect(offlineStatus).toContainText('Установленные карты и ручной импорт продолжают работать');
  await expect(page.locator('#chooseLocalPmtilesBtn')).toBeVisible();
  await context.setOffline(false);
});

test('settings section status keeps a dismissed PWA update discoverable', async ({ page }) => {
  await bootApp(page, { fakeWaitingServiceWorker: true });

  await page.locator('#dismissAppUpdateBtn').click();
  await expect(page.locator('#appUpdateBanner')).toBeHidden();
  await page.getByRole('button', { name: 'Настройки' }).click();

  const settingsStatus = page.locator('#sectionStatusSettings');
  await expect(settingsStatus).toBeVisible();
  await expect(settingsStatus).toHaveAttribute('data-state', 'action-needed');
  await expect(settingsStatus).toContainText('Доступна новая версия приложения');
  await settingsStatus.getByRole('button', { name: 'Обновить' }).click();
  await expect.poll(() => page.evaluate(() => window.__lastServiceWorkerMessage)).toEqual({ type: 'MUSHROOM_ACTIVATE_UPDATE' });
});

test('offline maps screen presents empty manager before a map is added', async ({ page }) => {
  await bootApp(page);

  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  await expect(page.locator('#screen-offline')).toBeVisible();

  await expect(page.getByRole('heading', { name: 'Мои карты' })).toBeVisible();
  await expect(page.locator('#offlineMapsCountPill')).toContainText('Офлайн-карт нет');
  await expect(page.locator('#offlineAddMapPanel')).toContainText('Импортировать свой .pmtiles');
  await expect(page.getByRole('button', { name: 'Выбрать файл карты' })).toBeVisible();
  await expect(page.locator('#pmtilesPreviewPanel')).toBeHidden();
  await expect(page.locator('#offlineActiveMapDetails')).toBeHidden();
  await expect(page.locator('#offlineMapListSection')).toBeHidden();
  await expect(page.getByRole('button', { name: 'Предпросмотр офлайн-карты' })).toBeHidden();
  await expect(page.locator('#offlineSystemDetails > summary').getByText('Системная информация', { exact: true })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Подготовить регион на компьютере' })).toBeVisible();
  await expect(page.locator('#startBboxExportBtn')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Проверить выбранный файл карты' })).toBeHidden();
});


test('offline catalog auto-refreshes on first offline screen open', async ({ page }) => {
  await bootApp(page, { fakeOfflineManifest: true });

  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  await expect(page.locator('#offlineRegionCatalogPill')).toContainText('2 региона');
  await expect(page.locator('#offlineRegionCatalogStatus')).toContainText('загружено 2 региона');
  await expect(page.locator('#offlineRegionCatalogList')).toContainText('Центральный федеральный округ');
  await expect(page.locator('#offlineRegionCatalogList')).toContainText('Калининградская область');
});


test('offline catalog failure keeps offline map user flows available', async ({ page }) => {
  await bootApp(page);

  await page.context().setOffline(true);
  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  await expect(page.locator('#offlineRegionCatalogStatus')).toContainText(/Каталог карт недоступен|нет соединения|не загрузился/);
  await expect(page.locator('#chooseLocalPmtilesBtn')).toBeVisible();
  await expect(page.locator('#startBboxExportBtn')).toBeVisible();
  await expect(page.locator('#offlineSystemDetails > summary').getByText('Системная информация', { exact: true })).toBeVisible();
  await page.context().setOffline(false);
});


test('offline storage explanation stays collapsed above system details', async ({ page }) => {
  await bootApp(page);

  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  await expect(page.locator('#offlineStorageInfoDetails')).toBeVisible();
  await expect(page.locator('#offlineStorageInfoDetails')).not.toHaveAttribute('open', '');
  await expect(page.locator('#offlineStorageInfoDetails > summary').getByText('Что хранится на устройстве', { exact: true })).toBeVisible();
  await expect(page.locator('#offlineStorageInfoDetails')).toContainText('память');
  await expect(page.locator('#offlineSystemDetails')).not.toHaveAttribute('open', '');

  const order = await page.evaluate(() => {
    const storage = document.querySelector('#offlineStorageInfoDetails')?.getBoundingClientRect();
    const system = document.querySelector('#offlineSystemDetails')?.getBoundingClientRect();
    return storage && system ? storage.top < system.top : false;
  });
  expect(order, 'human storage explanation should appear above System information').toBe(true);

  await page.locator('#offlineStorageInfoDetails > summary').click();
  await expect(page.locator('#offlineStorageInfoDetails')).toContainText('Офлайн-карты');
  await expect(page.locator('#offlineStorageInfoDetails')).toContainText('Удаление карты не удаляет грибные места');
  await expect(page.locator('#offlineStorageInfoDetails')).toContainText('Backup JSON');
});

test('offline maps keep region preparation visible while system details stay collapsed', async ({ page }) => {
  await bootApp(page);

  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  await expect(page.locator('#offlineRegionBuilderSection')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Подготовить регион на компьютере' })).toBeVisible();
  await expect(page.locator('#startBboxExportBtn')).toBeVisible();
  await expect(page.locator('#useVisibleBboxBtn')).toBeVisible();
  await expect(page.locator('#bboxCommandOutput')).toBeVisible();
  await expect(page.locator('#offlineSystemDetails')).not.toHaveAttribute('open', '');
  await expect(page.locator('#probePmtilesBtn')).toBeHidden();
  await expect(page.locator('#offlinePackageSelect')).toBeHidden();

  const bboxInsideSystemDetails = await page.locator('#startBboxExportBtn').evaluate((button) => Boolean(button.closest('#offlineSystemDetails')));
  expect(bboxInsideSystemDetails, 'rectangle preparation action must not be hidden inside System information').toBe(false);

  await expect(page.locator('#offlineManifestUrlInput')).toBeHidden();
  await page.locator('.offline-catalog-source-details > summary').click();
  await expect(page.locator('#offlineManifestUrlInput')).toBeVisible();
});


test('offline region catalog loads release manifest without installing maps', async ({ page }) => {
  await bootApp(page, { fakeOfflineManifest: true });

  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  await expect(page.getByRole('heading', { name: 'Каталог карт по странам' })).toBeVisible();
  await expect(page.locator('#offlineManifestUrlInput')).toHaveValue(/offline-map-packages\.json/);
  await page.locator('#refreshOfflineRegionCatalogBtn').click();

  await expect(page.locator('#offlineRegionCatalogPill')).toContainText('2 региона');
  await expect(page.locator('#offlineRegionCatalogStatus')).toContainText('загружено 2 региона');
  await expect(page.locator('#offlineRegionCatalogList')).toContainText('Центральный федеральный округ');
  await expect(page.locator('#offlineRegionCatalogList')).toContainText('Калининградская область');
  await expect(page.locator('#offlineRegionCatalogList')).toContainText('1.1 GB');
  await expect(page.locator('#offlineRegionCatalogList')).toContainText('не установлена');
  await openOfflineCountryFolder(page, 'russia');
  await expect(page.locator('#offlineRegionCatalogList').getByRole('button', { name: 'Установить' }).first()).toBeVisible();
  await expect(page.locator('#offlineRegionCatalogList').getByRole('link', { name: 'Скачать вручную' }).first()).toHaveAttribute('href', /central-fed-district\.pmtiles$/);
  await expect(page.locator('#offlineMapsCountPill')).toContainText('Офлайн-карт нет');
  await expect(page.locator('#pmtilesPreviewPanel')).toBeHidden();
});


test('manual region download dialog hands the downloaded file to streamed import', async ({ page }) => {
  await bootApp(page, {
    fakePmtilesRuntime: true,
    fakeOfflineManifest: true,
    fakeOfflineManifestSmallSizes: true,
    fakeManualPmtilesPicker: true
  });

  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  await page.locator('#refreshOfflineRegionCatalogBtn').click();
  await openOfflineCountryFolder(page, 'russia');
  const central = page.locator('.offline-region-card').filter({ hasText: 'Центральный федеральный округ' });

  await central.getByRole('link', { name: 'Скачать вручную' }).click();
  await expect(page.locator('#offlineRegionManualInstallDialog')).toBeVisible();
  await expect(page.locator('#offlineRegionManualInstallTitle')).toContainText('Центральный федеральный округ');
  await expect(page.locator('#offlineRegionManualInstallFileName')).toHaveText('central-fed-district.pmtiles');
  await expect(page.locator('#offlineRegionManualDownloadStartBtn')).toHaveAttribute('href', /central-fed-district\.pmtiles$/);
  await expect(page.locator('#offlineRegionManualChooseFileBtn')).toBeVisible();

  await page.locator('#offlineRegionManualChooseFileBtn').click();
  await expect(page.locator('#offlineRegionManualInstallDialog')).toBeHidden();
  await expect(page.locator('#appToast')).toContainText('Карта импортирована');
  await expect(page.locator('#localPmtilesImportProgressBar')).toHaveAttribute('aria-valuenow', '100');
  await expect(page.locator('#offlineImportNameDialog')).toBeVisible();
  await page.locator('#offlineImportNameKeepBtn').click();
  await expect(central).toContainText(/установлена|открыта сейчас/);
});


test('offline catalog groups legacy Russia and manifest Spain packages into country folders', async ({ page }) => {
  await bootApp(page, { fakeOfflineManifest: true, fakeOfflineManifestCountries: true });

  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  await page.locator('#refreshOfflineRegionCatalogBtn').click();

  await expect(page.locator('#offlineRegionCatalogPill')).toContainText('2 страны');
  await expect(page.locator('#offlineRegionCatalogPill')).toContainText('3 региона');

  const russia = page.locator('.offline-country-folder[data-country-id="russia"]');
  const spain = page.locator('.offline-country-folder[data-country-id="spain"]');
  await expect(russia).toHaveCount(1);
  await expect(spain).toHaveCount(1);
  await expect(russia.locator('summary')).toContainText('Россия');
  await expect(russia.locator('summary')).toContainText('2 региона');
  await expect(russia).not.toHaveAttribute('open', '');
  await expect(spain.locator('summary')).toContainText('Испания');
  await expect(spain.locator('summary')).toContainText('1 регион');
  await expect(spain).not.toHaveAttribute('open', '');
  await expect(russia.locator('.offline-country-folder-icon')).toHaveCount(1);
  await expect(spain.locator('.offline-country-chevron')).toHaveCount(1);

  await spain.locator('summary').click();
  await expect(spain).toHaveAttribute('open', '');
  await expect(spain.locator('.offline-region-card h4')).toHaveText('Мадрид');
  await expect(spain.locator('.offline-region-card')).toContainText('madrid.pmtiles');
  await page.locator('#refreshOfflineRegionCatalogBtn').click();
  await expect(spain).toHaveAttribute('open', '');
});


test('offline region install streams a catalog package into OPFS when supported', async ({ page }) => {
  await bootApp(page, { fakePmtilesRuntime: true, fakeOfflineManifest: true, fakeOfflineManifestSmallSizes: true });

  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  await page.locator('#refreshOfflineRegionCatalogBtn').click();
  await openOfflineCountryFolder(page, 'russia');
  const hasOpfs = await page.evaluate(() => Boolean(navigator.storage && typeof navigator.storage.getDirectory === 'function'));
  const central = page.locator('.offline-region-card').filter({ hasText: 'Центральный федеральный округ' });
  await central.getByRole('button', { name: 'Установить' }).click();
  await expect(page.locator('#offlineRegionInstallConfirmDialog')).toBeVisible();
  await expect(page.locator('#offlineRegionInstallConfirmTitle')).toContainText('Центральный федеральный округ');
  await expect(page.locator('#offlineRegionInstallConfirmSize')).toContainText(/B|KB/) ;
  await page.locator('#offlineRegionInstallConfirmBtn').click();

  if (!hasOpfs) {
    await expect(central).toContainText(/нужна ручная загрузка|ошибка/);
    await expect(central.getByRole('link', { name: 'Скачать вручную' })).toBeVisible();
    await expect(page.locator('#offlineMapsCountPill')).toContainText('Офлайн-карт нет');
    return;
  }

  await expect(central).toContainText('установлена');
  await expect(central.getByRole('button', { name: 'Открыть карту' })).toBeVisible();
  await expect(central.getByRole('link', { name: 'Скачать заново' })).toBeVisible();
  await expect(page.locator('#offlineMapsCountPill')).toContainText('1 офлайн-карта');

  await central.scrollIntoViewIfNeeded();
  await central.getByRole('button', { name: 'Открыть карту' }).click();
  await expect(page.locator('#offlinePackageManifestStatus')).toContainText('Локальная карта: Центральный федеральный округ');
  await expect(page.locator('#pmtilesPreviewPanel')).toBeVisible();
  await expect(page.locator('#pmtilesPreviewMap')).toHaveAttribute('data-fake-maplibre', 'ready');
  await expect(central).toContainText('открыта сейчас');
  await expect(central.getByRole('button', { name: 'Показать карту' })).toBeVisible();
  await expectOfflinePreviewNearViewportTop(page);

  await page.reload();
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);
  await expect(page.locator('#screen-offline')).toBeVisible();
  await openOfflineCountryFolder(page, 'russia');
  await expect(page.locator('#pmtilesPreviewPanel')).toBeVisible();
  await expect(page.locator('#pmtilesPreviewMap')).toHaveAttribute('data-fake-maplibre', 'ready');
  const centralAfterReload = page.locator('.offline-region-card').filter({ hasText: 'Центральный федеральный округ' });
  await expect(centralAfterReload).toContainText('открыта сейчас');
  await expect(centralAfterReload.getByRole('button', { name: 'Показать карту' })).toBeVisible();
  await centralAfterReload.scrollIntoViewIfNeeded();
  await centralAfterReload.getByRole('button', { name: 'Показать карту' }).click();
  await expect(page.locator('#pmtilesPreviewPanel')).toBeVisible();
  await expectOfflinePreviewNearViewportTop(page);
});


test('offline region install keeps manual fallback on fetch failure', async ({ page }) => {
  await bootApp(page, { fakeOfflineManifest: true, fakeOfflineManifestSmallSizes: true, fakeOfflineAssetError: true });

  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  await page.locator('#refreshOfflineRegionCatalogBtn').click();
  await openOfflineCountryFolder(page, 'russia');
  const central = page.locator('.offline-region-card').filter({ hasText: 'Центральный федеральный округ' });
  await central.getByRole('button', { name: 'Установить' }).click();
  await expect(page.locator('#offlineRegionInstallConfirmDialog')).toBeVisible();
  await page.locator('#offlineRegionInstallConfirmBtn').click();
  await expect(central).toContainText(/нужна ручная загрузка|ошибка/);
  await expect(central.getByRole('link', { name: 'Скачать вручную' })).toBeVisible();
  await expect(page.locator('#offlineMapsCountPill')).toContainText('Офлайн-карт нет');
  await expect(page.locator('#pmtilesPreviewPanel')).toBeHidden();
});


test('offline region catalog opens the installed local map instead of remote package', async ({ page }) => {
  await bootApp(page, { fakePmtilesRuntime: true, fakeOfflineManifest: true, fakeOfflineManifestSmallSizes: true });

  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  await page.locator('#localPmtilesFileInput').setInputFiles({
    name: 'kaliningrad.pmtiles',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from(`PMTiles fake ${'x'.repeat(256)}`)
  });
  await expect(page.locator('#appToast')).toContainText('Карта импортирована');
  await expect(page.locator('#offlineImportNameDialog')).toBeVisible();
  await page.locator('#offlineImportNameInput').fill('Калининград');
  await page.locator('#offlineImportNameSaveBtn').click();

  await page.locator('#refreshOfflineRegionCatalogBtn').click();
  await openOfflineCountryFolder(page, 'russia');
  const kaliningrad = page.locator('.offline-region-card').filter({ hasText: 'Калининградская область' });
  await expect(kaliningrad).toContainText('открыта сейчас');
  await expect(kaliningrad.getByRole('button', { name: 'Показать карту' })).toBeVisible();
  await expect(kaliningrad.getByRole('link', { name: 'Скачать заново' })).toHaveAttribute('href', /kaliningrad\.pmtiles$/);

  await expect(page.locator('.offline-region-card').filter({ hasText: 'Центральный федеральный округ' }).getByRole('button', { name: 'Установить' })).toBeVisible();
  await expect(page.locator('#pmtilesPreviewPanel')).toBeVisible();

  await kaliningrad.scrollIntoViewIfNeeded();
  await kaliningrad.getByRole('button', { name: 'Показать карту' }).click();
  await expect(page.locator('#offlinePackageManifestStatus')).toContainText('Локальная карта: Калининград');
  await expect(page.locator('#pmtilesPreviewPanel')).toBeVisible();
  await expect(page.locator('#pmtilesPreviewMap')).toHaveAttribute('data-fake-maplibre', 'ready');
  await expectOfflinePreviewNearViewportTop(page);
  const fabStackStyle = await page.locator('.offline-map-fab-stack').evaluate((el) => {
    const style = window.getComputedStyle(el);
    return { right: style.right, top: style.top, position: style.position };
  });
  const frameBox = await page.locator('.pmtiles-preview-frame').boundingBox();
  const fabStackBox = await page.locator('.offline-map-fab-stack').boundingBox();
  const centerButtonBox = await page.locator('#centerPmtilesOnMeBtn').boundingBox();
  expect(fabStackStyle.position).toBe('absolute');
  expect(fabStackStyle.right).not.toBe('auto');
  expect(frameBox).not.toBeNull();
  expect(fabStackBox).not.toBeNull();
  expect(centerButtonBox).not.toBeNull();
  expect(fabStackBox.x).toBeGreaterThanOrEqual(frameBox.x);
  expect(fabStackBox.y).toBeGreaterThanOrEqual(frameBox.y);
  expect(fabStackBox.x + fabStackBox.width).toBeLessThanOrEqual(frameBox.x + frameBox.width + 1);
  expect(centerButtonBox.x).toBeGreaterThanOrEqual(fabStackBox.x);
  expect(centerButtonBox.x + centerButtonBox.width).toBeLessThanOrEqual(fabStackBox.x + fabStackBox.width + 1);
});


test('manual PMTiles import keeps the IndexedDB fallback compatible without OPFS', async ({ page }) => {
  await bootApp(page, { fakePmtilesRuntime: true, forceNoOpfs: true });

  const hasOpfs = await page.evaluate(() => Boolean(navigator.storage && typeof navigator.storage.getDirectory === 'function'));
  expect(hasOpfs).toBe(false);

  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  await page.locator('#localPmtilesFileInput').setInputFiles({
    name: 'webkit-fallback.pmtiles',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from(`PMTiles fake ${'x'.repeat(256)}`)
  });

  await expect(page.locator('#appToast')).toContainText('Карта импортирована');
  await expect(page.locator('#localPmtilesImportProgressBar')).toHaveAttribute('aria-valuenow', '100');
  await expect(page.locator('#offlineImportNameDialog')).toBeVisible();
  await page.locator('#offlineImportNameKeepBtn').click();
  await expect(page.locator('#offlineMapsCountPill')).toContainText('1 офлайн-карта');
  await expect(page.locator('#localPmtilesFileStatus')).toContainText('импортирован в IndexedDB');
});


test('offline map manager imports, previews and deletes a local map', async ({ page }) => {
  await bootApp(page, { fakePmtilesRuntime: true });

  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  await page.locator('#localPmtilesFileInput').setInputFiles({
    name: 'karelia.pmtiles',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from(`PMTiles fake ${'x'.repeat(256)}`)
  });

  await expect(page.locator('#appToast')).toContainText('Проверяю файл карты');
  await expect(page.locator('#appToast')).toContainText('Импорт карты начался');
  await expect(page.locator('#appToast')).toContainText('Карта импортирована');
  await expect(page.locator('#offlineImportNameDialog')).toBeVisible();
  await expect(page.locator('#localPmtilesImportProgress')).toBeVisible();
  await expect(page.locator('#localPmtilesImportProgressBar')).toHaveAttribute('aria-valuenow', '100');
  await expect(page.locator('#localPmtilesImportProgressText')).toContainText('импорт завершён');
  await page.locator('#offlineImportNameInput').fill('Карелия');
  await page.locator('#offlineImportNameSaveBtn').click();
  await expect(page.locator('#offlineImportNameDialog')).toBeHidden();
  await expect(page.locator('#offlineMapsCountPill')).toContainText('1 офлайн-карта');
  await expect(page.locator('#pmtilesPreviewPanel')).toBeVisible();
  await expect(page.locator('#pmtilesPreviewMap')).toHaveAttribute('data-fake-maplibre', 'ready');
  await expect(page.locator('#currentOfflineMapStatus')).toContainText('Карелия');
  await expect(page.locator('#offlineActiveMapPill')).toContainText('Активна');
  await expect(page.locator('#offlineMapListSection')).toBeVisible();
  await expect(page.locator('#rememberedPmtilesMapsList')).toContainText('Карелия');

  await page.locator('#renameRememberedPmtilesMapBtn').click();
  await expect(page.locator('#rememberedPmtilesMapNameInput')).toBeVisible();
  await page.locator('#rememberedPmtilesMapNameInput').fill('Карелия север');
  await page.locator('#renameRememberedPmtilesMapBtn').click();
  await expect(page.locator('#currentOfflineMapStatus')).toContainText('Карелия север');
  await expect(page.locator('#rememberedPmtilesMapsList')).toContainText('Карелия север');

  await page.reload();
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);
  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  await expect(page.locator('#offlineMapsCountPill')).toContainText('1 офлайн-карта');
  await expect(page.locator('#currentOfflineMapStatus')).toContainText('Карелия север');
  await expect(page.locator('#offlineMapEmptyState')).toContainText('повторного выбора файла');
  await expect(page.locator('#offlineMapEmptyState')).not.toContainText('файл нужно выбрать заново');
  await expect(page.locator('#pmtilesPreviewPanel')).toBeVisible();

  await page.locator('#forgetRememberedPmtilesMapBtn').click();
  await expect(page.locator('#offlineDeleteMapDialog')).toBeVisible();
  await expect(page.locator('#offlineDeleteMapTitle')).toContainText('Карелия север');
  await expect(page.locator('#offlineDeleteMapText')).toContainText('только файл');
  await expect(page.locator('#offlineDeleteMapText')).toContainText('Точки, маршруты, группы и backup JSON останутся');
  await expect(page.locator('#offlineDeleteMapText')).toContainText('скачать или импортировать повторно');
  await page.locator('#offlineDeleteMapCancelBtn').click();
  await expect(page.locator('#offlineDeleteMapDialog')).toBeHidden();
  await expect(page.locator('#offlineMapsCountPill')).toContainText('1 офлайн-карта');
  await page.locator('#forgetRememberedPmtilesMapBtn').click();
  await page.locator('#offlineDeleteMapConfirmBtn').click();
  await expect(page.locator('#offlineMapsCountPill')).toContainText('Офлайн-карт нет');
  await expect(page.locator('#pmtilesPreviewPanel')).toBeHidden();
  await expect(page.locator('#offlineActiveMapDetails')).toBeHidden();
  await expect(page.locator('#offlineMapListSection')).toBeHidden();
});


test('deleting an offline map keeps saved spots and routes intact', async ({ page }) => {
  await bootApp(page, { fakePmtilesRuntime: true });
  await seedSpots(page);
  await seedSingleTrack(page);
  await page.reload();
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);

  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  await page.locator('#localPmtilesFileInput').setInputFiles({
    name: 'preserve-data.pmtiles',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from(`PMTiles fake ${'x'.repeat(256)}`)
  });
  await expect(page.locator('#offlineImportNameDialog')).toBeVisible();
  await page.locator('#offlineImportNameKeepBtn').click();
  await expect(page.locator('#offlineMapsCountPill')).toContainText('1 офлайн-карта');

  await page.locator('#forgetRememberedPmtilesMapBtn').click();
  await expect(page.locator('#offlineDeleteMapDialog')).toBeVisible();
  await expect(page.locator('#offlineDeleteMapText')).toContainText('Точки, маршруты, группы и backup JSON останутся');
  await page.locator('#offlineDeleteMapConfirmBtn').click();
  await expect(page.locator('#offlineMapsCountPill')).toContainText('Офлайн-карт нет');

  const state = await readLocalBackupState(page);
  expect(state.spots).toHaveLength(3);
  expect(state.tracks).toHaveLength(1);
  expect(state.tracks[0].id).toBe('e2e-preserved-track');
});


test('manual offline map import can be canceled without adding a partial map', async ({ page }) => {
  await bootApp(page, { fakePmtilesRuntime: true, slowLocalFileReads: true });

  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  const bytes = Buffer.alloc(9 * 1024 * 1024, 120);
  Buffer.from('PMTiles fake').copy(bytes, 0);
  await page.locator('#localPmtilesFileInput').setInputFiles({
    name: 'cancel-me.pmtiles',
    mimeType: 'application/octet-stream',
    buffer: bytes
  });

  await expect(page.locator('#localPmtilesImportProgress')).toBeVisible();
  await expect(page.locator('#cancelLocalPmtilesImportBtn')).toBeVisible();
  await page.locator('#cancelLocalPmtilesImportBtn').click();
  await expect(page.locator('#localPmtilesImportProgressText')).toContainText('импорт отменён');
  await expect(page.locator('#offlineMapsCountPill')).toContainText('Офлайн-карт нет');
  await expect(page.locator('#offlineImportNameDialog')).toBeHidden();
});



test('opening offline screen restores the last active installed map automatically', async ({ page }) => {
  await bootApp(page, { fakePmtilesRuntime: true });

  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  for (const fileName of ['north.pmtiles', 'south.pmtiles']) {
    await page.locator('#localPmtilesFileInput').setInputFiles({
      name: fileName,
      mimeType: 'application/octet-stream',
      buffer: Buffer.from(`PMTiles fake ${fileName} ${'x'.repeat(256)}`)
    });
    await expect(page.locator('#appToast')).toContainText('Карта импортирована');
    await expect(page.locator('#offlineImportNameDialog')).toBeVisible();
    await page.locator('#offlineImportNameKeepBtn').click();
  }

  await expect(page.locator('#offlineMapsCountPill')).toContainText('2 офлайн-карты');
  await expect(page.locator('#pmtilesPreviewPanel')).toBeVisible();
  await expect(page.locator('#currentOfflineMapStatus')).toContainText('south');

  await page.getByRole('button', { name: 'Карта', exact: true }).click();
  await expect(page.locator('#screen-map')).toBeVisible();
  await page.reload();
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);
  await expect(page.locator('#screen-map')).toBeVisible();

  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  await expect(page.locator('#offlineMapsCountPill')).toContainText('2 офлайн-карты');
  await expect(page.locator('#pmtilesPreviewPanel')).toBeVisible();
  await expect(page.locator('#pmtilesPreviewMap')).toHaveAttribute('data-fake-maplibre', 'ready');
  await expect(page.locator('#currentOfflineMapStatus')).toContainText('south');
});

test('offline map preview builds an OpenMapTiles compatible style for Planetiler metadata', async ({ page }) => {
  await bootApp(page, { fakePmtilesRuntime: true });

  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  await page.locator('#localPmtilesFileInput').setInputFiles({
    name: 'planetiler-openmaptiles.pmtiles',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from(`PMTiles fake ${'x'.repeat(256)}`)
  });

  await expect(page.locator('#offlineImportNameDialog')).toBeVisible();
  await page.locator('#offlineImportNameInput').fill('Planetiler тест');
  await page.locator('#offlineImportNameSaveBtn').click();
  await expect(page.locator('#pmtilesPreviewPanel')).toBeVisible();
  await expect(page.locator('#pmtilesPreviewMap')).toHaveAttribute('data-fake-maplibre', 'ready');

  const styleDetails = await page.evaluate(() => ({
    layerIds: window.__lastMapLibreStyleLayerIds || [],
    sourceLayers: Array.from(new Set(window.__lastMapLibreStyleSourceLayers || []))
  }));

  expect(styleDetails.layerIds).toEqual(expect.arrayContaining([
    'pmtiles-preview-omt-landcover',
    'pmtiles-preview-omt-landuse',
    'pmtiles-preview-omt-park',
    'pmtiles-preview-omt-water',
    'pmtiles-preview-omt-waterway',
    'pmtiles-preview-omt-boundary',
    'pmtiles-preview-omt-road-major',
    'pmtiles-preview-omt-building',
    'pmtiles-preview-omt-place-labels'
  ]));
  expect(styleDetails.sourceLayers).toEqual(expect.arrayContaining([
    'landcover',
    'landuse',
    'park',
    'water',
    'waterway',
    'boundary',
    'transportation',
    'building',
    'place'
  ]));
});


test('offline map import rejects invalid files without adding a map', async ({ page }) => {
  await bootApp(page, { fakePmtilesRuntime: true });

  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  await page.locator('#localPmtilesFileInput').setInputFiles({
    name: 'not-a-map.txt',
    mimeType: 'text/plain',
    buffer: Buffer.from('not pmtiles')
  });

  await expect(page.locator('#offlineImportErrorDialog')).toBeVisible();
  await expect(page.locator('#offlineImportErrorText')).toContainText('Это не .pmtiles файл');
  await page.locator('#offlineImportErrorCloseBtn').click();
  await expect(page.locator('#offlineMapsCountPill')).toContainText('Офлайн-карт нет');
  await expect(page.locator('#pmtilesPreviewPanel')).toBeHidden();
});

test('offline map import warns before importing a duplicate file', async ({ page }) => {
  await bootApp(page, { fakePmtilesRuntime: true });

  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  const filePayload = {
    name: 'duplicate.pmtiles',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from(`PMTiles fake ${'x'.repeat(256)}`)
  };
  await page.locator('#localPmtilesFileInput').setInputFiles(filePayload);
  await expect(page.locator('#offlineImportNameDialog')).toBeVisible();
  await page.locator('#offlineImportNameInput').fill('Дубликат');
  await page.locator('#offlineImportNameSaveBtn').click();
  await expect(page.locator('#offlineMapsCountPill')).toContainText('1 офлайн-карта');

  await page.locator('#localPmtilesFileInput').setInputFiles(filePayload);
  await expect(page.locator('#appToast')).toContainText('Карта уже добавлена');
  await expect(page.locator('#offlineDuplicateMapDialog')).toBeVisible();
  await expect(page.locator('#offlineDuplicateMapText')).toContainText('duplicate.pmtiles');
  await page.locator('#cancelDuplicateOfflineMapBtn').click();
  await expect(page.locator('#offlineDuplicateMapDialog')).toBeHidden();
  await expect(page.locator('#offlineMapsCountPill')).toContainText('1 офлайн-карта');
});



test('settings can emergency clear imported offline map files', async ({ page }) => {
  await bootApp(page, { fakePmtilesRuntime: true });

  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  await page.locator('#localPmtilesFileInput').setInputFiles({
    name: 'emergency.pmtiles',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from(`PMTiles fake ${'x'.repeat(256)}`)
  });
  await expect(page.locator('#offlineImportNameDialog')).toBeVisible();
  await page.locator('#offlineImportNameKeepBtn').click();
  await expect(page.locator('#offlineImportNameDialog')).toBeHidden();
  await expect(page.locator('#offlineMapsCountPill')).toContainText('1 офлайн-карта');
  await expect(page.locator('#pmtilesPreviewPanel')).toBeVisible();

  await page.getByRole('button', { name: 'Настройки' }).click();
  await expect(page.locator('#screen-settings')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Удалить файлы офлайн-карт' })).toBeVisible();
  await expect(page.locator('#offlineMapFilesClearStatus')).toContainText('Импортированных офлайн-карт: 1');

  await page.getByRole('button', { name: 'Удалить файлы офлайн-карт' }).click();
  await expect(page.locator('#destructiveActionDialog')).toBeVisible();
  await expect(page.locator('#destructiveActionTitle')).toContainText('Удалить все офлайн-карты');
  await expect(page.locator('#destructiveActionDeleteText')).toContainText('только файлы офлайн-карт');
  await expect(page.locator('#destructiveActionKeepText')).toContainText('Сохранённые точки, маршруты, папки, группы, чат и backup JSON останутся');
  await expect(page.locator('#destructiveActionRestoreText')).toContainText('скачать или импортировать повторно');
  await expect(page.locator('#destructiveActionConfirmBtn')).toHaveText('Удалить офлайн-карты');
  await page.locator('#destructiveActionConfirmBtn').click();
  await expect(page.locator('#offlineMapFilesClearStatus')).toContainText('Записи “Мои карты” очищены');

  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  await expect(page.locator('#offlineMapsCountPill')).toContainText('Офлайн-карт нет');
  await expect(page.locator('#pmtilesPreviewPanel')).toBeHidden();
  await expect(page.locator('#offlineActiveMapDetails')).toBeHidden();
});

test('offline map preview supports Ko me, picked point save and shared overlays', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 56.9505, longitude: 24.1065, accuracy: 9 });
  await bootApp(page, { fakePmtilesRuntime: true });
  await seedSpots(page);
  await page.reload();
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);

  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  await page.locator('#localPmtilesFileInput').setInputFiles({
    name: 'forest.pmtiles',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from(`PMTiles fake ${'x'.repeat(256)}`)
  });
  await expect(page.locator('#offlineImportNameDialog')).toBeVisible();
  await page.locator('#offlineImportNameKeepBtn').click();
  await expect(page.locator('#offlineImportNameDialog')).toBeHidden();
  await expect(page.locator('#pmtilesPreviewPanel')).toBeVisible();
  await expect(page.locator('#pmtilesPreviewMap')).toHaveAttribute('data-fake-maplibre', 'ready');
  await expect(page.locator('#pmtilesPreviewStatus')).toContainText('Нажми на карту');
  await expect(page.locator('#pmtilesPreviewStatus')).toContainText('точки 3');

  await page.locator('#centerPmtilesOnMeBtn').click();
  await expect(page.locator('#pmtilesPreviewFocusStatus')).toContainText('Я');
  await expect(page.locator('#offlineCoverageStatus')).toContainText('внутри области текущей офлайн-карты');

  await page.locator('#pmtilesPreviewMap').click({ position: { x: 80, y: 80 } });
  await expect(page.locator('#offlinePickedPointStatus')).toContainText('Выбранная точка: 56.950500, 24.106500');
  await expect(page.locator('#savePmtilesPickedPointBtn')).toBeEnabled();
  await page.locator('#savePmtilesPickedPointBtn').click();
  await expect(page.locator('#offlinePickedPointStatus')).toContainText('нажми на офлайн-карту');

  const state = await readLocalBackupState(page);
  expect(state.spots.some((spot) => spot.source === 'offline-map-picked')).toBe(true);
  expect(state.spots.some((spot) => spot.name === 'Точка 4')).toBe(true);
});

test('offline workspace mirrors shared spots and saves picked points back to both maps', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 56.9505, longitude: 24.1065, accuracy: 9 });
  await bootApp(page, { fakePmtilesRuntime: true });
  await seedSpots(page);
  await page.reload();
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);

  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  await page.locator('#localPmtilesFileInput').setInputFiles({
    name: 'shared-spots.pmtiles',
    mimeType: 'application/octet-stream',
    buffer: Buffer.from(`PMTiles fake ${'x'.repeat(256)}`)
  });
  await expect(page.locator('#offlineImportNameDialog')).toBeVisible();
  await page.locator('#offlineImportNameKeepBtn').click();
  await expect(page.locator('#pmtilesPreviewMap')).toHaveAttribute('data-spot-count', '3');
  await expect(page.locator('#map')).toHaveAttribute('data-spot-count', '3');

  const workspaceBox = await page.locator('#pmtilesPreviewMap').boundingBox();
  expect(workspaceBox, 'offline workspace must have visible bounds').not.toBeNull();
  expect(workspaceBox.height).toBeGreaterThan(330);
  await expect(page.locator('#offlineMapExpandBtn')).toBeVisible();
  await expect(page.locator('#offlineStartGpsBtn')).toBeVisible();
  await expect(page.locator('#centerPmtilesOnMeBtn')).toBeVisible();

  await page.evaluate(() => {
    window.__fakeMapLibreHitFeature = { properties: { kind: 'spot', id: 'e2e-white-spot' } };
  });
  await page.locator('#pmtilesPreviewMap').click({ position: { x: 90, y: 90 } });
  await expect(page.locator('#offlineMapObjectCard')).toBeVisible();
  await expect(page.locator('#offlineMapObjectTitle')).toContainText('Сохранённая точка');
  await expect(page.locator('#offlineMapObjectDetails')).toContainText('Белые у ручья');

  await page.evaluate(() => {
    const frame = document.querySelector('.pmtiles-preview-frame');
    if (!frame) return;
    const frameBottomInDocument = frame.getBoundingClientRect().bottom + window.scrollY;
    const targetBottom = window.innerHeight - 4;
    window.scrollTo(0, Math.max(0, frameBottomInDocument - targetBottom));
  });
  await page.waitForTimeout(150);
  const objectSheetBox = await page.locator('#offlineMapObjectCard').boundingBox();
  const bottomNavBox = await page.locator('.bottom-nav').boundingBox();
  expect(objectSheetBox, 'offline object sheet must have visible bounds').not.toBeNull();
  expect(bottomNavBox, 'bottom navigation must have visible bounds').not.toBeNull();
  expect(
    objectSheetBox.y + objectSheetBox.height,
    'offline object sheet actions must stay above fixed bottom navigation'
  ).toBeLessThanOrEqual(bottomNavBox.y - 6);

  await page.evaluate(() => { window.__fakeMapLibreHitFeature = null; });
  await page.locator('#pmtilesPreviewMap').click({ position: { x: 120, y: 120 } });
  await expect(page.locator('#offlineMapObjectTitle')).toContainText('выбранной точки');
  await page.locator('#offlineMapObjectPrimaryBtn').click();
  await expect(page.locator('#savePlaceDialog')).toBeVisible();
  await page.locator('#spotName').fill('Офлайн общая точка');
  await page.locator('#savePlaceDialogSaveBtn').click();
  await expect(page.locator('#savePlaceDialog')).toBeHidden();
  await expect(page.locator('#pmtilesPreviewMap')).toHaveAttribute('data-spot-count', '4');
  await expect(page.locator('#map')).toHaveAttribute('data-spot-count', '4');

  const state = await readLocalBackupState(page);
  expect(state.spots.some((spot) => spot.name === 'Офлайн общая точка' && spot.source === 'offline-map-picked')).toBe(true);
});

test('offline map region rectangle creates a pmtiles bbox command', async ({ page }) => {
  await bootApp(page);

  await page.getByRole('button', { name: 'Офлайн', exact: true }).click();
  await page.locator('#startBboxExportBtn').click();
  await expect(page.locator('#screen-map')).toBeVisible();

  const overlay = page.locator('#bboxSelectionOverlay');
  await expect(overlay).toBeVisible();
  const box = await overlay.boundingBox();
  expect(box, 'bbox selection overlay must have visible bounds').not.toBeNull();
  await overlay.click({ position: { x: Math.floor(box.width * 0.25), y: Math.floor(box.height * 0.35) } });
  await expect(page.locator('#bboxExportStatus')).toContainText('первый угол выбран');
  await expect(page.locator('.map-wrap-home #mapObjectCard')).toBeHidden();
  await expect(page.locator('#saveFlowTitle')).toContainText('Выбери место или включи GPS');
  await expect(overlay).toContainText('противоположный угол');
  await overlay.click({ position: { x: Math.floor(box.width * 0.72), y: Math.floor(box.height * 0.68) } });
  await expect(page.locator('#bboxSelectionOverlay')).toBeHidden();
  await expect(page.locator('#screen-offline')).toBeVisible();
  await expect(page.locator('.map-wrap-home #mapObjectCard')).toBeHidden();

  await expect(page.locator('#bboxExportStatus')).toContainText('Регион готов');
  await expect(page.locator('#bboxCommandOutput')).toHaveValue(/[\s\S]*--bbox=/);
  await expect(page.locator('#bboxCommandOutput')).toHaveValue(/[\s\S]*--maxzoom=14/);
});


test('settings screen groups diagnostics and advanced actions', async ({ page }) => {
  await bootApp(page);

  await page.getByRole('button', { name: 'Настройки' }).click();
  await expect(page.locator('#screen-settings')).toBeVisible();

  await expect(page.getByRole('heading', { name: 'Приложение' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Версия' })).toBeVisible();
  await expect(page.locator('#screen-settings')).not.toContainText('Спринт');
  await expect(page.getByRole('heading', { name: 'Кэш' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Офлайн-режим' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Расширенный режим' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Диагностика' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Открыть debug “!”' })).toBeVisible();

  await expect(page.locator('#settingsGpsDiagnostic')).toBeVisible();
  await expect(page.locator('#settingsMapDiagnostic')).toBeVisible();
  await expect(page.locator('#settingsSupabaseDiagnostic')).toBeVisible();
  await expect(page.locator('#screen-settings')).toContainText('БД');
  await expect(page.locator('#screen-settings')).not.toContainText('Supabase cleanup');
  await expect(page.locator('#settingsPmtilesDiagnostic')).toBeVisible();
  await expect(page.locator('#settingsServiceWorkerDiagnostic')).toBeVisible();

  await expect(page.getByRole('button', { name: 'Удалить файлы офлайн-карт' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Сбросить кэш приложения' })).toBeHidden();
  await page.locator('#showMapAdvancedToggle').check();
  await expect(page.locator('#advancedModePill')).toContainText('включен');

  const cacheDangerSummary = page.locator('.settings-danger-panel summary').getByText('Опасные действия с кэшем', { exact: true });
  await expect(cacheDangerSummary).toBeVisible();
  await cacheDangerSummary.click();
  await expect(page.getByRole('button', { name: 'Сбросить кэш приложения' })).toBeVisible();

  await expect(page.locator('.maintenance-card[data-advanced-only] summary').getByText('Чистка БД', { exact: true })).toBeVisible();
});

test('group screen separates entry actions from group features', async ({ page }) => {
  await bootApp(page);

  await page.getByRole('button', { name: 'Группа' }).click();
  await expect(page.locator('#screen-group')).toBeVisible();

  await expect(page.getByRole('heading', { name: 'Моя группа' })).toBeVisible();
  await expect(page.locator('#groupStateText')).toContainText('Ты не в группе');
  await expect(page.locator('#groupStatus')).toContainText('не в группе');
  await expect(page.locator('#liveStatus')).toBeHidden();
  await expect(page.locator('#myLiveStateBox')).toBeHidden();
  await expect(page.locator('#groupCreatePanel')).toBeVisible();
  await expect(page.locator('#groupJoinPanel')).toBeVisible();
  await expect(page.getByText('Код вводить не нужно')).toBeVisible();
  await expect(page.getByLabel('Профиль на этом устройстве')).toBeVisible();
  await expect(page.getByLabel('Код или ссылка группы')).toBeVisible();
  await expect(page.locator('#copyInviteBtn')).toBeHidden();
  await expect(page.locator('#leaveGroupBtn')).toBeHidden();
  await expect(page.locator('#groupLockedPreview')).toBeHidden();
  await expect(page.locator('#groupMembersCard')).toBeHidden();
  await expect(page.locator('#liveLocationsCard')).toBeHidden();
  await expect(page.locator('#groupChatCard')).toBeHidden();

  await page.getByLabel('Профиль на этом устройстве').fill('E2E пользователь');
  await expect(page.locator('#createGroupBtn')).toBeEnabled();
  await expect(page.locator('#joinGroupBtn')).toBeDisabled();
  await page.getByLabel('Код или ссылка группы').fill('e2e-entry-ux');
  await expect(page.locator('#joinGroupBtn')).toBeEnabled();
  await page.locator('#joinGroupBtn').click();
  await expectJoinedGroupReady(page, 'e2e-entry-ux');
  await page.evaluate(() => {
    document.querySelector('#groupId')?.dispatchEvent(new Event('change', { bubbles: true }));
  });
  await expectJoinedGroupReady(page, 'e2e-entry-ux');
  await expect(page.locator('#liveStatus')).toContainText('ваши координаты не передаются');
  await expect(page.locator('#myLiveStateBox')).toBeVisible();
  await expect(page.locator('#myLiveStateText')).toContainText('Ваши координаты не передаются');
  await expect(page.locator('#groupCreatePanel')).toBeHidden();
  await expect(page.locator('#groupJoinPanel')).toBeHidden();
  await expect(page.locator('#groupLockedPreview')).toBeHidden();
  await expect(page.locator('#groupJoinedActions')).toBeVisible();
  await expect(page.locator('#currentGroupCode')).toContainText('e2e-entry-ux');
  await expect(page.locator('#copyInviteBtn')).toBeVisible();
  await expect(page.locator('#leaveGroupBtn')).toBeVisible();

  await expect(page.locator('#groupMembersCard')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Участники' })).toBeVisible();
  await expect(page.locator('#groupMembersHint')).toContainText('не создаёт маркер');
  await expect(page.locator('#friendsList')).toContainText('E2E пользователь');
  await expect(page.locator('#friendsList')).toContainText('в группе');
  await expect(page.locator('#friendsList')).toContainText('координаты не передаются');

  await expect(page.locator('#liveLocationsCard')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Live-локации' })).toBeVisible();
  await expect(page.locator('#liveLocationsHint')).toContainText('только активные live-локации');
  await expect(page.locator('#liveLocationsList')).toContainText('Нет активных live-локаций');

  await expect(page.locator('#groupChatCard')).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Чат' })).toBeVisible();
});



test('map participant labels use unique name prefixes and shared semantic colors', async ({ page }) => {
  await bootApp(page);

  const result = await page.evaluate(() => {
    const now = new Date().toISOString();
    const input = document.querySelector('#liveName');
    if (input) input.value = 'Илья';
    window.renderFriends({
      members: [
        { user_id: 'friend-a', display_name: 'Иван', last_seen_at: now, updated_at: now },
        { user_id: 'friend-b', display_name: 'Игорь', last_seen_at: now, updated_at: now },
        { user_id: 'friend-c', display_name: 'Иван', last_seen_at: now, updated_at: now }
      ],
      locations: [
        { user_id: 'friend-a', user_name: 'Иван', lat: 56.95, lon: 24.10, accuracy: 8, updated_at: now },
        { user_id: 'friend-b', user_name: 'Игорь', lat: 56.96, lon: 24.11, accuracy: 8, updated_at: now },
        { user_id: 'friend-c', user_name: 'Иван', lat: 56.97, lon: 24.12, accuracy: 8, updated_at: now }
      ]
    });
    const online = Array.from(document.querySelectorAll('.map-dot-friend span')).map((node) => node.textContent).sort();
    const offline = window.buildPmtilesPreviewUserLayerData().points.features
      .filter((feature) => feature.properties.kind === 'live')
      .map((feature) => feature.properties.shortLabel)
      .sort();
    const prefixes = Object.fromEntries(window.buildUniqueMapNameLabels([
      { id: 'anna', name: 'Анна' },
      { id: 'anton', name: 'Антон' },
      { id: 'alina', name: 'Алина' }
    ]));
    return {
      online,
      offline,
      prefixes,
      colors: {
        user: window.mapMarkerColor('user'),
        friend: window.mapMarkerColor('friend'),
        spot: window.mapMarkerColor('spot'),
        picked: window.mapMarkerColor('picked'),
        chat: window.mapMarkerColor('chat')
      },
      spotIcon: window.makeMapIcon('spot', window.shortMapObjectLabel('Белые у ручья', '?')).options.html,
      chatIcon: window.makeMapIcon('chat', window.shortMapObjectLabel('Точка из чата', '?')).options.html
    };
  });

  expect(result.online).toEqual(['И1', 'И2', 'ИГ']);
  expect(result.offline).toEqual(result.online);
  expect(result.prefixes).toEqual({ anna: 'АНН', anton: 'АНТ', alina: 'АЛ' });
  expect(new Set(Object.values(result.colors)).size).toBe(5);
  expect(result.colors).toEqual({
    user: '#2563eb',
    friend: '#f97316',
    spot: '#16a34a',
    picked: '#d97706',
    chat: '#7c3aed'
  });
  expect(result.spotIcon).toContain('>Б<');
  expect(result.chatIcon).toContain('>Т<');
});
test('group join accepts retargeted WebKit click by button geometry', async ({ page }) => {
  await bootApp(page);

  await page.getByRole('button', { name: 'Группа' }).click();
  await page.locator('#liveName').fill('E2E пользователь');
  await page.locator('#groupId').fill('e2e-retargeted-join');
  await expect(page.locator('#joinGroupBtn')).toBeEnabled();

  await page.evaluate(() => {
    const btn = document.querySelector('#joinGroupBtn');
    if (!btn) throw new Error('joinGroupBtn missing');
    const rect = btn.getBoundingClientRect();
    document.dispatchEvent(new MouseEvent('click', {
      bubbles: true,
      cancelable: true,
      clientX: rect.left + rect.width / 2,
      clientY: rect.top + rect.height / 2
    }));
  });

  await expectJoinedGroupReady(page, 'e2e-retargeted-join');
});


test('fresh invite link requires a local profile before group join', async ({ page }) => {
  await bootApp(page, { fakeSupabase: true, path: '/?group=e2e-invite-needs-profile' });

  await page.getByRole('button', { name: 'Группа' }).click();
  await expect(page.locator('#groupId')).toHaveValue('e2e-invite-needs-profile');
  await expect(page.locator('#groupStateText')).toContainText('Ты не в группе');
  await expect(page.locator('#joinGroupBtn')).toBeDisabled();
  await expect(page.locator('#liveHint')).toContainText('Вы должны быть авторизованы');

  const beforeProfile = await page.evaluate(() => ({
    persistedGroup: localStorage.getItem('mushroom_live_group_id'),
    profiles: JSON.parse(localStorage.getItem('mushroom_people_profiles_v1') || '[]')
  }));
  expect(beforeProfile.persistedGroup).toBeNull();
  expect(beforeProfile.profiles.every((profile) => !profile.lastGroupId)).toBeTruthy();

  await page.locator('#liveName').fill('E2E пользователь');
  await expect(page.locator('#joinGroupBtn')).toBeEnabled();
  await page.locator('#joinGroupBtn').click();
  await expectJoinedGroupReady(page, 'e2e-invite-needs-profile');
});

test('new local person does not inherit the previous group code', async ({ page }) => {
  await bootApp(page, { fakeSupabase: true, path: '/?group=e2e-old-person-group' });

  await page.getByRole('button', { name: 'Группа' }).click();
  await page.locator('#liveName').fill('Первый пользователь');
  await page.locator('#joinGroupBtn').click();
  await expectJoinedGroupReady(page, 'e2e-old-person-group');

  page.once('dialog', async (dialog) => {
    expect(dialog.type()).toBe('prompt');
    await dialog.accept('Другой пользователь');
  });
  await page.locator('#newPersonProfileBtn').click();

  await expect(page.locator('#groupStateText')).toContainText('Ты не в группе');
  await expect(page.locator('#liveName')).toHaveValue('Другой пользователь');
  await expect(page.locator('#groupId')).toHaveValue('');
  await expect(page.locator('#joinGroupBtn')).toBeDisabled();
  await expect(page.locator('#liveHint')).toContainText('Открой приглашение или вставь код группы вручную');

  const afterSwitch = await page.evaluate(() => ({
    persistedGroup: localStorage.getItem('mushroom_live_group_id'),
    activeProfileId: localStorage.getItem('mushroom_active_profile_id'),
    profiles: JSON.parse(localStorage.getItem('mushroom_people_profiles_v1') || '[]')
  }));
  expect(afterSwitch.persistedGroup).toBeNull();
  const active = afterSwitch.profiles.find((profile) => profile.id === afterSwitch.activeProfileId);
  expect(active?.displayName).toBe('Другой пользователь');
  expect(active?.lastGroupId || '').toBe('');
});

test('group chat disables duplicate send and clears composer after success', async ({ page }) => {
  let chatPostCount = 0;
  await bootApp(page, {
    fakeSupabase: true,
    path: '/?group=e2e-chat-guard',
    fakeSupabaseHandler: async (route, { url, method }) => {
      if (url.pathname.endsWith('/rest/v1/group_messages') && method === 'POST') {
        chatPostCount += 1;
        await new Promise(resolve => setTimeout(resolve, 250));
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([{ id: `e2e-chat-${chatPostCount}` }])
        });
        return true;
      }
      return false;
    }
  });

  await page.getByRole('button', { name: 'Группа' }).click();
  await expect(page.locator('#groupId')).toHaveValue('e2e-chat-guard');
  await page.locator('#liveName').fill('E2E пользователь');
  await page.locator('#joinGroupBtn').click();
  await expectJoinedGroupReady(page, 'e2e-chat-guard');

  const input = page.locator('#chatMessageInput');
  const sendButton = page.locator('#chatSendBtn');
  await input.fill('Одно сообщение');
  await sendButton.click();
  await expect(sendButton).toBeDisabled();
  await expect(sendButton).toHaveText('Отправка…');

  await page.evaluate(() => {
    const btn = document.querySelector('#chatSendBtn');
    if (!btn) throw new Error('chatSendBtn missing');
    btn.disabled = false;
    btn.click();
  });

  await expect(input).toHaveValue('');
  await expect(sendButton).toBeEnabled();
  await expect(sendButton).toHaveText('Отправить');
  expect(chatPostCount, 'double submit must not create duplicate chat rows').toBe(1);
});


test('leaving group clears persisted group after reload', async ({ page }) => {
  await bootApp(page, { fakeSupabase: true, path: '/?group=e2e-leave-group' });

  await page.getByRole('button', { name: 'Группа' }).click();
  await expect(page.locator('#groupId')).toHaveValue('e2e-leave-group');

  await page.locator('#liveName').fill('E2E пользователь');
  await page.locator('#joinGroupBtn').click();
  await expectJoinedGroupReady(page, 'e2e-leave-group');

  await page.locator('#leaveGroupBtn').click();
  await expect(page.locator('#groupStateText')).toContainText('Ты не в группе');
  await expect(page.locator('#groupId')).toHaveValue('');
  expect(page.url()).not.toContain('group=');

  const persisted = await page.evaluate(() => ({
    legacyGroup: localStorage.getItem('mushroom_live_group_id'),
    profiles: JSON.parse(localStorage.getItem('mushroom_people_profiles_v1') || '[]')
  }));
  expect(persisted.legacyGroup).toBeNull();
  expect(persisted.profiles.every((profile) => !profile.lastGroupId)).toBeTruthy();

  await page.reload();
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);
  await page.getByRole('button', { name: 'Группа' }).click();
  await expect(page.locator('#groupStateText')).toContainText('Ты не в группе');
  await expect(page.locator('#groupId')).toHaveValue('');
});



test('map screen keeps GPS controls but does not duplicate bottom navigation in map content', async ({ page }) => {
  await bootApp(page);

  const mapScreen = page.locator('#screen-map');
  await expect(mapScreen).toBeVisible();
  await expect(mapScreen.getByRole('button', { name: /^GPS$/ })).toBeVisible();
  await expect(mapScreen.getByRole('button', { name: /^Ко мне$/ })).toBeVisible();
  await expect(page.locator('#mapObjectCard')).toBeHidden();

  const visibleMapPrompt = page.locator('#sectionStatusMap:visible, #saveFlowState:visible');
  await expect(visibleMapPrompt).toHaveCount(1);
  const promptBox = await visibleMapPrompt.first().boundingBox();
  const mapShellBox = await page.locator('.map-home-shell').boundingBox();
  expect(promptBox, 'exactly one map guidance/status block must be visible').not.toBeNull();
  expect(mapShellBox, 'map shell must be visible on map screen').not.toBeNull();
  expect(promptBox.y + promptBox.height, 'map guidance/status must sit above the map workspace').toBeLessThanOrEqual(mapShellBox.y + 1);

  for (const forbiddenNavName of ['Точки', 'Группа', 'Офлайн', 'Настройки']) {
    await expect(mapScreen.getByRole('button', { name: new RegExp(`^${forbiddenNavName}$`) })).toHaveCount(0);
  }
});



test('mobile GPS-ready guidance wraps inside its green container', async ({ page, context }) => {
  await page.setViewportSize({ width: 360, height: 740 });
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 56.9496, longitude: 24.1052, accuracy: 12 });
  await bootApp(page);

  const state = page.locator('#saveFlowState');
  const description = page.locator('#saveFlowDescription');
  await expect(state).toBeVisible();
  await expect(state).toHaveClass(/save-flow-ready/);
  await expect(description).toContainText('GPS уже активен');
  await expect(description).toContainText('Можно добавить название, тип, заметку или фото');

  const layout = await page.evaluate(() => {
    const container = document.querySelector('#saveFlowState');
    const text = document.querySelector('#saveFlowDescription');
    const copy = text?.parentElement;
    if (!container || !text || !copy) return null;
    const containerBox = container.getBoundingClientRect();
    const textBox = text.getBoundingClientRect();
    const copyBox = copy.getBoundingClientRect();
    const style = getComputedStyle(text);
    return {
      containerBox: { left: containerBox.left, right: containerBox.right },
      textBox: { left: textBox.left, right: textBox.right },
      copyBox: { left: copyBox.left, right: copyBox.right },
      containerScrollWidth: container.scrollWidth,
      containerClientWidth: container.clientWidth,
      copyScrollWidth: copy.scrollWidth,
      copyClientWidth: copy.clientWidth,
      whiteSpace: style.whiteSpace,
    };
  });

  expect(layout, 'GPS guidance layout must be measurable').not.toBeNull();
  expect(layout.whiteSpace).toBe('normal');
  expect(layout.containerScrollWidth).toBeLessThanOrEqual(layout.containerClientWidth + 1);
  expect(layout.copyScrollWidth).toBeLessThanOrEqual(layout.copyClientWidth + 1);
  expect(layout.textBox.left).toBeGreaterThanOrEqual(layout.containerBox.left - 1);
  expect(layout.textBox.right).toBeLessThanOrEqual(layout.containerBox.right + 1);
  expect(layout.copyBox.right).toBeLessThanOrEqual(layout.containerBox.right + 1);
});

test('online map floating controls use one square touch target system', async ({ page }) => {
  await bootApp(page);

  const controls = [
    page.locator('#mapExpandBtn'),
    page.locator('#startGpsBtn'),
    page.locator('#centerMeBtn')
  ];

  const boxes = [];
  for (const control of controls) {
    await expect(control).toBeVisible();
    const box = await control.boundingBox();
    expect(box, 'online map control must have visible bounds').not.toBeNull();
    boxes.push(box);
  }

  for (const box of boxes) {
    expect(Math.abs(box.width - box.height), 'online map control must be square').toBeLessThanOrEqual(2);
    expect(box.width, 'online map control must be finger-sized').toBeGreaterThanOrEqual(48);
  }

  const [expandBox, gpsBox, centerBox] = boxes;
  expect(Math.abs(gpsBox.width - expandBox.width), 'GPS control width must match expand control').toBeLessThanOrEqual(2);
  expect(Math.abs(centerBox.width - expandBox.width), 'center-on-me control width must match expand control').toBeLessThanOrEqual(2);
  expect(centerBox.y, 'center-on-me control must sit below GPS control').toBeGreaterThan(gpsBox.y + gpsBox.height - 1);

  const mapBox = await page.locator('.map-wrap-home').boundingBox();
  expect(mapBox, 'map must have visible bounds').not.toBeNull();
  for (const box of boxes) {
    expect(box.x, 'online map control must stay inside map horizontally').toBeGreaterThanOrEqual(mapBox.x - 1);
    expect(box.y, 'online map control must stay inside map vertically').toBeGreaterThanOrEqual(mapBox.y - 1);
    expect(box.x + box.width, 'online map control must not overflow map horizontally').toBeLessThanOrEqual(mapBox.x + mapBox.width + 1);
  }

  await expect(page.locator('#centerMeBtn')).toHaveAccessibleName('Ко мне');
});

test('expanded map workspace keeps map as the primary viewport above bottom navigation', async ({ page, context }) => {
  await bootApp(page);

  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await expect(page.locator('#sectionStatusMap')).toBeVisible();
  await expect(page.locator('#saveFlowState')).toBeHidden();
  expect(
    await page.locator('#sectionStatusMap:visible, #saveFlowState:visible').count(),
    'map status and save flow must never stack above the map'
  ).toBeLessThanOrEqual(1);

  const mapBox = await page.locator('.map-wrap-home').boundingBox();
  const navBox = await page.locator('.bottom-nav').boundingBox();
  expect(mapBox, 'expanded map workspace must have visible bounds').not.toBeNull();
  expect(navBox, 'bottom navigation must stay visible').not.toBeNull();
  const availableHeight = Math.max(0, navBox.y - mapBox.y - 8);
  const expectedPrimaryHeight = Math.min(page.viewportSize().height * 0.52, availableHeight);
  expect(mapBox.height, 'map should use the available primary workspace').toBeGreaterThanOrEqual(expectedPrimaryHeight - 2);
  expect(mapBox.y + mapBox.height, 'map must not overlap the bottom navigation').toBeLessThanOrEqual(navBox.y - 6);
});

test('map workspace recomputes bottom-nav clearance when section status changes', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 56.9496, longitude: 24.1052, accuracy: 12 });
  await bootApp(page);
  await expect(page.locator('#saveFlowState')).toBeVisible();

  await context.setOffline(true);
  await page.evaluate(() => window.dispatchEvent(new Event('offline')));
  await expect(page.locator('#sectionStatusMap')).toBeVisible();

  const offlineMapBox = await page.locator('.map-wrap-home').boundingBox();
  const offlineNavBox = await page.locator('.bottom-nav').boundingBox();
  expect(offlineMapBox, 'map must remain visible while offline status is shown').not.toBeNull();
  expect(offlineNavBox, 'bottom navigation must remain visible').not.toBeNull();
  expect(offlineMapBox.y + offlineMapBox.height).toBeLessThanOrEqual(offlineNavBox.y - 6);

  await context.setOffline(false);
  await page.evaluate(() => window.dispatchEvent(new Event('online')));
  await expect(page.locator('#sectionStatusMap')).toBeHidden();
  await expect(page.locator('#saveFlowState')).toBeVisible();

  const restoredMapBox = await page.locator('.map-wrap-home').boundingBox();
  const restoredNavBox = await page.locator('.bottom-nav').boundingBox();
  expect(restoredMapBox, 'map must remain visible after status clears').not.toBeNull();
  expect(restoredNavBox, 'bottom navigation must remain visible after status clears').not.toBeNull();
  expect(restoredMapBox.y + restoredMapBox.height).toBeLessThanOrEqual(restoredNavBox.y - 6);
});

test('online map expand button fills app workspace while keeping bottom navigation usable', async ({ page }) => {
  await bootApp(page);

  const expandBtn = page.locator('#mapExpandBtn');
  await expect(expandBtn).toBeVisible();
  await expect(expandBtn).toHaveText('⛶');

  const beforeButtonBox = await expandBtn.boundingBox();
  const beforeMapBox = await page.locator('.map-wrap-home').boundingBox();
  const beforeNavBox = await page.locator('.bottom-nav').boundingBox();
  expect(beforeButtonBox, 'expand button must have visible bounds before toggle').not.toBeNull();
  expect(beforeMapBox, 'map must have visible bounds before toggle').not.toBeNull();
  expect(beforeNavBox, 'bottom navigation must have visible bounds before toggle').not.toBeNull();

  await expandBtn.click();
  await expect(page.locator('body')).toHaveClass(/online-map-expanded/);
  await expect(expandBtn).toHaveText('↙');
  await expect(expandBtn).toHaveAttribute('aria-pressed', 'true');

  const expandedButtonBox = await expandBtn.boundingBox();
  const expandedMapBox = await page.locator('.map-wrap-home').boundingBox();
  const expandedNavBox = await page.locator('.bottom-nav').boundingBox();
  expect(expandedButtonBox, 'expand button must stay visible after toggle').not.toBeNull();
  expect(expandedMapBox, 'expanded map must have visible bounds').not.toBeNull();
  expect(expandedNavBox, 'bottom navigation must stay visible after expand').not.toBeNull();
  expect(expandedButtonBox.x, 'expand button must remain inside the expanded map').toBeGreaterThanOrEqual(expandedMapBox.x - 1);
  expect(expandedButtonBox.x - expandedMapBox.x, 'expand button must stay near the expanded map left edge').toBeLessThanOrEqual(24);
  expect(expandedButtonBox.y, 'expand button must remain inside the expanded map vertically').toBeGreaterThanOrEqual(expandedMapBox.y - 1);
  expect(expandedButtonBox.y - expandedMapBox.y, 'expand button must stay near the expanded map top edge').toBeLessThanOrEqual(24);

  const expandedGpsBox = await page.locator('#startGpsBtn').boundingBox();
  const expandedCenterBox = await page.locator('#centerMeBtn').boundingBox();
  expect(expandedGpsBox, 'GPS control must remain visible after expand').not.toBeNull();
  expect(expandedCenterBox, 'center-on-me control must remain visible after expand').not.toBeNull();
  for (const box of [expandedButtonBox, expandedGpsBox, expandedCenterBox]) {
    expect(Math.abs(box.width - expandedButtonBox.width), 'expanded map controls must keep matching widths').toBeLessThanOrEqual(2);
    expect(Math.abs(box.height - expandedButtonBox.height), 'expanded map controls must keep matching heights').toBeLessThanOrEqual(2);
  }

  expect(expandedMapBox.height, 'expanded map must become taller').toBeGreaterThan(beforeMapBox.height + 40);
  expect(expandedMapBox.y + expandedMapBox.height, 'expanded map must not cover bottom navigation').toBeLessThanOrEqual(expandedNavBox.y + 2);

  await page.getByRole('button', { name: 'Точки' }).click();
  await expect(page.locator('#screen-spots')).toBeVisible();
  await expect(page.locator('body')).not.toHaveClass(/online-map-expanded/);
});

test('picked map point share action explains the missing profile without adding navigation controls', async ({ page }) => {
  await bootApp(page);
  await pickMapPoint(page);

  const card = page.locator('#mapObjectCard');
  const inMapCard = page.locator('.map-wrap-home #mapObjectCard');
  await expect(card).toBeVisible();
  await expect(inMapCard).toBeVisible();
  const mapBox = await page.locator('.map-wrap-home').boundingBox();
  const cardBox = await card.boundingBox();
  expect(mapBox, 'map viewport must have visible bounds').not.toBeNull();
  expect(cardBox, 'in-map context sheet must have visible bounds').not.toBeNull();
  expect(cardBox.height, 'in-map context sheet must stay compact').toBeLessThan(mapBox.height * 0.7);
  expect(cardBox.y, 'context sheet must sit inside the map viewport').toBeGreaterThanOrEqual(mapBox.y);
  expect(cardBox.y + cardBox.height, 'context sheet must not overflow below map viewport').toBeLessThanOrEqual(mapBox.y + mapBox.height + 1);
  await expect(page.locator('#mapObjectTitle')).toHaveText('Карточка выбранной точки');
  await expect(page.locator('#mapObjectSubtitle')).toContainText('Мини-инфо по точке');
  await expect(page.locator('#mapObjectPill')).toHaveText('выбрано');
  await expect(page.locator('#mapObjectDetails')).toContainText('ещё не сохранено');
  await expect(page.locator('#mapObjectPrimaryBtn')).toHaveText('☆ Сохранить');
  await expect(page.locator('#mapObjectSecondaryBtn')).toHaveText('Сохранить и поделиться');
  await expect(page.locator('#mapObjectSecondaryBtn')).toBeVisible();
  await expect(page.locator('#mapObjectSecondaryBtn')).toHaveAttribute('data-share-reason', 'missing-profile');
  await page.locator('#mapObjectSecondaryBtn').click();
  await expect(page.locator('#sectionStatusMap')).toBeVisible();
  await expect(page.locator('#sectionStatusMap')).toHaveAttribute('data-reason', 'missing-profile');
  await expect(page.locator('#sectionStatusMap')).toContainText('Укажи имя профиля');
  await expect(page.locator('#sectionStatusMap')).toContainText('Точку можно сохранить на устройстве');
  await expect(page.locator('#mapObjectClearBtn')).toHaveAttribute('hidden', '');
  await expect(page.locator('#mapObjectCloseBtn')).toBeVisible();
  await expect(page.locator('#mapObjectCloseBtn')).toHaveText('×');
  const titleBox = await page.locator('#mapObjectTitle').boundingBox();
  const closeBox = await page.locator('#mapObjectCloseBtn').boundingBox();
  expect(titleBox, 'selected-place title must have visible bounds').not.toBeNull();
  expect(closeBox, 'sheet close button must have visible bounds').not.toBeNull();
  expect(Math.abs(closeBox.y - titleBox.y), 'close × must align with the title row, not the collapse row').toBeLessThanOrEqual(10);
  expect(closeBox.x + closeBox.width, 'close × must sit in the top-right corner of the sheet').toBeGreaterThan(cardBox.x + cardBox.width - 48);
  await expect(page.locator('#mapObjectCollapseBtn')).toHaveText('Свернуть');
  await page.locator('#mapObjectCollapseBtn').click();
  await expect(card).toHaveClass(/map-object-collapsed/);
  await expect(page.locator('#mapObjectDetails')).toBeHidden();
  await expect(page.locator('#mapObjectPrimaryBtn')).toBeHidden();
  await expect(page.locator('#mapObjectCollapseBtn')).toHaveText('Развернуть');
  await page.locator('#mapObjectCollapseBtn').click();
  await expect(card).not.toHaveClass(/map-object-collapsed/);
  await expect(page.locator('#mapObjectDetails')).toBeVisible();
  await expect(page.locator('#mapObjectPrimaryBtn')).toBeVisible();

  for (const forbiddenNavName of ['Точки', 'Группа', 'Офлайн', 'Настройки']) {
    await expect(card.getByRole('button', { name: new RegExp(`^${forbiddenNavName}$`) })).toHaveCount(0);
  }

  await page.locator('#mapObjectCloseBtn').click();
  await expect(card).toBeHidden();
  await expect(page.locator('#saveFlowTitle')).toContainText('Выбери место или включи GPS');
});

test('picked map point context sheet sends through the same share action when group chat is ready', async ({ page }) => {
  await bootApp(page, { fakeSupabase: true, path: '/?group=e2e-context-sheet-group' });

  await page.getByRole('button', { name: 'Группа' }).click();
  await expect(page.locator('#groupId')).toHaveValue('e2e-context-sheet-group');
  await page.locator('#liveName').fill('E2E пользователь');
  await expect(page.locator('#joinGroupBtn')).toBeEnabled();
  await page.locator('#joinGroupBtn').click();
  await expectJoinedGroupReady(page, 'e2e-context-sheet-group');

  await page.getByRole('button', { name: 'Карта' }).click();
  await pickMapPoint(page);
  await expect(page.locator('.map-wrap-home #mapObjectCard')).toBeVisible();
  await expect(page.locator('#mapObjectSecondaryBtn')).toBeVisible();
  await expect(page.locator('#mapObjectSecondaryBtn')).toHaveText('Сохранить и поделиться');
  await expect(page.locator('#mapObjectSecondaryBtn')).toHaveAttribute('data-share-reason', 'ready');
  await page.locator('#mapObjectSecondaryBtn').click();
  await expect(page.locator('#mapObjectTitle')).toHaveText('Карточка выбранной точки');
  await expect(page.locator('#savePlaceDialog')).toBeVisible();
  await expect(page.locator('#savePlaceDialogTitle')).toHaveText('Сохранить выбранную точку');
  await expect(page.locator('#savePlaceDialogSaveBtn')).toHaveText('Сохранить и поделиться');
});

test('share action distinguishes not-in-group and moves the user to group entry', async ({ page }) => {
  await bootApp(page, { fakeSupabase: true, path: '/?group=e2e-share-needs-join' });

  await page.getByRole('button', { name: 'Группа' }).click();
  await page.locator('#liveName').fill('E2E пользователь');
  await expect(page.locator('#groupId')).toHaveValue('e2e-share-needs-join');

  await page.getByRole('button', { name: 'Карта' }).click();
  await pickMapPoint(page);
  await expect(page.locator('#mapObjectSecondaryBtn')).toHaveAttribute('data-share-reason', 'not-in-group');
  await page.locator('#mapObjectSecondaryBtn').click();
  await expect(page.locator('#sectionStatusMap')).toHaveAttribute('data-reason', 'not-in-group');
  await expect(page.locator('#sectionStatusMap')).toContainText('Войди в группу');
  await page.locator('#sectionStatusMap .section-status-action').click();
  await expect(page.locator('#screen-group')).toBeVisible();
  await expect(page.locator('#groupId')).toBeFocused();
});

test('e2e boot neutralizes repository Supabase config unless fake Supabase is requested', async ({ page }) => {
  await bootApp(page, { path: '/?group=e2e-config-isolation' });
  const config = await page.evaluate(() => window.MUSHROOM_CONFIG || null);
  expect(config).toEqual({});
});

test('share action distinguishes missing Supabase configuration from missing profile', async ({ page }) => {
  await bootApp(page, { path: '/?group=e2e-share-no-config' });
  await page.getByRole('button', { name: 'Группа' }).click();
  await page.locator('#liveName').fill('E2E пользователь');

  await page.getByRole('button', { name: 'Карта' }).click();
  await pickMapPoint(page);
  await expect(page.locator('#mapObjectSecondaryBtn')).toHaveAttribute('data-share-reason', 'missing-config');
  await page.locator('#mapObjectSecondaryBtn').click();
  await expect(page.locator('#sectionStatusMap')).toHaveAttribute('data-reason', 'missing-config');
  await expect(page.locator('#sectionStatusMap')).toContainText('Группы не подключены');
  await expect(page.locator('#sectionStatusMap')).toContainText('Точку можно сохранить на устройстве');
});

test('share action explains offline mode while local save remains available', async ({ page, context }) => {
  await bootApp(page, { fakeSupabase: true, path: '/?group=e2e-share-offline' });
  await page.getByRole('button', { name: 'Группа' }).click();
  await page.locator('#liveName').fill('E2E пользователь');
  await page.locator('#joinGroupBtn').click();
  await expectJoinedGroupReady(page, 'e2e-share-offline');

  await page.getByRole('button', { name: 'Карта' }).click();
  await pickMapPoint(page);
  await context.setOffline(true);
  await page.locator('#mapObjectSecondaryBtn').click();
  await expect(page.locator('#sectionStatusMap')).toHaveAttribute('data-reason', 'offline');
  await expect(page.locator('#sectionStatusMap')).toContainText('Нет соединения');
  await expect(page.locator('#sectionStatusMap')).toContainText('Точку можно сохранить на устройстве');
  await expect(page.locator('#mapObjectPrimaryBtn')).toBeVisible();
  await expect(page.locator('#mapObjectPrimaryBtn')).toBeEnabled();
});

test('save and share still saves locally when connectivity disappears before submit', async ({ page, context }) => {
  await bootApp(page, { fakeSupabase: true, path: '/?group=e2e-share-lost-before-submit' });
  await page.getByRole('button', { name: 'Группа' }).click();
  await page.locator('#liveName').fill('E2E пользователь');
  await page.locator('#joinGroupBtn').click();
  await expectJoinedGroupReady(page, 'e2e-share-lost-before-submit');

  await page.getByRole('button', { name: 'Карта' }).click();
  await pickMapPoint(page);
  await page.locator('#mapObjectSecondaryBtn').click();
  await expect(page.locator('#savePlaceDialog')).toBeVisible();
  await page.locator('#spotName').fill('Точка без сети после диалога');
  await context.setOffline(true);
  await page.locator('#savePlaceDialogSaveBtn').click();

  await expect(page.locator('#savePlaceDialog')).toBeHidden();
  await expect(page.locator('#saveResultCard')).toBeVisible();
  await expect(page.locator('#saveResultTitle')).toContainText('Точка сохранена, но не отправлена в чат');
  await expect(page.locator('#sectionStatusMap')).toHaveAttribute('data-reason', 'offline');
  const state = await readLocalBackupState(page);
  expect(state.spots.some((spot) => spot.name === 'Точка без сети после диалога')).toBe(true);
});

test('saved spot share uses the same missing-profile reason in the spots section', async ({ page }) => {
  await bootApp(page);
  await seedSpots(page);
  await page.reload();
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);

  await page.getByRole('button', { name: 'Точки' }).click();
  await page.locator('.spot-folder-card').filter({ hasText: 'Грибные места' }).click();
  await page.locator('.spot-item').filter({ hasText: 'Белые у ручья' }).locator('.spot-item-main').click();
  await expect(page.locator('#spotListSendToChatBtn')).toBeVisible();
  await expect(page.locator('#spotListSendToChatBtn')).toHaveAttribute('data-share-reason', 'missing-profile');
  await page.locator('#spotListSendToChatBtn').click();
  await expect(page.locator('#sectionStatusSpots')).toHaveAttribute('data-reason', 'missing-profile');
  await expect(page.locator('#sectionStatusSpots')).toContainText('Укажи имя профиля');
  await expect(page.locator('#sectionStatusSpots')).toContainText('Сохранённая точка останется на устройстве');
});


test('save and share keeps the saved spot when chat send fails and offers retry', async ({ page }) => {
  let chatPostCount = 0;
  await bootApp(page, {
    fakeSupabase: true,
    path: '/?group=e2e-share-retry',
    fakeSupabaseHandler: async (route, { url, method }) => {
      if (url.pathname.endsWith('/rest/v1/group_messages') && method === 'POST') {
        chatPostCount += 1;
        if (chatPostCount === 1) {
          await route.fulfill({ status: 503, contentType: 'application/json', body: JSON.stringify({ message: 'chat offline' }) });
          return true;
        }
        await route.fulfill({
          status: 201,
          contentType: 'application/json',
          body: JSON.stringify([{ id: `retry-chat-${chatPostCount}` }])
        });
        return true;
      }
      return false;
    }
  });

  await page.getByRole('button', { name: 'Группа' }).click();
  await page.locator('#liveName').fill('E2E пользователь');
  await page.locator('#joinGroupBtn').click();
  await expectJoinedGroupReady(page, 'e2e-share-retry');

  await page.getByRole('button', { name: 'Карта' }).click();
  await pickMapPoint(page);
  await page.locator('#mapObjectSecondaryBtn').click();
  await expect(page.locator('#savePlaceDialog')).toBeVisible();
  await page.locator('#spotName').fill('Точка с повтором чата');
  await page.locator('#savePlaceDialogSaveBtn').click();

  await expect(page.locator('#savePlaceDialog')).toBeHidden();
  await expect(page.locator('#saveResultCard')).toBeVisible();
  await expect(page.locator('#saveResultTitle')).toContainText('Точка сохранена, но не отправлена в чат');
  await expect(page.locator('#saveResultText')).toContainText('Точка с повтором чата');
  await expect(page.locator('#saveResultShareBtn')).toHaveText('Повторить отправку');
  await expect(page.locator('#chatHint')).toContainText('Точка сохранена, но не отправлена в чат');

  await page.locator('#saveResultListBtn').click();
  await expect(page.locator('#screen-spots')).toBeVisible();
  await expect(page.locator('#activeSpotCollectionTitle')).toHaveText('Грибные места');
  await expect(page.locator('#spotsList')).toContainText('Точка с повтором чата');

  await page.getByRole('button', { name: 'Карта' }).click();
  await page.locator('#saveResultShareBtn').click();
  await expect(page.locator('#chatHint')).toContainText('Сохранённая точка отправлена в чат');
  expect(chatPostCount).toBe(2);
});

test('picked map point bookmark opens save form and creates result actions and spots handoff', async ({ page }) => {
  await bootApp(page);
  await pickMapPoint(page);

  await page.locator('#mapObjectPrimaryBtn').click();
  await expect(page.locator('#mapObjectTitle')).toHaveText('Карточка выбранной точки');
  await expect(page.locator('#savePlaceDialog')).toBeVisible();
  await expect(page.locator('#savePlaceDialogTitle')).toHaveText('Сохранить выбранную точку');
  await page.locator('#spotCollection').selectOption({ label: 'Грибные места' });
  await page.locator('#spotName').fill('Context sheet тестовая точка');
  await page.locator('#mushroomType').fill('Белые');
  await page.locator('#spotNote').fill('Сохранено через закладку выбранного места');
  await page.locator('#savePlaceDialogSaveBtn').click();

  await expect(page.locator('#saveResultCard')).toBeVisible();
  await expect(page.locator('#saveResultText')).toContainText('Context sheet тестовая точка');
  await expect(page.locator('#mapObjectTitle')).toContainText('Сохранённая точка');
  await expect(page.locator('#mapObjectPrimaryBtn')).toHaveText('Открыть в точках');
  await expect(page.locator('#saveResultListBtn')).toBeVisible();
  await expect(page.locator('#saveResultCloseBtn')).toBeVisible();

  await page.locator('#saveResultListBtn').click();
  await expect(page.locator('#screen-spots')).toBeVisible();
  await expect(page.locator('#spotsList')).toContainText('Context sheet тестовая точка');
});

test('saved spot map sheet opens spots section for edit and delete CRUD actions', async ({ page }) => {
  await bootApp(page);
  await seedSpots(page);
  await page.reload();
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);

  await page.getByRole('button', { name: 'Точки' }).click();
  await expect(page.locator('#spotFoldersView')).toBeVisible();
  await page.locator('.spot-folder-card').filter({ hasText: 'Грибные места' }).click();
  await expect(page.locator('#spotCount')).toHaveText('1');
  const savedSpot = page.locator('.spot-item').filter({ hasText: 'Белые у ручья' });
  await savedSpot.locator('.spot-item-main').click();
  await page.locator('#spotListShowOnMapBtn').click();

  await expect(page.locator('#screen-map')).toBeVisible();
  await expect(page.locator('#mapObjectTitle')).toHaveText('Сохранённая точка');
  await expect(page.locator('#mapObjectDetails')).toContainText('Белые у ручья');
  await expect(page.locator('#mapObjectPrimaryBtn')).toHaveText('Открыть в точках');
  await expect(page.locator('#mapObjectEditBtn')).toHaveAttribute('hidden', '');
  await expect(page.locator('#mapObjectDangerBtn')).toHaveAttribute('hidden', '');
  await expect(page.locator('#mapObjectCloseBtn')).toBeVisible();

  await page.locator('#mapObjectPrimaryBtn').click();
  await expect(page.locator('#screen-spots')).toBeVisible();
  await expect(page.locator('#spotListDetailsCard')).toBeVisible();
  await expect(page.locator('#spotListDetails')).toContainText('Белые у ручья');
  await expect(page.locator('#spotListShowOnMapBtn')).toBeVisible();
  await expect(page.locator('#spotListEditBtn')).toHaveText('Править');
  await expect(page.locator('#spotListEditBtn')).toBeVisible();
  await expect(page.locator('#spotListDeleteBtn')).toHaveText('Удалить');
  await expect(page.locator('#spotListDeleteBtn')).toBeVisible();
  await expect(page.locator('#spotListCloseDetailsBtn')).toBeVisible();
  await expect(page.locator('#spotListSaveEditBtn')).toBeHidden();
  await expect(page.locator('#spotListCancelEditBtn')).toBeHidden();

  await page.locator('#spotListEditBtn').click();
  await expect(page.locator('#spotListEditor')).toBeVisible();
  await expect(page.locator('#spotListDetails')).toBeHidden();
  await expect(page.locator('#spotListShowOnMapBtn')).toBeHidden();
  await expect(page.locator('#spotListEditBtn')).toBeHidden();
  await expect(page.locator('#spotListDeleteBtn')).toBeHidden();
  await expect(page.locator('#spotListCloseDetailsBtn')).toBeHidden();
  await expect(page.locator('#spotListSaveEditBtn')).toBeVisible();
  await expect(page.locator('#spotListCancelEditBtn')).toHaveText('Отмена');
  await expect(page.locator('#spotListCancelEditBtn')).toBeVisible();
  await page.locator('#spotListCollection').selectOption({ label: 'Разведка' });
  await page.locator('#spotListName').fill('Белые у ручья — обновлено');
  await page.locator('#spotListType').fill('Белые');
  await page.locator('#spotListNote').fill('Обновлено через раздел Точки');
  await page.locator('#spotListSaveEditBtn').click();

  await expect(page.locator('#spotListEditor')).toBeHidden();
  await expect(page.locator('#spotListDetails')).toContainText('Белые у ручья — обновлено');
  await expect(page.locator('#spotListDetails')).toContainText('Разведка');
  await expect(page.locator('#spotsList')).toContainText('Белые у ручья — обновлено');

  await page.locator('#spotListDeleteBtn').click();
  await expect(page.locator('#destructiveActionDialog')).toBeVisible();
  await expect(page.locator('#destructiveActionTitle')).toContainText('Белые у ручья — обновлено');
  await expect(page.locator('#destructiveActionDeleteText')).toContainText('только эта сохранённая точка');
  await expect(page.locator('#destructiveActionKeepText')).toContainText('Офлайн-карты, маршруты, папки и другие точки останутся');
  await expect(page.locator('#destructiveActionRestoreText')).toContainText('backup JSON');
  await expect(page.locator('#destructiveActionConfirmBtn')).toHaveText('Удалить точку');
  await page.locator('#destructiveActionCancelBtn').click();
  await expect(page.locator('#destructiveActionDialog')).toBeHidden();
  await expect(page.locator('#spotListDetailsCard')).toBeVisible();
  await expect(page.locator('#spotsList')).toContainText('Белые у ручья — обновлено');

  await page.locator('#spotListDeleteBtn').click();
  await page.locator('#destructiveActionConfirmBtn').click();
  await expect(page.locator('#spotListDetailsCard')).toBeHidden();
  await expect(page.locator('#spotCount')).toHaveText('1');
  await expect(page.locator('#spotsList')).not.toContainText('Белые у ручья — обновлено');
});

test('selected map point can be saved without GPS through save dialog', async ({ page }) => {
  await bootApp(page);
  await expect(page.locator('#saveFlowTitle')).toContainText('Выбери место или включи GPS');
  await expect(page.locator('#saveSpotBtn')).toHaveText('Включить GPS');

  await pickMapPoint(page);
  await expect(page.locator('#savePlaceDialog')).toBeHidden();
  await page.locator('#mapObjectPrimaryBtn').click();
  await expect(page.locator('#savePlaceDialog')).toBeVisible();
  await page.locator('#spotName').fill('Тестовая точка без GPS');
  await page.locator('#mushroomType').fill('Белые');
  await page.locator('#spotNote').fill('Сохранено Playwright без активного GPS');
  await page.locator('#savePlaceDialogSaveBtn').click();

  await expect(page.locator('#saveResultCard')).toBeVisible();
  await expect(page.locator('#saveResultText')).toContainText('Тестовая точка без GPS');

  await page.getByRole('button', { name: 'Точки' }).click();
  await expect(page.locator('#spotFoldersView')).toBeVisible();
  await page.locator('.spot-folder-card').filter({ hasText: 'Грибные места' }).click();
  await expect(page.locator('#spotsList')).toContainText('Тестовая точка без GPS');
});

test('app requests GPS on startup and a mocked position can be saved', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 56.9496, longitude: 24.1052, accuracy: 12 });
  await bootApp(page);

  await expect(page.locator('#gpsStatus')).toHaveText('активен');
  await expect(page.locator('#saveSpotBtn')).toHaveText('Сохранить моё место');
  await page.locator('#saveSpotBtn').click();
  await expect(page.locator('#savePlaceDialog')).toBeVisible();

  await page.locator('#spotName').fill('GPS smoke точка');
  await page.locator('#mushroomType').fill('Лисички');
  await page.locator('#spotNote').fill('Сохранено с mocked GPS');
  await page.locator('#savePlaceDialogSaveBtn').click();

  await expect(page.locator('#saveResultCard')).toBeVisible();
  await page.getByRole('button', { name: 'Точки' }).click();
  await expect(page.locator('#spotFoldersView')).toBeVisible();
  await page.locator('.spot-folder-card').filter({ hasText: 'Грибные места' }).click();
  await expect(page.locator('#spotsList')).toContainText('GPS smoke точка');
});


test('track recorder saves, reloads, draws and deletes a mocked GPS route', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 56.9496, longitude: 24.1052, accuracy: 11 });
  await bootApp(page);

  await expect(page.locator('#trackRecorderCard')).toContainText('работает только пока приложение открыто');
  await expect(page.locator('#trackRecorderCard')).toContainText('не полноценная фоновая запись');

  await page.locator('#startTrackBtn').click();
  await expect(page.locator('#trackRecorderPill')).toContainText('запись идёт');
  await expect(page.locator('#trackStatusText')).toContainText('Запись активна');

  await context.setGeolocation({ latitude: 56.9502, longitude: 24.1061, accuracy: 10 });
  await page.locator('#stopTrackBtn').click();
  await expect(page.locator('#trackStatusText')).toContainText('Маршрут сохранён');
  await expect(page.locator('#trackList')).toContainText('Маршрут 1');
  await expect(page.locator('#trackPointCountValue')).not.toHaveText('0');

  let state = await readLocalBackupState(page);
  expect(state.tracks).toHaveLength(1);
  expect(state.tracks[0].pointCount).toBeGreaterThanOrEqual(2);
  expect(state.tracks[0].points.length).toBeGreaterThanOrEqual(2);

  await page.locator('.track-item').filter({ hasText: 'Маршрут 1' }).getByRole('button', { name: 'Показать' }).click();
  await expect(page.locator('#screen-map')).toBeVisible();
  await expect(page.locator('#map')).toHaveAttribute('data-track-line-count', /[1-9]/);

  const backup = await exportBackupViaSettings(page);
  expect(backup.validation.trackCount).toBe(1);
  expect(backup.data.tracks[0].points.length).toBeGreaterThanOrEqual(2);

  await page.reload();
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);
  await expect(page.locator('#trackList')).toContainText('Маршрут 1');
  await page.getByRole('button', { name: 'Карта' }).click();
  await expect(page.locator('#screen-map')).toBeVisible();
  await expect(page.locator('#map')).toHaveAttribute('data-track-line-count', /[1-9]/);

  await expect(page.locator('.track-item').filter({ hasText: 'Маршрут 1' }).getByRole('button', { name: 'Удалить' })).toBeVisible();
  await page.locator('.track-item').filter({ hasText: 'Маршрут 1' }).getByRole('button', { name: 'Удалить' }).click();
  await expect(page.locator('#destructiveActionDialog')).toBeVisible();
  await expect(page.locator('#destructiveActionTitle')).toContainText('Маршрут 1');
  await expect(page.locator('#destructiveActionDeleteText')).toContainText('только этот записанный маршрут');
  await expect(page.locator('#destructiveActionKeepText')).toContainText('Сохранённые точки, офлайн-карты и другие маршруты останутся');
  await expect(page.locator('#destructiveActionConfirmBtn')).toHaveText('Удалить маршрут');
  await page.locator('#destructiveActionConfirmBtn').click();
  await expect(page.locator('#trackList')).toContainText('Сохранённых маршрутов пока нет');
  state = await readLocalBackupState(page);
  expect(state.tracks).toEqual([]);
});


test('active route recording stays visible across sections and above bottom navigation', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 56.9496, longitude: 24.1052, accuracy: 10 });
  await bootApp(page);

  const routeBar = page.locator('#routeRecordingBar');
  const routeSummary = page.locator('#routeRecordingSummary');
  const bottomNav = page.locator('.bottom-nav');

  await expect(routeBar).toBeHidden();
  await page.locator('#startTrackBtn').click();
  await expect(routeBar).toBeVisible();
  await expect(routeBar).toHaveAttribute('data-origin-screen', 'map');
  await expect(page.locator('#routeRecordingTitle')).toContainText('Записывается маршрут');
  await expect(routeSummary).toContainText('GPS-точек:');
  await expect(routeSummary).toContainText(/\d+ мин \d{2} сек/);

  for (const screen of ['Точки', 'Группа', 'Офлайн', 'Настройки']) {
    await page.getByRole('button', { name: screen, exact: true }).click();
    await expect(routeBar, `route bar must remain visible on ${screen}`).toBeVisible();
    const barBox = await routeBar.boundingBox();
    const navBox = await bottomNav.boundingBox();
    expect(barBox, `route bar bounds on ${screen}`).not.toBeNull();
    expect(navBox, `bottom navigation bounds on ${screen}`).not.toBeNull();
    expect(barBox.y + barBox.height, `route bar must stay above navigation on ${screen}`).toBeLessThanOrEqual(navBox.y - 4);
  }

  await page.locator('#routeRecordingOpenBtn').click();
  await expect(page.locator('#screen-map')).toBeVisible();
  await expect(page.getByRole('button', { name: 'Карта', exact: true })).toHaveAttribute('aria-current', 'page');

  await context.setGeolocation({ latitude: 56.9504, longitude: 24.1064, accuracy: 9 });
  await expect(routeSummary).toContainText(/GPS-точек: [1-9]/);

  await page.getByRole('button', { name: 'Группа', exact: true }).click();
  await page.locator('#routeRecordingStopBtn').click();
  await expect(routeBar).toBeHidden();
  await page.getByRole('button', { name: 'Карта', exact: true }).click();
  await expect(page.locator('#trackStatusText')).toContainText('Маршрут сохранён');
});

test('spots screen opens as folder list and filters marks inside folder', async ({ page }) => {
  await bootApp(page);
  await seedSpots(page);
  await page.reload();
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);

  await page.getByRole('button', { name: 'Точки' }).click();
  await expect(page.locator('#spotFoldersView')).toBeVisible();
  await expect(page.locator('#spotFolderDetailView')).toBeHidden();
  await expect(page.locator('#spotCount')).toHaveText('5 папок');
  await expect(page.locator('#spotFoldersList')).toContainText('Грибные места');
  await expect(page.locator('#spotFoldersList')).toContainText('Разведка');
  await expect(page.locator('#spotsList')).not.toContainText('Белые у ручья');

  await page.locator('.spot-folder-card').filter({ hasText: 'Разведка' }).click();
  await expect(page.locator('#spotFolderDetailView')).toBeVisible();
  await expect(page.locator('#activeSpotCollectionTitle')).toHaveText('Разведка');
  await expect(page.locator('#spotCount')).toHaveText('1');
  await expect(page.locator('#spotsList')).toContainText('Лисички у тропы');
  await expect(page.locator('#spotsList')).not.toContainText('Белые у ручья');

  await page.goBack();
  await expect(page.locator('#spotFoldersView')).toBeVisible();
  await expect(page.locator('#spotFolderDetailView')).toBeHidden();
  await page.locator('.spot-folder-card').filter({ hasText: 'Разведка' }).click();
  await expect(page.locator('#spotFolderDetailView')).toBeVisible();
  await expect(page.locator('#activeSpotCollectionTitle')).toHaveText('Разведка');
  await expect(page.locator('#spotCount')).toHaveText('1');
  await expect(page.locator('#spotsList')).toContainText('Лисички у тропы');
  await expect(page.locator('#spotsList')).not.toContainText('Белые у ручья');
  const chanterelleMenuCard = page.locator('.spot-item').filter({ hasText: 'Лисички у тропы' });
  const chanterelleMenuSummary = chanterelleMenuCard.locator('.spot-item-kebab-menu summary');
  const summaryBeforeOpen = await chanterelleMenuSummary.boundingBox();
  await chanterelleMenuSummary.click();
  const summaryAfterOpen = await chanterelleMenuSummary.boundingBox();
  expect(Math.abs((summaryAfterOpen?.x ?? 0) - (summaryBeforeOpen?.x ?? 0))).toBeLessThan(2);
  expect(Math.abs((summaryAfterOpen?.y ?? 0) - (summaryBeforeOpen?.y ?? 0))).toBeLessThan(2);
  await expect(chanterelleMenuCard.locator('.kebab-menu-panel')).toBeVisible();
  await expect(chanterelleMenuCard.getByRole('button', { name: 'Показать на карте' })).toBeVisible();
  await expect(chanterelleMenuCard.getByRole('button', { name: 'Показать на карте' })).toBeEnabled();
  await expect(chanterelleMenuCard.getByRole('button', { name: 'Отправить в чат' })).toBeVisible();
  await expect(chanterelleMenuCard.getByRole('button', { name: 'Править', exact: true })).toBeVisible();
  await expect(chanterelleMenuCard.getByRole('button', { name: 'Править', exact: true })).toBeEnabled();
  await expect(chanterelleMenuCard.getByRole('button', { name: 'Удалить' })).toBeVisible();
  await expect(chanterelleMenuCard.getByRole('button', { name: 'Удалить' })).toBeEnabled();
  await chanterelleMenuCard.locator('.spot-item-kebab-menu summary').click();

  await page.locator('#searchInput').fill('лис');
  await expect(page.locator('#spotCount')).toHaveText('1');
  await expect(page.locator('#spotsList')).toContainText('Лисички у тропы');

  await page.locator('#searchInput').fill('нет такого места');
  await expect(page.locator('#spotCount')).toHaveText('0/1');
  await expect(page.locator('#spotsList')).not.toContainText('Лисички у тропы');

  await page.locator('#searchInput').fill('');
  await page.locator('#spotFolderBackBtn').click();
  await expect(page.locator('#spotFoldersView')).toBeVisible();
  await expect(page.locator('#spotCollectionCreateOpenBtn')).toBeVisible();
  await expect(page.locator('#spotCollectionNameInput')).toBeHidden();
  await expect(page.locator('#spotCollectionManagerHint')).toContainText('Выбери папку, чтобы открыть метки.');
  const folderCard = page.locator('.spot-folder-card').filter({ hasText: 'Грибные места' });
  const folderMenuSummary = folderCard.locator('.folder-card-kebab-menu summary');
  await expect(folderMenuSummary).toBeVisible();
  const folderSummaryBefore = await folderMenuSummary.boundingBox();
  await folderMenuSummary.click();
  const folderSummaryAfter = await folderMenuSummary.boundingBox();
  expect(Math.abs((folderSummaryAfter?.x ?? 0) - (folderSummaryBefore?.x ?? 0))).toBeLessThan(2);
  expect(Math.abs((folderSummaryAfter?.y ?? 0) - (folderSummaryBefore?.y ?? 0))).toBeLessThan(2);
  const folderPanelBox = await folderCard.locator('.kebab-menu-panel').boundingBox();
  expect((folderPanelBox?.y ?? 0), 'folder card menu should open near the kebab instead of dropping into the next row').toBeLessThanOrEqual((folderSummaryAfter?.y ?? 0) + 2);
  await expect(folderCard.getByRole('button', { name: 'Переименовать' })).toBeVisible();
  await expect(folderCard.getByRole('button', { name: 'Удалить' })).toBeVisible();
  await folderCard.getByRole('button', { name: 'Переименовать' }).click();
  await expect(page.locator('#spotFolderRenameDialog')).toBeVisible();
  await expect(page.locator('#spotFoldersView')).toBeVisible();
  await expect(page.locator('#spotFolderDetailView')).toBeHidden();
  await page.locator('#spotFolderRenameDialogCancelBtn').click();
  await expect(page.locator('#spotFolderRenameDialog')).toBeHidden();
  await expect(page.locator('#spotFoldersView')).toBeVisible();
  await expect(page.locator('#spotFolderDetailView')).toBeHidden();
  await folderCard.click();
  await expect(page.locator('#spotFolderMenu')).toBeVisible();
  await page.locator('#spotFolderMenu summary').click();
  await expect(page.locator('#spotCollectionRenameMenuBtn')).toBeEnabled();
  await expect(page.locator('#spotCollectionDeleteMenuBtn')).toBeEnabled();
  await page.locator('#spotFolderMenu summary').click();
  await page.locator('#spotTypeFilter').selectOption({ label: 'Белые' });
  await expect(page.locator('#spotCount')).toHaveText('1');
  await expect(page.locator('#spotsList')).toContainText('Белые у ручья');
  await expect(page.locator('#spotsList')).not.toContainText('Лисички у тропы');
});


test('custom spot collections can be created renamed and deleted from folder menu', async ({ page }) => {
  await bootApp(page);
  await seedSpots(page);
  await page.reload();
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);

  await page.getByRole('button', { name: 'Точки' }).click();
  await expect(page.locator('#spotFoldersView')).toBeVisible();

  await page.locator('#spotCollectionCreateOpenBtn').click();
  await expect(page.locator('#spotCollectionCreateDialog')).toBeVisible();
  await page.locator('#spotCollectionNameInput').fill('Секретные места');
  await page.locator('#spotCollectionCreateBtn').click();
  await expect(page.locator('#spotCollectionManagerHint')).toContainText('создана');
  await expect(page.locator('#spotFoldersList')).toContainText('Секретные места');
  await expect(page.locator('#spotCollectionManageSelect option').filter({ hasText: 'Секретные места' })).toHaveCount(1);

  await page.locator('#spotCollectionCreateOpenBtn').click();
  await expect(page.locator('#spotCollectionCreateDialog')).toBeVisible();
  await page.locator('#spotCollectionNameInput').fill('  секретные   места  ');
  await page.locator('#spotCollectionCreateBtn').click();
  await expect(page.locator('#spotCollectionManagerHint')).toContainText('уже есть');
  await expect(page.locator('#spotCollectionManageSelect option').filter({ hasText: 'Секретные места' })).toHaveCount(1);
  await page.locator('#spotCollectionCreateCancelBtn').click();
  await expect(page.locator('#spotCollectionCreateDialog')).toBeHidden();

  await page.locator('.spot-folder-card').filter({ hasText: 'Разведка' }).click();
  await expect(page.locator('#spotsList')).toContainText('Лисички у тропы');
  await page.locator('.spot-item').filter({ hasText: 'Лисички у тропы' }).locator('.spot-item-kebab-menu summary').click();
  await page.locator('.spot-item').filter({ hasText: 'Лисички у тропы' }).getByRole('button', { name: 'Править', exact: true }).click();
  await expect(page.locator('#spotListEditor')).toBeVisible();
  await page.locator('#spotListCollection').selectOption({ label: 'Секретные места' });
  await page.locator('#spotListSaveEditBtn').click();
  await expect(page.locator('#activeSpotCollectionTitle')).toHaveText('Секретные места');
  await expect(page.locator('#spotCount')).toHaveText('1');
  await expect(page.locator('#spotsList')).toContainText('Лисички у тропы');

  await page.locator('#spotFolderMenu summary').click();
  await page.locator('#spotCollectionRenameMenuBtn').click();
  await expect(page.locator('#spotFolderEditPanel')).toBeVisible();
  await page.locator('#spotCollectionRenameInput').fill('  разведка  ');
  await page.locator('#spotCollectionRenameBtn').click();
  await expect(page.locator('#spotCollectionManagerHint')).toContainText('уже есть');
  await expect(page.locator('#spotCollectionManageSelect option').filter({ hasText: 'Разведка' })).toHaveCount(1);

  await page.locator('#spotCollectionRenameInput').fill('Семейные места');
  await page.locator('#spotCollectionRenameBtn').click();
  await expect(page.locator('#spotCollectionManagerHint')).toContainText('переименована');
  await expect(page.locator('#activeSpotCollectionTitle')).toHaveText('Семейные места');
  await expect(page.locator('#spotsList')).toContainText('Лисички у тропы');

  await page.locator('#spotFolderBackBtn').click();
  await page.locator('#spotCollectionCreateOpenBtn').click();
  await expect(page.locator('#spotCollectionCreateDialog')).toBeVisible();
  await page.locator('#spotCollectionNameInput').fill('семейные места');
  await page.locator('#spotCollectionCreateBtn').click();
  await expect(page.locator('#spotCollectionManagerHint')).toContainText('уже есть');
  await expect(page.locator('#spotCollectionManageSelect option').filter({ hasText: 'Семейные места' })).toHaveCount(1);
  await page.locator('#spotCollectionCreateCancelBtn').click();
  await expect(page.locator('#spotCollectionCreateDialog')).toBeHidden();

  await page.locator('.spot-folder-card').filter({ hasText: 'Семейные места' }).click();
  await page.locator('#spotFolderMenu summary').click();
  await page.locator('#spotCollectionDeleteMenuBtn').click();
  await expect(page.locator('#spotFolderDeleteDialog')).toBeVisible();
  await expect(page.locator('#spotFolderDeleteDialogCount')).toContainText('1 метка');
  await page.locator('#spotFolderDeleteTarget').selectOption('Грибные места');
  await page.locator('#spotFolderDeleteMoveBtn').click();
  await expect(page.locator('#spotFolderDeleteDialog')).toBeHidden();
  await expect(page.locator('#spotCollectionManagerHint')).toContainText('Перенесено меток: 1');
  await expect(page.locator('#spotFoldersView')).toBeVisible();
  await page.locator('.spot-folder-card').filter({ hasText: 'Грибные места' }).click();
  await expect(page.locator('#spotCount')).toHaveText('2');
  await expect(page.locator('#spotsList')).toContainText('Лисички у тропы');
  await expect(page.locator('#spotsList')).toContainText('Белые у ручья');
});


test('folder delete dialog can delete the folder and all contained spots', async ({ page }) => {
  await bootApp(page);
  await seedSpots(page);
  await page.reload();
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);

  await page.getByRole('button', { name: 'Точки' }).click();
  await page.locator('.spot-folder-card').filter({ hasText: 'Ягоды' }).click();
  await expect(page.locator('#spotsList')).toContainText('Подберёзовики за домом');

  await page.locator('#spotFolderMenu summary').click();
  await page.locator('#spotCollectionDeleteMenuBtn').click();
  await expect(page.locator('#spotFolderDeleteDialog')).toBeVisible();
  await expect(page.locator('#spotFolderDeleteDialogTitle')).toContainText('Ягоды');
  await expect(page.locator('#spotFolderDeleteDialogCount')).toContainText('1 метка');
  await page.locator('#spotFolderDeleteAllRequestBtn').click();
  await expect(page.locator('#spotFolderDeleteDangerDialog')).toBeVisible();
  await expect(page.locator('#spotFolderDeleteDangerText')).toContainText('1 метка');
  await expect(page.locator('#spotFolderDeleteDangerText')).toContainText('Офлайн-карты, маршруты и остальные папки останутся');
  await expect(page.locator('#spotFolderDeleteDangerText')).toContainText('backup JSON');
  await page.locator('#spotFolderDeleteAllConfirmBtn').click();

  await expect(page.locator('#spotFolderDeleteDangerDialog')).toBeHidden();
  await expect(page.locator('#spotCollectionManagerHint')).toContainText('удалена вместе с метками: 1');
  await expect(page.locator('#spotFoldersView')).toBeVisible();
  await expect(page.locator('#spotFoldersList')).not.toContainText('Ягоды');
  await expect(page.locator('#spotFoldersList')).not.toContainText('Подберёзовики за домом');
  const deletedSpotCount = await page.evaluate(async () => {
    const DB_NAME = 'mushroom-spots-db';
    const DB_VERSION = 4;
    const SPOTS_STORE = 'spots';
    return await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, DB_VERSION);
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction(SPOTS_STORE, 'readonly');
        const store = tx.objectStore(SPOTS_STORE);
        const getReq = store.get('e2e-birch-spot');
        getReq.onsuccess = () => { db.close(); resolve(getReq.result ? 1 : 0); };
        getReq.onerror = () => reject(getReq.error);
      };
    });
  });
  expect(deletedSpotCount).toBe(0);
});


test('local JSON backup export creates validated spots and custom folders without relying on download event', async ({ page }) => {
  await bootApp(page);
  await seedSpots(page);
  await page.reload();
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);

  await page.getByRole('button', { name: 'Точки' }).click();
  await expect(page.locator('#spotFoldersView')).toBeVisible();
  await page.locator('#spotCollectionCreateOpenBtn').click();
  await expect(page.locator('#spotCollectionCreateDialog')).toBeVisible();
  await page.locator('#spotCollectionNameInput').fill('Пустая папка для backup');
  await page.locator('#spotCollectionCreateBtn').click();
  await expect(page.locator('#spotCollectionManagerHint')).toContainText('создана');

  const backup = await exportBackupViaSettings(page);
  expect(backup.schema).toBe('mushroom-spots.local-json-backup');
  expect(backup.schemaVersion).toBe(1);
  expect(backup.appVersion).toBe('0.8.9');
  expect(new Date(backup.exportedAt).toString()).not.toBe('Invalid Date');
  expect(backup.validation).toMatchObject({ spotCount: 3, trackCount: 0, customCollectionCount: 1 });
  expect(backup.validation.checksum).toMatch(/^fnv1a32:[0-9a-f]{8}$/);
  expect(backup.data.spots.map((spot) => spot.name).sort()).toEqual([
    'Белые у ручья',
    'Лисички у тропы',
    'Подберёзовики за домом'
  ].sort());
  expect(backup.data.settings.customCollections).toContain('Пустая папка для backup');
  expect(JSON.stringify(backup)).not.toContain('SUPABASE_ANON_KEY');
  expect(JSON.stringify(backup)).not.toContain('backupFolderHandle');
  expect(JSON.stringify(backup)).not.toContain('.pmtiles');
});



test('backup settings explains export scope and updates user-visible export summary', async ({ page }) => {
  await bootApp(page);
  await seedSpots(page);
  await page.reload();
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);

  const backup = await exportBackupViaSettings(page);
  expect(backup.validation.spotCount).toBe(3);
  await expect(page.locator('#backupOperationStatus')).toContainText('Экспорт готов. Точек: 3. Маршрутов: 0. Пользовательских папок: 0. Карты, группы, чат и ключи не входят в JSON. Сохрани файл вне браузера.');
  await expect(page.locator('#storageHint')).toContainText('На iPhone скачивай JSON вручную');
  await expect(page.locator('#lastBackupStatus')).not.toHaveText('—');
});

test('backup settings keeps clear rejected-import status without erasing data', async ({ page }) => {
  await bootApp(page);
  await seedSpots(page);
  await page.reload();
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);
  const before = await readLocalBackupState(page);

  await importJsonFileViaSettings(page, '{ bad backup json', /Импорт отклонён: JSON повреждён/);
  await expect(page.locator('#backupOperationStatus')).toContainText('Импорт отклонён: JSON повреждён или имеет неправильный формат. Данные на устройстве не изменены.');

  const after = await readLocalBackupState(page);
  expect(after.spots.map((spot) => spot.name).sort()).toEqual(before.spots.map((spot) => spot.name).sort());
});

test('local JSON backup import restores spots and empty custom folders on every platform', async ({ page }) => {
  await bootApp(page);
  await seedSpots(page);
  await page.reload();
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);

  await page.getByRole('button', { name: 'Точки' }).click();
  await expect(page.locator('#spotFoldersView')).toBeVisible();
  await page.locator('#spotCollectionCreateOpenBtn').click();
  await expect(page.locator('#spotCollectionCreateDialog')).toBeVisible();
  await page.locator('#spotCollectionNameInput').fill('Пустая папка для восстановления');
  await page.locator('#spotCollectionCreateBtn').click();
  await expect(page.locator('#spotCollectionManagerHint')).toContainText('создана');

  const backup = await exportBackupViaSettings(page);
  await resetLocalSpotsAndCollections(page);
  await page.reload();
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);
  let state = await readLocalBackupState(page);
  expect(state.spots).toEqual([]);
  expect(state.customCollections).toEqual([]);

  await importJsonFileViaSettings(page, backup, /Импорт завершён\. Восстановлено точек: 3\. Восстановлено маршрутов: 0\. Восстановлено пользовательских папок: 1\. Существующие данные не очищались\./);
  await expect(page.locator('#backupOperationStatus')).toContainText('Импорт завершён. Восстановлено точек: 3. Восстановлено маршрутов: 0. Восстановлено пользовательских папок: 1. Существующие данные не очищались.');
  state = await readLocalBackupState(page);
  expect(state.spots.map((spot) => spot.name).sort()).toEqual([
    'Белые у ручья',
    'Лисички у тропы',
    'Подберёзовики за домом'
  ].sort());
  expect(state.customCollections).toContain('Пустая папка для восстановления');

  await page.getByRole('button', { name: 'Точки' }).click();
  await expect(page.locator('#spotFoldersList')).toContainText('Пустая папка для восстановления');
  await page.locator('.spot-folder-card').filter({ hasText: 'Пустая папка для восстановления' }).click();
  await expect(page.locator('#activeSpotCollectionTitle')).toHaveText('Пустая папка для восстановления');
  await expect(page.locator('#spotCount')).toHaveText('0');
});

test('local JSON backup import rejects malformed JSON without erasing existing data', async ({ page }) => {
  await bootApp(page);
  await seedSpots(page);
  await page.reload();
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);
  const before = await readLocalBackupState(page);
  expect(before.spots.map((spot) => spot.name)).toContain('Белые у ручья');

  await importJsonFileViaSettings(page, '{ this is not valid json', /Импорт отклонён: JSON повреждён/);

  const after = await readLocalBackupState(page);
  expect(after.spots.map((spot) => spot.name).sort()).toEqual(before.spots.map((spot) => spot.name).sort());
});

test('local JSON backup import rejects unsupported schema before any write', async ({ page }) => {
  await bootApp(page);
  await seedSpots(page);
  await page.reload();
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);
  const before = await readLocalBackupState(page);

  await importJsonFileViaSettings(page, {
    schema: 'mushroom-spots.local-json-backup',
    schemaVersion: 999,
    appVersion: 'future',
    exportedAt: '2026-06-01T00:00:00.000Z',
    validation: { spotCount: 1, customCollectionCount: 0, checksum: 'fnv1a32:00000000' },
    data: {
      spots: [{ id: 'bad-future-spot', name: 'Не должен появиться', lat: 56, lon: 24 }],
      settings: { customCollections: [] }
    }
  }, /Импорт отклонён: Версия схемы backup не поддерживается/);

  const after = await readLocalBackupState(page);
  expect(after.spots.map((spot) => spot.name).sort()).toEqual(before.spots.map((spot) => spot.name).sort());
  expect(after.spots.map((spot) => spot.name)).not.toContain('Не должен появиться');
});

test('local JSON backup import rejects unsafe structure before any write', async ({ page }) => {
  await bootApp(page);
  await seedSpots(page);
  await page.reload();
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);
  const before = await readLocalBackupState(page);

  await importJsonFileViaSettings(page, {
    schema: 'mushroom-spots.local-json-backup',
    schemaVersion: 1,
    appVersion: '0.8.9',
    exportedAt: '2026-06-01T00:00:00.000Z',
    validation: { spotCount: 1, customCollectionCount: 1, checksum: 'fnv1a32:00000000' },
    data: {
      spots: [{ id: 'bad-coords-spot', name: 'Опасная точка', lat: 'not-a-number', lon: 24 }],
      settings: { customCollections: ['Опасная папка'] }
    }
  }, /Импорт отклонён: Точка #1 содержит неправильные координаты/);

  const after = await readLocalBackupState(page);
  expect(after.spots.map((spot) => spot.name).sort()).toEqual(before.spots.map((spot) => spot.name).sort());
  expect(after.customCollections).not.toContain('Опасная папка');
});

test('saved spot and picked map point stay separate map objects', async ({ page }) => {
  await bootApp(page);
  await seedSpots(page);
  await page.reload();
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);

  await page.getByRole('button', { name: 'Точки' }).click();
  await expect(page.locator('#spotFoldersView')).toBeVisible();
  await page.locator('.spot-folder-card').filter({ hasText: 'Грибные места' }).click();
  await expect(page.locator('#spotCount')).toHaveText('1');

  const savedSpot = page.locator('.spot-item').filter({ hasText: 'Белые у ручья' });
  await savedSpot.locator('.spot-item-main').click();
  await page.locator('#spotListShowOnMapBtn').click();
  await expect(page.locator('#screen-map')).toBeVisible();
  await expect(page.locator('.map-wrap-home #mapObjectCard')).toBeVisible();
  await expect(page.locator('#mapObjectTitle')).toContainText('Сохранённая точка');
  await expect(page.locator('#mapObjectDetails')).toContainText('Белые у ручья');

  await pickMapPoint(page);
  await expect(page.locator('#mapObjectTitle')).toContainText('Карточка выбранной точки');
  await expect(page.locator('#mapObjectSubtitle')).toContainText('Мини-инфо по точке');

  await page.getByRole('button', { name: 'Точки' }).click();
  await expect(page.locator('#spotFoldersView')).toBeVisible();
  await expect(page.locator('#spotCount')).toHaveText('5 папок');
  await expect(page.locator('#spotsList')).not.toContainText('Карточка выбранной точки');
});
