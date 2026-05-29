const APP_VERSION = '0.5.6';
const DB_NAME = 'mushroom-spots-db';
const DB_VERSION = 2;
const SPOTS_STORE = 'spots';
const SETTINGS_STORE = 'settings';
const BACKUP_FILE_NAME = 'mushroom-spots-backup.json';

let db;
let map;
let userMarker;
let accuracyCircle;
let currentPosition = null;
let watchId = null;
let spots = [];
let spotMarkers = new Map();
let selectedSpotId = null;
let navLine = null;
let folderHandle = null;
let groupJoined = false;
let liveEnabled = false;
let liveTimer = null;
let friendsTimer = null;
let userId = null;
let friendMarkers = new Map();
let baseTileLayer = null;
let mapDebugEvents = [];
let mapTileStats = { loading: 0, load: 0, error: 0, lastError: null, lastTileUrl: null };
let apiDebugEvents = [];
let apiButtonStates = new Map();
let apiRequestSeq = 0;
let activeButtonDiagnostics = null;

const BUTTON_DIAGNOSTIC_LABELS = {
  startGpsBtn: 'Включить GPS',
  centerMeBtn: 'Ко мне',
  repairMapBtn: 'Починить карту',
  saveSpotBtn: 'Сохранить текущую точку',
  averageBtn: 'Усреднить 30 сек',
  navigateBtn: 'Показать направление',
  shareSpotBtn: 'Экспорт точки',
  deleteSpotBtn: 'Удалить',
  createGroupBtn: 'Создать группу',
  copyInviteBtn: 'Скопировать приглашение',
  joinGroupBtn: 'Войти в группу',
  leaveGroupBtn: 'Выйти из группы',
  startLiveBtn: 'Начать трансляцию',
  stopLiveBtn: 'Остановить трансляцию',
  refreshFriendsBtn: 'Обновить друзей',
  testSupabaseBtn: 'Проверить Supabase',
  exportAllBtn: 'Скачать backup JSON',
  chooseFolderBtn: 'Выбрать папку для backup',
  saveFolderBackupBtn: 'Сохранить backup в папку',
  requestPersistentBtn: 'Запросить постоянное хранение',
  mapDebugBtn: 'Открыть диагностику',
  refreshMapDebugBtn: 'Обновить диагностику',
  repairMapFromDebugBtn: 'Починить карту из диагностики',
  copyMapDebugBtn: 'Скопировать диагностику',
  closeMapDebugBtn: 'Закрыть диагностику',
  installHelpBtn: 'Открыть помощь',
  closeHelpBtn: 'Закрыть помощь'
};

const $ = (id) => document.getElementById(id);

function uid() {
  return `${Date.now()}-${Math.random().toString(16).slice(2)}`;
}

function fmtCoord(n) { return Number(n).toFixed(6); }
function fmtDate(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleString('ru-RU', { dateStyle:'medium', timeStyle:'short' });
}
function meters(m) { return m == null ? '—' : `${Math.round(m)} м`; }
function fmtOptionalNumber(value, suffix='', digits=0) {
  if (value == null || Number.isNaN(Number(value))) return '—';
  return `${Number(value).toFixed(digits)}${suffix}`;
}
function fmtSpeed(mps) {
  if (mps == null || Number.isNaN(Number(mps))) return '—';
  return `${(Number(mps) * 3.6).toFixed(1)} км/ч`;
}
function fmtHeading(deg) {
  if (deg == null || Number.isNaN(Number(deg))) return '—';
  return `${Math.round(Number(deg))}° ${directionName(Number(deg))}`;
}
function fmtTimeOnly(iso) {
  if (!iso) return '—';
  return new Date(iso).toLocaleTimeString('ru-RU');
}
function escapeHtml(str='') {
  return String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
}

function getButtonDiagnosticLabel(buttonId) {
  const el = buttonId ? $(buttonId) : null;
  return BUTTON_DIAGNOSTIC_LABELS[buttonId] || (el ? el.textContent.trim() : '') || buttonId || 'автоматически';
}

function shortApiTarget(target = '') {
  const text = String(target || '');
  if (text.length <= 120) return text;
  return `${text.slice(0, 117)}…`;
}

function getButtonStatusLine(state) {
  const detail = state.detail ? ` / ${state.detail}` : '';
  return `${state.label} — ${state.status}${detail}`;
}

function setButtonApiStatus(ctxOrButtonId, status, detail = '') {
  const ctx = typeof ctxOrButtonId === 'object' && ctxOrButtonId
    ? ctxOrButtonId
    : { buttonId: ctxOrButtonId, label: getButtonDiagnosticLabel(ctxOrButtonId), actionId: null };
  const buttonId = ctx.buttonId || 'auto';
  const previous = apiButtonStates.get(buttonId) || {};
  apiButtonStates.set(buttonId, {
    buttonId,
    label: ctx.label || getButtonDiagnosticLabel(buttonId),
    status,
    detail,
    actionId: ctx.actionId || previous.actionId || null,
    updatedAt: new Date().toISOString()
  });
  updateMapDebugUi(false);
}

function beginApiRequest(apiName, method = 'API', target = '', ctx = activeButtonDiagnostics) {
  const request = {
    id: `api-${++apiRequestSeq}`,
    buttonId: ctx?.buttonId || 'auto',
    buttonLabel: ctx?.label || 'автоматически',
    apiName,
    method,
    target: shortApiTarget(target),
    status: 'пендинг',
    detail: '',
    startedAt: new Date().toISOString(),
    finishedAt: null
  };
  if (ctx) ctx.pendingRequests = (ctx.pendingRequests || 0) + 1;
  apiDebugEvents.unshift(request);
  apiDebugEvents = apiDebugEvents.slice(0, 80);
  if (ctx) setButtonApiStatus(ctx, 'пендинг', `${apiName}: пендинг`);
  updateMapDebugUi(false);
  return request.id;
}

function finishApiRequest(requestId, status, detail = '') {
  const request = apiDebugEvents.find(item => item.id === requestId);
  if (!request) return;
  request.status = status;
  request.detail = detail;
  request.finishedAt = new Date().toISOString();

  const ctx = activeButtonDiagnostics && activeButtonDiagnostics.buttonId === request.buttonId
    ? activeButtonDiagnostics
    : null;
  if (ctx && ctx.pendingRequests) ctx.pendingRequests = Math.max(0, ctx.pendingRequests - 1);

  setButtonApiStatus(
    { buttonId: request.buttonId, label: request.buttonLabel, actionId: ctx?.actionId || null },
    status,
    `${request.apiName}: ${detail || status}`
  );
  updateMapDebugUi(false);
}

function getApiDebugSnapshot() {
  return {
    activeButton: activeButtonDiagnostics ? {
      buttonId: activeButtonDiagnostics.buttonId,
      label: activeButtonDiagnostics.label,
      pendingRequests: activeButtonDiagnostics.pendingRequests || 0,
      startedAt: activeButtonDiagnostics.startedAt
    } : null,
    buttons: Array.from(apiButtonStates.values()).sort((a, b) => String(b.updatedAt).localeCompare(String(a.updatedAt))),
    requests: apiDebugEvents.slice(0, 40)
  };
}

