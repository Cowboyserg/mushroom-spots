const APP_VERSION = '0.5.0';
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
let liveEnabled = false;
let liveTimer = null;
let friendsTimer = null;
let userId = null;
let friendMarkers = new Map();

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
function escapeHtml(str='') {
  return String(str).replace(/[&<>'"]/g, c => ({'&':'&amp;','<':'&lt;','>':'&gt;',"'":'&#39;','"':'&quot;'}[c]));
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

function initMap() {
  map = L.map('map', { zoomControl: true }).setView([56.9496, 24.1052], 12);
  L.tileLayer('https://tile.openstreetmap.org/{z}/{x}/{y}.png', {
    maxZoom: 19,
    attribution: '&copy; OpenStreetMap contributors'
  }).addTo(map);
}

function updateUserPosition(pos, center=false) {
  const { latitude, longitude, accuracy } = pos.coords;
  currentPosition = {
    lat: latitude,
    lon: longitude,
    accuracy,
    timestamp: new Date(pos.timestamp).toISOString()
  };
  $('gpsStatus').textContent = 'активен';
  $('gpsAccuracy').textContent = meters(accuracy);
  $('gpsCoords').textContent = `${fmtCoord(latitude)}, ${fmtCoord(longitude)}`;

  const latlng = [latitude, longitude];
  if (!userMarker) {
    userMarker = L.marker(latlng, { title: 'Я здесь' }).addTo(map).bindPopup('Я здесь');
    accuracyCircle = L.circle(latlng, { radius: accuracy || 0 }).addTo(map);
  } else {
    userMarker.setLatLng(latlng);
    accuracyCircle.setLatLng(latlng).setRadius(accuracy || 0);
  }
  if (center) map.setView(latlng, Math.max(map.getZoom(), 16));
  updateSelectedDetails();
  renderList();
}

function startGps(center=true) {
  if (!navigator.geolocation) {
    alert('Геолокация не поддерживается этим браузером.');
    return;
  }
  $('gpsStatus').textContent = 'запрос разрешения…';
  navigator.geolocation.getCurrentPosition(
    (pos) => updateUserPosition(pos, center),
    (err) => { $('gpsStatus').textContent = 'ошибка'; alert(`GPS ошибка: ${err.message}`); },
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
  if (watchId == null) {
    watchId = navigator.geolocation.watchPosition(
      (pos) => updateUserPosition(pos, false),
      () => {},
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
  const permission = await verifyFolderPermission(folderHandle, true);
  if (!permission) {
    $('folderStatus').textContent = 'нет разрешения';
    if (showSuccess) alert('Нет разрешения на запись в выбранную папку.');
    return false;
  }
  const fileHandle = await folderHandle.getFileHandle(BACKUP_FILE_NAME, { create: true });
  const writable = await fileHandle.createWritable();
  await writable.write(JSON.stringify(buildBackupPayload(), null, 2));
  await writable.close();
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
  const sampleWatch = navigator.geolocation.watchPosition(
    (pos) => {
      samples.push({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy });
      $('saveHint').textContent = `Усреднение: ${samples.length} измерений, лучшая точность ${meters(Math.min(...samples.map(s=>s.accuracy||9999)))}`;
    },
    (err) => alert(`Ошибка усреднения: ${err.message}`),
    { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
  );
  setTimeout(async () => {
    navigator.geolocation.clearWatch(sampleWatch);
    if (!samples.length) { $('saveHint').textContent = 'Не удалось собрать GPS-измерения.'; return; }
    const weighted = samples.map(s => ({ ...s, w: 1 / Math.max(s.accuracy || 50, 1) }));
    const wSum = weighted.reduce((s,x)=>s+x.w,0);
    currentPosition = {
      lat: weighted.reduce((s,x)=>s+x.lat*x.w,0)/wSum,
      lon: weighted.reduce((s,x)=>s+x.lon*x.w,0)/wSum,
      accuracy: Math.min(...samples.map(s=>s.accuracy||9999)),
      timestamp: new Date().toISOString()
    };
    updateUserPosition({ coords:{ latitude: currentPosition.lat, longitude: currentPosition.lon, accuracy: currentPosition.accuracy }, timestamp: Date.now() }, true);
    $('saveHint').textContent = `Готово: собрано ${samples.length} измерений за ${Math.round((Date.now()-started)/1000)} сек. Теперь можно сохранить точку.`;
  }, 30000);
}

function markerPopup(spot) {
  return `<strong>${escapeHtml(spot.name)}</strong><br>${spot.mushroomType ? escapeHtml(spot.mushroomType)+'<br>' : ''}${fmtCoord(spot.lat)}, ${fmtCoord(spot.lon)}<br>Точность: ${meters(spot.accuracy)}<br><button onclick="window.selectSpotFromPopup('${spot.id}')">Выбрать</button>`;
}

function renderMarkers() {
  for (const marker of spotMarkers.values()) marker.remove();
  spotMarkers.clear();
  for (const spot of spots) {
    const marker = L.marker([spot.lat, spot.lon], { title: spot.name }).addTo(map).bindPopup(markerPopup(spot));
    marker.on('click', () => selectSpot(spot.id, false));
    spotMarkers.set(spot.id, marker);
  }
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
  try {
    folderHandle = await window.showDirectoryPicker({ mode: 'readwrite' });
    await setSetting('backupFolderHandle', folderHandle);
    $('folderStatus').textContent = folderHandle.name || 'выбрана';
    await saveBackupToFolder(true);
  } catch (err) {
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
  const granted = await navigator.storage.persist();
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
  const url = (cfg.SUPABASE_URL || '').trim().replace(/\/$/, '');
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
  const res = await fetch(`${cfg.url}/rest/v1/${path}`, { ...options, headers });
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    throw new Error(`Supabase ${res.status}: ${text || res.statusText}`);
  }
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

function parseGroupFromUrl() {
  const url = new URL(window.location.href);
  const group = url.searchParams.get('group');
  if (group && $('groupId')) $('groupId').value = group;
}

function createGroup() {
  const group = crypto.randomUUID ? crypto.randomUUID() : uid();
  $('groupId').value = group;
  localStorage.setItem('mushroom_live_group_id', group);
  $('liveHint').textContent = 'Группа создана. Скопируй приглашение и отправь друзьям.';
}

async function copyInvite() {
  const group = $('groupId').value.trim();
  if (!group) return alert('Сначала создай или вставь ID группы.');
  const url = new URL(window.location.href);
  url.searchParams.set('group', group);
  const text = url.toString();
  try {
    await navigator.clipboard.writeText(text);
    $('liveHint').textContent = 'Ссылка-приглашение скопирована.';
  } catch {
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
  parseGroupFromUrl();
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

  for (const row of rows) {
    const ageMs = now - new Date(row.updated_at).getTime();
    const stale = ageMs > 5 * 60 * 1000;
    if (row.user_id !== myId && !stale) {
      seenIds.add(row.user_id);
      const latlng = [row.lat, row.lon];
      let marker = friendMarkers.get(row.user_id);
      const popup = `<strong>${escapeHtml(row.user_name)}</strong><br>${fmtCoord(row.lat)}, ${fmtCoord(row.lon)}<br>Точность: ${meters(row.accuracy)}<br>Обновлено: ${fmtDate(row.updated_at)}`;
      if (!marker) {
        marker = L.circleMarker(latlng, { radius: 9, weight: 3 }).addTo(map).bindPopup(popup);
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

  if (!rows.length) list.innerHTML = '<p class="hint">В группе пока нет активных участников.</p>';
}

async function refreshFriends() {
  try {
    const rows = await fetchFriends();
    renderFriends(rows);
  } catch (err) {
    $('liveHint').textContent = `Ошибка друзей: ${err.message}`;
  }
}

async function startLiveSharing() {
  if (!getSupabaseConfig()) return alert('Сначала вставь Supabase URL и anon public key в config.js и переопубликуй сайт.');
  const name = $('liveName').value.trim();
  const group = $('groupId').value.trim();
  if (!name) return alert('Укажи своё имя.');
  if (!group) return alert('Создай группу или вставь ID группы от друга.');
  saveLiveInputs();
  liveEnabled = true;
  $('liveStatus').textContent = 'включено';
  $('liveStatus').className = 'pill on';
  startGps(false);
  await publishMyLocation().catch(err => $('liveHint').textContent = err.message);
  await refreshFriends();
  clearInterval(liveTimer);
  clearInterval(friendsTimer);
  liveTimer = setInterval(() => publishMyLocation().catch(err => $('liveHint').textContent = err.message), 15000);
  friendsTimer = setInterval(refreshFriends, 10000);
}

function stopLiveSharing() {
  liveEnabled = false;
  clearInterval(liveTimer);
  clearInterval(friendsTimer);
  liveTimer = null;
  friendsTimer = null;
  $('liveStatus').textContent = 'выключено';
  $('liveStatus').className = 'pill';
  $('liveHint').textContent = 'Трансляция остановлена. Последняя позиция исчезнет у друзей, когда станет старше 5 минут.';
}

function bindUi() {
  $('startGpsBtn').onclick = () => startGps(true);
  $('centerMeBtn').onclick = () => currentPosition ? map.setView([currentPosition.lat, currentPosition.lon], 16) : startGps(true);
  $('saveSpotBtn').onclick = saveCurrentSpot;
  $('averageBtn').onclick = averageAndSave;
  $('searchInput').oninput = renderList;
  $('navigateBtn').onclick = showNavigationLine;
  $('shareSpotBtn').onclick = exportSelected;
  $('deleteSpotBtn').onclick = deleteSelected;
  $('exportAllBtn').onclick = exportAll;
  $('importFile').onchange = async (e) => { try { await importJson(e.target.files[0]); } catch(err) { alert(`Ошибка импорта: ${err.message}`); } finally { e.target.value = ''; } };
  $('chooseFolderBtn').onclick = chooseBackupFolder;
  $('saveFolderBackupBtn').onclick = () => saveBackupToFolder(true).catch(err => alert(`Ошибка backup: ${err.message}`));
  $('requestPersistentBtn').onclick = requestPersistentStorage;
  $('createGroupBtn').onclick = createGroup;
  $('copyInviteBtn').onclick = copyInvite;
  $('startLiveBtn').onclick = startLiveSharing;
  $('stopLiveBtn').onclick = stopLiveSharing;
  $('refreshFriendsBtn').onclick = refreshFriends;
  $('liveName').onchange = saveLiveInputs;
  $('groupId').onchange = saveLiveInputs;
  $('installHelpBtn').onclick = () => $('helpDialog').showModal();
  $('closeHelpBtn').onclick = () => $('helpDialog').close();
}

async function init() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(console.warn);
  $('appVersion').textContent = `v${APP_VERSION}`;
  db = await openDb();
  await restoreFolderHandle();
  ensureUserId();
  initMap();
  bindUi();
  loadLiveInputs();
  if (!getSupabaseConfig()) $('liveStatus').className = 'pill warn';
  await refreshSpots();
}

init().catch(err => {
  console.error(err);
  alert(`Ошибка запуска: ${err.message}`);
});
