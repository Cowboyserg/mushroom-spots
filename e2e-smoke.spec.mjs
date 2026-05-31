import { expect, test } from '@playwright/test';

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

  await page.route('**/*', async (route) => {
    const url = new URL(route.request().url());

    if (options.fakeSupabase && url.pathname.endsWith('/config.js')) {
      await route.fulfill({
        status: 200,
        contentType: 'application/javascript',
        body: `window.MUSHROOM_CONFIG = { SUPABASE_URL: 'https://fake.supabase.test', SUPABASE_ANON_KEY: 'fake-anon-key' };`
      });
      return;
    }

    if (options.fakeSupabase && url.hostname === 'fake.supabase.test' && url.pathname.startsWith('/rest/v1/')) {
      const method = route.request().method();
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
  await expect(page.locator('#appVersion')).toContainText('v0.7.14 · Sprint 5.14');
  await expect(page.locator('#map')).toHaveAttribute('data-map-runtime', 'leaflet-offline-lite');
  expect(pageErrors, 'app must not throw fatal page errors during boot').toEqual([]);
}

async function pickMapPoint(page) {
  const map = page.locator('#map');
  await expect(map).toBeVisible();
  const box = await map.boundingBox();
  expect(box, 'map must have visible bounds').not.toBeNull();
  await map.click({ button: 'right', position: { x: Math.floor(box.width / 2), y: Math.floor(box.height / 2) } });
  await expect(page.locator('#saveFlowTitle')).toContainText('Будет сохранена выбранная точка');
  await expect(page.locator('#saveSpotDetails #saveSpotBtn')).toHaveText('Сохранить выбранную точку');
}

async function seedSpots(page) {
  await page.evaluate(async () => {
    const DB_NAME = 'mushroom-spots-db';
    const SPOTS_STORE = 'spots';
    const SETTINGS_STORE = 'settings';
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
        photo: null,
        createdAt: '2026-05-31T07:00:00.000Z',
        updatedAt: '2026-05-31T07:00:00.000Z',
        appVersion: '0.7.14'
      }
    ];

    await new Promise((resolve, reject) => {
      const req = indexedDB.open(DB_NAME, 2);
      req.onupgradeneeded = () => {
        const db = req.result;
        if (!db.objectStoreNames.contains(SPOTS_STORE)) db.createObjectStore(SPOTS_STORE, { keyPath: 'id' });
        if (!db.objectStoreNames.contains(SETTINGS_STORE)) db.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      };
      req.onerror = () => reject(req.error);
      req.onsuccess = () => {
        const db = req.result;
        const tx = db.transaction(SPOTS_STORE, 'readwrite');
        const store = tx.objectStore(SPOTS_STORE);
        for (const spot of spots) store.put(spot);
        tx.oncomplete = () => { db.close(); resolve(); };
        tx.onerror = () => reject(tx.error);
      };
    });
  });
}

test('app loads and bottom navigation switches screens', async ({ page }) => {
  await bootApp(page);

  await page.getByRole('button', { name: 'Точки' }).click();
  await expect(page.locator('#screen-spots')).toBeVisible();
  await expect(page.locator('#screen-map')).toBeHidden();

  await page.getByRole('button', { name: 'Группа' }).click();
  await expect(page.locator('#screen-group')).toBeVisible();

  await page.getByRole('button', { name: 'Карта' }).click();
  await expect(page.locator('#screen-map')).toBeVisible();
});

