import { bulkUpsertSpots, deleteSpot, getSpot, listSpots, openDatabase, saveSpot } from './db.js';
import { downloadGpx, downloadJson, fileToDataUrl, parseImportedJson, shareJson } from './export.js';
import { bearingDegrees, distanceMeters, formatBearing, formatCoord, formatMeters, GeoAverager } from './geo.js';
import { SlippyMap } from './map.js';

const elements = {
  map: document.querySelector('#map'),
  tileLayer: document.querySelector('#tileLayer'),
  markerLayer: document.querySelector('#markerLayer'),
  zoomInBtn: document.querySelector('#zoomInBtn'),
  zoomOutBtn: document.querySelector('#zoomOutBtn'),
  locateBtn: document.querySelector('#locateBtn'),
  gpsStatus: document.querySelector('#gpsStatus'),
  latValue: document.querySelector('#latValue'),
  lonValue: document.querySelector('#lonValue'),
  accuracyValue: document.querySelector('#accuracyValue'),
  samplesValue: document.querySelector('#samplesValue'),
  startAveragingBtn: document.querySelector('#startAveragingBtn'),
  clearSamplesBtn: document.querySelector('#clearSamplesBtn'),
  spotForm: document.querySelector('#spotForm'),
  nameInput: document.querySelector('#nameInput'),
  speciesInput: document.querySelector('#speciesInput'),
  notesInput: document.querySelector('#notesInput'),
  photoInput: document.querySelector('#photoInput'),
  exportJsonBtn: document.querySelector('#exportJsonBtn'),
  exportGpxBtn: document.querySelector('#exportGpxBtn'),
  shareAllBtn: document.querySelector('#shareAllBtn'),
  importJsonInput: document.querySelector('#importJsonInput'),
  searchInput: document.querySelector('#searchInput'),
  spotList: document.querySelector('#spotList'),
  spotCount: document.querySelector('#spotCount'),
  spotDialog: document.querySelector('#spotDialog'),
  dialogTitle: document.querySelector('#dialogTitle'),
  dialogContent: document.querySelector('#dialogContent'),
  closeDialogBtn: document.querySelector('#closeDialogBtn'),
  navigateDialogBtn: document.querySelector('#navigateDialogBtn'),
  shareDialogBtn: document.querySelector('#shareDialogBtn'),
  deleteDialogBtn: document.querySelector('#deleteDialogBtn'),
  installHint: document.querySelector('#installHint'),
};

let map;
let spots = [];
let currentPosition = null;
let currentDialogSpotId = null;
let averaging = false;
const averager = new GeoAverager();

await init();

async function init() {
  await openDatabase();
  registerServiceWorker();
  setupInstallHint();

  map = new SlippyMap({
    root: elements.map,
    tileLayer: elements.tileLayer,
    markerLayer: elements.markerLayer,
    onSpotClick: showSpotDialog,
  });

  attachHandlers();
  await refreshSpots();
  startLocationWatch();
}

function attachHandlers() {
  elements.zoomInBtn.addEventListener('click', () => map.zoomBy(1));
  elements.zoomOutBtn.addEventListener('click', () => map.zoomBy(-1));
  elements.locateBtn.addEventListener('click', () => {
    if (currentPosition) map.setCenter(currentPosition.lat, currentPosition.lon, Math.max(map.zoom, 16));
    else startLocationWatch();
  });

  elements.startAveragingBtn.addEventListener('click', () => {
    averaging = !averaging;
    elements.startAveragingBtn.textContent = averaging ? 'Остановить усреднение' : 'Начать усреднение';
    elements.gpsStatus.textContent = averaging
      ? 'Усреднение включено. Постойте на месте 20–60 секунд, потом сохраните точку.'
      : 'Усреднение остановлено. Можно сохранить усреднённую или текущую точку.';
  });

  elements.clearSamplesBtn.addEventListener('click', () => {
    averager.clear();
    updateGpsUi();
  });

  elements.spotForm.addEventListener('submit', onSaveSpot);
  elements.exportJsonBtn.addEventListener('click', () => downloadJson(spots));
  elements.exportGpxBtn.addEventListener('click', () => downloadGpx(spots));
  elements.shareAllBtn.addEventListener('click', () => shareJson(spots, 'Грибные места').catch((error) => alert(error.message)));
  elements.importJsonInput.addEventListener('change', onImportJson);
  elements.searchInput.addEventListener('input', renderSpotList);
  elements.closeDialogBtn.addEventListener('click', () => elements.spotDialog.close());
  elements.navigateDialogBtn.addEventListener('click', onDialogNavigate);
  elements.shareDialogBtn.addEventListener('click', onDialogShare);
  elements.deleteDialogBtn.addEventListener('click', onDialogDelete);
  window.addEventListener('resize', () => map.render());
}

