import { expect, test } from '@playwright/test';

const EXPECTED_APP_VERSION = /v0\.7\.27 · Sprint 5\.27/;

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
  await expect(page.locator('#appVersion')).toContainText(EXPECTED_APP_VERSION);
  await expect(page.locator('#map')).toHaveAttribute('data-map-runtime', 'leaflet-offline-lite');
  expect(pageErrors, 'app must not throw fatal page errors during boot').toEqual([]);
}

async function pickMapPoint(page) {
  const map = page.locator('#map');
  await expect(map).toBeVisible();
  const box = await map.boundingBox();
  expect(box, 'map must have visible bounds').not.toBeNull();
  await map.click({ button: 'right', position: { x: Math.floor(box.width / 2), y: Math.floor(box.height / 2) } });
  await expect(page.locator('#saveFlowTitle')).toContainText('Выбрано место на карте');
  await expect(page.locator('.map-wrap-home #mapObjectCard')).toBeVisible();
  await expect(page.locator('#mapObjectTitle')).toHaveText('Выбранное место');
  await expect(page.locator('#mapObjectPrimaryBtn')).toHaveText('☆ Сохранить');
  await expect(page.locator('#saveSpotDetails #saveSpotBtn')).toHaveText('Сохранить выбранное место');
}

async function seedSpots(page) {
  await page.evaluate(async () => {
    window.dispatchEvent(new Event('mushroom:e2e-close-db'));
    const DB_NAME = 'mushroom-spots-db';
    const DB_VERSION = 2;
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
  await expect(page.getByRole('button', { name: 'Проверить выбранный файл карты' })).toBeHidden();
});

test('settings screen groups diagnostics and advanced actions', async ({ page }) => {
  await bootApp(page);

  await page.getByRole('button', { name: 'Настройки' }).click();
  await expect(page.locator('#screen-settings')).toBeVisible();

  await expect(page.getByRole('heading', { name: 'Приложение' })).toBeVisible();
  await expect(page.getByRole('heading', { name: 'Версия' })).toBeVisible();
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

  await expect(page.getByRole('button', { name: 'Сбросить кэш приложения' })).toBeHidden();
  await page.locator('#showMapAdvancedToggle').check();
  await expect(page.locator('#advancedModePill')).toContainText('включен');

  const cacheDangerSummary = page.locator('.settings-danger-panel summary').getByText('Опасные действия с кэшем', { exact: true });
  await expect(cacheDangerSummary).toBeVisible();
  await cacheDangerSummary.click();
  await expect(page.getByRole('button', { name: 'Сбросить кэш приложения' })).toBeVisible();

  await expect(page.locator('.maintenance-card[data-advanced-only] summary').getByText('Чистка БД', { exact: true })).toBeVisible();
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

  for (const forbiddenNavName of ['Точки', 'Группа', 'Офлайн', 'Настройки']) {
    await expect(mapScreen.getByRole('button', { name: new RegExp(`^${forbiddenNavName}$`) })).toHaveCount(0);
  }
});

test('expanded map workspace keeps map as the primary viewport above bottom navigation', async ({ page }) => {
  await bootApp(page);

  const mapBox = await page.locator('.map-wrap-home').boundingBox();
  const navBox = await page.locator('.bottom-nav').boundingBox();
  expect(mapBox, 'expanded map workspace must have visible bounds').not.toBeNull();
  expect(navBox, 'bottom navigation must stay visible').not.toBeNull();
  expect(mapBox.height, 'map should take most of the app workspace').toBeGreaterThan(page.viewportSize().height * 0.52);
  expect(mapBox.y + mapBox.height, 'map must not overlap the bottom navigation').toBeLessThanOrEqual(navBox.y + 2);
});

test('picked map point context sheet exposes object actions without app-nav duplicates', async ({ page }) => {
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
  await expect(page.locator('#mapObjectTitle')).toHaveText('Выбранное место');
  await expect(page.locator('#mapObjectSubtitle')).toContainText('Мини-инфо по точке');
  await expect(page.locator('#mapObjectPill')).toHaveText('выбрано');
  await expect(page.locator('#mapObjectDetails')).toContainText('ещё не сохранено');
  await expect(page.locator('#mapObjectPrimaryBtn')).toHaveText('☆ Сохранить');
  await expect(page.locator('#mapObjectSecondaryBtn')).toHaveText('Сохранить и поделиться');
  await expect(page.locator('#mapObjectSecondaryBtn')).toHaveAttribute('hidden', '');
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

test('picked map point context sheet enables share action only when group chat is ready', async ({ page }) => {
  await bootApp(page, { fakeSupabase: true, path: '/?group=e2e-context-sheet-group' });

  await page.getByRole('button', { name: 'Группа' }).click();
  await expect(page.locator('#groupId')).toHaveValue('e2e-context-sheet-group');
  await page.locator('#liveName').fill('E2E пользователь');
  await expect(page.locator('#joinGroupBtn')).toBeEnabled();
  await page.locator('#joinGroupBtn').click();
  await expect(page.locator('#groupStateText')).toContainText('Ты в группе');

  await page.getByRole('button', { name: 'Карта' }).click();
  await pickMapPoint(page);
  await expect(page.locator('.map-wrap-home #mapObjectCard')).toBeVisible();
  await expect(page.locator('#mapObjectSecondaryBtn')).toBeVisible();
  await expect(page.locator('#mapObjectSecondaryBtn')).toHaveText('Сохранить и поделиться');
  await page.locator('#mapObjectSecondaryBtn').click();
  await expect(page.locator('#mapObjectTitle')).toHaveText('Сохранить место');
  await expect(page.locator('#mapObjectPrimaryBtn')).toHaveText('Сохранить и поделиться');
  await expect(page.locator('#mapObjectSaveEditor')).toBeVisible();
});

test('picked map point bookmark opens save form and creates result actions and spots handoff', async ({ page }) => {
  await bootApp(page);
  await pickMapPoint(page);

  await page.locator('#mapObjectPrimaryBtn').click();
  await expect(page.locator('#mapObjectTitle')).toHaveText('Сохранить место');
  await expect(page.locator('#mapObjectSaveEditor')).toBeVisible();
  await page.locator('#mapObjectCollection').selectOption({ label: 'Грибные места' });
  await page.locator('#mapObjectName').fill('Context sheet тестовая точка');
  await page.locator('#mapObjectType').fill('Белые');
  await page.locator('#mapObjectNote').fill('Сохранено через закладку выбранного места');
  await page.locator('#mapObjectPrimaryBtn').click();

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

  page.once('dialog', async (dialog) => { await dialog.accept(); });
  await page.locator('#spotListDeleteBtn').click();
  await expect(page.locator('#spotListDetailsCard')).toBeHidden();
  await expect(page.locator('#spotCount')).toHaveText('1');
  await expect(page.locator('#spotsList')).not.toContainText('Белые у ручья — обновлено');
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
  await expect(page.locator('#spotFoldersView')).toBeVisible();
  await page.locator('.spot-folder-card').filter({ hasText: 'Грибные места' }).click();
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
  await expect(page.locator('#spotFoldersView')).toBeVisible();
  await page.locator('.spot-folder-card').filter({ hasText: 'Грибные места' }).click();
  await expect(page.locator('#spotsList')).toContainText('GPS smoke точка');
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
  const chanterelleMenuCard = page.locator('.spot-item').filter({ hasText: 'Лисички у тропы' });
  await chanterelleMenuCard.locator('.spot-item-kebab-menu summary').click();
  await expect(chanterelleMenuCard.getByRole('button', { name: 'Поделиться' })).toBeVisible();
  await expect(chanterelleMenuCard.getByRole('button', { name: 'Редактировать' })).toBeVisible();
  await expect(chanterelleMenuCard.getByRole('button', { name: 'Удалить' })).toBeVisible();
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
  await page.locator('.spot-folder-card').filter({ hasText: 'Грибные места' }).click();
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

  await page.locator('#spotCollectionNameInput').fill('Секретные места');
  await page.locator('#spotCollectionCreateBtn').click();
  await expect(page.locator('#spotCollectionManagerHint')).toContainText('создана');
  await expect(page.locator('#spotFoldersList')).toContainText('Секретные места');
  await expect(page.locator('#spotCollectionManageSelect option').filter({ hasText: 'Секретные места' })).toHaveCount(1);

  await page.locator('#spotCollectionNameInput').fill('  секретные   места  ');
  await page.locator('#spotCollectionCreateBtn').click();
  await expect(page.locator('#spotCollectionManagerHint')).toContainText('уже есть');
  await expect(page.locator('#spotCollectionManageSelect option').filter({ hasText: 'Секретные места' })).toHaveCount(1);

  await page.locator('.spot-folder-card').filter({ hasText: 'Разведка' }).click();
  await expect(page.locator('#spotsList')).toContainText('Лисички у тропы');
  await page.locator('.spot-item').filter({ hasText: 'Лисички у тропы' }).locator('.spot-item-kebab-menu summary').click();
  await page.locator('.spot-item').filter({ hasText: 'Лисички у тропы' }).getByRole('button', { name: 'Редактировать' }).click();
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
  await page.locator('#spotCollectionNameInput').fill('семейные места');
  await page.locator('#spotCollectionCreateBtn').click();
  await expect(page.locator('#spotCollectionManagerHint')).toContainText('уже есть');
  await expect(page.locator('#spotCollectionManageSelect option').filter({ hasText: 'Семейные места' })).toHaveCount(1);

  await page.locator('.spot-folder-card').filter({ hasText: 'Семейные места' }).click();
  page.once('dialog', async (dialog) => { await dialog.accept(); });
  await page.locator('#spotFolderMenu summary').click();
  await page.locator('#spotCollectionDeleteMenuBtn').click();
  await expect(page.locator('#spotFolderDeletePanel')).toBeVisible();
  await page.locator('#spotCollectionDeleteTarget').selectOption('Грибные места');
  await page.locator('#spotCollectionDeleteBtn').click();
  await expect(page.locator('#spotCollectionManagerHint')).toContainText('удалена');
  await expect(page.locator('#spotFoldersView')).toBeVisible();
  await page.locator('.spot-folder-card').filter({ hasText: 'Грибные места' }).click();
  await expect(page.locator('#spotCount')).toHaveText('2');
  await expect(page.locator('#spotsList')).toContainText('Лисички у тропы');
  await expect(page.locator('#spotsList')).toContainText('Белые у ручья');
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
  await expect(page.locator('#mapObjectTitle')).toContainText('Выбранное место');
  await expect(page.locator('#mapObjectSubtitle')).toContainText('Мини-инфо по точке');

  await page.getByRole('button', { name: 'Точки' }).click();
  await expect(page.locator('#spotFoldersView')).toBeVisible();
  await expect(page.locator('#spotCount')).toHaveText('5 папок');
  await expect(page.locator('#spotsList')).not.toContainText('Выбранное место');
});