test('offline maps screen presents map manager structure', async ({ page }) => {
  await bootApp(page);

  await page.getByRole('button', { name: 'Офлайн' }).click();
  await expect(page.locator('#screen-offline')).toBeVisible();

  await expect(page.getByRole('heading', { name: 'Мои карты' })).toBeVisible();
  await expect(page.locator('#currentOfflineMapStatus')).toContainText('Офлайн-карта не выбрана');
  await expect(page.locator('#offlineMapEmptyState')).toContainText('Можно пользоваться GPS и сохранёнными точками');
  await expect(page.getByRole('button', { name: 'Выбрать файл карты' })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Предпросмотр офлайн-карты' })).toBeVisible();
  await expect(page.locator('#rememberedPmtilesMapsList')).toContainText('Мои карты пока пусты');
  await expect(page.getByRole('heading', { name: 'Подготовить регион на компьютере' })).toBeVisible();
  await expect(page.locator('.offline-diagnostics-panel > summary').getByText('Диагностика карты', { exact: true })).toBeVisible();
  await expect(page.getByRole('button', { name: 'Проверить выбранный PMTiles' })).toBeHidden();
});

test('group screen separates overview members live locations and chat empty states', async ({ page }) => {
  await bootApp(page);

  await page.getByRole('button', { name: 'Группа' }).click();
  await expect(page.locator('#screen-group')).toBeVisible();

  await expect(page.getByRole('heading', { name: 'Моя группа' })).toBeVisible();
  await expect(page.locator('#groupStateText')).toContainText('Ты не в группе');
  await expect(page.locator('#myLiveStateText')).toContainText('Геопозиция не передаётся');

  await expect(page.getByRole('heading', { name: 'Участники' })).toBeVisible();
  await expect(page.locator('#groupMembersHint')).toContainText('не создаёт маркер');
  await expect(page.locator('#friendsList')).toContainText('Открой приглашение');

  await expect(page.getByRole('heading', { name: 'Live-локации' })).toBeVisible();
  await expect(page.locator('#liveLocationsHint')).toContainText('только активные live-локации');
  await expect(page.locator('#liveLocationsList')).toContainText('Live-локации появятся');

  await expect(page.getByRole('heading', { name: 'Чат' })).toBeVisible();
  await expect(page.locator('#groupChatList')).toContainText('Чат появится после входа в группу');
});

test('leaving group clears persisted group after reload', async ({ page }) => {
  await bootApp(page, { fakeSupabase: true, path: '/?group=e2e-leave-group' });

  await page.getByRole('button', { name: 'Группа' }).click();
  await expect(page.locator('#groupId')).toHaveValue('e2e-leave-group');

  await page.locator('#liveName').fill('E2E пользователь');
  await page.locator('#joinGroupBtn').click();
  await expect(page.locator('#groupStateText')).toContainText('Ты в группе');

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
  await expect(page.locator('#appVersion')).toContainText('v0.7.14 · Sprint 5.14');
  await page.getByRole('button', { name: 'Группа' }).click();
  await expect(page.locator('#groupStateText')).toContainText('Ты не в группе');
  await expect(page.locator('#groupId')).toHaveValue('');
});

test('selected map point can be saved without GPS and save action stays inside spot form', async ({ page }) => {
  await bootApp(page);
  await expect(page.locator('#saveFlowTitle')).toContainText('Выбери место или включи GPS');
  await expect(page.locator('#saveSpotBtn')).toHaveText('Включить GPS');

  await pickMapPoint(page);
  await page.locator('#spotName').fill('Тестовая точка без GPS');
  await page.locator('#mushroomType').fill('Белые');
  await page.locator('#spotNote').fill('Сохранено Playwright без активного GPS');
  await page.locator('#saveSpotDetails #saveSpotBtn').click();

  await expect(page.locator('#saveResultCard')).toBeVisible();
  await expect(page.locator('#saveResultText')).toContainText('Тестовая точка без GPS');

  await page.getByRole('button', { name: 'Точки' }).click();
  await expect(page.locator('#spotsList')).toContainText('Тестовая точка без GPS');
});

test('GPS point can be saved with mocked geolocation', async ({ page, context }) => {
  await context.grantPermissions(['geolocation']);
  await context.setGeolocation({ latitude: 56.9496, longitude: 24.1052, accuracy: 12 });
  await bootApp(page);

  await page.locator('#startGpsBtn').click();
  await expect(page.locator('#gpsStatus')).toHaveText('активен');
  await expect(page.locator('#saveSpotBtn')).toHaveText('Сохранить моё место');

  await page.locator('#spotName').fill('GPS smoke точка');
  await page.locator('#mushroomType').fill('Лисички');
  await page.locator('#spotNote').fill('Сохранено с mocked GPS');
  await page.locator('#saveSpotDetails #saveSpotBtn').click();

  await expect(page.locator('#saveResultCard')).toBeVisible();
  await page.getByRole('button', { name: 'Точки' }).click();
  await expect(page.locator('#spotsList')).toContainText('GPS smoke точка');
});

test('spots list search, type filter and name sorting work on seeded data', async ({ page }) => {
  await bootApp(page);
  await seedSpots(page);
  await page.reload();
  await expect(page.locator('#appVersion')).toContainText('v0.7.14 · Sprint 5.14');

  await page.getByRole('button', { name: 'Точки' }).click();
  await expect(page.locator('#spotCount')).toHaveText('3');
  await expect(page.locator('#spotsList')).toContainText('Белые у ручья');
  await expect(page.locator('#spotsList')).toContainText('Лисички у тропы');

  await page.locator('#searchInput').fill('лис');
  await expect(page.locator('#spotCount')).toHaveText('1/3');
  await expect(page.locator('#spotsList')).toContainText('Лисички у тропы');
  await expect(page.locator('#spotsList')).not.toContainText('Белые у ручья');

  await page.locator('#searchInput').fill('');
  await page.locator('#spotTypeFilter').selectOption({ label: 'Белые' });
  await expect(page.locator('#spotCount')).toHaveText('1/3');
  await expect(page.locator('#spotsList')).toContainText('Белые у ручья');
  await expect(page.locator('#spotsList')).not.toContainText('Лисички у тропы');

  await page.locator('#spotTypeFilter').selectOption('all');
  await page.locator('#spotSortSelect').selectOption('name');
  const titles = await page.locator('#spotsList .spot-title').allTextContents();
  expect(titles).toEqual(['Белые у ручья', 'Лисички у тропы', 'Подберёзовики за домом']);
});

test('saved spot and picked map point stay separate map objects', async ({ page }) => {
  await bootApp(page);
  await seedSpots(page);
  await page.reload();
  await expect(page.locator('#appVersion')).toContainText('v0.7.14 · Sprint 5.14');

  await page.getByRole('button', { name: 'Точки' }).click();
  await expect(page.locator('#spotCount')).toHaveText('3');

  const savedSpot = page.locator('.spot-item').filter({ hasText: 'Белые у ручья' });
  await savedSpot.getByRole('button', { name: 'Показать на карте' }).click();
  await expect(page.locator('#screen-map')).toBeVisible();
  await expect(page.locator('#mapObjectCard')).toBeVisible();
  await expect(page.locator('#mapObjectTitle')).toContainText('Сохранённая грибная точка');
  await expect(page.locator('#mapObjectDetails')).toContainText('Белые у ручья');

  await pickMapPoint(page);
  await expect(page.locator('#mapObjectTitle')).toContainText('Выбранное место на карте');
  await expect(page.locator('#mapObjectSubtitle')).toContainText('ещё не сохранённая точка');

  await page.getByRole('button', { name: 'Точки' }).click();
  await expect(page.locator('#spotCount')).toHaveText('3');
  await expect(page.locator('#spotsList')).not.toContainText('Выбранное место на карте');
});