function formatDiagnosticsText() {
  const api = getApiDebugSnapshot();
  const lines = [];
  lines.push('КНОПКИ / API');
  lines.push('Формат: кнопка нажата — статус ответа/пендинг.');
  if (!api.buttons.length) {
    lines.push('- Нажатий ещё не было.');
  } else {
    for (const state of api.buttons.slice(0, 24)) {
      lines.push(`- ${getButtonStatusLine(state)}`);
    }
  }
  lines.push('');
  lines.push('ПОСЛЕДНИЕ ЗАПРОСЫ');
  if (!api.requests.length) {
    lines.push('- Запросов ещё не было.');
  } else {
    for (const request of api.requests.slice(0, 24)) {
      const detail = request.detail ? ` / ${request.detail}` : '';
      const target = request.target ? ` ${request.target}` : '';
      lines.push(`- ${request.buttonLabel} -> ${request.method} ${request.apiName}${target}: ${request.status}${detail}`);
    }
  }
  lines.push('');
  lines.push('КАРТА JSON');
  lines.push(JSON.stringify(getMapDebugSnapshot(), null, 2));
  lines.push('');
  lines.push('API JSON');
  lines.push(JSON.stringify(api, null, 2));
  return lines.join('\n');
}

function withButtonDiagnostics(buttonId, handler) {
  return function wrappedButtonHandler(event) {
    const previousContext = activeButtonDiagnostics;
    const ctx = {
      actionId: uid(),
      buttonId,
      label: getButtonDiagnosticLabel(buttonId),
      startedAt: new Date().toISOString(),
      pendingRequests: 0
    };
    activeButtonDiagnostics = ctx;
    setButtonApiStatus(ctx, 'пендинг', 'кнопка нажата');

    const finishIfNoPending = () => {
      if ((ctx.pendingRequests || 0) === 0) {
        const current = apiButtonStates.get(buttonId);
        if (current && current.actionId === ctx.actionId && current.status === 'пендинг') {
          setButtonApiStatus(ctx, 'готово', 'обработчик завершён');
        }
      }
    };

    try {
      const result = handler.call(this, event);
      if (result && typeof result.then === 'function') {
        return result
          .then((value) => {
            finishIfNoPending();
            return value;
          })
          .catch((err) => {
            setButtonApiStatus(ctx, 'ошибка', err?.message || String(err));
            throw err;
          })
          .finally(() => {
            activeButtonDiagnostics = previousContext;
          });
      }
      finishIfNoPending();
      activeButtonDiagnostics = previousContext;
      return result;
    } catch (err) {
      setButtonApiStatus(ctx, 'ошибка', err?.message || String(err));
      activeButtonDiagnostics = previousContext;
      throw err;
    }
  };
}

function recordMapDebug(message, data = null) {
  const item = {
    at: new Date().toISOString(),
    message,
    data
  };
  mapDebugEvents.unshift(item);
  mapDebugEvents = mapDebugEvents.slice(0, 30);
  updateMapDebugUi(false);
}

function setMapStatus(text, mode = '') {
  const pill = $('mapStatusPill');
  if (!pill) return;
  pill.textContent = text;
  pill.className = `pill ${mode}`.trim();
}

function safeInvalidateMap(delay = 0, reason = 'manual') {
  if (!map) return;
  window.setTimeout(() => {
    try {
      map.invalidateSize({ animate: false, pan: false });
      recordMapDebug(`invalidateSize: ${reason}`);
      updateMapDebugUi(false);
    } catch (err) {
      console.warn('Map invalidateSize failed', err);
      recordMapDebug('invalidateSize failed', err.message);
      setMapStatus('ошибка размера карты', 'bad');
    }
  }, delay);
}

function getMapDebugSnapshot() {
  const mapEl = $('map');
  const wrapEl = document.querySelector('.map-wrap');
  const mapRect = mapEl ? mapEl.getBoundingClientRect() : null;
  const wrapRect = wrapEl ? wrapEl.getBoundingClientRect() : null;
  const tiles = Array.from(document.querySelectorAll('.leaflet-tile'));
  const loadedTiles = tiles.filter(t => t.classList.contains('leaflet-tile-loaded'));
  const brokenTiles = tiles.filter(t => t.complete && t.naturalWidth === 0);
  const center = map ? map.getCenter() : null;
  const cfg = getSupabaseConfig ? getSupabaseConfig() : null;

  return {
    appVersion: APP_VERSION,
    url: location.href,
    userAgent: navigator.userAgent,
    online: navigator.onLine,
    mapExists: Boolean(map),
    leafletLoaded: Boolean(window.L),
    mapSize: map ? map.getSize() : null,
    mapCenter: center ? { lat: Number(center.lat.toFixed(6)), lng: Number(center.lng.toFixed(6)) } : null,
    mapZoom: map ? map.getZoom() : null,
    mapElementRect: mapRect ? { width: Math.round(mapRect.width), height: Math.round(mapRect.height), top: Math.round(mapRect.top), left: Math.round(mapRect.left) } : null,
    mapWrapRect: wrapRect ? { width: Math.round(wrapRect.width), height: Math.round(wrapRect.height), top: Math.round(wrapRect.top), left: Math.round(wrapRect.left) } : null,
    tileStats: mapTileStats,
    tileDom: {
      total: tiles.length,
      loaded: loadedTiles.length,
      broken: brokenTiles.length,
      sample: tiles.slice(0, 6).map(t => ({
        src: t.currentSrc || t.src || '',
        cls: t.className,
        complete: t.complete,
        natural: `${t.naturalWidth || 0}x${t.naturalHeight || 0}`,
        style: t.getAttribute('style') || ''
      }))
    },
    cssCheck: {
      leafletTilePosition: tiles[0] ? getComputedStyle(tiles[0]).position : 'no tile',
      mapPosition: mapEl ? getComputedStyle(mapEl).position : 'no map',
      mapOverflow: mapEl ? getComputedStyle(mapEl).overflow : 'no map'
    },
    supabaseConfigured: Boolean(cfg),
    recentEvents: mapDebugEvents
  };
}

function updateMapDebugUi(forceText = false) {
  const textEl = $('mapDebugText');
  const snapshot = getMapDebugSnapshot();

  if (snapshot.tileStats.error > 0) {
    setMapStatus('ошибки тайлов', 'bad');
  } else if (snapshot.tileDom.total > 0 && snapshot.tileDom.loaded === 0) {
    setMapStatus('тайлы не загружены', 'warn');
  } else if (snapshot.mapElementRect && snapshot.mapElementRect.height < 100) {
    setMapStatus('малый контейнер', 'bad');
  } else if (snapshot.tileDom.loaded > 0) {
    setMapStatus(`тайлы: ${snapshot.tileDom.loaded}/${snapshot.tileDom.total}`, 'on');
  } else {
    setMapStatus('карта ждёт тайлы', 'warn');
  }

  if (textEl && (forceText || $('mapDebugDialog')?.open)) {
    textEl.textContent = formatDiagnosticsText();
  }

  const hint = $('mapHint');
  if (hint) {
    if (snapshot.tileStats.error > 0) {
      hint.textContent = `Есть ошибки загрузки тайлов: ${snapshot.tileStats.error}. Открой “!” и скопируй диагностику.`;
    } else if (snapshot.tileDom.total > 0 && snapshot.tileDom.loaded === 0) {
      hint.textContent = 'Тайлы созданы, но не загрузились. Проверь интернет или нажми “Починить карту”.';
    } else {
      hint.textContent = 'Если карта выглядит серой или тайлы стоят кусками, нажми “Починить карту” или открой диагностику “!”.';
    }
  }
}