function startLocationWatch() {
  if (!('geolocation' in navigator)) {
    elements.gpsStatus.textContent = 'Геолокация недоступна в этом браузере.';
    return;
  }

  navigator.geolocation.watchPosition(
    (position) => {
      const coords = position.coords;
      currentPosition = {
        lat: coords.latitude,
        lon: coords.longitude,
        accuracy: coords.accuracy,
        timestamp: position.timestamp,
      };
      if (averaging) averager.add(position);
      map.setCurrentPosition(currentPosition);
      updateGpsUi();
      renderSpotList();
    },
    (error) => {
      elements.gpsStatus.textContent = `Ошибка GPS: ${error.message}`;
    },
    { enableHighAccuracy: true, maximumAge: 0, timeout: 30000 },
  );
}

function updateGpsUi() {
  elements.latValue.textContent = formatCoord(currentPosition?.lat);
  elements.lonValue.textContent = formatCoord(currentPosition?.lon);
  elements.accuracyValue.textContent = formatMeters(currentPosition?.accuracy);
  elements.samplesValue.textContent = String(averager.count());

  if (!currentPosition) return;
  const avg = averager.average();
  const sampleText = avg ? ` Оценка после усреднения: ${formatMeters(avg.averagedAccuracy)}, замеров: ${avg.samplesCount}.` : '';
  elements.gpsStatus.textContent = `GPS активен. Текущая точность: ${formatMeters(currentPosition.accuracy)}.${sampleText}`;
}

async function onSaveSpot(event) {
  event.preventDefault();
  const averaged = averager.average();
  const source = averaged || currentPosition;

  if (!source) {
    alert('Пока нет GPS-позиции. Разрешите геолокацию и дождитесь первого определения координат.');
    return;
  }

  const photoDataUrl = await fileToDataUrl(elements.photoInput.files?.[0]).catch((error) => {
    alert(error.message);
    return null;
  });

  const now = new Date().toISOString();
  const spot = {
    id: crypto.randomUUID(),
    name: elements.nameInput.value.trim() || `Точка ${new Date().toLocaleDateString('ru-RU')}`,
    species: elements.speciesInput.value.trim(),
    notes: elements.notesInput.value.trim(),
    lat: source.lat,
    lon: source.lon,
    accuracy: source.accuracy ?? null,
    averagedAccuracy: source.averagedAccuracy ?? null,
    samplesCount: source.samplesCount ?? 1,
    photoDataUrl,
    createdAt: now,
    updatedAt: now,
  };

  await saveSpot(spot);
  elements.spotForm.reset();
  averaging = false;
  averager.clear();
  elements.startAveragingBtn.textContent = 'Начать усреднение';
  await refreshSpots();
  map.setCenter(spot.lat, spot.lon, Math.max(map.zoom, 16));
}

async function refreshSpots() {
  spots = await listSpots();
  map?.setSpots(spots);
  renderSpotList();
}