function repairMap() {
  if (!map) return;
  recordMapDebug('repairMap started');
  safeInvalidateMap(0, 'repair immediate');
  safeInvalidateMap(200, 'repair delayed 200');
  safeInvalidateMap(800, 'repair delayed 800');
  try {
    if (baseTileLayer && baseTileLayer.redraw) {
      baseTileLayer.redraw();
      recordMapDebug('tile layer redraw');
    }
  } catch (err) {
    recordMapDebug('tile layer redraw failed', err.message);
  }
  if (currentPosition) {
    try { map.setView([currentPosition.lat, currentPosition.lon], Math.max(map.getZoom(), 16), { animate: false }); } catch {}
  }
  updateMapDebugUi(true);
}

async function copyMapDebug() {
  const requestId = beginApiRequest('Clipboard.writeText', 'BROWSER', 'diagnostics text');
  const text = formatDiagnosticsText();
  try {
    await navigator.clipboard.writeText(text);
    finishApiRequest(requestId, 'готово', 'диагностика скопирована');
    alert('Диагностика скопирована.');
  } catch (err) {
    finishApiRequest(requestId, 'ошибка', err?.message || 'clipboard недоступен');
    const box = $('mapDebugText');
    if (box) {
      box.textContent = text;
      box.focus();
    }
    alert('Не удалось скопировать автоматически. Текст показан в окне диагностики.');
  }
}