function renderSpotList() {
  const query = elements.searchInput.value.trim().toLowerCase();
  const filtered = !query ? spots : spots.filter((spot) => [spot.name, spot.species, spot.notes]
    .join(' ')
    .toLowerCase()
    .includes(query));

  elements.spotCount.textContent = String(spots.length);

  const fragment = document.createDocumentFragment();
  for (const spot of filtered) {
    const item = document.createElement('li');
    item.className = 'spot-item';
    const distance = currentPosition ? `${Math.round(distanceMeters(currentPosition, spot))} м` : 'расстояние неизвестно';
    const bearing = currentPosition ? ` · азимут ${formatBearing(bearingDegrees(currentPosition, spot))}` : '';
    item.innerHTML = `
      <strong>${escapeHtml(spot.name || 'Без названия')}</strong>
      <div class="spot-meta">${escapeHtml(spot.species || 'Тип не указан')} · ${escapeHtml(new Date(spot.createdAt).toLocaleDateString('ru-RU'))} · ${distance}${bearing}</div>
      <div class="spot-meta">${formatCoord(spot.lat)}, ${formatCoord(spot.lon)} · ${formatMeters(spot.accuracy)}</div>
    `;
    item.addEventListener('click', () => showSpotDialog(spot.id));
    fragment.appendChild(item);
  }

  if (!filtered.length) {
    const empty = document.createElement('li');
    empty.className = 'spot-meta';
    empty.textContent = 'Точек пока нет.';
    fragment.appendChild(empty);
  }

  elements.spotList.replaceChildren(fragment);
}

async function showSpotDialog(id) {
  const spot = await getSpot(id);
  if (!spot) return;
  currentDialogSpotId = id;
  elements.dialogTitle.textContent = spot.name || 'Без названия';
  const distance = currentPosition ? `${Math.round(distanceMeters(currentPosition, spot))} м` : 'неизвестно';
  const bearing = currentPosition ? formatBearing(bearingDegrees(currentPosition, spot)) : '—';
  elements.dialogContent.innerHTML = `
    ${spot.photoDataUrl ? `<img class="dialog-photo" alt="Фото точки" src="${spot.photoDataUrl}" />` : ''}
    <p><strong>Тип:</strong> ${escapeHtml(spot.species || '—')}</p>
    <p><strong>Расстояние:</strong> ${escapeHtml(distance)}</p>
    <p><strong>Азимут:</strong> ${escapeHtml(bearing)}</p>
    <p><strong>Координаты:</strong> ${formatCoord(spot.lat)}, ${formatCoord(spot.lon)}</p>
    <p><strong>Точность GPS:</strong> ${formatMeters(spot.accuracy)}</p>
    <p><strong>Усреднение:</strong> ${formatMeters(spot.averagedAccuracy)}, замеров: ${spot.samplesCount || 1}</p>
    <p><strong>Создано:</strong> ${escapeHtml(new Date(spot.createdAt).toLocaleString('ru-RU'))}</p>
    <p><strong>Заметки:</strong><br>${escapeHtml(spot.notes || '—').replaceAll('\n', '<br>')}</p>
  `;
  elements.spotDialog.showModal();
}

async function onDialogNavigate() {
  const spot = await getSpot(currentDialogSpotId);
  if (!spot) return;
  map.setCenter(spot.lat, spot.lon, Math.max(map.zoom, 16));
  elements.spotDialog.close();
}

async function onDialogShare() {
  const spot = await getSpot(currentDialogSpotId);
  if (!spot) return;
  try {
    await shareJson([spot], spot.name || 'Грибная точка');
  } catch (error) {
    alert(error.message);
  }
}

async function onDialogDelete() {
  const spot = await getSpot(currentDialogSpotId);
  if (!spot) return;
  if (!confirm(`Удалить «${spot.name || 'Без названия'}»?`)) return;
  await deleteSpot(spot.id);
  elements.spotDialog.close();
  await refreshSpots();
}

async function onImportJson(event) {
  const file = event.target.files?.[0];
  if (!file) return;
  try {
    const text = await file.text();
    const imported = parseImportedJson(text);
    const count = await bulkUpsertSpots(imported);
    await refreshSpots();
    alert(`Импортировано точек: ${count}.`);
  } catch (error) {
    alert(error.message);
  } finally {
    event.target.value = '';
  }
}

function registerServiceWorker() {
  if ('serviceWorker' in navigator) {
    navigator.serviceWorker.register('./sw.js').catch((error) => {
      console.warn('Service worker registration failed', error);
    });
  }
}

function setupInstallHint() {
  window.addEventListener('beforeinstallprompt', () => {
    elements.installHint.hidden = false;
  });
}

function escapeHtml(value) {
  const div = document.createElement('div');
  div.textContent = String(value ?? '');
  return div.innerHTML;
}