function makeMapIcon(kind) {
  const label = kind === 'user' ? 'Я' : kind === 'friend' ? 'Д' : '';
  const labelHtml = label ? `<span>${label}</span>` : '';
  return L.divIcon({
    className: '',
    html: `<div class="map-dot map-dot-${kind}">${labelHtml}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16]
  });
}

function openDb() {
  return new Promise((resolve, reject) => {
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = () => {
      const database = req.result;
      if (!database.objectStoreNames.contains(SPOTS_STORE)) {
        const store = database.createObjectStore(SPOTS_STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
      }
      if (!database.objectStoreNames.contains(SETTINGS_STORE)) {
        database.createObjectStore(SETTINGS_STORE, { keyPath: 'key' });
      }
    };
    req.onsuccess = () => resolve(req.result);
    req.onerror = () => reject(req.error);
  });
}

function store(name, mode='readonly') {
  return db.transaction(name, mode).objectStore(name);
}

function getAllSpots() {
  return new Promise((resolve, reject) => {
    const req = store(SPOTS_STORE).getAll();
    req.onsuccess = () => resolve(req.result.sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt))));
    req.onerror = () => reject(req.error);
  });
}

function putSpot(spot) {
  return new Promise((resolve, reject) => {
    const req = store(SPOTS_STORE, 'readwrite').put(spot);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function removeSpot(id) {
  return new Promise((resolve, reject) => {
    const req = store(SPOTS_STORE, 'readwrite').delete(id);
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function getSetting(key) {
  return new Promise((resolve, reject) => {
    const req = store(SETTINGS_STORE).get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : null);
    req.onerror = () => reject(req.error);
  });
}

function setSetting(key, value) {
  return new Promise((resolve, reject) => {
    const req = store(SETTINGS_STORE, 'readwrite').put({ key, value, updatedAt: new Date().toISOString() });
    req.onsuccess = () => resolve();
    req.onerror = () => reject(req.error);
  });
}

function updateGpsStatusPanel(position) {
  $('gpsStatus').textContent = 'активен';
  $('gpsAccuracy').textContent = meters(position.accuracy);
  $('gpsCoords').textContent = `${fmtCoord(position.lat)}, ${fmtCoord(position.lon)}`;
  $('gpsSatellites').textContent = 'недоступно в PWA';
  $('gpsAltitude').textContent = position.altitude == null ? '—' : `${Math.round(position.altitude)} м${position.altitudeAccuracy != null ? ` ±${Math.round(position.altitudeAccuracy)} м` : ''}`;
  $('gpsSpeed').textContent = fmtSpeed(position.speed);
  $('gpsHeading').textContent = fmtHeading(position.heading);
  $('gpsUpdatedAt').textContent = fmtTimeOnly(position.timestamp);
}

function initMap() {
  if (!window.L) {
    setMapStatus('Leaflet не загружен', 'bad');
    recordMapDebug('Leaflet JS is not loaded');
    return;
  }

  const mapEl = $('map');
  if (!mapEl) {
    recordMapDebug('Map element not found');
    return;
  }

  map = L.map(mapEl, {
    zoomControl: true,
    preferCanvas: true,
    attributionControl: true,
    zoomAnimation: true,
    markerZoomAnimation: true
  }).setView([56.9496, 24.1052], 12);

  baseTileLayer = L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    minZoom: 2,
    tileSize: 256,
    updateWhenIdle: false,
    updateWhenZooming: true,
    keepBuffer: 4,
    detectRetina: false,
    attribution: '&copy; OpenStreetMap contributors'
  });

  baseTileLayer
    .on('loading', () => {
      mapTileStats.loading += 1;
      recordMapDebug('tile loading');
    })
    .on('tileload', (e) => {
      mapTileStats.load += 1;
      mapTileStats.lastTileUrl = e.tile?.currentSrc || e.tile?.src || null;
      updateMapDebugUi(false);
    })
    .on('tileerror', (e) => {
      mapTileStats.error += 1;
      mapTileStats.lastError = e.tile?.currentSrc || e.tile?.src || 'unknown tile';
      recordMapDebug('tile error', mapTileStats.lastError);
      setMapStatus('ошибка тайлов', 'bad');
    })
    .addTo(map);

  map.on('load moveend zoomend resize', () => updateMapDebugUi(false));

  // Leaflet can render broken/offset tiles if the map is initialized while
  // the PWA layout is still settling, especially after install-to-home-screen,
  // orientation changes, or service worker updates.
  setMapStatus('карта загружается', 'warn');
  safeInvalidateMap(0, 'init');
  safeInvalidateMap(250, 'init delayed 250');
  safeInvalidateMap(1000, 'init delayed 1000');
  window.setTimeout(updateMapDebugUi, 1200);
}

function updateUserPosition(pos, center=false) {
  const { latitude, longitude, accuracy } = pos.coords;
  const { altitude, altitudeAccuracy, speed, heading } = pos.coords;
  currentPosition = {
    lat: latitude,
    lon: longitude,
    accuracy,
    altitude,
    altitudeAccuracy,
    speed,
    heading,
    timestamp: new Date(pos.timestamp).toISOString(),
    satellites: null
  };
  updateGpsStatusPanel(currentPosition);

  const latlng = [latitude, longitude];
  if (!userMarker) {
    userMarker = L.marker(latlng, { title: 'Я здесь', icon: makeMapIcon('user') }).addTo(map).bindPopup('Я здесь');
    accuracyCircle = L.circle(latlng, { radius: accuracy || 0 }).addTo(map);
  } else {
    userMarker.setLatLng(latlng);
    accuracyCircle.setLatLng(latlng).setRadius(accuracy || 0);
  }
  if (center) map.setView(latlng, Math.max(map.getZoom(), 16));
  safeInvalidateMap(0, 'render/update');
  updateSelectedDetails();
  renderList();
}

function startGps(center=true) {
  if (!navigator.geolocation) {
    alert('Геолокация не поддерживается этим браузером.');
    return;
  }
  $('gpsStatus').textContent = 'запрос разрешения…';
  const requestId = beginApiRequest('Geolocation.getCurrentPosition', 'BROWSER', 'GPS permission/current position');
  navigator.geolocation.getCurrentPosition(
    (pos) => {
      finishApiRequest(requestId, 'готово', `GPS ${meters(pos.coords.accuracy)}`);
      updateUserPosition(pos, center);
    },
    (err) => {
      finishApiRequest(requestId, 'ошибка', err.message);
      $('gpsStatus').textContent = 'ошибка';
      alert(`GPS ошибка: ${err.message}`);
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
  if (watchId == null) {
    const watchRequestId = beginApiRequest('Geolocation.watchPosition', 'BROWSER', 'GPS live updates');
    watchId = navigator.geolocation.watchPosition(
      (pos) => {
        finishApiRequest(watchRequestId, 'готово', `watch активен, GPS ${meters(pos.coords.accuracy)}`);
        updateUserPosition(pos, false);
      },
      (err) => finishApiRequest(watchRequestId, 'ошибка', err.message),
      { enableHighAccuracy: true, timeout: 20000, maximumAge: 5000 }
    );
  }
}

function distanceMeters(a, b) {
  const R = 6371000;
  const toRad = d => d * Math.PI / 180;
  const dLat = toRad(b.lat - a.lat);
  const dLon = toRad(b.lon - a.lon);
  const lat1 = toRad(a.lat);
  const lat2 = toRad(b.lat);
  const x = Math.sin(dLat/2)**2 + Math.cos(lat1)*Math.cos(lat2)*Math.sin(dLon/2)**2;
  return 2 * R * Math.asin(Math.sqrt(x));
}

function bearingDegrees(a, b) {
  const toRad = d => d * Math.PI / 180;
  const toDeg = r => r * 180 / Math.PI;
  const lat1 = toRad(a.lat), lat2 = toRad(b.lat);
  const dLon = toRad(b.lon - a.lon);
  const y = Math.sin(dLon) * Math.cos(lat2);
  const x = Math.cos(lat1)*Math.sin(lat2) - Math.sin(lat1)*Math.cos(lat2)*Math.cos(dLon);
  return (toDeg(Math.atan2(y, x)) + 360) % 360;
}

function directionName(deg) {
  const names = ['С','СВ','В','ЮВ','Ю','ЮЗ','З','СЗ'];
  return names[Math.round(deg / 45) % 8];
}

async function fileToDataUrl(file) {
  if (!file) return null;
  if (file.size > 3 * 1024 * 1024) {
    alert('Фото больше 3 МБ. Лучше выбрать меньшее фото.');
    return null;
  }
  return new Promise((resolve, reject) => {
    const reader = new FileReader();
    reader.onload = () => resolve(reader.result);
    reader.onerror = () => reject(reader.error);
    reader.readAsDataURL(file);
  });
}

function buildBackupPayload() {
  return {
    schemaVersion: 1,
    appVersion: APP_VERSION,
    exportedAt: new Date().toISOString(),
    spotCount: spots.length,
    spots
  };
}

function downloadJson(filename, data) {
  const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
  const url = URL.createObjectURL(blob);
  const a = document.createElement('a');
  a.href = url;
  a.download = filename;
  document.body.appendChild(a);
  a.click();
  a.remove();
  URL.revokeObjectURL(url);
}

async function saveBackupToFolder(showSuccess = false) {
  if (!folderHandle) {
    if (showSuccess) alert('Сначала выбери папку для backup.');
    return false;
  }
  const requestId = beginApiRequest('FileSystem backup write', 'BROWSER', BACKUP_FILE_NAME);
  const permission = await verifyFolderPermission(folderHandle, true);
  if (!permission) {
    finishApiRequest(requestId, 'отказ', 'нет разрешения на запись');
    $('folderStatus').textContent = 'нет разрешения';
    if (showSuccess) alert('Нет разрешения на запись в выбранную папку.');
    return false;
  }
  const fileHandle = await folderHandle.getFileHandle(BACKUP_FILE_NAME, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(buildBackupPayload(), null, 2));
  await writable.close();
  finishApiRequest(requestId, 'готово', 'backup записан');
  await setSetting('lastFolderBackupAt', new Date().toISOString());
  await updateStorageUi();
  if (showSuccess) alert(`Backup сохранён в файл ${BACKUP_FILE_NAME}`);
  return true;
}

async function afterDataChanged() {
  await refreshSpots();
  if (folderHandle) {
    try { await saveBackupToFolder(false); } catch (err) { console.warn('Folder backup failed', err); }
  }
}

async function saveCurrentSpot() {
  if (!currentPosition) {
    alert('Сначала включи GPS и дождись координат.');
    return;
  }
  const name = $('spotName').value.trim() || `Точка ${spots.length + 1}`;
  const photo = await fileToDataUrl($('spotPhoto').files[0]);
  const spot = {
    id: uid(),
    name,
    mushroomType: $('mushroomType').value.trim(),
    note: $('spotNote').value.trim(),
    lat: currentPosition.lat,
    lon: currentPosition.lon,
    accuracy: currentPosition.accuracy,
    source: 'current-gps',
    photo,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    appVersion: APP_VERSION
  };
  await putSpot(spot);
  $('spotName').value = '';
  $('mushroomType').value = '';
  $('spotNote').value = '';
  $('spotPhoto').value = '';
  await afterDataChanged();
  selectSpot(spot.id, true);
}

async function averageAndSave() {
  if (!navigator.geolocation) return alert('Геолокация не поддерживается.');
  $('saveHint').textContent = 'Усреднение: стой на месте 30 секунд…';
  const samples = [];
  const started = Date.now();
  const requestId = beginApiRequest('Geolocation.watchPosition', 'BROWSER', '30 sec averaging');
  const sampleWatch = navigator.geolocation.watchPosition(
    (pos) => {
      samples.push({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy });
      $('saveHint').textContent = `Усреднение: ${samples.length} измерений, лучшая точность ${meters(Math.min(...samples.map(s=>s.accuracy||9999)))}`;
    },
    (err) => {
      finishApiRequest(requestId, 'ошибка', err.message);
      alert(`Ошибка усреднения: ${err.message}`);
    },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
  setTimeout(async () => {
    navigator.geolocation.clearWatch(sampleWatch);
    if (!samples.length) {
      finishApiRequest(requestId, 'ошибка', 'GPS-измерения не собраны');
      $('saveHint').textContent = 'Не удалось собрать GPS-измерения.';
      return;
    }
    const weighted = samples.map(s => ({ ...s, w: 1 / Math.max(s.accuracy || 50, 1) }));
    const wSum = weighted.reduce((s,x)=>s+x.w,0);
    currentPosition = {
      lat: weighted.reduce((s,x)=>s+x.lat*x.w,0)/wSum,
      lon: weighted.reduce((s,x)=>s+x.lon*x.w,0)/wSum,
      accuracy: Math.min(...samples.map(s=>s.accuracy||9999)),
      altitude: null,
      altitudeAccuracy: null,
      speed: null,
      heading: null,
      satellites: null,
      timestamp: new Date().toISOString()
    };
    updateUserPosition({ coords:{ latitude: currentPosition.lat, longitude: currentPosition.lon, accuracy: currentPosition.accuracy, altitude: null, altitudeAccuracy: null, speed: null, heading: null }, timestamp: Date.now() }, true);
    $('saveHint').textContent = `Готово: собрано ${samples.length} измерений за ${Math.round((Date.now()-started)/1000)} сек. Теперь можно сохранить точку.`;
    finishApiRequest(requestId, 'готово', `${samples.length} измерений`);
  }, 30000);
}

function markerPopup(spot) {
  return `<strong>${escapeHtml(spot.name)}</strong><br>${spot.mushroomType ? escapeHtml(spot.mushroomType)+'<br>' : ''}${fmtCoord(spot.lat)}, ${fmtCoord(spot.lon)}<br>Точность: ${meters(spot.accuracy)}<br><button onclick="window.selectSpotFromPopup('${spot.id}')">Выбрать</button>`;
}

function renderMarkers() {
  for (const marker of spotMarkers.values()) marker.remove();
  spotMarkers.clear();
  for (const spot of spots) {
    const marker = L.marker([spot.lat, spot.lon], { title: spot.name, icon: makeMapIcon('spot') }).addTo(map).bindPopup(markerPopup(spot));
    marker.on('click', () => selectSpot(spot.id, false));
    spotMarkers.set(spot.id, marker);
  }
  safeInvalidateMap(0, 'render/update');
}

function renderList() {
  const q = $('searchInput').value.trim().toLowerCase();
  const filtered = spots.filter(s => [s.name, s.mushroomType, s.note].join(' ').toLowerCase().includes(q));
  $('spotCount').textContent = String(spots.length);
  const list = $('spotsList');
  list.innerHTML = '';
  if (!filtered.length) {
    list.innerHTML = '<p class="hint">Пока нет сохранённых мест.</p>';
    return;
  }
  for (const spot of filtered) {
    const item = document.createElement('div');
    item.className = `spot-item ${spot.id === selectedSpotId ? 'active' : ''}`;
    const dist = currentPosition ? meters(distanceMeters({lat:currentPosition.lat, lon:currentPosition.lon}, spot)) : '—';
    item.innerHTML = `<div><div class="spot-title">${escapeHtml(spot.name)}</div><div class="spot-meta">${escapeHtml(spot.mushroomType || 'Тип не указан')} · ${fmtDate(spot.createdAt)}<br>Расстояние: ${dist} · GPS: ${meters(spot.accuracy)}</div></div>${spot.photo ? `<img class="thumb" src="${spot.photo}" alt="Фото">` : ''}`;
    item.onclick = () => selectSpot(spot.id, true);
    list.appendChild(item);
  }
}

async function refreshSpots() {
  spots = await getAllSpots();
  renderMarkers();
  renderList();
  updateSelectedDetails();
  await updateStorageUi();
}

function selectSpot(id, center=false) {
  selectedSpotId = id;
  const spot = spots.find(s => s.id === id);
  if (!spot) return;
  $('selectedCard').hidden = false;
  if (center) map.setView([spot.lat, spot.lon], Math.max(map.getZoom(), 16));
  const marker = spotMarkers.get(id);
  if (marker) marker.openPopup();
  updateSelectedDetails();
  renderList();
}
window.selectSpotFromPopup = (id) => selectSpot(id, false);

function updateSelectedDetails() {
  const spot = spots.find(s => s.id === selectedSpotId);
  if (!spot) return;
  let nav = 'Включи GPS, чтобы видеть расстояние и направление.';
  if (currentPosition) {
    const from = { lat: currentPosition.lat, lon: currentPosition.lon };
    const dist = distanceMeters(from, spot);
    const bearing = bearingDegrees(from, spot);
    nav = `До точки: <strong>${meters(dist)}</strong>. Направление: <strong>${Math.round(bearing)}° ${directionName(bearing)}</strong>.`;
  }
  $('selectedDetails').innerHTML = `
    <p><strong>${escapeHtml(spot.name)}</strong></p>
    <p>${escapeHtml(spot.mushroomType || 'Тип грибов не указан')}</p>
    <p>${escapeHtml(spot.note || 'Заметки нет')}</p>
    <p class="hint">${fmtCoord(spot.lat)}, ${fmtCoord(spot.lon)} · точность ${meters(spot.accuracy)} · ${fmtDate(spot.createdAt)}</p>
    <p>${nav}</p>
    ${spot.photo ? `<img src="${spot.photo}" alt="Фото места">` : ''}
  `;
}

function showNavigationLine() {
  const spot = spots.find(s => s.id === selectedSpotId);
  if (!spot || !currentPosition) return alert('Нужна выбранная точка и активный GPS.');
  if (navLine) navLine.remove();
  navLine = L.polyline([[currentPosition.lat, currentPosition.lon], [spot.lat, spot.lon]], { weight: 4 }).addTo(map);
  map.fitBounds(navLine.getBounds(), { padding: [40, 40] });
}

function exportAll() {
  downloadJson(`mushroom-spots-backup-${new Date().toISOString().slice(0,10)}.json`, buildBackupPayload());
}

function exportSelected() {
  const spot = spots.find(s => s.id === selectedSpotId);
  if (!spot) return alert('Сначала выбери точку.');
  downloadJson(`mushroom-spot-${spot.name.replace(/[^a-zа-яё0-9]+/gi,'-')}.json`, { schemaVersion: 1, appVersion: APP_VERSION, exportedAt: new Date().toISOString(), spots: [spot] });
}

async function importJson(file) {
  if (!file) return;
  const text = await file.text();
  const data = JSON.parse(text);
  const imported = Array.isArray(data) ? data : data.spots;
  if (!Array.isArray(imported)) throw new Error('JSON не содержит массив spots');
  let count = 0;
  for (const raw of imported) {
    if (typeof raw.lat !== 'number' || typeof raw.lon !== 'number') continue;
    const now = new Date().toISOString();
    const spot = {
      ...raw,
      id: raw.id || uid(),
      createdAt: raw.createdAt || now,
      updatedAt: now,
      appVersion: APP_VERSION
    };
    await putSpot(spot);
    count++;
  }
  await afterDataChanged();
  alert(`Импортировано точек: ${count}`);
}

async function deleteSelected() {
  const spot = spots.find(s => s.id === selectedSpotId);
  if (!spot) return;
  if (!confirm(`Удалить точку «${spot.name}»?`)) return;
  await removeSpot(spot.id);
  selectedSpotId = null;
  $('selectedCard').hidden = true;
  if (navLine) { navLine.remove(); navLine = null; }
  await afterDataChanged();
}

async function verifyFolderPermission(handle, write = false) {
  if (!handle) return false;
  const options = write ? { mode: 'readwrite' } : {};
  if ((await handle.queryPermission(options)) === 'granted') return true;
  if ((await handle.requestPermission(options)) === 'granted') return true;
  return false;
}

async function chooseBackupFolder() {
  if (!('showDirectoryPicker' in window)) {
    $('storageHint').textContent = 'Этот браузер не поддерживает выбор папки. На iPhone используй “Скачать backup JSON”.';
    alert('Выбор папки не поддерживается этим браузером. Используй ручной экспорт JSON.');
    return;
  }
  const requestId = beginApiRequest('showDirectoryPicker', 'BROWSER', 'backup folder');
  try {
    folderHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    finishApiRequest(requestId, 'готово', 'папка выбрана');
    await setSetting('backupFolderHandle', folderHandle);
    $('folderStatus').textContent = folderHandle.name || 'выбрана';
    await saveBackupToFolder(true);
  } catch (err) {
    finishApiRequest(requestId, err.name === 'AbortError' ? 'отменено' : 'ошибка', err.message);
    if (err.name !== 'AbortError') alert(`Ошибка выбора папки: ${err.message}`);
  }
}

async function restoreFolderHandle() {
  try {
    const saved = await getSetting('backupFolderHandle');
    if (saved) folderHandle = saved;
  } catch (err) {
    console.warn('Cannot restore folder handle', err);
  }
}

async function requestPersistentStorage() {
  if (!navigator.storage || !navigator.storage.persist) {
    alert('Этот браузер не поддерживает запрос постоянного хранения.');
    return;
  }
  const requestId = beginApiRequest('navigator.storage.persist', 'BROWSER', 'persistent storage');
  const granted = await navigator.storage.persist();
  finishApiRequest(requestId, granted ? 'готово' : 'отказ', granted ? 'разрешено' : 'браузер не дал гарантию');
  await setSetting('persistentStorageGranted', granted);
  await updateStorageUi();
  alert(granted ? 'Браузер разрешил более устойчивое хранение данных.' : 'Браузер не дал постоянное хранение. Делай backup JSON вручную.');
}

async function updateStorageUi() {
  if (!$('folderStatus')) return;
  if ('showDirectoryPicker' in window) {
    $('chooseFolderBtn').disabled = false;
  } else {
    $('chooseFolderBtn').disabled = true;
  }
  if (folderHandle) {
    $('folderStatus').textContent = folderHandle.name || 'выбрана';
    $('saveFolderBackupBtn').disabled = false;
  } else {
    $('folderStatus').textContent = 'не выбрана';
    $('saveFolderBackupBtn').disabled = true;
  }
  const last = await getSetting('lastFolderBackupAt');
  $('lastBackupStatus').textContent = last ? fmtDate(last) : '—';
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage ? Math.round(estimate.usage / 1024 / 1024) : 0;
      $('storageHint').textContent = `Сохранено точек: ${spots.length}. Примерно занято локально: ${used} МБ. На iPhone основной надёжный способ — периодический backup JSON.`;
    } catch {}
  }
}



function getSupabaseConfig() {
  const cfg = window.MUSHROOM_CONFIG || {};
  const rawUrl = (cfg.SUPABASE_URL || '').trim();
  const url = rawUrl.replace(/\/rest\/v1\/?$/, '').replace(/\/$/, '');
  const key = (cfg.SUPABASE_ANON_KEY || '').trim();
  if (!url || !key || url.includes('PASTE_') || key.includes('PASTE_')) return null;
  return { url, key };
}

async function supabaseFetch(path, options = {}) {
  const cfg = getSupabaseConfig();
  if (!cfg) throw new Error('Supabase не настроен. Заполни SUPABASE_URL и SUPABASE_ANON_KEY в config.js.');
  const headers = {
    apikey: cfg.key,
    Authorization: `Bearer ${cfg.key}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const method = options.method || 'GET';
  const requestUrl = `${cfg.url}/rest/v1/${path}`;
  const requestId = beginApiRequest('Supabase REST', method, requestUrl);
  let res;
  try {
    res = await fetch(requestUrl, { ...options, headers });
  } catch (err) {
    finishApiRequest(requestId, 'ошибка сети', err.message);
    throw new Error(`Network fetch failed. URL=${requestUrl}. ${err.message}`);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    finishApiRequest(requestId, `HTTP ${res.status}`, text || res.statusText);
    throw new Error(`Supabase ${res.status}: ${text || res.statusText}`);
  }
  finishApiRequest(requestId, `HTTP ${res.status}`, res.statusText || 'OK');
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function ensureUserId() {
  let id = localStorage.getItem('mushroom_live_user_id');
  if (!id) {
    id = crypto.randomUUID ? crypto.randomUUID() : uid();
    localStorage.setItem('mushroom_live_user_id', id);
  }
  userId = id;
  return id;
}

function updateLiveUi() {
  if ($('groupStatus')) {
    $('groupStatus').textContent = groupJoined ? 'в группе' : 'не в группе';
    $('groupStatus').className = groupJoined ? 'pill on' : 'pill';
  }
  if ($('liveStatus')) {
    $('liveStatus').textContent = liveEnabled ? 'трансляция включена' : 'трансляция выключена';
    $('liveStatus').className = liveEnabled ? 'pill on' : 'pill';
    if (!getSupabaseConfig()) $('liveStatus').className = 'pill warn';
  }
}

function parseGroupFromUrl() {
  const url = new URL(window.location.href);
  const group = url.searchParams.get('group');
  if (group && $('groupId')) {
    $('groupId').value = group;
    localStorage.setItem('mushroom_live_group_id', group);
    return group;
  }
  return null;
}

async function createGroup() {
  const group = crypto.randomUUID ? crypto.randomUUID() : uid();
  $('groupId').value = group;
  localStorage.setItem('mushroom_live_group_id', group);
  updateLiveUi();
  if (getSupabaseConfig()) {
    await joinGroup(true);
    $('liveHint').textContent = 'Группа создана. Ты уже вошёл в неё и видишь участников. Чтобы друзья видели тебя, нажми “Начать трансляцию”.';
  } else {
    $('liveHint').textContent = 'Группа создана. Скопируй приглашение и отправь друзьям. Для live-режима нужен Supabase в config.js.';
  }
}

async function copyInvite() {
  const group = $('groupId').value.trim();
  if (!group) return alert('Сначала создай или вставь ID группы.');
  const url = new URL(window.location.href);
  url.searchParams.set('group', group);
  const text = url.toString();
  const requestId = beginApiRequest('Clipboard.writeText', 'BROWSER', 'invite link');
  try {
    await navigator.clipboard.writeText(text);
    finishApiRequest(requestId, 'готово', 'приглашение скопировано');
    $('liveHint').textContent = 'Ссылка-приглашение скопирована.';
  } catch (err) {
    finishApiRequest(requestId, 'ошибка', err?.message || 'clipboard недоступен');
    prompt('Скопируй ссылку:', text);
  }
}

function saveLiveInputs() {
  localStorage.setItem('mushroom_live_name', $('liveName').value.trim());
  localStorage.setItem('mushroom_live_group_id', $('groupId').value.trim());
}

function loadLiveInputs() {
  $('liveName').value = localStorage.getItem('mushroom_live_name') || '';
  $('groupId').value = localStorage.getItem('mushroom_live_group_id') || '';
  const groupFromUrl = parseGroupFromUrl();
  updateLiveUi();
  return groupFromUrl;
}

function clearFriendMarkers() {
  for (const marker of friendMarkers.values()) marker.remove();
  friendMarkers.clear();
}

async function joinGroup(silent = false) {
  if (!getSupabaseConfig()) {
    if (!silent) alert('Сначала вставь Supabase URL и anon public key в config.js и переопубликуй сайт.');
    updateLiveUi();
    return false;
  }
  const group = $('groupId').value.trim();
  if (!group) {
    if (!silent) alert('Создай группу или открой приглашение от друга.');
    return false;
  }
  saveLiveInputs();
  groupJoined = true;
  updateLiveUi();
  clearInterval(friendsTimer);
  await refreshFriends();
  friendsTimer = setInterval(refreshFriends, 10000);
  if (!silent) {
    $('liveHint').textContent = 'Ты в группе. Можно видеть активных участников без передачи своей позиции. Чтобы друзья видели тебя, нажми “Начать трансляцию”.';
  }
  return true;
}

async function leaveGroup() {
  await stopLiveSharing(false);
  groupJoined = false;
  clearInterval(friendsTimer);
  friendsTimer = null;
  clearFriendMarkers();
  $('friendsList').innerHTML = '<p class="hint">Ты вышел из группы.</p>';
  $('groupId').value = '';
  localStorage.removeItem('mushroom_live_group_id');
  updateLiveUi();
  $('liveHint').textContent = 'Ты вышел из группы. Приглашение можно открыть заново.';
}

async function publishMyLocation() {
  if (!liveEnabled) return;
  const group = $('groupId').value.trim();
  const name = $('liveName').value.trim();
  if (!group || !name) throw new Error('Укажи имя и ID группы.');
  if (!currentPosition) {
    startGps(false);
    $('liveHint').textContent = 'Жду GPS-координаты перед отправкой позиции…';
    return;
  }
  const payload = {
    group_id: group,
    user_id: ensureUserId(),
    user_name: name,
    lat: currentPosition.lat,
    lon: currentPosition.lon,
    accuracy: currentPosition.accuracy,
    updated_at: new Date().toISOString()
  };
  await supabaseFetch('live_locations?on_conflict=group_id,user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(payload)
  });
  $('liveHint').textContent = `Позиция отправлена: ${new Date().toLocaleTimeString('ru-RU')}`;
}

async function deleteMyLiveLocation() {
  const group = $('groupId').value.trim();
  if (!group || !getSupabaseConfig()) return;
  const encodedGroup = encodeURIComponent(group);
  const encodedUser = encodeURIComponent(ensureUserId());
  await supabaseFetch(`live_locations?group_id=eq.${encodedGroup}&user_id=eq.${encodedUser}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' }
  });
}

async function fetchFriends() {
  const group = $('groupId').value.trim();
  if (!group) return [];
  const encodedGroup = encodeURIComponent(group);
  const rows = await supabaseFetch(`live_locations?group_id=eq.${encodedGroup}&select=group_id,user_id,user_name,lat,lon,accuracy,updated_at&order=updated_at.desc`, { method: 'GET' });
  return Array.isArray(rows) ? rows : [];
}

function renderFriends(rows) {
  const list = $('friendsList');
  list.innerHTML = '';
  const now = Date.now();
  const myId = ensureUserId();
  const seenIds = new Set();
  let activeCount = 0;

  for (const row of rows) {
    const ageMs = now - new Date(row.updated_at).getTime();
    const stale = ageMs > 5 * 60 * 1000;
    if (!stale) activeCount += 1;
    if (row.user_id !== myId && !stale) {
      seenIds.add(row.user_id);
      const latlng = [row.lat, row.lon];
      let marker = friendMarkers.get(row.user_id);
      const popup = `<strong>${escapeHtml(row.user_name)}</strong><br>${fmtCoord(row.lat)}, ${fmtCoord(row.lon)}<br>Точность: ${meters(row.accuracy)}<br>Обновлено: ${fmtDate(row.updated_at)}`;
      if (!marker) {
        marker = L.marker(latlng, { title: row.user_name, icon: makeMapIcon('friend') }).addTo(map).bindPopup(popup);
        friendMarkers.set(row.user_id, marker);
      } else {
        marker.setLatLng(latlng).setPopupContent(popup);
      }
    }

    const dist = currentPosition ? meters(distanceMeters({ lat: currentPosition.lat, lon: currentPosition.lon }, row)) : '—';
    const item = document.createElement('div');
    item.className = `friend-item ${stale ? 'friend-stale' : ''}`;
    item.innerHTML = `<div><div class="friend-name">${escapeHtml(row.user_name)}${row.user_id === myId ? ' · я' : ''}</div><div class="friend-meta">${stale ? 'устарело' : 'активно'} · ${fmtDate(row.updated_at)}<br>Расстояние: ${dist} · GPS: ${meters(row.accuracy)}</div></div>`;
    item.onclick = () => map.setView([row.lat, row.lon], Math.max(map.getZoom(), 16));
    list.appendChild(item);
  }

  for (const [id, marker] of friendMarkers.entries()) {
    if (!seenIds.has(id)) {
      marker.remove();
      friendMarkers.delete(id);
    }
  }

  if (!rows.length) {
    list.innerHTML = groupJoined ? '<p class="hint">В группе пока нет активных участников.</p>' : '<p class="hint">Открой приглашение или нажми “Войти в группу”.</p>';
  }
  safeInvalidateMap(0, 'render/update');

  if (rows.length && activeCount === 0) {
    const note = document.createElement('p');
    note.className = 'hint';
    note.textContent = 'Все найденные позиции устарели.';
    list.appendChild(note);
  }
}

async function refreshFriends() {
  try {
    const rows = await fetchFriends();
    renderFriends(rows);
    return true;
  } catch (err) {
    $('liveHint').textContent = `Ошибка друзей: ${err.message}`;
    return false;
  }
}

async function startLiveSharing() {
  if (!getSupabaseConfig()) return alert('Сначала вставь Supabase URL и anon public key в config.js и переопубликуй сайт.');
  const name = $('liveName').value.trim();
  const group = $('groupId').value.trim();
  if (!name) return alert('Укажи своё имя.');
  if (!group) return alert('Создай группу или вставь ID группы от друга.');
  saveLiveInputs();
  if (!groupJoined) {
    const joined = await joinGroup(true);
    if (!joined) return;
  }
  liveEnabled = true;
  updateLiveUi();
  startGps(false);
  await publishMyLocation().catch(err => $('liveHint').textContent = err.message);
  await refreshFriends();
  clearInterval(liveTimer);
  liveTimer = setInterval(() => publishMyLocation().catch(err => $('liveHint').textContent = err.message), 15000);
}

async function stopLiveSharing(keepWatching = true) {
  liveEnabled = false;
  clearInterval(liveTimer);
  liveTimer = null;
  updateLiveUi();
  try { await deleteMyLiveLocation(); } catch (err) { console.warn('Could not delete own live location', err); }
  if (!keepWatching) {
    clearInterval(friendsTimer);
    friendsTimer = null;
  } else if (groupJoined) {
    await refreshFriends();
  }
  $('liveHint').textContent = keepWatching && groupJoined
    ? 'Трансляция остановлена. Ты остался в группе и продолжаешь видеть активных участников.'
    : 'Трансляция остановлена.';
}

async function testSupabaseConnection() {
  try {
    const cfg = getSupabaseConfig();
    if (!cfg) throw new Error('Supabase не настроен в config.js.');
    const rows = await supabaseFetch('live_locations?select=id&limit=1', { method: 'GET' });
    $('liveHint').textContent = `Supabase OK. URL=${cfg.url}. Ответ: ${Array.isArray(rows) ? rows.length : 'ok'}`;
  } catch (err) {
    $('liveHint').textContent = `Supabase test failed: ${err.message}`;
  }
}

function bindUi() {
  $('startGpsBtn').onclick = withButtonDiagnostics('startGpsBtn', () => startGps(true));
  $('centerMeBtn').onclick = withButtonDiagnostics('centerMeBtn', () => currentPosition ? map.setView([currentPosition.lat, currentPosition.lon], 16) : startGps(true));
  $('saveSpotBtn').onclick = withButtonDiagnostics('saveSpotBtn', saveCurrentSpot);
  $('averageBtn').onclick = withButtonDiagnostics('averageBtn', averageAndSave);
  $('searchInput').oninput = renderList;
  $('navigateBtn').onclick = withButtonDiagnostics('navigateBtn', showNavigationLine);
  $('shareSpotBtn').onclick = withButtonDiagnostics('shareSpotBtn', exportSelected);
  $('deleteSpotBtn').onclick = withButtonDiagnostics('deleteSpotBtn', deleteSelected);
  $('exportAllBtn').onclick = withButtonDiagnostics('exportAllBtn', exportAll);
  $('importFile').onchange = async (e) => { try { await importJson(e.target.files[0]); } catch(err) { alert(`Ошибка импорта: ${err.message}`); } finally { e.target.value = ''; } };
  $('chooseFolderBtn').onclick = withButtonDiagnostics('chooseFolderBtn', chooseBackupFolder);
  $('saveFolderBackupBtn').onclick = withButtonDiagnostics('saveFolderBackupBtn', () => saveBackupToFolder(true).catch(err => alert(`Ошибка backup: ${err.message}`)));
  $('requestPersistentBtn').onclick = withButtonDiagnostics('requestPersistentBtn', requestPersistentStorage);
  $('createGroupBtn').onclick = withButtonDiagnostics('createGroupBtn', createGroup);
  $('copyInviteBtn').onclick = withButtonDiagnostics('copyInviteBtn', copyInvite);
  $('joinGroupBtn').onclick = withButtonDiagnostics('joinGroupBtn', () => joinGroup(false));
  $('leaveGroupBtn').onclick = withButtonDiagnostics('leaveGroupBtn', leaveGroup);
  $('startLiveBtn').onclick = withButtonDiagnostics('startLiveBtn', startLiveSharing);
  $('stopLiveBtn').onclick = withButtonDiagnostics('stopLiveBtn', () => stopLiveSharing(true));
  $('refreshFriendsBtn').onclick = withButtonDiagnostics('refreshFriendsBtn', () => groupJoined ? refreshFriends() : joinGroup(false));
  $('testSupabaseBtn').onclick = withButtonDiagnostics('testSupabaseBtn', testSupabaseConnection);
  if ($('repairMapBtn')) $('repairMapBtn').onclick = withButtonDiagnostics('repairMapBtn', repairMap);
  if ($('mapDebugBtn')) $('mapDebugBtn').onclick = withButtonDiagnostics('mapDebugBtn', () => { updateMapDebugUi(true); $('mapDebugDialog').showModal(); });
  if ($('refreshMapDebugBtn')) $('refreshMapDebugBtn').onclick = withButtonDiagnostics('refreshMapDebugBtn', () => updateMapDebugUi(true));
  if ($('repairMapFromDebugBtn')) $('repairMapFromDebugBtn').onclick = withButtonDiagnostics('repairMapFromDebugBtn', repairMap);
  if ($('copyMapDebugBtn')) $('copyMapDebugBtn').onclick = withButtonDiagnostics('copyMapDebugBtn', copyMapDebug);
  if ($('closeMapDebugBtn')) $('closeMapDebugBtn').onclick = withButtonDiagnostics('closeMapDebugBtn', () => $('mapDebugDialog').close());

  window.addEventListener('online', () => { recordMapDebug('browser online'); repairMap(); });
  window.addEventListener('offline', () => { recordMapDebug('browser offline'); updateMapDebugUi(true); });
  window.addEventListener('resize', () => safeInvalidateMap(150, 'resize'));
  window.addEventListener('orientationchange', () => safeInvalidateMap(500, 'orientationchange'));
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) safeInvalidateMap(250, 'visibilitychange');
  });
  window.addEventListener('focus', () => safeInvalidateMap(250, 'focus'));

  $('liveName').onchange = saveLiveInputs;
  $('groupId').onchange = () => {
    saveLiveInputs();
    groupJoined = false;
    clearInterval(friendsTimer);
    friendsTimer = null;
    clearFriendMarkers();
    renderFriends([]);
    updateLiveUi();
  };
  $('installHelpBtn').onclick = withButtonDiagnostics('installHelpBtn', () => $('helpDialog').showModal());
  $('closeHelpBtn').onclick = withButtonDiagnostics('closeHelpBtn', () => $('helpDialog').close());
}

async function init() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(console.warn);
  $('appVersion').textContent = `v${APP_VERSION} · Sprint 3.7`;
  db = await openDb();
  await restoreFolderHandle();
  ensureUserId();
  initMap();
  bindUi();
  recordMapDebug('app initialized');
  const groupFromUrl = loadLiveInputs();
  await refreshSpots();
  if (!getSupabaseConfig()) {
    updateLiveUi();
    $('liveHint').textContent = 'Для live-режима нужен Supabase URL и anon public key в файле config.js.';
  } else if ($('groupId').value.trim()) {
    await joinGroup(true);
    $('liveHint').textContent = groupFromUrl
      ? 'Приглашение открыто: ты вошёл в группу и видишь участников. Чтобы друзья видели тебя, нажми “Начать трансляцию”.'
      : 'Последняя группа восстановлена: ты видишь участников. Чтобы друзья видели тебя, нажми “Начать трансляцию”.';
  } else {
    updateLiveUi();
  }
}

init().catch(err => {
  console.error(err);
  alert(`Ошибка запуска: ${err.message}`);
});
