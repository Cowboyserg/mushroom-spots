const APP_VERSION = '0.7.41-hotfix.1';
const DB_NAME = 'mushroom-spots-db';
const DB_VERSION = 4;
const SPOTS_STORE = 'spots';
const SETTINGS_STORE = 'settings';
const TRACKS_STORE = 'tracks';
const OFFLINE_MAP_FILES_STORE = 'offlineMapFiles';
const BACKUP_FILE_NAME = 'mushroom-spots-backup.json';
const BACKUP_SCHEMA = 'mushroom-spots.local-json-backup';
const BACKUP_SCHEMA_VERSION = 1;
const CHAT_MAX_LENGTH = 300;
const CHAT_FETCH_LIMIT = 50;
const CHAT_REFRESH_MS = 10000;
const CHAT_SPOT_PREFIX = '::spot::';
const PROFILE_STORAGE_KEY = 'mushroom_people_profiles_v1';
const ACTIVE_PROFILE_STORAGE_KEY = 'mushroom_active_profile_id';
const MEMBER_SYNC_PENDING_KEY = 'mushroom_member_sync_pending_v1';
const GROUP_MEMBERS_CACHE_PREFIX = 'mushroom_group_members_cache_v1:';
const MEMBER_SYNC_RETRY_MS = 15000;
const SUPABASE_TIMEOUT_MS = 12000;
const OFFLINE_MAP_PACKAGE_META_KEY = 'mushroom_offline_map_package_v1';
const OFFLINE_MAP_SELECTED_PACKAGE_KEY = 'mushroom_offline_map_selected_package_v1';
const REMEMBERED_PMTILES_MAPS_KEY = 'mushroom_remembered_pmtiles_maps_v1';
const OPFS_OFFLINE_MAPS_DIR = 'mushroom-offline-map-files';
const BBOX_EXPORT_OUTPUT_FILE = 'mushroom-medium-z14.pmtiles';
const BBOX_EXPORT_MAX_ZOOM = 14;
const APP_SCREEN_STORAGE_KEY = 'mushroom_active_app_screen_v1';
const APP_ADVANCED_MODE_KEY = 'mushroom_advanced_mode_v1';
const APP_SCREENS = ['map', 'spots', 'group', 'offline', 'settings'];
const APP_CACHE_RESET_MARKER_KEY = 'mushroom_app_cache_reset_marker_v1';
const SPOT_DEFAULT_COLLECTION = 'Грибные места';
const SPOT_COLLECTIONS = [SPOT_DEFAULT_COLLECTION, 'Разведка', 'Ягоды', 'Парковка', 'Другое'];
const SPOT_CUSTOM_COLLECTIONS_SETTING_KEY = 'spot_custom_collections_v1';
const SPOT_DELETED_COLLECTIONS_SETTING_KEY = 'spot_deleted_collections_v1';


const MAP_ENGINE_LEAFLET = 'leaflet';
const MAP_ENGINE_LEAFLET_LITE = 'leaflet-lite';
const MAP_ENGINE_MAPLIBRE = 'maplibre';
const MAP_PROVIDER_ONLINE_RASTER = 'online-raster';
const MAP_PROVIDER_OFFLINE_PMTILES = 'offline-pmtiles';
const MAP_PROVIDER_NO_BASEMAP = 'no-basemap';
const PMTILES_SAMPLE_URL = './offline-test.pmtiles';
const PMTILES_DEFAULT_URL = PMTILES_SAMPLE_URL;
const OFFLINE_MAP_MANIFEST_URL = './offline-map-packages.json';
const OFFLINE_MAP_MANIFEST_URL_STORAGE_KEY = 'mushroom_offline_map_manifest_url_v1';
const OFFLINE_MAP_DEFAULT_RELEASE_TAG = 'maps-2026-06-02';
const MAPLIBRE_GL_VERSION = '5.24.0';
const PMTILES_JS_VERSION = '4.4.1';
const PROTOMAPS_BASEMAPS_VERSION = '5';
const MAPLIBRE_SCRIPT_URLS = [
  `https://unpkg.com/maplibre-gl@${MAPLIBRE_GL_VERSION}/dist/maplibre-gl.js`,
  `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_GL_VERSION}/dist/maplibre-gl.js`
];
const MAPLIBRE_CSS_URLS = [
  `https://unpkg.com/maplibre-gl@${MAPLIBRE_GL_VERSION}/dist/maplibre-gl.css`,
  `https://cdn.jsdelivr.net/npm/maplibre-gl@${MAPLIBRE_GL_VERSION}/dist/maplibre-gl.css`
];
const PMTILES_SCRIPT_URLS = [
  `https://unpkg.com/pmtiles@${PMTILES_JS_VERSION}/dist/pmtiles.js`,
  `https://cdn.jsdelivr.net/npm/pmtiles@${PMTILES_JS_VERSION}/dist/pmtiles.js`
];
const PROTOMAPS_BASEMAPS_SCRIPT_URLS = [
  `https://unpkg.com/@protomaps/basemaps@${PROTOMAPS_BASEMAPS_VERSION}/dist/basemaps.js`,
  `https://cdn.jsdelivr.net/npm/@protomaps/basemaps@${PROTOMAPS_BASEMAPS_VERSION}/dist/basemaps.js`
];

const OFFLINE_REGION_NAMES_RU = {
  'central-fed-district': 'Центральный федеральный округ',
  'crimean-fed-district': 'Крымский федеральный округ',
  'far-eastern-fed-district': 'Дальневосточный федеральный округ',
  'north-caucasus-fed-district': 'Северо-Кавказский федеральный округ',
  'northwestern-fed-district': 'Северо-Западный федеральный округ',
  'siberian-fed-district': 'Сибирский федеральный округ',
  'south-fed-district': 'Южный федеральный округ',
  'ural-fed-district': 'Уральский федеральный округ',
  'volga-fed-district': 'Приволжский федеральный округ',
  'kaliningrad': 'Калининградская область'
};

const MAP_PROVIDER_LABELS = {
  [MAP_PROVIDER_ONLINE_RASTER]: 'online raster',
  [MAP_PROVIDER_OFFLINE_PMTILES]: 'offline map file',
  [MAP_PROVIDER_NO_BASEMAP]: 'no map background'
};

let db;
let map;
let userMarker;
let accuracyCircle;
let currentPosition = null;
let activeAppScreen = 'map';
let showMapAdvancedControls = false;
let onlineMapExpanded = false;
let watchId = null;
let spots = [];
let customSpotCollections = [];
let deletedSpotCollections = [];
let activeSpotCollection = null;
let spotFolderDeleteDialogState = null;
let suppressSpotHistorySync = false;
const SPOTS_HISTORY_STATE_KEY = 'mushroomSpotsUiState';
let spotMarkers = new Map();
let selectedSpotId = null;
let lastSavedSpotId = null;
let savePlaceDialogState = null;
let selectedMapObject = null;
let mapObjectSheetCollapsed = false;
let pickedSaveEditorOpen = false;
let pickedSaveShareAfterSave = false;
let savedSpotEditorOpen = false;
let spotListEditorOpen = false;
let pickedMapPoint = null;
let pickedMapPointMarker = null;
let chatPreviewPointMarker = null;
let chatPreviewPoint = null;
let mapLongPressTimer = null;
let mapLongPressStart = null;
let bboxExportState = {
  mode: 'idle',
  firstCorner: null,
  bounds: null,
  command: '',
  updatedAt: null,
  source: null,
  error: null
};
let bboxExportLayer = null;
let bboxExportSelectionOverlay = null;
let lastBboxExportClick = null;
let bboxExportPointerStart = null;
let lastBboxExportDomSelectionAt = 0;
let lastBboxExportDomSelectionPoint = null;
let navLine = null;
let tracks = [];
let trackLines = new Map();
let activeTrackLine = null;
let trackRecording = { active: false, id: null, startedAt: null, points: [], watchId: null, lastError: null };
let folderHandle = null;
let groupJoined = false;
let liveEnabled = false;
let liveTimer = null;
let friendsTimer = null;
let chatTimer = null;
let chatMessages = [];
let chatEditingMessageId = null;
let chatSendPending = false;
let userId = null;
let friendMarkers = new Map();
let baseTileLayer = null;
let mapEngine = MAP_ENGINE_LEAFLET;
let mapProvider = MAP_PROVIDER_ONLINE_RASTER;
let mapSourceStatus = 'booting';
let offlinePackageStatus = 'not-installed';
let offlinePackageMeta = null;
let mapFallbackActive = false;
let mapProviderLastReason = 'startup';
let mapProviderChangedAt = new Date().toISOString();
let mapDebugEvents = [];
let mapTileStats = { provider: mapProvider, loading: 0, load: 0, error: 0, lastError: null, lastTileUrl: null, startedAt: new Date().toISOString() };
let pmtilesProtocol = null;
let pmtilesPreviewMap = null;
let pmtilesPreviewLiveRows = [];
let offlineMapManifest = {
  url: OFFLINE_MAP_MANIFEST_URL,
  status: 'not-loaded',
  packages: [],
  selectedPackageId: null,
  error: null,
  loadedAt: null
};
let offlineRegionInstallState = {
  byPackageId: {},
  lastPackageId: null
};
const offlineRegionInstallControllers = new Map();
let localPmtilesFileState = {
  status: 'not-selected',
  file: null,
  storageType: null,
  storageName: null,
  persistent: false,
  packageId: null,
  key: null,
  name: null,
  customName: null,
  rememberedId: null,
  fingerprint: null,
  sizeBytes: null,
  lastModified: null,
  selectedAt: null,
  error: null
};
let pendingLocalPmtilesImportMode = 'add';
let pendingDuplicatePmtilesImport = null;
let pendingOfflineImportNameMapId = null;
let appToastTimer = null;
const OFFLINE_IMPORT_TOAST_STEP_MS = 1200;
const OFFLINE_IMPORT_RESULT_MODAL_DELAY_MS = 1600;
let rememberedPmtilesMapsState = {
  status: 'not-loaded',
  maps: [],
  selectedId: null,
  error: null,
  updatedAt: null
};
let pmtilesPreviewState = {
  status: 'not-run',
  visible: false,
  sourceUrl: PMTILES_DEFAULT_URL,
  styleMode: null,
  error: null,
  loadedAt: null,
  lastEvent: null,
  styleName: null,
  appliedBounds: null,
  appliedCenter: null,
  appliedZoom: null,
  viewportMode: null,
  vectorLayers: null
};
let pmtilesPreviewUserLayerState = {
  status: 'not-rendered',
  counts: { spots: 0, selectedSpot: 0, gps: 0, picked: 0, chat: 0, live: 0, accuracy: 0, tracks: 0, activeTrack: 0 },
  updatedAt: null,
  error: null
};
let pmtilesPreviewFocusState = {
  status: 'not-run',
  target: null,
  coords: null,
  zoom: null,
  updatedAt: null,
  error: null,
  reason: null
};
let pmtilesRuntimeProbe = {
  url: PMTILES_DEFAULT_URL,
  status: 'not-run',
  maplibreLoaded: false,
  pmtilesLoaded: false,
  webgl: null,
  protocolRegistered: false,
  packageFound: false,
  header: null,
  metadata: null,
  error: null,
  diagnostics: null,
  checkedAt: null
};
let apiDebugEvents = [];
let apiButtonStates = new Map();
let apiRequestSeq = 0;
let activeButtonDiagnostics = null;
let peopleProfiles = [];
let activeProfileId = null;
let memberSyncPending = false;
let memberSyncTimer = null;

const BUTTON_DIAGNOSTIC_LABELS = {
  startGpsBtn: 'Включить GPS',
  centerMeBtn: 'Ко мне',
  mapExpandBtn: 'Развернуть карту',
  repairMapBtn: 'Починить карту',
  startBboxExportBtn: 'Выбрать прямоугольник региона',
  useVisibleBboxBtn: 'Взять видимую область как регион карты',
  copyBboxCommandBtn: 'Скопировать команду подготовки региона',
  clearBboxExportBtn: 'Сбросить регион карты',
  saveSpotBtn: 'Сохранить место',
  saveCurrentGpsOnlyBtn: 'Сохранить только GPS',
  savePickedMapPointBtn: 'Сохранить выбранную точку на карте',
  sharePickedMapPointToChatBtn: 'Отправить выбранную точку в чат',
  clearPickedMapPointBtn: 'Сбросить выбранную точку на карте',
  averageBtn: 'Уточнить GPS 30 сек',
  showSelectedSpotOnMapBtn: 'Показать выбранную точку на карте',
  spotListOpenDetailsBtn: 'Открыть карточку точки из списка',
  spotListShowOnMapBtn: 'Показать точку из списка на карте',
  spotListSendToChatBtn: 'Отправить точку из списка в чат',
  spotListEditBtn: 'Править точку в разделе Точки',
  spotListDeleteBtn: 'Удалить точку в разделе Точки',
  spotListSaveEditBtn: 'Сохранить изменения точки в разделе Точки',
  spotListCancelEditBtn: 'Отменить правку точки в разделе Точки',
  closeSelectedSpotBtn: 'Закрыть карточку точки',
  spotListCloseDetailsBtn: 'Закрыть карточку точки в списке',
  spotItemShowOnMapBtn: 'Показать точку из меню ⋯',
  spotItemShareBtn: 'Отправить точку из меню ⋯ в чат',
  spotItemEditBtn: 'Править точку из меню ⋯',
  spotItemDeleteBtn: 'Удалить точку из меню ⋯',
  navigateBtn: 'Показать направление',
  shareSpotBtn: 'Экспорт точки',
  sendSelectedSpotToChatBtn: 'Отправить сохранённую точку в чат',
  createGroupBtn: 'Создать группу',
  copyInviteBtn: 'Скопировать приглашение',
  savePersonProfileBtn: 'Запомнить локального человека',
  newPersonProfileBtn: 'Другой человек',
  profileQuickLoginBtn: 'Войти как сохранённый человек',
  joinGroupBtn: 'Войти в группу',
  leaveGroupBtn: 'Выйти из группы',
  startLiveBtn: 'Начать показ моей позиции',
  stopLiveBtn: 'Остановить мою позицию',
  refreshFriendsBtn: 'Обновить участников',
  testSupabaseBtn: 'Проверить БД',
  chatSendBtn: 'Отправить сообщение',
  chatRefreshBtn: 'Обновить чат',
  chatCancelEditBtn: 'Отменить правку сообщения',
  chatEditMessageBtn: 'Править сообщение',
  chatDeleteMessageBtn: 'Удалить сообщение',
  chatShowSpotBtn: 'Показать точку из чата на карте',
  cleanMyDbBtn: 'Удалить меня из БД',
  cleanMyEverywhereDbBtn: 'Удалить меня из всех групп',
  cleanCurrentGroupDbBtn: 'Очистить текущую группу',
  cleanStaleGroupDbBtn: 'Удалить старые записи группы',
  resetAppCacheBtn: 'Сбросить кэш приложения',
  loadOfflineManifestBtn: 'Обновить список карт',
  refreshOfflineRegionCatalogBtn: 'Обновить каталог регионов',
  saveOfflineManifestUrlBtn: 'Сохранить URL каталога регионов',
  offlineRegionInstallBtn: 'Установить карту региона',
  offlineRegionCancelInstallBtn: 'Отменить установку региона',
  offlineRegionCatalogDownload: 'Скачать карту региона вручную',
  chooseLocalPmtilesBtn: 'Выбрать файл карты',
  probePmtilesBtn: 'Проверить выбранный файл карты',
  previewPmtilesBtn: 'Предпросмотр офлайн-карты',
  replaceLocalPmtilesBtn: 'Заменить файл карты',
  centerPmtilesOnMeBtn: 'Показать меня на офлайн-карте',
  renameRememberedPmtilesMapBtn: 'Сохранить название карты',
  forgetRememberedPmtilesMapBtn: 'Забыть карту',
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

function safeJsonParse(value, fallback = null) {
  try {
    return value ? JSON.parse(value) : fallback;
  } catch {
    return fallback;
  }
}

function uniqueProfiles(profiles) {
  const seen = new Set();
  return (profiles || []).filter(profile => {
    if (!profile || !profile.id || seen.has(profile.id)) return false;
    seen.add(profile.id);
    return true;
  });
}

function makeLocalProfile(name = '', groupId = '', id = null) {
  const profileId = id || (crypto.randomUUID ? crypto.randomUUID() : uid());
  const now = new Date().toISOString();
  return {
    id: profileId,
    displayName: String(name || '').trim(),
    lastGroupId: String(groupId || '').trim(),
    createdAt: now,
    updatedAt: now,
    lastJoinedAt: '',
    lastSyncedAt: ''
  };
}

function savePeopleProfiles() {
  peopleProfiles = uniqueProfiles(peopleProfiles);
  localStorage.setItem(PROFILE_STORAGE_KEY, JSON.stringify(peopleProfiles));
  if (activeProfileId) localStorage.setItem(ACTIVE_PROFILE_STORAGE_KEY, activeProfileId);
}

function getActiveProfile() {
  return peopleProfiles.find(profile => profile.id === activeProfileId) || peopleProfiles[0] || null;
}

function loadPeopleProfiles() {
  const savedProfiles = uniqueProfiles(safeJsonParse(localStorage.getItem(PROFILE_STORAGE_KEY), []));
  const legacyId = localStorage.getItem('mushroom_live_user_id');
  const legacyName = localStorage.getItem('mushroom_live_name') || '';
  const legacyGroup = localStorage.getItem('mushroom_live_group_id') || '';
  peopleProfiles = savedProfiles;

  if (!peopleProfiles.length) {
    peopleProfiles.push(makeLocalProfile(legacyName, legacyGroup, legacyId));
  } else if (legacyId && !peopleProfiles.some(profile => profile.id === legacyId)) {
    peopleProfiles.push(makeLocalProfile(legacyName, legacyGroup, legacyId));
  }

  activeProfileId = localStorage.getItem(ACTIVE_PROFILE_STORAGE_KEY) || legacyId || peopleProfiles[0]?.id || null;
  if (!peopleProfiles.some(profile => profile.id === activeProfileId)) activeProfileId = peopleProfiles[0]?.id || null;
  savePeopleProfiles();
  ensureUserId();
  return peopleProfiles;
}

function updateActiveProfileFromInputs() {
  const profile = getActiveProfile();
  if (!profile) return null;
  const name = $('liveName')?.value?.trim() || profile.displayName || '';
  const group = $('groupId')?.value?.trim() || '';
  if (name) profile.displayName = name;
  profile.lastGroupId = group;
  profile.updatedAt = new Date().toISOString();
  savePeopleProfiles();
  localStorage.setItem('mushroom_live_user_id', profile.id);
  localStorage.setItem('mushroom_live_name', profile.displayName || '');
  localStorage.setItem('mushroom_live_group_id', group);
  return profile;
}

function applyProfileToInputs(profile, keepCurrentGroup = false) {
  if (!profile) return;
  if ($('liveName')) $('liveName').value = profile.displayName || '';
  if ($('groupId') && !keepCurrentGroup) $('groupId').value = profile.lastGroupId || '';
  localStorage.setItem('mushroom_live_user_id', profile.id);
  localStorage.setItem('mushroom_live_name', profile.displayName || '');
  localStorage.setItem('mushroom_live_group_id', $('groupId')?.value?.trim() || profile.lastGroupId || '');
}

function clearGroupInviteFromUrl() {
  try {
    const url = new URL(window.location.href);
    if (!url.searchParams.has('group')) return;
    url.searchParams.delete('group');
    const next = `${url.pathname}${url.search}${url.hash}`;
    window.history.replaceState(window.history.state, '', next || './');
  } catch (err) {
    console.warn('Could not clear group invite URL', err);
  }
}

function clearPersistedGroupSelection() {
  if ($('groupId')) $('groupId').value = '';
  localStorage.removeItem('mushroom_live_group_id');
  const profile = getActiveProfile();
  if (profile) {
    profile.lastGroupId = '';
    profile.updatedAt = new Date().toISOString();
    savePeopleProfiles();
  }
  clearGroupInviteFromUrl();
  renderPeopleProfiles();
}

function resetRuntimeGroupSession() {
  liveEnabled = false;
  groupJoined = false;
  clearInterval(liveTimer);
  clearInterval(friendsTimer);
  liveTimer = null;
  friendsTimer = null;
  clearFriendMarkers();
  stopChatAutoRefresh(true);
  setMemberSyncPending(false, 'local session reset');
}

function switchActiveProfile(profileId, options = {}) {
  const profile = peopleProfiles.find(item => item.id === profileId);
  if (!profile) return false;
  const keepCurrentGroup = Boolean(options.keepCurrentGroup);
  const shouldJoin = Boolean(options.joinAfterSwitch);
  if (profile.id !== activeProfileId) resetRuntimeGroupSession();
  activeProfileId = profile.id;
  userId = profile.id;
  savePeopleProfiles();
  applyProfileToInputs(profile, keepCurrentGroup);
  renderPeopleProfiles();
  updateLiveUi();
  if (shouldJoin && currentGroupId()) joinGroup(false).catch(err => alert(`Ошибка входа: ${err.message}`));
  return true;
}

function renderPeopleProfiles() {
  const wrap = $('peopleProfiles');
  const hint = $('peopleHint');
  const active = getActiveProfile();
  if (!wrap) return;
  wrap.innerHTML = '';

  for (const profile of peopleProfiles) {
    const btn = document.createElement('button');
    btn.type = 'button';
    btn.className = profile.id === activeProfileId ? 'profile-chip active' : 'profile-chip secondary';
    btn.textContent = `${profile.id === activeProfileId ? '✓ ' : ''}${profile.displayName || 'Без имени'}`;
    btn.title = profile.lastGroupId ? `Последняя группа: ${profile.lastGroupId}` : 'Локальный профиль на этом устройстве';
    btn.onclick = withButtonDiagnostics('profileQuickLoginBtn', () => switchActiveProfile(profile.id, { keepCurrentGroup: true, joinAfterSwitch: Boolean(currentGroupId()) }));
    wrap.appendChild(btn);
  }

  if (hint) {
    if (active) {
      const group = active.lastGroupId || currentGroupId() || '—';
      hint.textContent = `Локально запомнен: ${active.displayName || 'Без имени'}. Последняя группа: ${group}. В лесу вход открывается локально сразу, а запись участника синхронизируется при связи.`;
    } else {
      hint.textContent = 'Локальный человек ещё не создан.';
    }
  }
  const saveBtn = $('savePersonProfileBtn');
  if (saveBtn) saveBtn.disabled = !($('liveName')?.value?.trim());
}

function saveCurrentPersonProfile() {
  const name = $('liveName')?.value?.trim();
  if (!name) { markButtonBlocked('пустое имя'); alert('Сначала укажи имя.'); return false; }
  const profile = updateActiveProfileFromInputs();
  renderPeopleProfiles();
  $('liveHint').textContent = `Локальный человек сохранён: ${profile.displayName}.`;
  return true;
}

function createNewPersonProfile() {
  const typed = prompt('Имя нового человека на этом телефоне:', '');
  const name = String(typed || '').trim();
  if (!name) { markButtonCancelled('новый человек не создан'); return false; }
  resetRuntimeGroupSession();
  const profile = makeLocalProfile(name, currentGroupId());
  peopleProfiles.push(profile);
  activeProfileId = profile.id;
  userId = profile.id;
  savePeopleProfiles();
  applyProfileToInputs(profile, true);
  renderPeopleProfiles();
  updateLiveUi();
  $('liveHint').textContent = `Создан локальный человек: ${name}. Нажми “Войти как ${name}”, чтобы записать его в группу.`;
  return true;
}

function groupMembersCacheKey(group) {
  return `${GROUP_MEMBERS_CACHE_PREFIX}${encodeURIComponent(group || '')}`;
}

function normalizeMemberForCache(member) {
  if (!member || !member.user_id) return null;
  return {
    group_id: member.group_id || currentGroupId(),
    user_id: member.user_id,
    display_name: member.display_name || member.user_name || 'Без имени',
    is_live: Boolean(member.is_live),
    last_seen_at: member.last_seen_at || member.updated_at || new Date().toISOString(),
    updated_at: member.updated_at || member.last_seen_at || new Date().toISOString(),
    cache_only: Boolean(member.cache_only)
  };
}

function selfMemberRow() {
  const now = new Date().toISOString();
  return normalizeMemberForCache({
    group_id: currentGroupId(),
    user_id: ensureUserId(),
    display_name: currentChatName(),
    is_live: Boolean(liveEnabled),
    last_seen_at: now,
    updated_at: now
  });
}

function saveGroupMembersCache(group, data = {}) {
  if (!group) return;
  const byId = new Map();
  for (const member of data.members || []) {
    const normalized = normalizeMemberForCache(member);
    if (normalized) byId.set(normalized.user_id, normalized);
  }
  for (const loc of data.locations || []) {
    if (!loc?.user_id || byId.has(loc.user_id)) continue;
    const normalized = normalizeMemberForCache({
      group_id: group,
      user_id: loc.user_id,
      display_name: loc.user_name || 'Без имени',
      is_live: true,
      last_seen_at: loc.updated_at,
      updated_at: loc.updated_at,
      cache_only: true
    });
    if (normalized) byId.set(normalized.user_id, normalized);
  }
  const self = selfMemberRow();
  if (self) byId.set(self.user_id, self);
  const snapshot = { groupId: group, cachedAt: new Date().toISOString(), members: Array.from(byId.values()) };
  localStorage.setItem(groupMembersCacheKey(group), JSON.stringify(snapshot));
}

function loadGroupMembersCache(group) {
  const snapshot = safeJsonParse(localStorage.getItem(groupMembersCacheKey(group)), null);
  if (!snapshot || !Array.isArray(snapshot.members)) return null;
  return snapshot;
}

function mergeSelfIntoGroupCache(group) {
  if (!group) return;
  const snapshot = loadGroupMembersCache(group) || { groupId: group, cachedAt: new Date().toISOString(), members: [] };
  const byId = new Map(snapshot.members.map(member => [member.user_id, member]));
  const self = selfMemberRow();
  if (self) byId.set(self.user_id, self);
  snapshot.members = Array.from(byId.values());
  snapshot.cachedAt = new Date().toISOString();
  localStorage.setItem(groupMembersCacheKey(group), JSON.stringify(snapshot));
}

function renderCachedFriends(group, reason = '') {
  const snapshot = loadGroupMembersCache(group);
  if (!snapshot) return false;
  renderFriends({ locations: [], members: snapshot.members, fromCache: true, cachedAt: snapshot.cachedAt });
  if (reason) $('liveHint').textContent = `Показаны участники из кэша (${fmtDate(snapshot.cachedAt)}). ${reason}`;
  return true;
}

function setMemberSyncPending(pending, reason = '') {
  memberSyncPending = Boolean(pending);
  if (memberSyncPending) {
    localStorage.setItem(MEMBER_SYNC_PENDING_KEY, JSON.stringify({
      groupId: currentGroupId(),
      userId: ensureUserId(),
      displayName: currentChatName(),
      isLive: Boolean(liveEnabled),
      reason,
      updatedAt: new Date().toISOString()
    }));
  } else {
    localStorage.removeItem(MEMBER_SYNC_PENDING_KEY);
  }
  updateLiveUi();
}

function restoreMemberSyncPending() {
  const pending = safeJsonParse(localStorage.getItem(MEMBER_SYNC_PENDING_KEY), null);
  memberSyncPending = Boolean(pending && pending.groupId && pending.userId);
}

function handleMemberSyncFailure(err) {
  const message = err?.message || String(err || 'ошибка синхронизации');
  setMemberSyncPending(true, message);
  scheduleMemberSyncRetry();
  return message;
}

function scheduleMemberSyncRetry() {
  clearInterval(memberSyncTimer);
  memberSyncTimer = setInterval(() => retryMemberSync('timer').catch(console.warn), MEMBER_SYNC_RETRY_MS);
}

async function retryMemberSync(reason = 'manual') {
  if (!memberSyncPending || !groupJoined || !currentGroupId() || !getSupabaseConfig()) return false;
  if (navigator.onLine === false) return false;
  try {
    await upsertGroupMember(liveEnabled);
    $('liveHint').textContent = reason === 'online'
      ? 'Связь вернулась: имя участника синхронизировано.'
      : 'Имя участника синхронизировано.';
    await refreshFriends();
    return true;
  } catch (err) {
    handleMemberSyncFailure(err);
    return false;
  }
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


function markButtonBlocked(detail) {
  if (activeButtonDiagnostics) setButtonApiStatus(activeButtonDiagnostics, 'заблокировано', detail);
}

function markButtonCancelled(detail) {
  if (activeButtonDiagnostics) setButtonApiStatus(activeButtonDiagnostics, 'отменено', detail);
}


function cacheBustUrl() {
  const url = new URL(window.location.href);
  url.searchParams.set('app_reload', String(Date.now()));
  url.searchParams.set('app_version', APP_VERSION);
  return url.toString();
}

async function deleteVisibleCacheStorage() {
  const deletedCaches = [];
  if (!('caches' in window)) {
    setButtonApiStatus(activeButtonDiagnostics || 'resetAppCacheBtn', 'заблокировано', 'Cache API не поддерживается');
    return deletedCaches;
  }

  const keys = await caches.keys();
  for (const key of keys) {
    const deleted = await caches.delete(key);
    deletedCaches.push(`${key}:${deleted ? 'deleted' : 'not-deleted'}`);
  }
  return deletedCaches;
}

async function unregisterVisibleServiceWorkers() {
  const unregisteredWorkers = [];
  if (!('serviceWorker' in navigator)) {
    setButtonApiStatus(activeButtonDiagnostics || 'resetAppCacheBtn', 'заблокировано', 'кэш приложения не поддерживается');
    return unregisteredWorkers;
  }

  const regs = await navigator.serviceWorker.getRegistrations();
  for (const reg of regs) {
    try {
      if (reg.active) reg.active.postMessage({ type: 'MUSHROOM_CLEAR_APP_CACHE', version: APP_VERSION });
      if (reg.waiting) reg.waiting.postMessage({ type: 'MUSHROOM_CLEAR_APP_CACHE', version: APP_VERSION });
      if (typeof reg.update === 'function') await reg.update().catch(() => null);
      const ok = await reg.unregister();
      unregisteredWorkers.push(`${reg.scope}:${ok ? 'unregistered' : 'not-unregistered'}`);
    } catch (err) {
      unregisteredWorkers.push(`${reg.scope}:error:${err.message}`);
    }
  }
  return unregisteredWorkers;
}

async function resetAppCache() {
  const ok = confirm('Сбросить кэш приложения и перезагрузить страницу?\n\nЛокальные грибные точки, фото, имя, ID группы и backup-настройки останутся. Будет удалён только кэш приложения и регистрация service worker. Если Android PWA держит старую версию, после перезагрузки закрой и открой приложение ещё раз.');
  if (!ok) { markButtonCancelled('сброс кэша отменён пользователем'); return; }

  setDisabled('resetAppCacheBtn', true);
  setButtonApiStatus(activeButtonDiagnostics || 'resetAppCacheBtn', 'pending', 'удаляю кэш приложения');

  const reloadUrl = cacheBustUrl();
  const resetMarker = { requestedAt: new Date().toISOString(), targetVersion: APP_VERSION, reloadUrl };

  let deletedCaches = [];
  let unregisteredWorkers = [];
  try {
    localStorage.setItem(APP_CACHE_RESET_MARKER_KEY, JSON.stringify(resetMarker));
  } catch (_) {}

  try {
    deletedCaches = await deleteVisibleCacheStorage();
    unregisteredWorkers = await unregisterVisibleServiceWorkers();

    // Give Android WebView/standalone PWA a short moment to detach the old controller.
    await new Promise((resolve) => setTimeout(resolve, 700));

    const cacheDetail = deletedCaches.length ? `${deletedCaches.length} cache(s)` : 'cache отсутствует';
    const swDetail = unregisteredWorkers.length ? `${unregisteredWorkers.length} SW` : 'SW отсутствует';
    setButtonApiStatus(activeButtonDiagnostics || 'resetAppCacheBtn', 'готово', `${cacheDetail}, ${swDetail}; перезагрузка без кэша`);
    recordMapDebug('app cache reset requested', { deletedCaches, unregisteredWorkers, reloadUrl });

    // Location query busts the document; versioned script/link URLs bust app.js/styles.css/manifest.
    window.location.replace(reloadUrl);
  } catch (err) {
    setDisabled('resetAppCacheBtn', false);
    setButtonApiStatus(activeButtonDiagnostics || 'resetAppCacheBtn', 'ошибка', err.message);
    recordMapDebug('app cache reset failed', { error: err.message, deletedCaches, unregisteredWorkers });
    alert(`Не удалось полностью сбросить кэш: ${err.message}`);
  }
}

function setDisabled(id, disabled) {
  const el = $(id);
  if (el) el.disabled = Boolean(disabled);
}

function setHidden(id, hidden) {
  const el = $(id);
  if (el) el.hidden = Boolean(hidden);
}

function setText(id, text) {
  const el = $(id);
  if (el) el.textContent = text;
}

function waitForMs(ms) {
  return new Promise((resolve) => setTimeout(resolve, ms));
}

function showAppToast(message, mode = 'info') {
  const toast = $('appToast');
  if (!toast) return;
  toast.textContent = String(message || '');
  toast.className = `app-toast ${mode || 'info'}`.trim();
  toast.hidden = false;
  if (appToastTimer) clearTimeout(appToastTimer);
  appToastTimer = setTimeout(() => {
    toast.hidden = true;
  }, 3200);
}

function closeDialogSafely(id) {
  const dialog = $(id);
  if (dialog && typeof dialog.close === 'function' && dialog.open) dialog.close();
}

function showDialogSafely(id) {
  const dialog = $(id);
  if (!dialog) return;
  if (typeof dialog.showModal === 'function') {
    if (!dialog.open) dialog.showModal();
  } else {
    dialog.hidden = false;
  }
}

function closeOfflineImportDialogs() {
  closeDialogSafely('offlineImportNameDialog');
  closeDialogSafely('offlineDuplicateMapDialog');
  closeDialogSafely('offlineImportErrorDialog');
}

function offlineImportErrorMessage(errOrCode, fallback = 'Файл не удалось импортировать') {
  const message = typeof errOrCode === 'string' ? errOrCode : (errOrCode?.message || fallback);
  if (/QuotaExceededError|quota|storage quota|недостаточно места/i.test(message)) return 'Недостаточно места для сохранения карты.';
  if (/расширением \.pmtiles|не \.pmtiles/i.test(message)) return 'Это не .pmtiles файл.';
  if (/пустой/i.test(message)) return 'Файл пустой.';
  if (/слишком маленький/i.test(message)) return 'Файл слишком маленький для карты.';
  if (/не читается|read/i.test(message)) return 'Файл не удалось прочитать.';
  if (/не найден/i.test(message)) return 'Сохранённый файл карты не найден.';
  return message || fallback;
}

function showOfflineImportError(message, detail = '') {
  showAppToast('Файл не удалось импортировать', 'error');
  const text = $('offlineImportErrorText');
  if (text) text.textContent = detail ? `${message} ${detail}` : message;
  showDialogSafely('offlineImportErrorDialog');
}

function showOfflineImportNameDialog(record) {
  if (!record) return;
  pendingOfflineImportNameMapId = record.id;
  const input = $('offlineImportNameInput');
  const meta = $('offlineImportNameMeta');
  if (input) {
    input.value = record.title || String(record.fileName || '').replace(/\.pmtiles$/i, '') || 'Офлайн-карта';
    setTimeout(() => {
      try { input.focus(); input.select(); } catch (_) {}
    }, 0);
  }
  if (meta) meta.textContent = `${record.fileName || 'map.pmtiles'} · ${formatBytes(record.sizeBytes)}.`;
  showDialogSafely('offlineImportNameDialog');
}

async function showOfflineDuplicateMapDialog(file, existing) {
  pendingDuplicatePmtilesImport = { file, existingId: existing?.id || null };
  const text = $('offlineDuplicateMapText');
  if (text) text.textContent = `Файл ${file?.name || 'map.pmtiles'} уже есть в “Мои карты” как “${existing?.title || 'карта'}”.`;
  showAppToast('Карта уже добавлена', 'info');
  await waitForMs(OFFLINE_IMPORT_RESULT_MODAL_DELAY_MS);
  showDialogSafely('offlineDuplicateMapDialog');
}

function validatePmtilesImportFile(file) {
  if (!file) throw new Error('Файл не выбран.');
  if (!/\.pmtiles$/i.test(file.name || '')) throw new Error('Это не .pmtiles файл.');
  const size = Number(file.size || 0);
  if (size <= 0) throw new Error('Файл пустой.');
  if (size < 16) throw new Error('Файл слишком маленький для карты.');
  if (typeof file.arrayBuffer !== 'function') throw new Error('Файл не удалось прочитать.');
}

function setPillState(id, state) {
  const el = $(id);
  if (!el) return;
  el.classList.remove('warn', 'bad', 'on');
  if (state) el.classList.add(state);
}

function getSaveSpotTarget() {
  if (pickedMapPoint) {
    return {
      kind: 'picked',
      source: 'map-picked',
      position: pickedMapPoint,
      title: 'Выбрано место на карте',
      description: 'Это ещё не сохранённая точка. Нажми ☆ в карточке на карте, чтобы выбрать папку и заполнить поля.',
      pill: 'выбранное место',
      pillState: 'on',
      button: 'Сохранить выбранное место'
    };
  }
  if (currentPosition) {
    return {
      kind: 'gps',
      source: 'current-gps',
      position: currentPosition,
      title: 'Будет сохранено моё текущее место',
      description: 'GPS уже активен. Можно добавить название, тип, заметку или фото и сохранить точку.',
      pill: 'GPS готов',
      pillState: 'on',
      button: 'Сохранить моё место'
    };
  }
  return {
    kind: 'none',
    source: null,
    position: null,
    title: navigator.geolocation ? 'Выбери место или включи GPS' : 'GPS недоступен',
    description: navigator.geolocation
      ? 'Выбери точку на карте или включи GPS, чтобы сохранить текущую позицию.'
      : 'GPS недоступен. Можно сохранить выбранную точку на карте.',
    pill: navigator.geolocation ? 'нет точки' : 'GPS недоступен',
    pillState: 'warn',
    button: navigator.geolocation ? 'Включить GPS' : 'Выбери место на карте'
  };
}

function updateSaveSpotFlowUi() {
  const target = getSaveSpotTarget();
  setText('saveFlowTitle', target.title);
  setText('saveFlowDescription', target.description);
  setText('saveTargetPill', target.pill);
  setText('saveSpotBtn', target.button);
  setText('saveSpotActionHint', target.kind === 'none'
    ? 'Сначала нужна выбранная точка или GPS-позиция.'
    : 'Откроется окно сохранения с папкой и описанием.');
  setPillState('saveTargetPill', target.pillState);

  const coords = target.position
    ? `Координаты: ${fmtCoord(target.position.lat)}, ${fmtCoord(target.position.lon)}${target.position.accuracy != null ? ` · точность ${meters(target.position.accuracy)}` : ''}`
    : 'Координаты: —';
  setText('saveFlowCoords', coords);

  const state = $('saveFlowState');
  if (state) {
    state.classList.toggle('save-flow-ready', target.kind !== 'none');
    state.classList.toggle('save-flow-picked', target.kind === 'picked');
    state.classList.toggle('save-flow-waiting', target.kind === 'none');
  }
}


function updateActionButtonsUi() {
  const hasSupabase = Boolean(getSupabaseConfig());
  const hasGroup = Boolean(currentGroupId());
  const hasPosition = Boolean(currentPosition);
  const hasPickedMapPoint = Boolean(pickedMapPoint);
  const hasSelected = Boolean(selectedSpotId);
  const canUseChat = canSendSpotToChat();
  const canRequestGps = Boolean(navigator.geolocation);

  setDisabled('startTrackBtn', trackRecording.active || !canRequestGps);
  setDisabled('stopTrackBtn', !trackRecording.active);
  setDisabled('saveSpotBtn', !hasPickedMapPoint && !hasPosition && !canRequestGps);
  setDisabled('saveCurrentGpsOnlyBtn', !hasPosition);
  setDisabled('savePickedMapPointBtn', !hasPickedMapPoint);
  setDisabled('savePlaceDialogSaveBtn', !savePlaceDialogState?.position);
  setDisabled('sharePickedMapPointToChatBtn', !hasPickedMapPoint || !canUseChat);
  setDisabled('clearPickedMapPointBtn', !hasPickedMapPoint);
  setDisabled('averageBtn', !navigator.geolocation);
  setDisabled('centerMeBtn', !hasPosition && !navigator.geolocation);
  setDisabled('centerPmtilesOnMeBtn', !hasPosition && !navigator.geolocation);
  setDisabled('showSelectedSpotOnMapBtn', !hasSelected);
  const spotListEditing = Boolean(hasSelected && spotListEditorOpen);
  setDisabled('spotListShowOnMapBtn', !hasSelected || spotListEditing);
  setDisabled('navigateBtn', !hasSelected || !hasPosition);
  setDisabled('shareSpotBtn', !hasSelected);
  setDisabled('sendSelectedSpotToChatBtn', !hasSelected || !canUseChat);
  setDisabled('spotListSendToChatBtn', !hasSelected || spotListEditing || !canUseChat);
  setDisabled('saveResultShareBtn', !lastSavedSpotId || !canUseChat);
  setHidden('sendSelectedSpotToChatBtn', !canUseChat);
  setHidden('saveResultShareBtn', !canUseChat);
  setDisabled('spotListEditBtn', !hasSelected || spotListEditing);
  setDisabled('spotListDeleteBtn', !hasSelected || spotListEditing);
  setDisabled('spotListSaveEditBtn', !spotListEditing);
  setDisabled('spotListCancelEditBtn', !spotListEditing);
  setDisabled('spotListCloseDetailsBtn', !hasSelected || spotListEditing);
  renderSpotListDetailsState();
  setDisabled('copyBboxCommandBtn', !bboxExportState.command);
  setDisabled('clearBboxExportBtn', !bboxExportState.command && bboxExportState.mode === 'idle' && !bboxExportState.firstCorner);
  updateSaveSpotFlowUi();
  renderMapObjectPanel();

  if ($('joinGroupBtn')) $('joinGroupBtn').textContent = groupJoined ? 'В группе' : (currentChatName() !== 'Без имени' ? `Войти как ${currentChatName()}` : 'Войти в группу');
  setDisabled('copyInviteBtn', !hasGroup);
  setDisabled('joinGroupBtn', !hasSupabase || !hasGroup || groupJoined);
  setDisabled('leaveGroupBtn', !groupJoined);
  setDisabled('startLiveBtn', !hasSupabase || !hasGroup || liveEnabled);
  setDisabled('stopLiveBtn', !liveEnabled);
  setDisabled('refreshFriendsBtn', !hasSupabase || !hasGroup || !groupJoined);
  setDisabled('testSupabaseBtn', !hasSupabase);
  renderList();
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
  const provider = mapProviderSnapshot();
  const lines = [];
  lines.push('КАРТА / PROVIDER');
  lines.push(`- engine: ${provider.mapEngine}`);
  lines.push(`- provider: ${provider.mapProvider}`);
  lines.push(`- source status: ${provider.mapSourceStatus}`);
  lines.push(`- offline package: ${provider.offlinePackageStatus}`);
  lines.push(`- fallback active: ${provider.fallbackActive}`);
  lines.push(`- reason: ${provider.reason}`);
  if (provider.bboxExport) {
    lines.push(`- bbox export: ${provider.bboxExport.mode}`);
    if (provider.bboxExport.bounds) lines.push(`- bbox bounds: ${provider.bboxExport.bounds.join(',')}`);
    if (provider.bboxExport.command) lines.push(`- bbox command: ${provider.bboxExport.command.replace(/\n/g, ' ')}`);
    if (provider.bboxExport.error) lines.push(`- bbox error: ${provider.bboxExport.error}`);
  }
  lines.push(`- pmtiles runtime: ${provider.pmtilesRuntime.status}`);
  lines.push(`- pmtiles file: ${provider.pmtilesRuntime.packageFound ? 'found' : 'not-found/unchecked'}`);
  lines.push(`- pmtiles url: ${provider.pmtilesRuntime.url}`);
  lines.push(`- pmtiles local file: ${provider.localPmtilesFile.status === 'selected' ? `${provider.localPmtilesFile.name} / ${formatBytes(provider.localPmtilesFile.sizeBytes)}` : provider.localPmtilesFile.status}`);
  if (provider.rememberedPmtilesMaps) {
    lines.push(`- remembered maps: ${provider.rememberedPmtilesMaps.count || 0}`);
    if (provider.rememberedPmtilesMaps.selectedName) lines.push(`- remembered selected: ${provider.rememberedPmtilesMaps.selectedName}`);
  }
  if (provider.pmtilesRuntime.error) lines.push(`- pmtiles error: ${provider.pmtilesRuntime.error}`);
  if (provider.pmtilesRuntime.diagnostics) {
    const diag = provider.pmtilesRuntime.diagnostics;
    lines.push(`- pmtiles transport: ${diag.summary || diag.status || 'unknown'}`);
    if (diag.head) lines.push(`- pmtiles HEAD: ${diag.head.status || 'n/a'}${diag.head.error ? ` / ${diag.head.error}` : ''}`);
    if (diag.range) lines.push(`- pmtiles Range: ${diag.range.status || 'n/a'}${diag.range.bytes != null ? ` / ${diag.range.bytes} bytes` : ''}${diag.range.error ? ` / ${diag.range.error}` : ''}`);
    if (diag.hint) lines.push(`- pmtiles hint: ${diag.hint}`);
  }
  lines.push(`- список пакетов карт: ${provider.offlineMapManifest.status}`);
  lines.push(`- selected package: ${provider.offlineMapManifest.selectedPackageName || provider.offlineMapManifest.selectedPackageId || 'none'}`);
  if (provider.offlineRegionInstall) {
    lines.push(`- region install: ${provider.offlineRegionInstall.lastStatus || 'idle'}`);
    lines.push(`- region install bytes: ${provider.offlineRegionInstall.lastReceivedBytes || 0}${provider.offlineRegionInstall.lastTotalBytes ? ` / ${provider.offlineRegionInstall.lastTotalBytes}` : ''}`);
    lines.push(`- region install storage: ${provider.offlineRegionInstall.lastStorageType || 'none'}`);
    if (provider.offlineRegionInstall.lastError) lines.push(`- last install error: ${provider.offlineRegionInstall.lastError}`);
  }
  lines.push(`- pmtiles preview: ${provider.pmtilesPreview.status}`);
  if (provider.pmtilesPreview.userLayers) {
    const userLayers = provider.pmtilesPreview.userLayers;
    const c = userLayers.counts || {};
    lines.push(`- pmtiles user layers: ${userLayers.status}`);
    lines.push(`- pmtiles user counts: spots=${c.spots || 0}, selected=${c.selectedSpot || 0}, gps=${c.gps || 0}, picked=${c.picked || 0}, chat=${c.chat || 0}, live=${c.live || 0}`);
    if (userLayers.error) lines.push(`- pmtiles user layers error: ${userLayers.error}`);
  }
  if (provider.pmtilesPreview.styleName || provider.pmtilesPreview.styleMode) lines.push(`- pmtiles style: ${provider.pmtilesPreview.styleName || provider.pmtilesPreview.styleMode}`);
  if (provider.pmtilesPreview.appliedBounds) lines.push(`- pmtiles bounds: ${provider.pmtilesPreview.appliedBounds.join(',')}`);
  if (provider.pmtilesPreview.appliedCenter) lines.push(`- pmtiles center: ${provider.pmtilesPreview.appliedCenter.join(',')}`);
  if (provider.pmtilesPreview.appliedZoom != null) lines.push(`- pmtiles zoom: ${provider.pmtilesPreview.appliedZoom}`);
  if (provider.pmtilesPreview.viewportMode) lines.push(`- pmtiles viewport: ${provider.pmtilesPreview.viewportMode}`);
  if (provider.pmtilesPreview.focus) {
    lines.push(`- pmtiles focus: ${provider.pmtilesPreview.focus.status}${provider.pmtilesPreview.focus.target ? ` / ${provider.pmtilesPreview.focus.target}` : ''}`);
    if (provider.pmtilesPreview.focus.coords) lines.push(`- pmtiles focus coords: ${provider.pmtilesPreview.focus.coords.join(',')}`);
    if (provider.pmtilesPreview.focus.error) lines.push(`- pmtiles focus error: ${provider.pmtilesPreview.focus.error}`);
  }
  if (provider.pmtilesPreview.vectorLayers?.length) lines.push(`- pmtiles layers: ${provider.pmtilesPreview.vectorLayers.join(', ')}`);
  lines.push('');
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

function canUseMapRuntime() {
  return Boolean(map && window.L);
}

function isLeafletOfflineLiteRuntime() {
  return Boolean(window.L && window.L.__mushroomOfflineLite);
}

function resetMapTileStats(provider = mapProvider) {
  mapTileStats = {
    provider,
    loading: 0,
    load: 0,
    error: 0,
    lastError: null,
    lastTileUrl: null,
    startedAt: new Date().toISOString()
  };
}

function readOfflinePackageMeta() {
  offlinePackageMeta = safeJsonParse(localStorage.getItem(OFFLINE_MAP_PACKAGE_META_KEY), null);
  if (offlinePackageMeta && offlinePackageMeta.format === 'pmtiles') {
    offlinePackageStatus = offlinePackageMeta.runtime === 'maplibre-pmtiles-probe'
      ? 'metadata-ready-runtime-experimental'
      : 'metadata-present-runtime-not-enabled';
  } else {
    offlinePackageStatus = 'not-installed';
  }
  return offlinePackageMeta;
}

function mapProviderSnapshot() {
  return {
    mapEngine,
    mapProvider,
    mapProviderLabel: MAP_PROVIDER_LABELS[mapProvider] || mapProvider,
    mapSourceStatus,
    offlinePackageStatus,
    offlinePackageMeta: offlinePackageMeta ? {
      id: offlinePackageMeta.id || null,
      name: offlinePackageMeta.name || null,
      format: offlinePackageMeta.format || null,
      sizeBytes: offlinePackageMeta.sizeBytes || null,
      bbox: offlinePackageMeta.bbox || null,
      minZoom: offlinePackageMeta.minZoom || null,
      maxZoom: offlinePackageMeta.maxZoom || null,
      installedAt: offlinePackageMeta.installedAt || null,
      source: offlinePackageMeta.source || null
    } : null,
    fallbackActive: mapFallbackActive,
    bboxExport: getBboxExportSnapshot(),
    pmtilesRuntime: {
      url: pmtilesRuntimeProbe.url,
      status: pmtilesRuntimeProbe.status,
      maplibreLoaded: pmtilesRuntimeProbe.maplibreLoaded,
      pmtilesLoaded: pmtilesRuntimeProbe.pmtilesLoaded,
      webgl: pmtilesRuntimeProbe.webgl,
      protocolRegistered: pmtilesRuntimeProbe.protocolRegistered,
      packageFound: pmtilesRuntimeProbe.packageFound,
      header: pmtilesRuntimeProbe.header,
      metadata: pmtilesRuntimeProbe.metadata,
      error: pmtilesRuntimeProbe.error,
      diagnostics: pmtilesRuntimeProbe.diagnostics,
      checkedAt: pmtilesRuntimeProbe.checkedAt
    },
    localPmtilesFile: getLocalPmtilesFileSnapshot(),
    rememberedPmtilesMaps: getRememberedPmtilesMapsSnapshot(),
    pmtilesPreview: {
      status: pmtilesPreviewState.status,
      visible: pmtilesPreviewState.visible,
      sourceUrl: pmtilesPreviewState.sourceUrl,
      styleMode: pmtilesPreviewState.styleMode,
      error: pmtilesPreviewState.error,
      loadedAt: pmtilesPreviewState.loadedAt,
      lastEvent: pmtilesPreviewState.lastEvent,
      styleName: pmtilesPreviewState.styleName,
      appliedBounds: pmtilesPreviewState.appliedBounds,
      appliedCenter: pmtilesPreviewState.appliedCenter,
      appliedZoom: pmtilesPreviewState.appliedZoom,
      viewportMode: pmtilesPreviewState.viewportMode,
      vectorLayers: pmtilesPreviewState.vectorLayers,
      userLayers: {
        status: pmtilesPreviewUserLayerState.status,
        counts: pmtilesPreviewUserLayerState.counts,
        updatedAt: pmtilesPreviewUserLayerState.updatedAt,
        error: pmtilesPreviewUserLayerState.error
      },
      focus: {
        status: pmtilesPreviewFocusState.status,
        target: pmtilesPreviewFocusState.target,
        coords: pmtilesPreviewFocusState.coords,
        zoom: pmtilesPreviewFocusState.zoom,
        updatedAt: pmtilesPreviewFocusState.updatedAt,
        error: pmtilesPreviewFocusState.error,
        reason: pmtilesPreviewFocusState.reason
      }
    },
    offlineMapManifest: getOfflineMapManifestSnapshot(),
    offlineRegionInstall: getOfflineRegionInstallSnapshot(),
    changedAt: mapProviderChangedAt,
    reason: mapProviderLastReason
  };
}

function setMapProviderState(patch = {}, reason = 'state update') {
  if (patch.mapEngine !== undefined) mapEngine = patch.mapEngine;
  if (patch.mapProvider !== undefined) mapProvider = patch.mapProvider;
  if (patch.mapSourceStatus !== undefined) mapSourceStatus = patch.mapSourceStatus;
  if (patch.offlinePackageStatus !== undefined) offlinePackageStatus = patch.offlinePackageStatus;
  if (patch.fallbackActive !== undefined) mapFallbackActive = Boolean(patch.fallbackActive);
  mapProviderLastReason = reason;
  mapProviderChangedAt = new Date().toISOString();
  recordMapDebug(`map provider: ${reason}`, mapProviderSnapshot());
}

function setOfflineMapStatus(text, mode = '') {
  const pill = $('offlineMapStatusPill');
  if (!pill) return;
  pill.textContent = text;
  pill.className = `pill ${mode}`.trim();
}

function updateOfflineMapStatusPill() {
  if (offlinePackageStatus === 'not-installed') {
    setOfflineMapStatus('Файл офлайн-карты не выбран', 'warn');
  } else if (offlinePackageStatus === 'metadata-present-runtime-not-enabled') {
    setOfflineMapStatus('Файл офлайн-карты найден, предпросмотр ещё не готов', 'warn');
  } else if (offlinePackageStatus === 'metadata-ready-runtime-experimental') {
    setOfflineMapStatus('Файл офлайн-карты найден, рендер экспериментальный', 'warn');
  } else if (offlinePackageStatus === 'preview-ready-runtime-experimental') {
    setOfflineMapStatus('Предпросмотр офлайн-карты готов', 'on');
  } else if (offlinePackageStatus === 'ready') {
    setOfflineMapStatus('Карта: файл офлайн-карты готов', 'on');
  } else {
    setOfflineMapStatus(`Офлайн-карта: ${offlinePackageStatus}`, 'warn');
  }
}

function setPmtilesRuntimeStatus(text, mode = '') {
  const pill = $('pmtilesRuntimeStatusPill');
  if (!pill) return;
  pill.textContent = text;
  pill.className = `pill ${mode}`.trim();
}

function updatePmtilesRuntimeStatusPill() {
  const status = pmtilesRuntimeProbe.status;
  if (offlinePackageStatus === 'preview-ready-runtime-experimental' && pmtilesPreviewState.status === 'loaded') {
    setPmtilesRuntimeStatus('Файл карты: preview отрисован', 'on');
  } else if (status === 'ready') {
    setPmtilesRuntimeStatus('Файл карты: пакет читается', 'on');
  } else if (status === 'maplibre-ready-no-package') {
    setPmtilesRuntimeStatus('Файл карты: модуль готов, файл не найден', 'warn');
  } else if (status === 'not-run') {
    setPmtilesRuntimeStatus('Файл карты: не проверен', 'warn');
  } else if (status === 'loading-runtime' || status === 'checking-package' || status === 'starting-maplibre' || status === 'starting-maplibre-preview') {
    setPmtilesRuntimeStatus('Файл карты: проверка…', 'warn');
  } else if (status === 'runtime-failed' || status === 'package-error' || status === 'maplibre-failed') {
    setPmtilesRuntimeStatus('Файл карты: ошибка проверки', 'bad');
  } else {
    setPmtilesRuntimeStatus(`Файл карты: ${status}`, 'warn');
  }
}

function createOnlineRasterLayer() {
  return L.tileLayer('https://{s}.basemaps.cartocdn.com/rastertiles/voyager/{z}/{x}/{y}{r}.png', {
    maxZoom: 20,
    minZoom: 2,
    subdomains: 'abcd',
    tileSize: 256,
    updateWhenIdle: false,
    updateWhenZooming: true,
    keepBuffer: 4,
    detectRetina: false,
    attribution: '&copy; <a href="https://www.openstreetmap.org/copyright">OpenStreetMap</a> contributors &copy; <a href="https://carto.com/attributions">CARTO</a>'
  });
}

function setCurrentPmtilesProbeButtonStatus(status, detail) {
  if (activeButtonDiagnostics && activeButtonDiagnostics.buttonId === 'probePmtilesBtn') {
    setButtonApiStatus(activeButtonDiagnostics, status, detail);
  }
}

function setPmtilesProbeState(patch = {}, reason = 'pmtiles probe update') {
  pmtilesRuntimeProbe = {
    ...pmtilesRuntimeProbe,
    ...patch,
    checkedAt: new Date().toISOString()
  };
  recordMapDebug(reason, { pmtilesRuntime: pmtilesRuntimeProbe });
  updatePmtilesRuntimeStatusPill();
  renderPmtilesProbeDetails();
}

function setPmtilesPreviewState(patch = {}, reason = 'pmtiles preview update') {
  pmtilesPreviewState = {
    ...pmtilesPreviewState,
    ...patch,
    lastEvent: reason
  };
  recordMapDebug(reason, { pmtilesPreview: pmtilesPreviewState });
  updatePmtilesRuntimeStatusPill();
  updatePmtilesPreviewUi();
}

function setPmtilesPreviewUserLayerState(patch = {}, reason = 'pmtiles preview user layers update') {
  pmtilesPreviewUserLayerState = {
    ...pmtilesPreviewUserLayerState,
    ...patch,
    updatedAt: new Date().toISOString()
  };
  recordMapDebug(reason, { pmtilesPreviewUserLayers: pmtilesPreviewUserLayerState });
  updatePmtilesPreviewUi();
}

function setPmtilesPreviewFocusState(patch = {}, reason = 'pmtiles preview focus update') {
  pmtilesPreviewFocusState = {
    ...pmtilesPreviewFocusState,
    ...patch,
    updatedAt: new Date().toISOString(),
    reason
  };
  recordMapDebug(reason, { pmtilesPreviewFocus: pmtilesPreviewFocusState });
  updatePmtilesPreviewUi();
  updatePmtilesPreviewFocusUi();
}

function setCurrentPmtilesPreviewButtonStatus(status, detail) {
  if (activeButtonDiagnostics && activeButtonDiagnostics.buttonId === 'previewPmtilesBtn') {
    setButtonApiStatus(activeButtonDiagnostics, status, detail);
  }
}

function updatePmtilesPreviewUi() {
  const panel = $('pmtilesPreviewPanel');
  const statusEl = $('pmtilesPreviewStatus');
  if (!panel || !statusEl) return;

  const hasOfflineMaps = (rememberedPmtilesMapsState.maps || []).length > 0;
  panel.hidden = !hasOfflineMaps || !pmtilesPreviewState.visible;

  if (pmtilesPreviewState.status === 'loaded') {
    const styleText = pmtilesPreviewState.styleName ? ` · style: ${pmtilesPreviewState.styleName}` : '';
    const boundsText = pmtilesPreviewState.appliedBounds ? ` · bounds: ${pmtilesPreviewState.appliedBounds.join(',')}` : '';
    const c = pmtilesPreviewUserLayerState.counts || {};
    const userText = pmtilesPreviewUserLayerState.status === 'rendered'
      ? ` · слои: точки ${c.spots || 0}, маршруты ${c.tracks || 0}${c.activeTrack ? ' + запись' : ''}, GPS ${c.gps || 0}, выбор ${c.picked || 0}, чат ${c.chat || 0}, друзья ${c.live || 0}`
      : '';
    const focusText = pmtilesPreviewFocusState.status === 'focused' && pmtilesPreviewFocusState.target
      ? ` · фокус: ${pmtilesPreviewFocusState.target}`
      : '';
    statusEl.textContent = `Предпросмотр офлайн-карты: выбранный файл карты открыт (${getActivePmtilesPackageName()})${styleText}${boundsText}${userText}${focusText}. Нажми на карту, чтобы выбрать место, или используй “Ко мне”.`;
  } else if (pmtilesPreviewState.status === 'loading') {
    statusEl.textContent = 'Предпросмотр офлайн-карты: загрузка модуля предпросмотра и подключение файла…';
  } else if (pmtilesPreviewState.status === 'source-loaded') {
    const layerText = pmtilesPreviewState.vectorLayers?.length ? ` Слои: ${pmtilesPreviewState.vectorLayers.slice(0, 8).join(', ')}.` : '';
    statusEl.textContent = `Предпросмотр офлайн-карты: источник подключён, применяем стиль и границы региона…${layerText}`;
  } else if (pmtilesPreviewState.status === 'metadata-only') {
    statusEl.textContent = `Предпросмотр офлайн-карты: файл ${getActivePmtilesPackageName()} читается, но это не raster-пакет для текущего preview. Нужен отдельный vector-style спринт.`;
  } else if (pmtilesPreviewState.status === 'error') {
    statusEl.textContent = `Предпросмотр офлайн-карты: ошибка — ${pmtilesPreviewState.error || 'неизвестная ошибка'}`;
  } else {
    statusEl.textContent = 'Предпросмотр офлайн-карты: не запускался.';
  }
  updateOfflinePickedPointUi();
}

function updatePmtilesPreviewFocusUi() {
  const el = $('pmtilesPreviewFocusStatus');
  if (!el) return;
  if (pmtilesPreviewFocusState.status === 'focused') {
    const coords = pmtilesPreviewFocusState.coords
      ? `${Number(pmtilesPreviewFocusState.coords[1]).toFixed(6)}, ${Number(pmtilesPreviewFocusState.coords[0]).toFixed(6)}`
      : 'координаты неизвестны';
    el.textContent = `Фокус офлайн-карты: ${pmtilesPreviewFocusState.target || 'точка'} · ${coords} · zoom ${pmtilesPreviewFocusState.zoom || '—'}.`;
  } else if (pmtilesPreviewFocusState.status === 'pending') {
    el.textContent = 'Фокус офлайн-карты: запрашиваю GPS / запускаю предпросмотр…';
  } else if (pmtilesPreviewFocusState.status === 'error') {
    el.textContent = `Фокус офлайн-карты: ошибка — ${pmtilesPreviewFocusState.error || 'неизвестная ошибка'}`;
  } else {
    el.textContent = 'Фокус офлайн-карты: не выполнялся.';
  }
}

function getAbsolutePmtilesUrl(url = PMTILES_DEFAULT_URL) {
  return new URL(url, window.location.href).href;
}

function registerPmtilesArchiveForUrl(url = PMTILES_DEFAULT_URL) {
  if (!window.pmtiles || !window.pmtiles.PMTiles || !pmtilesProtocol) return null;
  const absoluteUrl = getAbsolutePmtilesUrl(url);
  const archive = new window.pmtiles.PMTiles(absoluteUrl);
  if (typeof pmtilesProtocol.add === 'function') {
    try { pmtilesProtocol.add(archive); } catch (err) { recordMapDebug('PMTiles protocol add failed', err?.message || String(err)); }
  }
  return { archive, absoluteUrl, protocolUrl: `pmtiles://${absoluteUrl}` };
}

function isLocalPmtilesPackage(pkg = null) {
  return Boolean(pkg && String(pkg.sourceType || '').startsWith('local-file-') && pkg.fileRef === true);
}

function isPersistentPmtilesPackage(pkg = null) {
  const sourceType = String(pkg?.sourceType || '');
  return Boolean(pkg && pkg.fileRef === true && (sourceType === 'local-file-opfs' || sourceType === 'local-file-idb'));
}

function getLocalPmtilesFileSnapshot() {
  return {
    status: localPmtilesFileState.status,
    storageType: localPmtilesFileState.storageType,
    storageName: localPmtilesFileState.storageName,
    persistent: Boolean(localPmtilesFileState.persistent),
    packageId: localPmtilesFileState.packageId,
    key: localPmtilesFileState.key,
    name: localPmtilesFileState.name,
    customName: localPmtilesFileState.customName,
    rememberedId: localPmtilesFileState.rememberedId,
    fingerprint: localPmtilesFileState.fingerprint,
    sizeBytes: localPmtilesFileState.sizeBytes,
    lastModified: localPmtilesFileState.lastModified,
    selectedAt: localPmtilesFileState.selectedAt,
    error: localPmtilesFileState.error
  };
}

function hasOpfsStorage() {
  return Boolean(navigator.storage && typeof navigator.storage.getDirectory === 'function');
}

function sanitizeOfflineMapStorageName(value = 'map.pmtiles') {
  const safe = String(value || 'map.pmtiles')
    .trim()
    .replace(/[^a-zA-Z0-9._-]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 96);
  return safe || 'map.pmtiles';
}

async function getOfflineMapsOpfsDirectory(create = true) {
  if (!hasOpfsStorage()) throw new Error('OPFS недоступен в этом браузере');
  const root = await navigator.storage.getDirectory();
  return root.getDirectoryHandle(OPFS_OFFLINE_MAPS_DIR, { create });
}

async function fileToArrayBuffer(file) {
  if (!file || typeof file.arrayBuffer !== 'function') throw new Error('Файл офлайн-карты не читается браузером');
  return file.arrayBuffer();
}

async function writePmtilesFileToOpfs(file, storageName) {
  const dir = await getOfflineMapsOpfsDirectory(true);
  const handle = await dir.getFileHandle(storageName, { create: true });
  const writable = await handle.createWritable();
  try {
    const bytes = await fileToArrayBuffer(file);
    await writable.write(bytes);
  } finally {
    await writable.close();
  }
  return { storageType: 'opfs', storageName };
}

async function readPmtilesFileFromOpfs(storageName) {
  const dir = await getOfflineMapsOpfsDirectory(false);
  const handle = await dir.getFileHandle(storageName, { create: false });
  return handle.getFile();
}

async function deletePmtilesFileFromOpfs(storageName) {
  if (!storageName || !hasOpfsStorage()) return false;
  try {
    const dir = await getOfflineMapsOpfsDirectory(false);
    await dir.removeEntry(storageName);
    return true;
  } catch (err) {
    recordMapDebug('OPFS PMTiles delete skipped/failed', err?.message || String(err));
    return false;
  }
}

async function putPmtilesFileBlobToIndexedDb(file, storageName) {
  const bytes = await fileToArrayBuffer(file);
  await putStoreValue(OFFLINE_MAP_FILES_STORE, {
    id: storageName,
    fileName: file.name || 'local.pmtiles',
    sizeBytes: file.size || bytes.byteLength || null,
    contentType: file.type || 'application/octet-stream',
    updatedAt: new Date().toISOString(),
    bytes
  });
  return { storageType: 'idb-blob', storageName };
}

async function readPmtilesFileBlobFromIndexedDb(storageName) {
  const record = await getStoreValue(OFFLINE_MAP_FILES_STORE, storageName);
  if (record?.bytes) return new Blob([record.bytes], { type: record.contentType || 'application/octet-stream' });
  if (record?.blob) return record.blob;
  throw new Error('Файл офлайн-карты не найден в IndexedDB');
}

async function deletePmtilesFileBlobFromIndexedDb(storageName) {
  if (!storageName) return false;
  return new Promise((resolve, reject) => {
    const req = store(OFFLINE_MAP_FILES_STORE, 'readwrite').delete(storageName);
    req.onsuccess = () => resolve(true);
    req.onerror = () => reject(req.error);
  });
}

async function persistPmtilesFile(file, preferredStorageName) {
  const storageName = preferredStorageName || `pmtiles-${Date.now()}-${sanitizeOfflineMapStorageName(file.name || 'map.pmtiles')}`;
  try {
    return await writePmtilesFileToOpfs(file, storageName);
  } catch (err) {
    recordMapDebug('OPFS PMTiles import unavailable, falling back to IndexedDB Blob', err?.message || String(err));
    return putPmtilesFileBlobToIndexedDb(file, storageName);
  }
}

async function verifyPersistedPmtilesFile(persisted) {
  const file = await readPersistedPmtilesFile(persisted);
  if (!file || Number(file.size || 0) <= 0) throw new Error('Файл сохранён, но не читается.');
  return file;
}

async function readPersistedPmtilesFile(recordOrPackage = {}) {
  const storageType = recordOrPackage.storageType || localPmtilesFileState.storageType;
  const storageName = recordOrPackage.storageName || localPmtilesFileState.storageName;
  if (!storageType || !storageName) throw new Error('У офлайн-карты нет сохранённого файла');
  if (storageType === 'opfs') return readPmtilesFileFromOpfs(storageName);
  if (storageType === 'idb-blob') return readPmtilesFileBlobFromIndexedDb(storageName);
  throw new Error(`Неизвестный тип хранения офлайн-карты: ${storageType}`);
}

async function deletePersistedPmtilesFile(record = {}) {
  if (!record?.storageName) return false;
  if (record.storageType === 'opfs') return deletePmtilesFileFromOpfs(record.storageName);
  if (record.storageType === 'idb-blob') return deletePmtilesFileBlobFromIndexedDb(record.storageName);
  return false;
}

function getOfflineRegionInstallEntry(packageId) {
  return offlineRegionInstallState.byPackageId[String(packageId || '')] || null;
}

function getLastOfflineRegionInstallEntry() {
  return getOfflineRegionInstallEntry(offlineRegionInstallState.lastPackageId);
}

function setOfflineRegionInstallState(packageId, patch = {}, reason = 'offline region install update') {
  const id = String(packageId || 'unknown-region');
  const previous = offlineRegionInstallState.byPackageId[id] || {
    packageId: id,
    status: 'not-installed',
    receivedBytes: 0,
    totalBytes: null,
    storageType: null,
    storageName: null,
    error: null,
    startedAt: null,
    updatedAt: null,
    finishedAt: null
  };
  const next = {
    ...previous,
    ...patch,
    packageId: id,
    updatedAt: new Date().toISOString()
  };
  offlineRegionInstallState = {
    byPackageId: {
      ...offlineRegionInstallState.byPackageId,
      [id]: next
    },
    lastPackageId: id
  };
  recordMapDebug(reason, next);
  renderOfflineRegionCatalogUi();
  updateMapDebugUi(false);
  return next;
}

function getOfflineRegionInstallSnapshot() {
  const entries = Object.values(offlineRegionInstallState.byPackageId || {})
    .sort((a, b) => String(b.updatedAt || '').localeCompare(String(a.updatedAt || '')));
  const last = getLastOfflineRegionInstallEntry();
  return {
    lastPackageId: offlineRegionInstallState.lastPackageId || null,
    lastStatus: last?.status || 'idle',
    lastReceivedBytes: last?.receivedBytes || 0,
    lastTotalBytes: last?.totalBytes || null,
    lastStorageType: last?.storageType || null,
    lastStorageName: last?.storageName || null,
    lastError: last?.error || null,
    entries
  };
}

function formatOfflineRegionInstallProgress(entry = null) {
  if (!entry) return '';
  const received = Number(entry.receivedBytes || 0);
  const total = Number(entry.totalBytes || 0);
  if (received <= 0 && total <= 0) return '';
  if (total > 0) {
    const percent = Math.max(0, Math.min(100, Math.floor((received / total) * 100)));
    return `${formatBytes(received)} из ${formatBytes(total)} / ${percent}%`;
  }
  return `${formatBytes(received)} скачано`;
}

function makeOfflineRegionPackageFingerprint(pkg = {}) {
  const id = String(pkg.id || '').trim().toLowerCase();
  const fileName = String(pkg.fileName || pkg.url?.split('/').pop() || 'region.pmtiles').trim().toLowerCase();
  const version = String(pkg.checksum || pkg.version || pkg.url || '').trim();
  const size = Number(pkg.sizeBytes || 0);
  return `catalog-pmtiles:${id}:${fileName}:${size}:${version}`;
}

function makeOfflineRegionStorageName(pkg = {}) {
  const id = sanitizeOfflineMapStorageName(pkg.id || 'region');
  const fileName = sanitizeOfflineMapStorageName(pkg.fileName || pkg.url?.split('/').pop() || `${id}.pmtiles`);
  return `catalog-${id}-${fileName}`;
}

function validateOfflineRegionInstallPrerequisites(pkg = {}) {
  if (!pkg?.url) throw Object.assign(new Error('У региона нет URL файла карты.'), { code: 'OFFLINE_REGION_NO_URL' });
  if (!hasOpfsStorage()) {
    throw Object.assign(new Error('Автоустановка больших карт требует OPFS. Скачай файл вручную и импортируй его через “Выбрать файл карты”.'), { code: 'OFFLINE_REGION_MANUAL_REQUIRED' });
  }
}

async function validatePersistedPmtilesHeader(persisted, packageInfo = null) {
  const file = await readPersistedPmtilesFile(persisted);
  const size = Number(file?.size || 0);
  if (!file || size <= 0) throw new Error('Файл региона сохранён, но не читается.');
  const bytes = new Uint8Array(await file.slice(0, 127).arrayBuffer());
  const magic = bytesToAscii(bytes, 12);
  if (bytes.byteLength < 127 || !/^PMTiles/.test(magic || '')) {
    throw new Error(`Первые байты не похожи на PMTiles header: ${magic || 'пусто'}.`);
  }
  const expected = Number(packageInfo?.sizeBytes || 0);
  if (expected > 0 && size !== expected) {
    throw new Error(`Размер скачанного файла не совпадает с каталогом: ${formatBytes(size)} вместо ${formatBytes(expected)}.`);
  }
  return { file, sizeBytes: size, magic };
}

async function streamRemotePmtilesToOpfs(pkg, signal, onProgress = null) {
  validateOfflineRegionInstallPrerequisites(pkg);
  const storageName = makeOfflineRegionStorageName(pkg);
  const url = String(pkg.url || '').trim();
  const response = await fetch(url, { cache: 'no-store', redirect: 'follow', signal });
  if (!response.ok) {
    throw Object.assign(new Error(`HTTP ${response.status}: файл региона не скачан.`), { code: 'OFFLINE_REGION_FETCH_FAILED', status: response.status });
  }
  if (!response.body || typeof response.body.getReader !== 'function') {
    throw Object.assign(new Error('Браузер не дал поток чтения для большого файла. Используй “Скачать вручную”.'), { code: 'OFFLINE_REGION_MANUAL_REQUIRED' });
  }

  const headerLength = headerNumber(headerValue(response.headers, 'content-length'));
  const totalBytes = headerLength || headerNumber(pkg.sizeBytes) || null;
  const dir = await getOfflineMapsOpfsDirectory(true);
  const handle = await dir.getFileHandle(storageName, { create: true });
  const writable = await handle.createWritable();
  const reader = response.body.getReader();
  let receivedBytes = 0;
  let completed = false;

  try {
    if (typeof onProgress === 'function') onProgress({ receivedBytes, totalBytes, storageType: 'opfs', storageName });
    while (true) {
      if (signal?.aborted) throw Object.assign(new Error('Установка региона отменена.'), { name: 'AbortError', code: 'OFFLINE_REGION_CANCELED' });
      const { done, value } = await reader.read();
      if (done) break;
      if (value && value.byteLength) {
        await writable.write(value);
        receivedBytes += value.byteLength;
        if (typeof onProgress === 'function') onProgress({ receivedBytes, totalBytes, storageType: 'opfs', storageName });
      }
    }
    await writable.close();
    completed = true;
    if (totalBytes && receivedBytes !== totalBytes) {
      throw new Error(`Файл скачан не полностью: ${formatBytes(receivedBytes)} из ${formatBytes(totalBytes)}.`);
    }
    return { storageType: 'opfs', storageName, sizeBytes: receivedBytes, totalBytes };
  } finally {
    try { reader.releaseLock(); } catch (err) { /* no-op */ }
    if (!completed) {
      try {
        if (typeof writable.abort === 'function') await writable.abort();
        else await writable.close();
      } catch (err) { /* no-op */ }
      await deletePmtilesFileFromOpfs(storageName);
    }
  }
}

async function upsertRememberedPmtilesMapForPackage(pkg, persisted, verified = {}) {
  const fingerprint = makeOfflineRegionPackageFingerprint(pkg);
  const now = new Date().toISOString();
  const existing = findRememberedPmtilesMapByFingerprint(fingerprint) || findRememberedPmtilesMapForPackage(pkg);
  const recordId = existing?.id || `remembered-region-${sanitizeOfflineMapStorageName(pkg.id || 'region')}-${Date.now()}`;
  const fileName = pkg.fileName || pkg.url?.split('/').pop() || `${pkg.id || 'region'}.pmtiles`;
  const title = existing?.title || pkg.name || fileName.replace(/\.pmtiles$/i, '') || 'Региональная карта';
  const mapRecord = {
    ...(existing || {}),
    id: recordId,
    fingerprint,
    title,
    fileName,
    sizeBytes: verified.sizeBytes || persisted.sizeBytes || pkg.sizeBytes || existing?.sizeBytes || null,
    lastModified: existing?.lastModified || null,
    sourceType: 'local-file-opfs',
    storageType: persisted.storageType,
    storageName: persisted.storageName,
    persistent: true,
    importedAt: now,
    createdAt: existing?.createdAt || now,
    lastSelectedAt: now,
    notes: existing?.notes || `Installed from catalog package ${pkg.id || fileName}`
  };
  const withoutRecord = (rememberedPmtilesMapsState.maps || []).filter((item) => item.id !== mapRecord.id);
  rememberedPmtilesMapsState.maps = [mapRecord, ...withoutRecord];
  rememberedPmtilesMapsState.selectedId = mapRecord.id;
  saveRememberedPmtilesMaps(existing ? 'catalog PMTiles region updated' : 'catalog PMTiles region installed');
  return mapRecord;
}

async function installOfflineRegionPackage(packageId) {
  const pkg = (offlineMapManifest.packages || []).find((item) => item.id === packageId);
  if (!pkg || !pkg.enabled || isLocalPmtilesPackage(pkg)) return null;
  const alreadyInstalled = findRememberedPmtilesMapForPackage(pkg);
  if (alreadyInstalled) {
    setOfflineRegionInstallState(pkg.id, { status: 'installed', receivedBytes: alreadyInstalled.sizeBytes || 0, totalBytes: pkg.sizeBytes || alreadyInstalled.sizeBytes || null, storageType: alreadyInstalled.storageType || null, storageName: alreadyInstalled.storageName || null, error: null, finishedAt: new Date().toISOString() }, 'offline region already installed');
    return alreadyInstalled;
  }

  const controller = new AbortController();
  offlineRegionInstallControllers.set(pkg.id, controller);
  const startedAt = new Date().toISOString();
  setOfflineRegionInstallState(pkg.id, { status: 'downloading', receivedBytes: 0, totalBytes: pkg.sizeBytes || null, storageType: 'opfs', storageName: makeOfflineRegionStorageName(pkg), error: null, startedAt, finishedAt: null }, 'offline region install started');
  setButtonApiStatus({ buttonId: 'offlineRegionInstallBtn', label: BUTTON_DIAGNOSTIC_LABELS.offlineRegionInstallBtn }, 'пендинг', `${pkg.name || pkg.id} · скачивание`);

  try {
    const persisted = await streamRemotePmtilesToOpfs(pkg, controller.signal, (progress) => {
      setOfflineRegionInstallState(pkg.id, {
        status: 'downloading',
        receivedBytes: progress.receivedBytes,
        totalBytes: progress.totalBytes || pkg.sizeBytes || null,
        storageType: progress.storageType,
        storageName: progress.storageName,
        error: null
      }, 'offline region install progress');
    });
    setOfflineRegionInstallState(pkg.id, { status: 'verifying', receivedBytes: persisted.sizeBytes || 0, totalBytes: persisted.totalBytes || pkg.sizeBytes || null, storageType: persisted.storageType, storageName: persisted.storageName, error: null }, 'offline region verifying downloaded file');
    const verified = await validatePersistedPmtilesHeader(persisted, pkg);
    const record = await upsertRememberedPmtilesMapForPackage(pkg, { ...persisted, sizeBytes: verified.sizeBytes }, verified);
    const localPackage = makePersistedPmtilesPackage(record);
    offlineMapManifest.packages = [localPackage, ...(offlineMapManifest.packages || []).filter((item) => !(isLocalPmtilesPackage(item) && item.rememberedId === record.id))];
    offlineMapManifest.selectedPackageId = localPackage.id;
    selectOfflineMapPackage(localPackage.id, true);
    setOfflineRegionInstallState(pkg.id, { status: 'installed', receivedBytes: verified.sizeBytes, totalBytes: verified.sizeBytes, storageType: record.storageType, storageName: record.storageName, error: null, finishedAt: new Date().toISOString() }, 'offline region installed');
    setButtonApiStatus({ buttonId: 'offlineRegionInstallBtn', label: BUTTON_DIAGNOSTIC_LABELS.offlineRegionInstallBtn }, 'готово', `${pkg.name || pkg.id} · установлена в OPFS`);
    showAppToast('Регион установлен', 'success');
    renderOfflineMapPackageUi();
    return record;
  } catch (err) {
    const canceled = err?.name === 'AbortError' || err?.code === 'OFFLINE_REGION_CANCELED';
    const manualRequired = err?.code === 'OFFLINE_REGION_MANUAL_REQUIRED' || /failed to fetch|network|cors|redirect|body|getReader|OPFS/i.test(err?.message || '');
    const status = canceled ? 'canceled' : manualRequired ? 'blocked-manual-required' : 'failed';
    const message = err?.message || String(err);
    setOfflineRegionInstallState(pkg.id, { status, error: message, finishedAt: new Date().toISOString() }, canceled ? 'offline region install canceled' : 'offline region install failed');
    setButtonApiStatus({ buttonId: canceled ? 'offlineRegionCancelInstallBtn' : 'offlineRegionInstallBtn', label: canceled ? BUTTON_DIAGNOSTIC_LABELS.offlineRegionCancelInstallBtn : BUTTON_DIAGNOSTIC_LABELS.offlineRegionInstallBtn }, canceled ? 'отменено' : 'ошибка', message);
    if (!canceled) showAppToast(manualRequired ? 'Автоустановка недоступна, скачай вручную' : 'Регион не установлен', 'error');
    return null;
  } finally {
    offlineRegionInstallControllers.delete(pkg.id);
    renderOfflineMapPackageUi();
    updateMapDebugUi(true);
  }
}

function cancelOfflineRegionInstall(packageId) {
  const controller = offlineRegionInstallControllers.get(packageId);
  if (!controller) return false;
  controller.abort();
  setOfflineRegionInstallState(packageId, { status: 'canceled', error: 'Установка отменена пользователем.', finishedAt: new Date().toISOString() }, 'offline region install cancel requested');
  setButtonApiStatus({ buttonId: 'offlineRegionCancelInstallBtn', label: BUTTON_DIAGNOSTIC_LABELS.offlineRegionCancelInstallBtn }, 'отменено', 'установка отменена');
  return true;
}


async function clearPmtilesFilesFromOpfs() {
  if (!hasOpfsStorage()) return { supported: false, deletedCount: 0, detail: 'OPFS недоступен' };
  try {
    const root = await navigator.storage.getDirectory();
    let dir;
    try {
      dir = await root.getDirectoryHandle(OPFS_OFFLINE_MAPS_DIR, { create: false });
    } catch (err) {
      if (err?.name === 'NotFoundError') return { supported: true, deletedCount: 0, detail: 'OPFS-папка офлайн-карт уже пуста' };
      throw err;
    }

    let deletedCount = 0;
    if (typeof dir.entries === 'function') {
      for await (const [name] of dir.entries()) {
        await dir.removeEntry(name, { recursive: true });
        deletedCount += 1;
      }
      return { supported: true, deletedCount, detail: `OPFS-файлов удалено: ${deletedCount}` };
    }

    await root.removeEntry(OPFS_OFFLINE_MAPS_DIR, { recursive: true });
    return { supported: true, deletedCount: null, detail: 'OPFS-папка офлайн-карт удалена' };
  } catch (err) {
    recordMapDebug('OPFS PMTiles emergency clear failed', err?.message || String(err));
    return { supported: true, deletedCount: 0, error: err?.message || String(err), detail: `OPFS: ошибка — ${err?.message || String(err)}` };
  }
}

async function clearPmtilesFilesFromIndexedDb() {
  try {
    await writeToStore(OFFLINE_MAP_FILES_STORE, (objectStore) => objectStore.clear());
    return { deleted: true, detail: 'IndexedDB-файлы офлайн-карт удалены' };
  } catch (err) {
    recordMapDebug('IndexedDB PMTiles emergency clear failed', err?.message || String(err));
    return { deleted: false, error: err?.message || String(err), detail: `IndexedDB: ошибка — ${err?.message || String(err)}` };
  }
}

function resetOfflineMapRuntimeAfterFileClear() {
  rememberedPmtilesMapsState = {
    status: 'loaded',
    maps: [],
    selectedId: null,
    error: null,
    updatedAt: new Date().toISOString()
  };
  localStorage.removeItem(REMEMBERED_PMTILES_MAPS_KEY);
  localStorage.removeItem(OFFLINE_MAP_SELECTED_PACKAGE_KEY);
  localPmtilesFileState = {
    status: 'not-selected',
    file: null,
    storageType: null,
    storageName: null,
    persistent: false,
    packageId: null,
    key: null,
    name: null,
    customName: null,
    rememberedId: null,
    fingerprint: null,
    sizeBytes: null,
    lastModified: null,
    selectedAt: null,
    error: null
  };
  const previousSelectedPackageId = offlineMapManifest.selectedPackageId;
  offlineMapManifest.packages = (offlineMapManifest.packages || []).filter((pkg) => !isLocalPmtilesPackage(pkg));
  if (previousSelectedPackageId && !offlineMapManifest.packages.some((pkg) => pkg.id === previousSelectedPackageId)) {
    offlineMapManifest.selectedPackageId = null;
  }
  pmtilesRuntimeProbe = {
    ...pmtilesRuntimeProbe,
    status: 'not-run',
    packageFound: false,
    header: null,
    metadata: null,
    error: null,
    diagnostics: null,
    packageId: null,
    packageName: null
  };
  pmtilesPreviewState = {
    ...pmtilesPreviewState,
    status: 'not-run',
    visible: false,
    sourceUrl: PMTILES_DEFAULT_URL,
    error: null,
    loadedAt: null,
    lastEvent: 'offline-map-files-cleared'
  };
  try {
    if (pmtilesPreviewMap && typeof pmtilesPreviewMap.remove === 'function') pmtilesPreviewMap.remove();
  } catch (err) {
    recordMapDebug('PMTiles preview remove after emergency clear failed', err?.message || String(err));
  }
  pmtilesPreviewMap = null;
  pmtilesPreviewLiveRows = [];
  clearPickedMapPoint(false);
}

async function clearImportedOfflineMapFiles() {
  const mapCount = (rememberedPmtilesMapsState.maps || []).length;
  const message = mapCount
    ? `Удалить все импортированные файлы офлайн-карт и ${mapCount} записей из “Мои карты”? Грибные точки, маршруты, backup JSON, группы и чат не будут удалены.`
    : 'Удалить все файлы офлайн-карт из локального хранилища приложения? Грибные точки, маршруты, backup JSON, группы и чат не будут удалены.';
  if (!confirm(message)) return false;

  const statusEl = $('offlineMapFilesClearStatus');
  const setClearStatus = (text) => {
    if (!statusEl) return;
    statusEl.dataset.userUpdated = 'true';
    statusEl.textContent = text;
  };

  setDisabled('clearOfflineMapFilesBtn', true);
  setButtonApiStatus(activeButtonDiagnostics || 'clearOfflineMapFilesBtn', 'pending', 'удаляю файлы офлайн-карт');
  let statusText = 'файлы офлайн-карт удалены';
  try {
    const opfsResult = await clearPmtilesFilesFromOpfs();
    const idbResult = await clearPmtilesFilesFromIndexedDb();
    resetOfflineMapRuntimeAfterFileClear();
    const details = [opfsResult.detail, idbResult.detail].filter(Boolean).join('; ');
    statusText = details || statusText;
    setClearStatus(`${statusText}. Записи “Мои карты” очищены.`);

    try { renderOfflineMapPackageUi(); } catch (err) { recordMapDebug('offline clear render package UI failed', err?.message || String(err)); }
    try { renderRememberedPmtilesMapsUi(); } catch (err) { recordMapDebug('offline clear render remembered maps UI failed', err?.message || String(err)); }
    try { updateSettingsSummary(); } catch (err) { recordMapDebug('offline clear settings summary failed', err?.message || String(err)); }
    try { updateMapDebugUi(true); } catch (err) { recordMapDebug('offline clear map debug UI failed', err?.message || String(err)); }

    setClearStatus(`${statusText}. Записи “Мои карты” очищены.`);
    setButtonApiStatus(activeButtonDiagnostics || 'clearOfflineMapFilesBtn', 'готово', statusText);
    return true;
  } catch (err) {
    const errorText = `Не удалось очистить файлы офлайн-карт: ${err?.message || String(err)}`;
    setClearStatus(errorText);
    setButtonApiStatus(activeButtonDiagnostics || 'clearOfflineMapFilesBtn', 'ошибка', errorText);
    throw err;
  } finally {
    setDisabled('clearOfflineMapFilesBtn', false);
  }
}

function createLocalPmtilesSource(file, key) {
  return {
    getKey() {
      return key;
    },
    async getBytes(offset, length, signal) {
      if (signal?.aborted) throw new DOMException('PMTiles local file read aborted', 'AbortError');
      const start = Number(offset);
      const size = Number(length);
      if (!Number.isFinite(start) || !Number.isFinite(size) || start < 0 || size < 0) {
        throw new Error(`Invalid PMTiles local byte range: offset=${offset}, length=${length}`);
      }
      const data = await file.slice(start, start + size).arrayBuffer();
      return { data };
    }
  };
}

function createPersistentPmtilesSource(recordOrPackage = {}, key) {
  return {
    getKey() {
      return key;
    },
    async getBytes(offset, length, signal) {
      if (signal?.aborted) throw new DOMException('PMTiles persisted file read aborted', 'AbortError');
      const start = Number(offset);
      const size = Number(length);
      if (!Number.isFinite(start) || !Number.isFinite(size) || start < 0 || size < 0) {
        throw new Error(`Invalid persisted PMTiles byte range: offset=${offset}, length=${length}`);
      }
      const file = await readPersistedPmtilesFile(recordOrPackage);
      const data = await file.slice(start, start + size).arrayBuffer();
      return { data };
    }
  };
}

function registerPmtilesArchiveForPackage(packageInfo = getActiveOfflineMapPackage()) {
  if (!window.pmtiles || !window.pmtiles.PMTiles || !pmtilesProtocol) return null;
  if (isLocalPmtilesPackage(packageInfo)) {
    const key = localPmtilesFileState.key || `local-pmtiles-${Date.now()}`;
    let source;
    if (isPersistentPmtilesPackage(packageInfo)) {
      source = createPersistentPmtilesSource(packageInfo, key);
    } else {
      const file = localPmtilesFileState.file;
      if (!file || localPmtilesFileState.packageId !== packageInfo.id) {
        throw new Error('Локальный файл офлайн-карты не выбран в этой сессии. Выбери файл заново.');
      }
      source = createLocalPmtilesSource(file, key);
    }
    const archive = new window.pmtiles.PMTiles(source);
    if (typeof pmtilesProtocol.add === 'function') {
      try { pmtilesProtocol.add(archive); } catch (err) { recordMapDebug('Local PMTiles protocol add failed', err?.message || String(err)); }
    }
    return { archive, absoluteUrl: key, protocolUrl: `pmtiles://${key}`, local: true };
  }
  return registerPmtilesArchiveForUrl(packageInfo?.url || PMTILES_DEFAULT_URL);
}

function defaultOfflineMapPackage() {
  return {
    id: 'mini-sample',
    name: 'Мини sample файла карты',
    url: PMTILES_SAMPLE_URL,
    sourceType: 'same-origin-sample',
    role: 'diagnostic',
    enabled: true,
    sizeBytes: null,
    description: 'Маленький встроенный диагностический пакет для проверки модуля офлайн-карты.'
  };
}

function normalizeOfflineMapPackage(pkg = {}, index = 0) {
  const fallback = defaultOfflineMapPackage();
  const id = String(pkg.id || pkg.name || `package-${index + 1}`).trim();
  const url = String(pkg.url || '').trim();
  const enabled = pkg.enabled !== false && Boolean(url);
  return {
    id,
    name: String(pkg.name || id || fallback.name).trim(),
    fileName: String(pkg.fileName || pkg.filename || (url ? url.split('/').pop() : '') || '').trim(),
    url,
    sourceType: String(pkg.sourceType || pkg.source || inferPmtilesSourceType(url)).trim(),
    role: pkg.role || null,
    version: pkg.version || null,
    sizeBytes: headerNumber(pkg.sizeBytes ?? pkg.size ?? null),
    bounds: Array.isArray(pkg.bounds) ? pkg.bounds : null,
    minZoom: pkg.minZoom ?? null,
    maxZoom: pkg.maxZoom ?? null,
    enabled,
    required: Boolean(pkg.required),
    description: pkg.description || null,
    releaseTag: pkg.releaseTag || null,
    checksum: pkg.checksum || null,
    fileRef: Boolean(pkg.fileRef),
    localSession: Boolean(pkg.localSession)
  };
}

function ensureSamplePackage(packages = []) {
  const sample = defaultOfflineMapPackage();
  const normalized = packages.map((pkg, index) => normalizeOfflineMapPackage(pkg, index));
  if (!normalized.some((pkg) => pkg.id === sample.id)) normalized.unshift(sample);
  return normalized;
}

function inferPmtilesSourceType(url = '') {
  const value = String(url || '');
  if (!value) return 'not-configured';
  if (value.startsWith('./') || value.startsWith('/')) return 'same-origin-static-file';
  if (/github\.com\/[^/]+\/[^/]+\/releases\/download\//i.test(value)) return 'github-release-asset';
  if (/objects\.githubusercontent\.com/i.test(value)) return 'github-release-redirect';
  return 'remote-url';
}

function inferGitHubReleaseManifestUrlFromLocation() {
  try {
    const host = window.location.hostname;
    const match = host.match(/^([^.]+)\.github\.io$/i);
    const repo = window.location.pathname.split('/').filter(Boolean)[0];
    if (match && repo) {
      return `https://github.com/${match[1]}/${repo}/releases/download/${OFFLINE_MAP_DEFAULT_RELEASE_TAG}/offline-map-packages.json`;
    }
  } catch (err) {
    console.warn('Could not infer GitHub release manifest URL', err);
  }
  return OFFLINE_MAP_MANIFEST_URL;
}

function getConfiguredOfflineMapManifestUrl() {
  const saved = String(localStorage.getItem(OFFLINE_MAP_MANIFEST_URL_STORAGE_KEY) || '').trim();
  return saved || inferGitHubReleaseManifestUrlFromLocation();
}

function setConfiguredOfflineMapManifestUrl(url) {
  const trimmed = String(url || '').trim();
  if (!trimmed) {
    localStorage.removeItem(OFFLINE_MAP_MANIFEST_URL_STORAGE_KEY);
    offlineMapManifest.url = inferGitHubReleaseManifestUrlFromLocation();
    return offlineMapManifest.url;
  }
  try {
    // Accept relative same-origin URLs and absolute HTTP(S) URLs only.
    const parsed = new URL(trimmed, window.location.href);
    if (!['http:', 'https:'].includes(parsed.protocol)) throw new Error('unsupported protocol');
  } catch (err) {
    throw new Error('Укажи ссылку на offline-map-packages.json или относительный путь вроде ./offline-map-packages.json');
  }
  localStorage.setItem(OFFLINE_MAP_MANIFEST_URL_STORAGE_KEY, trimmed);
  offlineMapManifest.url = trimmed;
  return trimmed;
}

function renderOfflineManifestUrlUi() {
  const input = $('offlineManifestUrlInput');
  if (input) input.value = offlineMapManifest.url || getConfiguredOfflineMapManifestUrl();
}

function parseGitHubReleaseDownloadUrl(url) {
  try {
    const parsed = new URL(url, window.location.href);
    const match = parsed.pathname.match(/^\/([^/]+)\/([^/]+)\/releases\/download\/([^/]+)\/([^/]+)$/);
    if (!match || parsed.hostname !== 'github.com') return null;
    return { owner: match[1], repo: match[2], tag: decodeURIComponent(match[3]), assetName: decodeURIComponent(match[4]) };
  } catch {
    return null;
  }
}

function getOfflineRegionDisplayName(regionId) {
  return OFFLINE_REGION_NAMES_RU[regionId] || regionId.split('-').map((part) => part ? part[0].toUpperCase() + part.slice(1) : part).join(' ');
}

async function loadGitHubReleaseManifestFallback(manifestUrl) {
  const info = parseGitHubReleaseDownloadUrl(manifestUrl);
  if (!info) return null;
  const apiUrl = `https://api.github.com/repos/${info.owner}/${info.repo}/releases/tags/${encodeURIComponent(info.tag)}`;
  const res = await fetch(apiUrl, { cache: 'no-store', headers: { Accept: 'application/vnd.github+json' } });
  if (!res.ok) throw new Error(`GitHub API HTTP ${res.status}`);
  const release = await res.json();
  const assets = Array.isArray(release.assets) ? release.assets : [];
  const pmtilesAssets = assets.filter((asset) => String(asset.name || '').endsWith('.pmtiles'));
  if (!pmtilesAssets.length) throw new Error('GitHub Release найден, но .pmtiles assets не найдены');
  return {
    schemaVersion: 1,
    releaseTag: info.tag,
    generatedFrom: 'github-release-assets-api',
    packages: pmtilesAssets.map((asset) => {
      const fileName = String(asset.name || '').trim();
      const id = fileName.replace(/\.pmtiles$/i, '');
      const url = asset.browser_download_url || `https://github.com/${info.owner}/${info.repo}/releases/download/${info.tag}/${fileName}`;
      return {
        id,
        name: getOfflineRegionDisplayName(id),
        fileName,
        url,
        sourceType: 'github-release-asset',
        version: info.tag,
        sizeBytes: headerNumber(asset.size),
        enabled: true,
        role: 'regional-map',
        schema: 'openmaptiles-planetiler',
        description: `Офлайн-карта: ${getOfflineRegionDisplayName(id)}.`
      };
    })
  };
}

async function fetchOfflineMapManifestJson(manifestUrl) {
  try {
    const res = await fetch(manifestUrl, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    return await res.json();
  } catch (err) {
    const fallback = await loadGitHubReleaseManifestFallback(manifestUrl);
    if (fallback) {
      recordMapDebug('offline map manifest synthesized from GitHub Release assets', { manifestUrl, error: err?.message || String(err) });
      return fallback;
    }
    throw err;
  }
}

function getOfflineMapManifestSnapshot() {
  const selected = getSelectedOfflineMapPackage(false);
  return {
    url: offlineMapManifest.url,
    status: offlineMapManifest.status,
    packageCount: offlineMapManifest.packages.length,
    selectedPackageId: offlineMapManifest.selectedPackageId,
    selectedPackageName: selected?.name || null,
    selectedPackageUrl: selected?.url || null,
    selectedPackageSource: selected?.sourceType || null,
    error: offlineMapManifest.error,
    loadedAt: offlineMapManifest.loadedAt,
    packages: offlineMapManifest.packages.map((pkg) => ({
      id: pkg.id,
      name: pkg.name,
      url: pkg.url,
      fileName: pkg.fileName,
      sourceType: pkg.sourceType,
      version: pkg.version,
      sizeBytes: pkg.sizeBytes,
      enabled: pkg.enabled,
      role: pkg.role,
      fileRef: Boolean(pkg.fileRef),
      localSession: Boolean(pkg.localSession)
    })),
    localFile: getLocalPmtilesFileSnapshot(),
    rememberedMaps: getRememberedPmtilesMapsSnapshot()
  };
}


function safeRememberedPmtilesMaps(raw) {
  const parsed = safeJsonParse(raw, null);
  const maps = Array.isArray(parsed?.maps) ? parsed.maps : [];
  const normalized = maps
    .map((item, index) => normalizeRememberedPmtilesMap(item, index))
    .filter(Boolean)
    .sort((a, b) => String(b.lastSelectedAt || b.createdAt || '').localeCompare(String(a.lastSelectedAt || a.createdAt || '')));
  const selectedId = parsed?.selectedId && normalized.some((item) => item.id === parsed.selectedId) ? parsed.selectedId : (normalized[0]?.id || null);
  return { status: 'loaded', maps: normalized, selectedId, error: null, updatedAt: parsed?.updatedAt || null };
}

function normalizeRememberedPmtilesMap(item = {}, index = 0) {
  const fingerprint = String(item.fingerprint || '').trim();
  if (!fingerprint) return null;
  const fileName = String(item.fileName || item.name || `map-${index + 1}.pmtiles`).trim();
  const fallbackTitle = fileName.replace(/\.pmtiles$/i, '') || `Карта ${index + 1}`;
  return {
    id: String(item.id || fingerprint).trim(),
    fingerprint,
    title: String(item.title || item.customName || fallbackTitle).trim() || fallbackTitle,
    fileName,
    sizeBytes: headerNumber(item.sizeBytes ?? item.size ?? null),
    lastModified: item.lastModified || null,
    sourceType: item.sourceType || (item.storageType === 'opfs' ? 'local-file-opfs' : item.storageType === 'idb-blob' ? 'local-file-idb' : 'local-file-session'),
    storageType: item.storageType || null,
    storageName: item.storageName || null,
    persistent: Boolean(item.persistent || item.storageName),
    importedAt: item.importedAt || null,
    createdAt: item.createdAt || new Date().toISOString(),
    lastSelectedAt: item.lastSelectedAt || item.selectedAt || null,
    notes: item.notes || null
  };
}

function saveRememberedPmtilesMaps(reason = 'remembered maps saved') {
  rememberedPmtilesMapsState = {
    ...rememberedPmtilesMapsState,
    status: 'loaded',
    maps: rememberedPmtilesMapsState.maps || [],
    updatedAt: new Date().toISOString(),
    error: null
  };
  localStorage.setItem(REMEMBERED_PMTILES_MAPS_KEY, JSON.stringify({
    schemaVersion: 1,
    selectedId: rememberedPmtilesMapsState.selectedId || null,
    updatedAt: rememberedPmtilesMapsState.updatedAt,
    maps: rememberedPmtilesMapsState.maps
  }));
  recordMapDebug(reason, getRememberedPmtilesMapsSnapshot());
}

function loadRememberedPmtilesMaps() {
  try {
    rememberedPmtilesMapsState = safeRememberedPmtilesMaps(localStorage.getItem(REMEMBERED_PMTILES_MAPS_KEY));
  } catch (err) {
    rememberedPmtilesMapsState = { status: 'error', maps: [], selectedId: null, error: err?.message || String(err), updatedAt: null };
  }
  renderRememberedPmtilesMapsUi();
  return rememberedPmtilesMapsState;
}

function makePmtilesFileFingerprint(file) {
  const name = String(file?.name || 'local.pmtiles').trim().toLowerCase();
  const size = Number(file?.size || 0);
  const modified = Number(file?.lastModified || 0);
  return `pmtiles:${name}:${size}:${modified}`;
}

function makePmtilesFileDuplicateKey(file) {
  return {
    fileName: String(file?.name || 'local.pmtiles').trim().toLowerCase(),
    sizeBytes: Number(file?.size || 0)
  };
}

function rememberedPmtilesMapMatchesFile(item, file) {
  if (!item || !file) return false;
  const incoming = makePmtilesFileDuplicateKey(file);
  const storedName = String(item.fileName || item.name || '').trim().toLowerCase();
  const storedSize = Number(item.sizeBytes || item.size || 0);
  return Boolean(incoming.fileName && storedName === incoming.fileName && incoming.sizeBytes > 0 && storedSize === incoming.sizeBytes);
}

function findRememberedPmtilesMapByFingerprint(fingerprint) {
  return (rememberedPmtilesMapsState.maps || []).find((item) => item.fingerprint === fingerprint) || null;
}

function findRememberedPmtilesMapForFile(file) {
  const fingerprint = makePmtilesFileFingerprint(file);
  return findRememberedPmtilesMapByFingerprint(fingerprint)
    || (rememberedPmtilesMapsState.maps || []).find((item) => rememberedPmtilesMapMatchesFile(item, file))
    || null;
}

function findRememberedPmtilesMapForPackage(pkg) {
  if (!pkg) return null;
  const fileName = String(pkg.fileName || pkg.url?.split('/').pop() || '').trim().toLowerCase();
  const sizeBytes = Number(pkg.sizeBytes || 0);
  if (!fileName || sizeBytes <= 0) return null;
  return (rememberedPmtilesMapsState.maps || []).find((item) => String(item.fileName || '').trim().toLowerCase() === fileName && Number(item.sizeBytes || 0) === sizeBytes) || null;
}

function getRemoteOfflineMapPackages() {
  return (offlineMapManifest.packages || []).filter((pkg) => pkg && pkg.enabled && !isLocalPmtilesPackage(pkg) && pkg.id !== defaultOfflineMapPackage().id);
}

function getSelectedRememberedPmtilesMap() {
  const id = rememberedPmtilesMapsState.selectedId;
  return (rememberedPmtilesMapsState.maps || []).find((item) => item.id === id) || null;
}

function offlineMapCountLabel(count) {
  const value = Number(count) || 0;
  if (value <= 0) return 'Офлайн-карт нет';
  const mod10 = value % 10;
  const mod100 = value % 100;
  if (mod10 === 1 && mod100 !== 11) return `${value} офлайн-карта`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${value} офлайн-карты`;
  return `${value} офлайн-карт`;
}

function getRememberedPmtilesMapUiStatus(item) {
  if (!item) return { label: 'Нет карты', mode: 'warn' };
  const isSelected = item.id === rememberedPmtilesMapsState.selectedId;
  const activeSource = localPmtilesFileState.status === 'selected' && localPmtilesFileState.rememberedId === item.id;
  const persistent = Boolean(item.persistent && item.storageName);
  if (isSelected && activeSource) return { label: 'Активна', mode: 'on' };
  if (persistent) return { label: isSelected ? 'Готова' : 'Готова', mode: 'on' };
  return { label: 'Нужен файл', mode: 'warn' };
}

function renderOfflineMapsManagerShell() {
  const maps = rememberedPmtilesMapsState.maps || [];
  const selected = getSelectedRememberedPmtilesMap();
  const count = maps.length;
  const hasMaps = count > 0;
  const countPill = $('offlineMapsCountPill');
  const details = $('offlineActiveMapDetails');
  const listSection = $('offlineMapListSection');
  const addPanel = $('offlineAddMapPanel');
  const addTitle = $('offlineAddMapTitle');
  const addHint = $('offlineAddMapHint');
  const activePill = $('offlineActiveMapPill');

  if (countPill) {
    countPill.textContent = offlineMapCountLabel(count);
    countPill.className = `pill ${hasMaps ? 'on' : 'warn'}`.trim();
  }
  if (details) details.hidden = !hasMaps;
  if (listSection) listSection.hidden = !hasMaps;
  if (addPanel) addPanel.classList.toggle('empty-mode', !hasMaps);
  if (addTitle) addTitle.textContent = hasMaps ? 'Добавить карту' : 'Офлайн-карт пока нет';
  if (addHint) {
    addHint.textContent = hasMaps
      ? 'Можно добавить ещё один .pmtiles-файл. Новая карта появится в списке и станет активной.'
      : 'Добавь файл .pmtiles, чтобы использовать карту без интернета. После добавления здесь появится предпросмотр карты.';
  }
  if (activePill) {
    const state = getRememberedPmtilesMapUiStatus(selected);
    activePill.textContent = state.label;
    activePill.className = `pill ${state.mode}`.trim();
  }
  updatePmtilesPreviewUi();
}

async function upsertRememberedPmtilesMapForFile(file, options = {}) {
  const fingerprint = makePmtilesFileFingerprint(file);
  const now = new Date().toISOString();
  const selected = getSelectedRememberedPmtilesMap();
  const replaceTarget = options.replaceRecordId
    ? (rememberedPmtilesMapsState.maps || []).find((item) => item.id === options.replaceRecordId)
    : null;
  const existing = replaceTarget || (options.replaceSelected && selected ? selected : findRememberedPmtilesMapForFile(file));
  const fallbackTitle = String(file.name || 'local.pmtiles').replace(/\.pmtiles$/i, '') || 'Локальная карта';
  const recordId = existing?.id || `remembered-pmtiles-${Date.now()}`;
  const storageName = existing?.storageName || `${recordId}-${sanitizeOfflineMapStorageName(file.name || 'map.pmtiles')}`;
  const persisted = await persistPmtilesFile(file, storageName);
  await verifyPersistedPmtilesFile(persisted);
  const sourceType = persisted.storageType === 'opfs' ? 'local-file-opfs' : 'local-file-idb';
  const mapRecord = {
    ...(existing || {}),
    id: recordId,
    fingerprint,
    title: existing?.title || fallbackTitle,
    fileName: file.name || existing?.fileName || 'local.pmtiles',
    sizeBytes: file.size || existing?.sizeBytes || null,
    lastModified: file.lastModified || existing?.lastModified || null,
    sourceType,
    storageType: persisted.storageType,
    storageName: persisted.storageName,
    persistent: true,
    importedAt: now,
    createdAt: existing?.createdAt || now,
    lastSelectedAt: now,
    notes: existing?.notes || null
  };

  const withoutRecord = (rememberedPmtilesMapsState.maps || []).filter((item) => item.id !== mapRecord.id);
  rememberedPmtilesMapsState.maps = [mapRecord, ...withoutRecord];
  rememberedPmtilesMapsState.selectedId = mapRecord.id;
  saveRememberedPmtilesMaps(existing ? 'persistent PMTiles map updated' : 'persistent PMTiles map imported');
  return mapRecord;
}

function makePersistedPmtilesPackage(record) {
  if (!record) return null;
  const packageId = `local-map-${record.id}`;
  const key = `${packageId}-${record.storageName || record.fingerprint || Date.now()}`;
  localPmtilesFileState = {
    status: 'selected',
    file: null,
    storageType: record.storageType || null,
    storageName: record.storageName || null,
    persistent: Boolean(record.persistent && record.storageName),
    packageId,
    key,
    name: record.fileName || 'local.pmtiles',
    customName: record.title || null,
    rememberedId: record.id,
    fingerprint: record.fingerprint || null,
    sizeBytes: record.sizeBytes || null,
    lastModified: record.lastModified || null,
    selectedAt: new Date().toISOString(),
    error: null
  };
  return {
    id: packageId,
    name: `Локальная карта: ${record.title || record.fileName || 'карта'}`,
    url: `${record.sourceType || 'local-file-opfs'}://${key}/${encodeURIComponent(record.fileName || 'local.pmtiles')}`,
    sourceType: record.sourceType || (record.storageType === 'opfs' ? 'local-file-opfs' : 'local-file-idb'),
    storageType: record.storageType || null,
    storageName: record.storageName || null,
    role: 'local-user-file',
    version: null,
    sizeBytes: record.sizeBytes || null,
    bounds: null,
    minZoom: null,
    maxZoom: null,
    enabled: Boolean(record.storageName),
    required: false,
    description: `Импортированный файл офлайн-карты “${record.fileName || 'local.pmtiles'}”. Файл сохранён внутри приложения и доступен после перезапуска PWA.`,
    releaseTag: null,
    checksum: null,
    fileRef: true,
    localSession: false,
    persistent: Boolean(record.persistent && record.storageName),
    rememberedId: record.id,
    fingerprint: record.fingerprint || null
  };
}

function getRememberedPmtilesMapsSnapshot() {
  const selected = getSelectedRememberedPmtilesMap();
  return {
    status: rememberedPmtilesMapsState.status,
    count: rememberedPmtilesMapsState.maps.length,
    selectedId: rememberedPmtilesMapsState.selectedId,
    selectedName: selected?.title || null,
    error: rememberedPmtilesMapsState.error,
    updatedAt: rememberedPmtilesMapsState.updatedAt,
    maps: rememberedPmtilesMapsState.maps.map((item) => ({
      id: item.id,
      title: item.title,
      fileName: item.fileName,
      sizeBytes: item.sizeBytes,
      lastModified: item.lastModified,
      lastSelectedAt: item.lastSelectedAt,
      storageType: item.storageType || null,
      persistent: Boolean(item.persistent && item.storageName),
      hasLocalFile: localPmtilesFileState.status === 'selected' && localPmtilesFileState.rememberedId === item.id
    }))
  };
}

function getUserFacingOfflineMapState() {
  const selected = getSelectedRememberedPmtilesMap();
  const localSourceSelected = localPmtilesFileState.status === 'selected';
  const sessionMatchesSelected = localSourceSelected && selected && localPmtilesFileState.rememberedId === selected.id;
  const title = localPmtilesFileState.customName || selected?.title || (localPmtilesFileState.name ? localPmtilesFileState.name.replace(/\.pmtiles$/i, '') : 'Офлайн-карта');

  if (localSourceSelected) {
    const storageText = localPmtilesFileState.persistent
      ? (localPmtilesFileState.storageType === 'opfs' ? 'импортирована в локальное хранилище приложения' : 'сохранена в локальное хранилище приложения')
      : 'выбрана в этой сессии';
    return {
      mode: 'ready',
      title,
      summary: `“${title}” — карта готова.`,
      detail: `Файл ${storageText}. Предпросмотр, GPS, точки и маршруты доступны без повторного выбора файла после перезапуска PWA.`,
      selected,
      sessionMatchesSelected
    };
  }

  if (selected) {
    const hasPersistentRecord = Boolean(selected.persistent && selected.storageName);
    return {
      mode: hasPersistentRecord ? 'loading' : 'needs-file',
      title: selected.title,
      summary: hasPersistentRecord
        ? `“${selected.title}” — карта импортирована, подключаем файл…`
        : `“${selected.title}” — запись найдена, файл нужно импортировать заново.`,
      detail: hasPersistentRecord
        ? 'Файл карты сохранён внутри приложения. Если он не открылся, возможно браузер очистил storage.'
        : `Это старая запись без сохранённого файла. Нажми “Выбрать файл карты” и выбери ${selected.fileName}, чтобы импортировать файл внутрь приложения.`,
      selected,
      sessionMatchesSelected: false
    };
  }

  return {
    mode: 'empty',
    title: 'Офлайн-карта не выбрана',
    summary: 'Офлайн-карта не выбрана.',
    detail: 'Офлайн-карта не выбрана. Можно пользоваться GPS и сохранёнными точками, но подложка карты может не загрузиться без интернета.',
    selected: null,
    sessionMatchesSelected: false
  };
}

function renderCurrentOfflineMapSummary() {
  const status = $('currentOfflineMapStatus');
  const empty = $('offlineMapEmptyState');
  const state = getUserFacingOfflineMapState();
  if (status) status.textContent = state.summary;
  if (empty) {
    empty.textContent = state.detail;
    empty.classList.toggle('warn-state', state.mode !== 'ready');
    empty.classList.toggle('ok-state', state.mode === 'ready');
  }
  renderOfflineMapsManagerShell();
}

function renderRememberedPmtilesMapsList() {
  const list = $('rememberedPmtilesMapsList');
  if (!list) return;
  list.innerHTML = '';
  const maps = rememberedPmtilesMapsState.maps || [];
  if (!maps.length) return;

  for (const item of maps) {
    const isSelected = item.id === rememberedPmtilesMapsState.selectedId;
    const hasSessionFile = localPmtilesFileState.status === 'selected' && localPmtilesFileState.rememberedId === item.id;
    const card = document.createElement('article');
    card.className = 'remembered-map-card';
    if (isSelected) card.classList.add('selected');
    if (hasSessionFile) card.classList.add('active-file');
    card.setAttribute('role', 'listitem');

    const top = document.createElement('div');
    top.className = 'remembered-map-card-top';
    const heading = document.createElement('h3');
    heading.textContent = item.title || 'Без названия';
    const pill = document.createElement('span');
    const uiStatus = getRememberedPmtilesMapUiStatus(item);
    pill.className = `pill ${uiStatus.mode}`.trim();
    pill.textContent = uiStatus.label;
    top.append(heading, pill);

    const meta = document.createElement('p');
    meta.className = 'hint remembered-map-meta';
    meta.textContent = `${item.fileName} · ${formatBytes(item.sizeBytes)}${item.lastSelectedAt ? ` · выбиралась ${new Date(item.lastSelectedAt).toLocaleString('ru-RU')}` : ''}`;

    const actions = document.createElement('div');
    actions.className = 'row remembered-map-actions';

    const openAction = document.createElement('button');
    openAction.type = 'button';
    openAction.className = 'secondary btn-secondary small-btn';
    openAction.textContent = isSelected ? 'Активна' : 'Открыть';
    openAction.disabled = isSelected;
    openAction.onclick = () => selectRememberedPmtilesMap(item.id, true).catch(console.warn);

    const renameAction = document.createElement('button');
    renameAction.type = 'button';
    renameAction.className = 'secondary btn-secondary small-btn';
    renameAction.textContent = 'Переименовать';
    renameAction.onclick = () => {
      selectRememberedPmtilesMap(item.id, true).catch(console.warn);
      const input = $('rememberedPmtilesMapNameInput');
      if (input) {
        input.focus();
        input.select();
      }
    };

    const deleteAction = document.createElement('button');
    deleteAction.type = 'button';
    deleteAction.className = 'secondary btn-secondary small-btn';
    deleteAction.textContent = 'Удалить';
    deleteAction.onclick = () => forgetRememberedPmtilesMapById(item.id, true).catch(console.warn);

    actions.append(openAction, renameAction, deleteAction);
    card.append(top, meta, actions);
    list.appendChild(card);
  }
}

function renderRememberedPmtilesMapsUi() {
  const select = $('rememberedPmtilesMapSelect');
  const nameInput = $('rememberedPmtilesMapNameInput');
  const status = $('rememberedPmtilesMapStatus');
  const selected = getSelectedRememberedPmtilesMap();
  if (select) {
    select.innerHTML = '';
    if (!(rememberedPmtilesMapsState.maps || []).length) {
      const option = document.createElement('option');
      option.value = '';
      option.textContent = 'Нет запомненных карт';
      select.appendChild(option);
      select.disabled = true;
    } else {
      select.disabled = false;
      for (const item of rememberedPmtilesMapsState.maps) {
        const option = document.createElement('option');
        option.value = item.id;
        const active = localPmtilesFileState.status === 'selected' && localPmtilesFileState.rememberedId === item.id;
        option.textContent = `${item.title} · ${formatBytes(item.sizeBytes)}${active ? ' · активна' : item.persistent ? ' · импортирована' : ''}`;
        select.appendChild(option);
      }
      select.value = rememberedPmtilesMapsState.selectedId || selected?.id || '';
    }
  }
  if (nameInput && selected && document.activeElement !== nameInput) {
    nameInput.value = selected.title || '';
  } else if (nameInput && !selected && document.activeElement !== nameInput) {
    nameInput.value = '';
  }
  if (status) {
    if (rememberedPmtilesMapsState.status === 'error') {
      status.textContent = `Мои карты: ошибка — ${rememberedPmtilesMapsState.error || 'неизвестно'}`;
    } else if (!rememberedPmtilesMapsState.maps.length) {
      status.textContent = 'Мои карты: пока нет. Выбери файл карты, дай ему понятное название и сохрани локально на устройстве.';
    } else if (selected) {
      const active = localPmtilesFileState.status === 'selected' && localPmtilesFileState.rememberedId === selected.id;
      status.textContent = active
        ? `Активная карта: “${selected.title}” · ${formatBytes(selected.sizeBytes)} · файл сохранён внутри приложения.`
        : selected.persistent
          ? `Выбранная карта: “${selected.title}”. Файл импортирован, можно открыть карту.`
          : `Выбранная карта: “${selected.title}”. Это старая запись: выбери ${selected.fileName}, чтобы импортировать файл внутрь приложения.`;
    }
  }
  renderCurrentOfflineMapSummary();
  renderRememberedPmtilesMapsList();
  const canRename = Boolean(selected);
  const canForget = Boolean(selected);
  setDisabled('renameRememberedPmtilesMapBtn', !canRename);
  setDisabled('forgetRememberedPmtilesMapBtn', !canForget);
}

async function activatePersistedPmtilesMap(record, userAction = false) {
  if (!record?.storageName) return null;
  try {
    // Verify that the browser still has the imported file before exposing it as the active package.
    const file = await readPersistedPmtilesFile(record);
    const verifiedRecord = {
      ...record,
      sizeBytes: record.sizeBytes || file.size || null,
      lastSelectedAt: new Date().toISOString()
    };
    rememberedPmtilesMapsState.maps = (rememberedPmtilesMapsState.maps || []).map((item) => item.id === verifiedRecord.id ? verifiedRecord : item);
    rememberedPmtilesMapsState.selectedId = verifiedRecord.id;
    const pkg = makePersistedPmtilesPackage(verifiedRecord);
    offlineMapManifest.packages = [pkg, ...(offlineMapManifest.packages || []).filter((item) => !(isLocalPmtilesPackage(item) && item.rememberedId === verifiedRecord.id))];
    offlineMapManifest.selectedPackageId = pkg.id;
    if (offlineMapManifest.status === 'not-loaded') offlineMapManifest.status = 'local-persistent';
    selectOfflineMapPackage(pkg.id, userAction);
    saveRememberedPmtilesMaps('persistent PMTiles map activated');
    return pkg;
  } catch (err) {
    localPmtilesFileState = {
      status: 'error',
      file: null,
      storageType: record.storageType || null,
      storageName: record.storageName || null,
      persistent: Boolean(record.persistent),
      packageId: null,
      key: null,
      name: record.fileName || null,
      customName: record.title || null,
      rememberedId: record.id,
      fingerprint: record.fingerprint || null,
      sizeBytes: record.sizeBytes || null,
      lastModified: record.lastModified || null,
      selectedAt: null,
      error: err?.message || String(err)
    };
    recordMapDebug('persistent PMTiles map activation failed', localPmtilesFileState.error);
    renderOfflineMapPackageUi();
    return null;
  }
}

async function selectRememberedPmtilesMap(recordId, userAction = false) {
  const found = (rememberedPmtilesMapsState.maps || []).find((item) => item.id === recordId);
  if (!found) return null;
  rememberedPmtilesMapsState.selectedId = found.id;
  saveRememberedPmtilesMaps('remembered PMTiles map selected');
  if (found.persistent && found.storageName) {
    const pkg = await activatePersistedPmtilesMap(found, userAction);
    if (pkg && userAction && $('screen-offline') && !$('screen-offline').hidden) {
      await showPmtilesPreviewMap();
    }
  } else {
    const activePkg = getSelectedOfflineMapPackage(false);
    if (localPmtilesFileState.status === 'selected' && localPmtilesFileState.rememberedId === found.id && activePkg?.id === localPmtilesFileState.packageId) {
      selectOfflineMapPackage(localPmtilesFileState.packageId, userAction);
    }
  }
  renderRememberedPmtilesMapsUi();
  updateMapDebugUi(false);
  return found;
}

function renameRememberedPmtilesMapById(recordId, nextTitle, statusTarget = activeButtonDiagnostics) {
  const selected = (rememberedPmtilesMapsState.maps || []).find((item) => item.id === recordId);
  const title = String(nextTitle || '').trim();
  if (!selected) {
    markButtonBlocked('нет выбранной запомненной карты');
    return null;
  }
  if (!title) {
    markButtonBlocked('введи название карты');
    return null;
  }
  rememberedPmtilesMapsState.maps = rememberedPmtilesMapsState.maps.map((item) => item.id === selected.id ? { ...item, title } : item);
  const updated = (rememberedPmtilesMapsState.maps || []).find((item) => item.id === selected.id);
  if (localPmtilesFileState.rememberedId === selected.id) {
    localPmtilesFileState = { ...localPmtilesFileState, customName: title };
    offlineMapManifest.packages = (offlineMapManifest.packages || []).map((pkg) => isLocalPmtilesPackage(pkg) && pkg.id === localPmtilesFileState.packageId
      ? { ...pkg, name: `Локальная карта: ${title}`, description: `Импортированный файл офлайн-карты “${localPmtilesFileState.name}”. Хранится внутри приложения.` }
      : pkg);
    pmtilesRuntimeProbe = { ...pmtilesRuntimeProbe, packageName: `Локальная карта: ${title}` };
  }
  saveRememberedPmtilesMaps('remembered PMTiles map renamed');
  renderOfflineMapPackageUi();
  renderRememberedPmtilesMapsUi();
  updateMapDebugUi(true);
  setButtonApiStatus(statusTarget, 'готово', `название: ${updated?.title || title}`);
  return updated;
}

function renameSelectedRememberedPmtilesMap() {
  const selected = getSelectedRememberedPmtilesMap();
  const input = $('rememberedPmtilesMapNameInput');
  return renameRememberedPmtilesMapById(selected?.id, input?.value || '', activeButtonDiagnostics);
}

function saveOfflineImportNameFromDialog() {
  const recordId = pendingOfflineImportNameMapId || rememberedPmtilesMapsState.selectedId;
  const input = $('offlineImportNameInput');
  const updated = renameRememberedPmtilesMapById(recordId, input?.value || '', { buttonId: 'offlineImportNameSaveBtn', label: 'Сохранить название карты' });
  if (updated) {
    closeDialogSafely('offlineImportNameDialog');
    pendingOfflineImportNameMapId = null;
    showAppToast('Название сохранено', 'success');
  }
}

function keepOfflineImportNameFromDialog() {
  closeDialogSafely('offlineImportNameDialog');
  pendingOfflineImportNameMapId = null;
}

async function openExistingDuplicateOfflineMap() {
  const existingId = pendingDuplicatePmtilesImport?.existingId;
  closeDialogSafely('offlineDuplicateMapDialog');
  pendingDuplicatePmtilesImport = null;
  if (!existingId) return;
  await selectRememberedPmtilesMap(existingId, true);
  showAppToast('Открыта существующая карта', 'success');
}

async function replaceDuplicateOfflineMap() {
  const pending = pendingDuplicatePmtilesImport;
  closeDialogSafely('offlineDuplicateMapDialog');
  pendingDuplicatePmtilesImport = null;
  if (!pending?.file || !pending?.existingId) return;
  await selectLocalPmtilesFile(pending.file, {
    replaceRecordId: pending.existingId,
    skipDuplicateCheck: true
  });
}

function cancelDuplicateOfflineMap() {
  closeDialogSafely('offlineDuplicateMapDialog');
  pendingDuplicatePmtilesImport = null;
}

async function forgetRememberedPmtilesMapById(recordId, ask = true) {
  const target = (rememberedPmtilesMapsState.maps || []).find((item) => item.id === recordId);
  if (!target) {
    markButtonBlocked('нет выбранной запомненной карты');
    return false;
  }
  if (ask && !confirm(`Удалить офлайн-карту “${target.title}” из списка?`)) return false;
  await deletePersistedPmtilesFile(target).catch((err) => recordMapDebug('persistent PMTiles file delete failed', err?.message || String(err)));
  rememberedPmtilesMapsState.maps = (rememberedPmtilesMapsState.maps || []).filter((item) => item.id !== target.id);
  rememberedPmtilesMapsState.selectedId = rememberedPmtilesMapsState.selectedId === target.id
    ? (rememberedPmtilesMapsState.maps[0]?.id || null)
    : rememberedPmtilesMapsState.selectedId;
  if (localPmtilesFileState.rememberedId === target.id) {
    localPmtilesFileState = { status: 'none', file: null, storageType: null, storageName: null, persistent: false, name: null, customName: null, rememberedId: null, fingerprint: null, packageId: null, key: null, sizeBytes: null, lastModified: null, selectedAt: null, error: null };
    offlineMapManifest.packages = (offlineMapManifest.packages || []).filter((pkg) => !isLocalPmtilesPackage(pkg));
    offlineMapManifest.selectedPackageId = null;
    pmtilesPreviewState = { ...pmtilesPreviewState, visible: false, status: 'not-run', error: null };
    if (pmtilesPreviewMap) {
      try { pmtilesPreviewMap.remove(); } catch (err) { console.warn('Offline map preview remove failed', err); }
      pmtilesPreviewMap = null;
    }
  }
  saveRememberedPmtilesMaps('remembered PMTiles map forgotten');
  renderOfflineMapPackageUi();
  renderRememberedPmtilesMapsUi();
  updateMapDebugUi(true);
  setButtonApiStatus(activeButtonDiagnostics, 'готово', `карта удалена: ${target.title}`);
  return true;
}

function forgetSelectedRememberedPmtilesMap() {
  const selected = getSelectedRememberedPmtilesMap();
  return forgetRememberedPmtilesMapById(selected?.id, true);
}

function getSelectedOfflineMapPackage(allowFallback = true) {
  const packages = offlineMapManifest.packages || [];
  const selectedId = offlineMapManifest.selectedPackageId || localStorage.getItem(OFFLINE_MAP_SELECTED_PACKAGE_KEY);
  const found = packages.find((pkg) => pkg.id === selectedId && pkg.enabled) || packages.find((pkg) => pkg.enabled);
  if (found) return found;
  return allowFallback ? defaultOfflineMapPackage() : null;
}

function getActiveOfflineMapPackage() {
  const selected = getSelectedOfflineMapPackage(true);
  if (!selected.url) throw new Error('У выбранного пакета карты нет URL в списке карт');
  return selected;
}

function getActivePmtilesPackageUrl() {
  return getSelectedOfflineMapPackage(true).url || PMTILES_DEFAULT_URL;
}

function getActivePmtilesPackageName() {
  return getSelectedOfflineMapPackage(true).name || 'пакет карты';
}

function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return 'размер неизвестен';
  if (value < 1024) return `${Math.round(value)} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  if (value < 1024 * 1024 * 1024) return `${Math.round(value / 1024 / 1024)} MB`;
  return `${(value / 1024 / 1024 / 1024).toFixed(1)} GB`;
}

function getOfflineRegionInstallUiState(pkg, installed) {
  if (installed) return { status: 'installed', label: 'установлена', mode: 'on', detail: 'Файл уже сохранён в локальном хранилище приложения.' };
  const entry = getOfflineRegionInstallEntry(pkg?.id);
  if (!entry) return { status: 'not-installed', label: 'не установлена', mode: 'warn', detail: 'Можно установить автоматически в OPFS или скачать файл вручную.' };
  const progress = formatOfflineRegionInstallProgress(entry);
  if (entry.status === 'downloading') return { status: entry.status, label: 'скачивается', mode: 'warn', detail: progress ? `Скачано ${progress}.` : 'Скачивание началось.' };
  if (entry.status === 'verifying') return { status: entry.status, label: 'проверяется', mode: 'warn', detail: 'Файл скачан, проверяю PMTiles header.' };
  if (entry.status === 'installed') return { status: entry.status, label: 'установлена', mode: 'on', detail: 'Файл сохранён в OPFS.' };
  if (entry.status === 'blocked-manual-required') return { status: entry.status, label: 'нужна ручная загрузка', mode: 'warn', detail: entry.error || 'Браузер заблокировал автоустановку. Используй “Скачать вручную”.' };
  if (entry.status === 'canceled') return { status: entry.status, label: 'отменена', mode: 'warn', detail: entry.error || 'Установка отменена.' };
  if (entry.status === 'failed') return { status: entry.status, label: 'ошибка', mode: 'warn', detail: entry.error || 'Регион не установлен.' };
  return { status: entry.status || 'not-installed', label: entry.status || 'не установлена', mode: 'warn', detail: entry.error || '' };
}

function renderOfflineRegionCatalogUi() {
  renderOfflineManifestUrlUi();
  const status = $('offlineRegionCatalogStatus');
  const pill = $('offlineRegionCatalogPill');
  const list = $('offlineRegionCatalogList');
  const remotePackages = getRemoteOfflineMapPackages();
  const lastInstall = getLastOfflineRegionInstallEntry();
  const lastInstallText = lastInstall
    ? ` Установка: ${lastInstall.status}${lastInstall.receivedBytes ? ` · ${formatOfflineRegionInstallProgress(lastInstall)}` : ''}${lastInstall.error ? ` · ${lastInstall.error}` : ''}.`
    : '';

  if (pill) {
    if (offlineMapManifest.status === 'loaded') {
      pill.textContent = remotePackages.length ? `${remotePackages.length} регионов` : 'пусто';
      pill.className = `pill ${remotePackages.length ? 'on' : 'warn'}`.trim();
    } else if (offlineMapManifest.status === 'loading') {
      pill.textContent = 'загрузка';
      pill.className = 'pill warn';
    } else if (offlineMapManifest.status === 'error') {
      pill.textContent = 'ошибка';
      pill.className = 'pill warn';
    } else {
      pill.textContent = 'не загружен';
      pill.className = 'pill warn';
    }
  }

  if (status) {
    if (offlineMapManifest.status === 'loaded') {
      status.textContent = remotePackages.length
        ? `Каталог регионов: загружено ${remotePackages.length}. “Установить” скачивает файл потоково в OPFS; “Скачать вручную” остаётся резервным способом.${lastInstallText}`
        : 'Каталог регионов: загружен, но региональных .pmtiles в manifest нет.';
    } else if (offlineMapManifest.status === 'loading') {
      status.textContent = 'Каталог регионов: загружается…';
    } else if (offlineMapManifest.status === 'error') {
      status.textContent = `Каталог регионов: ошибка — ${offlineMapManifest.error || 'неизвестно'}. Проверь URL manifest или доступность GitHub Release.`;
    } else {
      status.textContent = 'Каталог регионов: не загружен. Вставь URL offline-map-packages.json из GitHub Release и нажми “Обновить каталог”.';
    }
  }

  if (!list) return;
  list.innerHTML = '';
  if (!remotePackages.length) {
    const empty = document.createElement('p');
    empty.className = 'hint offline-region-empty';
    empty.textContent = offlineMapManifest.status === 'loaded'
      ? 'В manifest нет доступных региональных карт.'
      : 'После загрузки manifest здесь появятся регионы для установки или ручного скачивания.';
    list.appendChild(empty);
    return;
  }

  for (const pkg of remotePackages) {
    const installed = findRememberedPmtilesMapForPackage(pkg);
    const installEntry = getOfflineRegionInstallEntry(pkg.id);
    const uiState = getOfflineRegionInstallUiState(pkg, installed);
    const card = document.createElement('article');
    card.className = `offline-region-card${installed ? ' installed' : ''}`;
    card.setAttribute('role', 'listitem');
    card.dataset.packageId = pkg.id;
    card.dataset.installStatus = uiState.status;

    const top = document.createElement('div');
    top.className = 'offline-region-card-top';
    const titleWrap = document.createElement('div');
    const title = document.createElement('h4');
    title.textContent = pkg.name || pkg.id;
    const meta = document.createElement('p');
    meta.className = 'hint';
    meta.textContent = `${pkg.fileName || pkg.url.split('/').pop() || 'pmtiles'} · ${formatBytes(pkg.sizeBytes)}${pkg.version ? ` · ${pkg.version}` : ''}`;
    titleWrap.append(title, meta);
    const state = document.createElement('span');
    state.className = `pill ${uiState.mode}`.trim();
    state.textContent = uiState.label;
    top.append(titleWrap, state);

    const desc = document.createElement('p');
    desc.className = 'hint';
    desc.textContent = pkg.description || 'Региональная офлайн-карта из GitHub Release.';

    const installDetail = document.createElement('p');
    installDetail.className = 'hint offline-region-install-detail';
    installDetail.textContent = uiState.detail;

    const actions = document.createElement('div');
    actions.className = 'row offline-region-actions';

    if (installed) {
      const openBtn = document.createElement('button');
      openBtn.type = 'button';
      openBtn.className = 'btn-primary small-btn';
      openBtn.textContent = 'Открыть установленную';
      openBtn.addEventListener('click', () => {
        selectRememberedPmtilesMap(installed.id, true).catch(console.warn);
      });
      actions.appendChild(openBtn);
    } else if (installEntry?.status === 'downloading') {
      const cancelBtn = document.createElement('button');
      cancelBtn.type = 'button';
      cancelBtn.className = 'secondary btn-secondary small-btn';
      cancelBtn.textContent = 'Отменить';
      cancelBtn.addEventListener('click', () => cancelOfflineRegionInstall(pkg.id));
      actions.appendChild(cancelBtn);
    } else {
      const installBtn = document.createElement('button');
      installBtn.type = 'button';
      installBtn.className = 'btn-primary small-btn';
      installBtn.textContent = installEntry?.status === 'failed' || installEntry?.status === 'blocked-manual-required' || installEntry?.status === 'canceled'
        ? 'Повторить установку'
        : 'Установить';
      installBtn.addEventListener('click', () => {
        installOfflineRegionPackage(pkg.id).catch((err) => {
          recordMapDebug('offline region install click failed', err?.message || String(err));
        });
      });
      actions.appendChild(installBtn);
    }

    if (pkg.url) {
      const download = document.createElement('a');
      download.className = 'secondary btn-secondary small-btn offline-region-download-link';
      download.href = pkg.url;
      download.target = '_blank';
      download.rel = 'noopener noreferrer';
      download.textContent = installed ? 'Скачать заново' : 'Скачать вручную';
      download.addEventListener('click', (event) => openOfflineRegionDownloadUrl(event, pkg));
      actions.appendChild(download);
    }

    card.append(top, desc, installDetail, actions);
    list.appendChild(card);
  }
}

function openOfflineRegionDownloadUrl(event, pkg) {
  const url = String(pkg?.url || '').trim();
  if (!url) return;
  try {
    setButtonApiStatus(activeButtonDiagnostics || { buttonId: 'offlineRegionCatalogDownload', label: 'Скачать карту региона' }, 'готово', `открываю файл: ${pkg.fileName || pkg.name || 'регион'}`);
    const status = $('offlineRegionCatalogStatus');
    if (status) status.textContent = `Каталог регионов: открываю файл “${pkg.name || pkg.fileName || 'регион'}”. Если новое окно не открылось, повтори нажатие или скопируй ссылку из GitHub Release.`;
    if (!event) return;
    event.preventDefault();
    const opened = window.open(url, '_blank');
    if (opened) {
      try { opened.opener = null; } catch (err) { /* no-op */ }
      return;
    }
    window.location.href = url;
  } catch (err) {
    recordMapDebug('offline region manual download open failed', err?.message || String(err));
    if (event) event.preventDefault();
    window.location.href = url;
  }
}

function saveOfflineManifestUrlFromInput() {
  try {
    const value = $('offlineManifestUrlInput')?.value || '';
    const savedUrl = setConfiguredOfflineMapManifestUrl(value);
    offlineMapManifest = {
      ...offlineMapManifest,
      url: savedUrl,
      status: 'not-loaded',
      error: null,
      loadedAt: null
    };
    renderOfflineMapPackageUi();
    setButtonApiStatus(activeButtonDiagnostics, 'готово', 'URL каталога сохранён');
    return savedUrl;
  } catch (err) {
    setButtonApiStatus(activeButtonDiagnostics, 'ошибка', err?.message || String(err));
    const status = $('offlineRegionCatalogStatus');
    if (status) status.textContent = `Каталог регионов: ошибка URL — ${err?.message || String(err)}`;
    return null;
  }
}

async function refreshOfflineRegionCatalogFromUi() {
  const value = $('offlineManifestUrlInput')?.value || '';
  try {
    setConfiguredOfflineMapManifestUrl(value);
  } catch (err) {
    setButtonApiStatus(activeButtonDiagnostics, 'ошибка', err?.message || String(err));
    const status = $('offlineRegionCatalogStatus');
    if (status) status.textContent = `Каталог регионов: ошибка URL — ${err?.message || String(err)}`;
    return null;
  }
  return loadOfflineMapManifest(true);
}

function renderOfflineMapPackageUi() {
  const select = $('offlinePackageSelect');
  const status = $('offlinePackageManifestStatus');
  if (select) {
    const selectedId = offlineMapManifest.selectedPackageId || localStorage.getItem(OFFLINE_MAP_SELECTED_PACKAGE_KEY) || '';
    select.innerHTML = '';
    for (const pkg of offlineMapManifest.packages) {
      const option = document.createElement('option');
      option.value = pkg.id;
      option.textContent = `${pkg.name} · ${pkg.sourceType}${pkg.sizeBytes ? ` · ${formatBytes(pkg.sizeBytes)}` : ''}`;
      option.disabled = !pkg.enabled;
      select.appendChild(option);
    }
    const active = getSelectedOfflineMapPackage(true);
    select.value = active.id || selectedId;
  }

  if (status) {
    const active = getSelectedOfflineMapPackage(true);
    if (offlineMapManifest.status === 'loaded') {
      status.textContent = `Manifest: загружен. Выбран пакет: ${active.name} (${active.sourceType}). ${active.url ? active.url : 'URL не задан.'}`;
    } else if (offlineMapManifest.status === 'loading') {
      status.textContent = 'Manifest: загружается…';
    } else if (offlineMapManifest.status === 'error') {
      status.textContent = `Manifest: ошибка — ${offlineMapManifest.error || 'неизвестно'}. Доступен встроенный mini sample.`;
    } else {
      status.textContent = 'Manifest: не загружен. Доступен встроенный mini sample.';
    }
  }
  renderLocalPmtilesFileUi();
  renderOfflineRegionCatalogUi();
  renderRememberedPmtilesMapsUi();
  renderPmtilesProbeDetails();
  updateMapDebugUi(false);
}

function selectOfflineMapPackage(packageId, userAction = false) {
  const pkg = (offlineMapManifest.packages || []).find((item) => item.id === packageId);
  if (!pkg || !pkg.enabled) {
    renderOfflineMapPackageUi();
    return null;
  }
  offlineMapManifest.selectedPackageId = pkg.id;
  if (isLocalPmtilesPackage(pkg)) {
    localStorage.removeItem(OFFLINE_MAP_SELECTED_PACKAGE_KEY);
  } else {
    localStorage.setItem(OFFLINE_MAP_SELECTED_PACKAGE_KEY, pkg.id);
  }
  pmtilesRuntimeProbe = {
    ...pmtilesRuntimeProbe,
    url: pkg.url,
    status: 'not-run',
    packageFound: false,
    header: null,
    metadata: null,
    error: null,
    diagnostics: null,
    packageId: pkg.id,
    packageName: pkg.name
  };
  pmtilesPreviewState = {
    ...pmtilesPreviewState,
    status: 'not-run',
    visible: false,
    sourceUrl: pkg.url,
    styleMode: null,
    styleName: null,
    appliedBounds: null,
    appliedCenter: null,
    appliedZoom: null,
    viewportMode: null,
    vectorLayers: null,
    error: null,
    loadedAt: null,
    lastEvent: userAction ? 'selected package changed by user' : 'selected package restored'
  };
  if (pmtilesPreviewMap) {
    try { pmtilesPreviewMap.remove(); } catch (err) { console.warn('Offline map preview remove failed', err); }
    pmtilesPreviewMap = null;
  }
  pmtilesPreviewUserLayerState = {
    status: 'not-rendered',
    counts: { spots: 0, selectedSpot: 0, gps: 0, picked: 0, chat: 0, live: 0, accuracy: 0, tracks: 0, activeTrack: 0 },
    updatedAt: null,
    error: null
  };
  setMapProviderState({ offlinePackageStatus: 'not-installed' }, `selected пакет карты: ${pkg.id}`);
  updatePmtilesRuntimeStatusPill();
  updatePmtilesPreviewUi();
  renderOfflineMapPackageUi();
  return pkg;
}

function renderLocalPmtilesFileUi() {
  const status = $('localPmtilesFileStatus');
  if (!status) return;
  if (localPmtilesFileState.status === 'selected') {
    const modified = localPmtilesFileState.lastModified ? new Date(localPmtilesFileState.lastModified).toLocaleString('ru-RU') : 'дата неизвестна';
    const custom = localPmtilesFileState.customName ? ` · карта: “${localPmtilesFileState.customName}”` : '';
    const storage = localPmtilesFileState.persistent
      ? (localPmtilesFileState.storageType === 'opfs' ? 'импортирован в OPFS' : 'импортирован в IndexedDB')
      : 'выбран в этой сессии';
    status.textContent = `Файл карты: ${localPmtilesFileState.name}${custom} · ${formatBytes(localPmtilesFileState.sizeBytes)} · ${storage} · изменён ${modified}. После перезапуска PWA повторно выбирать файл не нужно.`;
  } else if (localPmtilesFileState.status === 'error') {
    status.textContent = `Файл карты: ошибка — ${localPmtilesFileState.error || 'неизвестно'}`;
  } else {
    status.textContent = 'Файл карты: не выбран. Можно скачать региональный файл карты и выбрать его здесь. Сетевые CORS/Range-запросы к GitHub для этого не нужны.';
  }
}

async function makeLocalPmtilesPackage(file, options = {}) {
  const remembered = await upsertRememberedPmtilesMapForFile(file, options);
  return makePersistedPmtilesPackage(remembered);
}

async function importLocalPmtilesFile(file, options = {}) {
  validatePmtilesImportFile(file);
  const replaceSelected = Boolean(options.replaceSelected || pendingLocalPmtilesImportMode === 'replace');
  const replaceRecordId = options.replaceRecordId || null;
  showAppToast('Проверяю файл карты', 'info');
  await waitForMs(OFFLINE_IMPORT_TOAST_STEP_MS);

  const duplicate = !options.skipDuplicateCheck && !replaceSelected && !replaceRecordId
    ? findRememberedPmtilesMapForFile(file)
    : null;
  if (duplicate) {
    await showOfflineDuplicateMapDialog(file, duplicate);
    return null;
  }

  showAppToast('Импорт карты начался', 'info');
  await waitForMs(OFFLINE_IMPORT_TOAST_STEP_MS);
  setButtonApiStatus({ buttonId: 'chooseLocalPmtilesBtn', label: BUTTON_DIAGNOSTIC_LABELS.chooseLocalPmtilesBtn }, 'пендинг', `${file.name} · импорт`);
  const pkg = await makeLocalPmtilesPackage(file, { replaceSelected, replaceRecordId });
  offlineMapManifest.packages = [pkg, ...(offlineMapManifest.packages || []).filter((item) => !isLocalPmtilesPackage(item))];
  offlineMapManifest.selectedPackageId = pkg.id;
  if (offlineMapManifest.status === 'not-loaded') offlineMapManifest.status = 'local-persistent';
  selectOfflineMapPackage(pkg.id, true);
  const importedRecord = getSelectedRememberedPmtilesMap();
  setButtonApiStatus({ buttonId: 'chooseLocalPmtilesBtn', label: BUTTON_DIAGNOSTIC_LABELS.chooseLocalPmtilesBtn }, 'готово', `${file.name} · ${formatBytes(file.size)} · импортировано`);
  showAppToast('Карта импортирована', 'success');
  recordMapDebug('local offline map file imported', getLocalPmtilesFileSnapshot());
  renderOfflineMapPackageUi();
  updateMapDebugUi(true);
  if ($('screen-offline') && !$('screen-offline').hidden) {
    try {
      await showPmtilesPreviewMap();
    } catch (previewErr) {
      recordMapDebug('offline map preview after import failed', previewErr?.message || String(previewErr));
      showOfflineImportError('Карта импортирована, но предпросмотр не открылся.', previewErr?.message || '');
      return pkg;
    }
  }
  await waitForMs(OFFLINE_IMPORT_RESULT_MODAL_DELAY_MS);
  showOfflineImportNameDialog(importedRecord);
  return pkg;
}

async function selectLocalPmtilesFile(file, options = {}) {
  try {
    if (!file) return null;
    return await importLocalPmtilesFile(file, options);
  } catch (err) {
    const message = offlineImportErrorMessage(err);
    localPmtilesFileState = { ...localPmtilesFileState, status: 'error', error: message };
    setButtonApiStatus({ buttonId: 'chooseLocalPmtilesBtn', label: BUTTON_DIAGNOSTIC_LABELS.chooseLocalPmtilesBtn }, 'ошибка', message);
    showOfflineImportError(message);
    renderLocalPmtilesFileUi();
    updateMapDebugUi(true);
    return null;
  } finally {
    pendingLocalPmtilesImportMode = 'add';
  }
}

async function loadOfflineMapManifest(userAction = false) {
  offlineMapManifest = {
    ...offlineMapManifest,
    status: 'loading',
    error: null
  };
  renderOfflineMapPackageUi();
  if (userAction && ['loadOfflineManifestBtn', 'refreshOfflineRegionCatalogBtn'].includes(activeButtonDiagnostics?.buttonId)) {
    setButtonApiStatus(activeButtonDiagnostics, 'пендинг', 'загрузка каталога регионов');
  }

  try {
    const manifestUrl = offlineMapManifest.url || getConfiguredOfflineMapManifestUrl();
    const json = await fetchOfflineMapManifestJson(manifestUrl);
    const localPackage = (offlineMapManifest.packages || []).find((pkg) => isLocalPmtilesPackage(pkg) && pkg.id === localPmtilesFileState.packageId);
    const packages = ensureSamplePackage(Array.isArray(json.packages) ? json.packages : []);
    if (localPackage && localPmtilesFileState.status === 'selected') packages.unshift(localPackage);
    const savedSelectedId = localPackage ? localPackage.id : localStorage.getItem(OFFLINE_MAP_SELECTED_PACKAGE_KEY);
    const selectedPackage = packages.find((pkg) => pkg.id === savedSelectedId && pkg.enabled) || packages.find((pkg) => pkg.enabled) || defaultOfflineMapPackage();
    offlineMapManifest = {
      url: manifestUrl,
      status: 'loaded',
      schemaVersion: json.schemaVersion || null,
      packages,
      selectedPackageId: selectedPackage.id,
      error: null,
      loadedAt: new Date().toISOString()
    };
    if (isLocalPmtilesPackage(selectedPackage)) localStorage.removeItem(OFFLINE_MAP_SELECTED_PACKAGE_KEY);
    else localStorage.setItem(OFFLINE_MAP_SELECTED_PACKAGE_KEY, selectedPackage.id);
    pmtilesRuntimeProbe = { ...pmtilesRuntimeProbe, url: selectedPackage.url, packageId: selectedPackage.id, packageName: selectedPackage.name };
    pmtilesPreviewState = { ...pmtilesPreviewState, sourceUrl: selectedPackage.url };
    renderOfflineMapPackageUi();
    recordMapDebug('offline map manifest loaded', getOfflineMapManifestSnapshot());
    if (userAction && ['loadOfflineManifestBtn', 'refreshOfflineRegionCatalogBtn'].includes(activeButtonDiagnostics?.buttonId)) {
      setButtonApiStatus(activeButtonDiagnostics, 'готово', `найдено пакетов: ${packages.length}`);
    }
    return offlineMapManifest;
  } catch (err) {
    const localPackage = (offlineMapManifest.packages || []).find((pkg) => isLocalPmtilesPackage(pkg) && pkg.id === localPmtilesFileState.packageId);
    const sample = defaultOfflineMapPackage();
    const packages = localPackage && localPmtilesFileState.status === 'selected' ? [localPackage, sample] : [sample];
    const selectedPackage = localPackage && localPmtilesFileState.status === 'selected' ? localPackage : sample;
    offlineMapManifest = {
      url: offlineMapManifest.url || getConfiguredOfflineMapManifestUrl(),
      status: 'error',
      packages,
      selectedPackageId: selectedPackage.id,
      error: err?.message || String(err),
      loadedAt: null
    };
    pmtilesRuntimeProbe = { ...pmtilesRuntimeProbe, url: selectedPackage.url, packageId: selectedPackage.id, packageName: selectedPackage.name };
    pmtilesPreviewState = { ...pmtilesPreviewState, sourceUrl: selectedPackage.url };
    renderOfflineMapPackageUi();
    recordMapDebug('offline map manifest load failed; sample fallback active', offlineMapManifest.error);
    if (userAction && ['loadOfflineManifestBtn', 'refreshOfflineRegionCatalogBtn'].includes(activeButtonDiagnostics?.buttonId)) {
      setButtonApiStatus(activeButtonDiagnostics, 'ошибка', offlineMapManifest.error);
    }
    return offlineMapManifest;
  }
}

function isRasterPmtilesTileType(tileType) {
  const normalized = String(tileType ?? '').toLowerCase();
  return ['2', '3', '4', '5', 'png', 'jpeg', 'jpg', 'webp', 'avif'].includes(normalized);
}

function isVectorPmtilesTileType(tileType) {
  const normalized = String(tileType ?? '').toLowerCase();
  return ['1', 'mvt', 'pbf', 'vector', 'vector-mvt'].includes(normalized);
}

function createPmtilesRasterPreviewStyle(protocolUrl) {
  return {
    version: 8,
    sources: {
      'pmtiles-preview': {
        type: 'raster',
        url: protocolUrl,
        tileSize: 256
      }
    },
    layers: [
      { id: 'pmtiles-preview-background', type: 'background', paint: { 'background-color': '#eef2e8' } },
      { id: 'pmtiles-preview-raster', type: 'raster', source: 'pmtiles-preview', paint: { 'raster-opacity': 0.92 } }
    ]
  };
}

function normalizePmtilesVectorLayerIds(vectorLayers = []) {
  if (!Array.isArray(vectorLayers)) return new Set();
  return new Set(vectorLayers.map((layer) => {
    if (typeof layer === 'string') return layer;
    if (layer && typeof layer === 'object') return layer.id || layer.name;
    return null;
  }).filter(Boolean));
}

function hasOpenMapTilesPreviewSchema(vectorLayers = []) {
  const ids = normalizePmtilesVectorLayerIds(vectorLayers);
  return ids.has('transportation')
    || ids.has('transportation_name')
    || ids.has('building')
    || (ids.has('landcover') && ids.has('place'))
    || (ids.has('waterway') && ids.has('boundary'));
}

function createOpenMapTilesVectorPreviewLayers(sourceName, vectorLayers = []) {
  const ids = normalizePmtilesVectorLayerIds(vectorLayers);
  const has = (id) => ids.has(id);
  const layers = [
    { id: 'pmtiles-preview-omt-background', type: 'background', paint: { 'background-color': '#f3efe6' } }
  ];

  if (has('landcover')) {
    layers.push({
      id: 'pmtiles-preview-omt-landcover',
      type: 'fill',
      source: sourceName,
      'source-layer': 'landcover',
      paint: {
        'fill-color': ['match', ['coalesce', ['get', 'class'], ['get', 'subclass']], 'wood', '#b9d6a3', 'forest', '#b9d6a3', 'grass', '#cddfb2', 'wetland', '#c4dcb7', 'sand', '#eadfba', '#d7e4bd'],
        'fill-opacity': 0.62
      }
    });
  }
  if (has('landuse')) {
    layers.push({
      id: 'pmtiles-preview-omt-landuse',
      type: 'fill',
      source: sourceName,
      'source-layer': 'landuse',
      paint: {
        'fill-color': ['match', ['coalesce', ['get', 'class'], ['get', 'type']], 'forest', '#b7d8a2', 'park', '#c6e1ac', 'grass', '#c6e1ac', 'farmland', '#e2d7ad', 'residential', '#e0d8ca', 'industrial', '#d9d1c4', '#d8dfbe'],
        'fill-opacity': 0.54
      }
    });
  }
  if (has('park')) {
    layers.push({
      id: 'pmtiles-preview-omt-park',
      type: 'fill',
      source: sourceName,
      'source-layer': 'park',
      paint: { 'fill-color': '#c8e0ae', 'fill-opacity': 0.66 }
    });
  }
  if (has('water')) {
    layers.push({
      id: 'pmtiles-preview-omt-water',
      type: 'fill',
      source: sourceName,
      'source-layer': 'water',
      paint: { 'fill-color': '#a9cfe5', 'fill-opacity': 0.95 }
    });
  }
  if (has('waterway')) {
    layers.push({
      id: 'pmtiles-preview-omt-waterway',
      type: 'line',
      source: sourceName,
      'source-layer': 'waterway',
      paint: { 'line-color': '#76b7d8', 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 14, 1.8, 17, 3.4] }
    });
  }
  if (has('boundary')) {
    layers.push({
      id: 'pmtiles-preview-omt-boundary',
      type: 'line',
      source: sourceName,
      'source-layer': 'boundary',
      minzoom: 4,
      paint: { 'line-color': '#b8b0a2', 'line-dasharray': [3, 2], 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.35, 10, 0.9, 14, 1.7] }
    });
  }
  if (has('transportation')) {
    layers.push(
      {
        id: 'pmtiles-preview-omt-road-all',
        type: 'line',
        source: sourceName,
        'source-layer': 'transportation',
        minzoom: 4,
        paint: { 'line-color': '#9a8568', 'line-opacity': 0.58, 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.35, 8, 0.75, 11, 1.35, 14, 2.8, 17, 5.4] }
      },
      {
        id: 'pmtiles-preview-omt-road-casing',
        type: 'line',
        source: sourceName,
        'source-layer': 'transportation',
        minzoom: 5,
        paint: { 'line-color': '#c7b89d', 'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.55, 10, 1.25, 13, 3.2, 16, 7.0] }
      },
      {
        id: 'pmtiles-preview-omt-road-major',
        type: 'line',
        source: sourceName,
        'source-layer': 'transportation',
        minzoom: 5,
        filter: ['in', ['get', 'class'], ['literal', ['motorway', 'trunk', 'primary', 'secondary']]],
        paint: { 'line-color': '#fff2b3', 'line-width': ['interpolate', ['linear'], ['zoom'], 5, 0.75, 10, 1.9, 13, 4.2, 16, 8.0] }
      },
      {
        id: 'pmtiles-preview-omt-road-medium',
        type: 'line',
        source: sourceName,
        'source-layer': 'transportation',
        minzoom: 8,
        filter: ['in', ['get', 'class'], ['literal', ['tertiary', 'minor', 'service', 'residential', 'unclassified']]],
        paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 12, 1.5, 15, 4.0] }
      },
      {
        id: 'pmtiles-preview-omt-road-tracks',
        type: 'line',
        source: sourceName,
        'source-layer': 'transportation',
        minzoom: 10,
        filter: ['any', ['in', ['get', 'class'], ['literal', ['track', 'path']]], ['in', ['get', 'subclass'], ['literal', ['track', 'path', 'footway', 'cycleway', 'bridleway']]]],
        paint: { 'line-color': '#f7f7f3', 'line-width': ['interpolate', ['linear'], ['zoom'], 10, 0.35, 14, 1.1, 17, 2.3], 'line-dasharray': [1.5, 1.2] }
      }
    );
  }
  if (has('building')) {
    layers.push({
      id: 'pmtiles-preview-omt-building',
      type: 'fill',
      source: sourceName,
      'source-layer': 'building',
      minzoom: 13,
      paint: { 'fill-color': '#d1b99a', 'fill-opacity': 0.66 }
    });
  }
  if (has('place')) {
    layers.push({
      id: 'pmtiles-preview-omt-place-labels',
      type: 'symbol',
      source: sourceName,
      'source-layer': 'place',
      minzoom: 4,
      layout: { 'text-field': ['coalesce', ['get', 'name:ru'], ['get', 'name:en'], ['get', 'name']], 'text-font': ['Noto Sans Regular'], 'text-size': ['interpolate', ['linear'], ['zoom'], 4, 10, 9, 13, 13, 16], 'text-anchor': 'center', 'text-allow-overlap': false },
      paint: { 'text-color': '#4e463c', 'text-halo-color': '#f8f4ea', 'text-halo-width': 1.2 }
    });
  }
  if (has('transportation_name')) {
    layers.push({
      id: 'pmtiles-preview-omt-road-labels',
      type: 'symbol',
      source: sourceName,
      'source-layer': 'transportation_name',
      minzoom: 12,
      layout: { 'symbol-placement': 'line', 'text-field': ['coalesce', ['get', 'name:ru'], ['get', 'name:en'], ['get', 'name'], ['get', 'ref']], 'text-font': ['Noto Sans Regular'], 'text-size': ['interpolate', ['linear'], ['zoom'], 12, 9, 16, 12], 'text-rotation-alignment': 'map' },
      paint: { 'text-color': '#635946', 'text-halo-color': '#ffffff', 'text-halo-width': 1.0 }
    });
  }
  return layers;
}

function createOpenMapTilesVectorPreviewStyle(protocolUrl, vectorLayers = []) {
  const sourceName = 'pmtiles-preview';
  return {
    version: 8,
    glyphs: 'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf',
    sources: {
      [sourceName]: {
        type: 'vector',
        url: protocolUrl,
        attribution: '<a href="https://openstreetmap.org">OpenStreetMap</a>'
      }
    },
    layers: createOpenMapTilesVectorPreviewLayers(sourceName, vectorLayers)
  };
}

function createFallbackVectorPreviewLayers(sourceName) {
  return [
    { id: 'pmtiles-preview-background', type: 'background', paint: { 'background-color': '#f3efe6' } },
    { id: 'pmtiles-preview-water', type: 'fill', source: sourceName, 'source-layer': 'water', paint: { 'fill-color': '#a9cfe5', 'fill-opacity': 0.95 } },
    { id: 'pmtiles-preview-natural-forest', type: 'fill', source: sourceName, 'source-layer': 'natural', filter: ['any', ['==', ['get', 'natural'], 'wood'], ['==', ['get', 'landuse'], 'forest'], ['==', ['get', 'boundary'], 'national_park']], paint: { 'fill-color': '#b9d6a3', 'fill-opacity': 0.72 } },
    { id: 'pmtiles-preview-natural-other', type: 'fill', source: sourceName, 'source-layer': 'natural', filter: ['any', ['==', ['get', 'natural'], 'scrub'], ['==', ['get', 'natural'], 'wetland'], ['==', ['get', 'landuse'], 'meadow']], paint: { 'fill-color': '#cddfb2', 'fill-opacity': 0.56 } },
    { id: 'pmtiles-preview-landuse-parks', type: 'fill', source: sourceName, 'source-layer': 'landuse', filter: ['any', ['==', ['get', 'leisure'], 'park'], ['==', ['get', 'leisure'], 'garden'], ['==', ['get', 'landuse'], 'grass'], ['==', ['get', 'landuse'], 'cemetery']], paint: { 'fill-color': '#c8e0ae', 'fill-opacity': 0.62 } },
    { id: 'pmtiles-preview-landuse-farmland', type: 'fill', source: sourceName, 'source-layer': 'landuse', filter: ['any', ['==', ['get', 'landuse'], 'farmland'], ['==', ['get', 'landuse'], 'farmyard'], ['==', ['get', 'landuse'], 'orchard']], paint: { 'fill-color': '#e2d7ad', 'fill-opacity': 0.5 } },
    { id: 'pmtiles-preview-landuse-urban', type: 'fill', source: sourceName, 'source-layer': 'landuse', filter: ['any', ['==', ['get', 'landuse'], 'residential'], ['==', ['get', 'landuse'], 'commercial'], ['==', ['get', 'landuse'], 'industrial']], paint: { 'fill-color': '#e0d8ca', 'fill-opacity': 0.5 } },
    { id: 'pmtiles-preview-waterways', type: 'line', source: sourceName, 'source-layer': 'physical_line', filter: ['==', ['get', 'pmap:kind'], 'waterway'], paint: { 'line-color': '#76b7d8', 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.5, 14, 1.8, 17, 3.5] } },
    { id: 'pmtiles-preview-boundaries', type: 'line', source: sourceName, 'source-layer': 'boundaries', paint: { 'line-color': '#b8b0a2', 'line-dasharray': [3, 2], 'line-width': ['interpolate', ['linear'], ['zoom'], 4, 0.4, 10, 1.0, 14, 1.8] } },
    { id: 'pmtiles-preview-transit', type: 'line', source: sourceName, 'source-layer': 'transit', minzoom: 8, paint: { 'line-color': '#9c8a76', 'line-width': ['interpolate', ['linear'], ['zoom'], 8, 0.45, 13, 1.2, 16, 2.3], 'line-dasharray': [2, 2] } },
    { id: 'pmtiles-preview-road-casing', type: 'line', source: sourceName, 'source-layer': 'roads', minzoom: 6, paint: { 'line-color': '#c7b89d', 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.6, 10, 1.1, 13, 3.0, 16, 7.0] } },
    { id: 'pmtiles-preview-road-major', type: 'line', source: sourceName, 'source-layer': 'roads', minzoom: 6, filter: ['any', ['==', ['get', 'pmap:kind'], 'highway'], ['==', ['get', 'pmap:kind'], 'major_road'], ['in', ['get', 'highway'], ['literal', ['motorway', 'trunk', 'primary', 'secondary']]]], paint: { 'line-color': '#fff2b3', 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.8, 10, 1.8, 13, 4.0, 16, 8.0] } },
    { id: 'pmtiles-preview-road-medium', type: 'line', source: sourceName, 'source-layer': 'roads', minzoom: 9, filter: ['any', ['==', ['get', 'pmap:kind'], 'medium_road'], ['in', ['get', 'highway'], ['literal', ['tertiary', 'unclassified', 'residential']]]], paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 9, 0.6, 12, 1.5, 15, 4.0] } },
    { id: 'pmtiles-preview-road-minor', type: 'line', source: sourceName, 'source-layer': 'roads', minzoom: 11, filter: ['any', ['==', ['get', 'pmap:kind'], 'minor_road'], ['in', ['get', 'highway'], ['literal', ['track', 'path', 'footway', 'service']]]], paint: { 'line-color': '#f7f7f3', 'line-width': ['interpolate', ['linear'], ['zoom'], 11, 0.4, 14, 1.1, 17, 2.2], 'line-dasharray': [1.5, 1.2] } },
    { id: 'pmtiles-preview-buildings', type: 'fill', source: sourceName, 'source-layer': 'buildings', minzoom: 13, paint: { 'fill-color': '#d1b99a', 'fill-opacity': 0.66 } },
    { id: 'pmtiles-preview-place-labels', type: 'symbol', source: sourceName, 'source-layer': 'places', minzoom: 4, layout: { 'text-field': ['coalesce', ['get', 'name:ru'], ['get', 'name:en'], ['get', 'name']], 'text-font': ['Noto Sans Regular'], 'text-size': ['interpolate', ['linear'], ['zoom'], 4, 10, 9, 13, 13, 16], 'text-anchor': 'center', 'text-allow-overlap': false }, paint: { 'text-color': '#4e463c', 'text-halo-color': '#f8f4ea', 'text-halo-width': 1.2 } },
    { id: 'pmtiles-preview-road-labels', type: 'symbol', source: sourceName, 'source-layer': 'roads', minzoom: 12, layout: { 'symbol-placement': 'line', 'text-field': ['coalesce', ['get', 'name:ru'], ['get', 'name:en'], ['get', 'name'], ['get', 'ref']], 'text-font': ['Noto Sans Regular'], 'text-size': ['interpolate', ['linear'], ['zoom'], 12, 9, 16, 12], 'text-rotation-alignment': 'map' }, paint: { 'text-color': '#635946', 'text-halo-color': '#ffffff', 'text-halo-width': 1.0 } }
  ];
}

function createFallbackVectorPreviewStyle(protocolUrl) {
  const sourceName = 'pmtiles-preview';
  return {
    version: 8,
    glyphs: 'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf',
    sources: {
      [sourceName]: {
        type: 'vector',
        url: protocolUrl,
        attribution: '<a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>'
      }
    },
    layers: createFallbackVectorPreviewLayers(sourceName)
  };
}

async function ensureProtomapsBasemapsRuntime() {
  if (window.basemaps && typeof window.basemaps.layers === 'function' && typeof window.basemaps.namedFlavor === 'function') return true;
  try {
    await loadScriptFromCandidates(
      PROTOMAPS_BASEMAPS_SCRIPT_URLS,
      () => Boolean(window.basemaps && typeof window.basemaps.layers === 'function' && typeof window.basemaps.namedFlavor === 'function'),
      'Protomaps basemaps style runtime'
    );
    return true;
  } catch (err) {
    recordMapDebug('Protomaps basemaps style runtime unavailable; using fallback vector style', err?.message || String(err));
    return false;
  }
}

async function createPmtilesVectorPreviewStyle(protocolUrl, vectorLayers = []) {
  if (hasOpenMapTilesPreviewSchema(vectorLayers)) {
    return {
      style: createOpenMapTilesVectorPreviewStyle(protocolUrl, vectorLayers),
      styleName: 'openmaptiles-planetiler-vector-basic',
      styleMode: 'vector-openmaptiles-style',
      sourceName: 'pmtiles-preview'
    };
  }

  const sourceName = 'protomaps';
  const hasBasemapsRuntime = await ensureProtomapsBasemapsRuntime();
  if (hasBasemapsRuntime) {
    return {
      style: {
        version: 8,
        glyphs: 'https://protomaps.github.io/basemaps-assets/fonts/{fontstack}/{range}.pbf',
        sprite: 'https://protomaps.github.io/basemaps-assets/sprites/v4/light',
        sources: {
          [sourceName]: {
            type: 'vector',
            url: protocolUrl,
            attribution: '<a href="https://protomaps.com">Protomaps</a> © <a href="https://openstreetmap.org">OpenStreetMap</a>'
          }
        },
        layers: window.basemaps.layers(sourceName, window.basemaps.namedFlavor('light'), { lang: 'ru' })
      },
      styleName: 'protomaps-basemaps-light-v5',
      styleMode: 'vector-protomaps-style',
      sourceName
    };
  }
  return {
    style: createFallbackVectorPreviewStyle(protocolUrl),
    styleName: 'fallback-protomaps-vector-basic',
    styleMode: 'vector-fallback-style',
    sourceName: 'pmtiles-preview'
  };
}

function getMainMapCenterForPreview() {
  try {
    if (!map || typeof map.getCenter !== 'function') return null;
    const center = map.getCenter();
    if (Number.isFinite(center?.lng) && Number.isFinite(center?.lat)) return [center.lng, center.lat];
  } catch (err) {
    recordMapDebug('main map center unavailable for offline map preview', err?.message || String(err));
  }
  return null;
}

function getPmtilesPreviewBounds(meta = {}, packageInfo = {}) {
  const candidates = [
    packageInfo?.bounds,
    meta?.bbox,
    meta?.metadata?.bounds
  ];
  for (const candidate of candidates) {
    const bounds = normalizeLonLatBounds(candidate);
    if (isUsefulRegionalBounds(bounds)) return bounds;
  }
  return null;
}

function getExplicitPmtilesPreviewCenter(meta = {}) {
  const candidates = [meta?.center, meta?.metadata?.center];
  for (const candidate of candidates) {
    if (candidate && Number.isFinite(candidate.lon) && Number.isFinite(candidate.lat)) {
      if (Math.abs(candidate.lon) > 0.0001 || Math.abs(candidate.lat) > 0.0001) return [candidate.lon, candidate.lat];
    }
  }
  return null;
}

function getPmtilesPreviewCenter(meta = {}, bounds = null) {
  const explicitCenter = getExplicitPmtilesPreviewCenter(meta);
  if (explicitCenter) return explicitCenter;
  if (bounds) return [(bounds[0] + bounds[2]) / 2, (bounds[1] + bounds[3]) / 2];
  return getMainMapCenterForPreview() || [37.6176, 55.7558];
}

function getPmtilesBoundsSize(bounds = null) {
  if (!Array.isArray(bounds) || bounds.length !== 4) return null;
  const [west, south, east, north] = bounds.map(Number);
  if (![west, south, east, north].every(Number.isFinite)) return null;
  return { width: Math.abs(east - west), height: Math.abs(north - south) };
}

function shouldFocusSmallVectorPmtilesRegion(bounds = null, isVectorPreview = false) {
  if (!isVectorPreview) return false;
  const size = getPmtilesBoundsSize(bounds);
  if (!size) return false;
  return size.width <= 6 && size.height <= 4;
}

function getPmtilesPreviewZoom(meta = {}, bounds = null, isVectorPreview = false) {
  const centerZoom = meta?.center?.zoom ?? meta?.metadata?.center?.zoom;
  if (Number.isFinite(centerZoom) && centerZoom > 0) {
    if (shouldFocusSmallVectorPmtilesRegion(bounds, isVectorPreview)) return Math.max(10, Math.min(centerZoom, 13));
    return centerZoom;
  }
  if (shouldFocusSmallVectorPmtilesRegion(bounds, isVectorPreview)) return 10;
  if (bounds) return isVectorPreview ? 11 : 0;
  return isVectorPreview ? 10 : 0;
}

async function showPmtilesPreviewMap() {
  const panel = $('pmtilesPreviewPanel');
  const container = $('pmtilesPreviewMap');
  if (!panel || !container) throw new Error('Offline map preview container is missing');

  panel.hidden = false;
  pmtilesPreviewUserLayerState = {
    status: 'not-rendered',
    counts: { spots: 0, selectedSpot: 0, gps: 0, picked: 0, chat: 0, live: 0, accuracy: 0, tracks: 0, activeTrack: 0 },
    updatedAt: null,
    error: null
  };
  setPmtilesPreviewState({
    status: 'loading',
    visible: true,
    sourceUrl: getActivePmtilesPackageUrl(),
    styleMode: null,
    styleName: null,
    appliedBounds: null,
    appliedCenter: null,
    appliedZoom: null,
    viewportMode: null,
    vectorLayers: null,
    error: null,
    loadedAt: null
  }, 'offline map preview started');
  setCurrentPmtilesPreviewButtonStatus('пендинг', 'загрузка предпросмотра офлайн-карты');

  try {
    const runtime = await ensureExperimentalMapLibreRuntime();
    setPmtilesProbeState({
      status: 'starting-maplibre-preview',
      maplibreLoaded: runtime.maplibreLoaded,
      pmtilesLoaded: runtime.pmtilesLoaded,
      protocolRegistered: runtime.protocolRegistered,
      webgl: hasWebGLSupport()
    }, 'MapLibre/PMTiles runtime loaded for preview');

    const activePackage = getActiveOfflineMapPackage();
    const activeUrl = activePackage.url;
    const result = await readPmtilesPackage(activeUrl, activePackage);
    setPmtilesProbeState({
      status: 'ready',
      packageFound: true,
      header: result.header,
      metadata: result.metadata,
      error: null
    }, 'PMTiles preview package metadata read');
    setMapProviderState({ offlinePackageStatus: 'metadata-ready-runtime-experimental' }, 'PMTiles preview metadata ready; Leaflet remains primary');

    if (pmtilesPreviewMap) {
      try { pmtilesPreviewMap.remove(); } catch (err) { console.warn('Offline map preview remove failed', err); }
      pmtilesPreviewMap = null;
    }
    container.innerHTML = '';

    const isRasterPreview = isRasterPmtilesTileType(result.meta?.tileType);
    const isVectorPreview = isVectorPmtilesTileType(result.meta?.tileType);
    if (!isRasterPreview && !isVectorPreview) {
      setPmtilesPreviewState({
        status: 'metadata-only',
        visible: true,
        sourceUrl: activeUrl,
        styleMode: 'metadata-only',
        error: null,
        loadedAt: new Date().toISOString()
      }, 'PMTiles preview skipped for unknown tile type');
      setCurrentPmtilesPreviewButtonStatus('готово', 'пакет читается, но tile type не поддержан preview');
      updateMapDebugUi(true);
      return true;
    }

    const registration = registerPmtilesArchiveForPackage(activePackage);
    const protocolUrl = registration?.protocolUrl || `pmtiles://${getAbsolutePmtilesUrl(activeUrl)}`;
    const vectorLayers = result.meta?.metadata?.vectorLayers || [];
    const previewBounds = getPmtilesPreviewBounds(result.meta, activePackage);
    const focusedSmallRegion = shouldFocusSmallVectorPmtilesRegion(previewBounds, isVectorPreview);
    const center = getPmtilesPreviewCenter(result.meta, previewBounds);
    const zoom = getPmtilesPreviewZoom(result.meta, previewBounds, isVectorPreview);
    const viewportMode = previewBounds && !focusedSmallRegion ? 'fit-bounds' : (focusedSmallRegion ? 'focused-small-region' : 'center-zoom');
    const vectorStyleResult = isVectorPreview ? await createPmtilesVectorPreviewStyle(protocolUrl, vectorLayers) : null;
    const style = isVectorPreview ? vectorStyleResult.style : createPmtilesRasterPreviewStyle(protocolUrl);
    const styleName = isVectorPreview ? vectorStyleResult.styleName : 'raster-pmtiles-basic';
    const styleMode = isVectorPreview ? (vectorStyleResult.styleMode || 'vector-protomaps-style') : 'raster-source-url';

    await new Promise((resolve, reject) => {
      let finished = false;
      const timeout = window.setTimeout(() => {
        if (finished) return;
        finished = true;
        reject(new Error('PMTiles preview timeout'));
      }, 18000);

      try {
        pmtilesPreviewMap = new window.maplibregl.Map({
          container,
          style,
          center,
          zoom,
          minZoom: 0,
          maxZoom: Number.isFinite(result.meta?.maxZoom) ? result.meta.maxZoom : (isVectorPreview ? 16 : 2),
          interactive: true,
          attributionControl: false,
          fadeDuration: 0
        });
        if (window.maplibregl.NavigationControl) {
          pmtilesPreviewMap.addControl(new window.maplibregl.NavigationControl({ showCompass: false }), 'top-right');
        }
        if (typeof pmtilesPreviewMap.on === 'function') {
          pmtilesPreviewMap.on('click', handlePmtilesPreviewMapClick);
        }
      } catch (err) {
        window.clearTimeout(timeout);
        reject(err);
        return;
      }

      const applyViewport = () => {
        try {
          pmtilesPreviewMap.resize();
          if (previewBounds && !focusedSmallRegion) {
            pmtilesPreviewMap.fitBounds([[previewBounds[0], previewBounds[1]], [previewBounds[2], previewBounds[3]]], {
              padding: 26,
              duration: 0,
              maxZoom: Math.min(Number.isFinite(result.meta?.maxZoom) ? result.meta.maxZoom : 13, 13)
            });
          } else {
            pmtilesPreviewMap.setCenter(center);
            pmtilesPreviewMap.setZoom(zoom);
          }
        } catch (err) {
          recordMapDebug('PMTiles preview viewport apply failed', err?.message || String(err));
        }
      };

      pmtilesPreviewMap.once('load', () => {
        applyViewport();
        renderPmtilesPreviewUserLayers('PMTiles preview user layers initial load');
        setPmtilesPreviewState({
          status: 'source-loaded',
          visible: true,
          styleMode,
          styleName,
          appliedBounds: previewBounds,
          appliedCenter: center,
          appliedZoom: zoom,
          viewportMode,
          vectorLayers
        }, 'PMTiles preview MapLibre load event');
      });

      pmtilesPreviewMap.once('idle', () => {
        if (finished) return;
        finished = true;
        window.clearTimeout(timeout);
        applyViewport();
        resolve();
      });

      pmtilesPreviewMap.on('error', (event) => {
        const message = event?.error?.message || 'MapLibre preview error';
        recordMapDebug('PMTiles preview non-fatal MapLibre error', message);
        // Do not reject immediately: style/glyph warnings must not break the primary Leaflet map.
      });
    });

    setMapProviderState({ offlinePackageStatus: 'preview-ready-runtime-experimental' }, 'PMTiles preview rendered; Leaflet remains primary');
    setPmtilesPreviewState({
      status: 'loaded',
      visible: true,
      styleMode,
      styleName,
      appliedBounds: previewBounds,
      appliedCenter: center,
      appliedZoom: zoom,
      viewportMode,
      vectorLayers,
      error: null,
      loadedAt: new Date().toISOString()
    }, 'PMTiles preview rendered');
    renderPmtilesPreviewUserLayers('PMTiles preview user layers rendered');
    setCurrentPmtilesPreviewButtonStatus('готово', 'предпросмотр офлайн-карты отрисован отдельно от основной карты');
    updateMapDebugUi(true);
    return true;
  } catch (err) {
    setPmtilesPreviewState({
      status: 'error',
      visible: true,
      error: err?.message || String(err)
    }, 'PMTiles preview failed');
    setCurrentPmtilesPreviewButtonStatus('ошибка', err?.message || String(err));
    updateMapDebugUi(true);
    return false;
  }
}


function normalizePreviewPoint(lat, lon) {
  const latNum = Number(lat);
  const lonNum = Number(lon);
  if (!Number.isFinite(latNum) || !Number.isFinite(lonNum)) return null;
  if (latNum < -90 || latNum > 90 || lonNum < -180 || lonNum > 180) return null;
  return { lat: latNum, lon: lonNum };
}

function previewPointFeature(kind, lat, lon, properties = {}) {
  const point = normalizePreviewPoint(lat, lon);
  if (!point) return null;
  return {
    type: 'Feature',
    geometry: { type: 'Point', coordinates: [point.lon, point.lat] },
    properties: { kind, ...properties }
  };
}

function previewCirclePolygon(lon, lat, radiusMeters, steps = 48) {
  const r = Number(radiusMeters);
  if (!Number.isFinite(r) || r <= 0) return null;
  const center = normalizePreviewPoint(lat, lon);
  if (!center) return null;
  const safeRadius = Math.min(Math.max(r, 3), 5000);
  const latRad = center.lat * Math.PI / 180;
  const metersPerDegLat = 111320;
  const metersPerDegLon = Math.max(1, 111320 * Math.cos(latRad));
  const coords = [];
  for (let i = 0; i <= steps; i += 1) {
    const angle = (i / steps) * Math.PI * 2;
    coords.push([
      center.lon + (Math.cos(angle) * safeRadius) / metersPerDegLon,
      center.lat + (Math.sin(angle) * safeRadius) / metersPerDegLat
    ]);
  }
  return {
    type: 'Feature',
    geometry: { type: 'Polygon', coordinates: [coords] },
    properties: { kind: 'gps-accuracy', radiusMeters: safeRadius }
  };
}

function emptyFeatureCollection() {
  return { type: 'FeatureCollection', features: [] };
}

function previewLineFeature(kind, points = [], properties = {}) {
  const coords = (Array.isArray(points) ? points : [])
    .map((point) => normalizePreviewPoint(point?.lat, point?.lon ?? point?.lng))
    .filter(Boolean)
    .map((point) => [point.lon, point.lat]);
  if (coords.length < 2) return null;
  return {
    type: 'Feature',
    geometry: { type: 'LineString', coordinates: coords },
    properties: { kind, ...properties }
  };
}

function getActivePmtilesPreviewBounds() {
  const applied = normalizeLonLatBounds(pmtilesPreviewState.appliedBounds);
  if (applied) return applied;
  const metaBounds = normalizeLonLatBounds(offlinePackageMeta?.bbox || offlinePackageMeta?.metadata?.bounds);
  if (isUsefulRegionalBounds(metaBounds)) return metaBounds;
  const selectedBounds = normalizeLonLatBounds(getSelectedOfflineMapPackage(false)?.bounds);
  return isUsefulRegionalBounds(selectedBounds) ? selectedBounds : null;
}

function isPointInsideLonLatBounds(lat, lon, bounds) {
  const point = normalizePreviewPoint(lat, lon);
  const normalizedBounds = normalizeLonLatBounds(bounds);
  if (!point || !normalizedBounds) return null;
  const [west, south, east, north] = normalizedBounds;
  return point.lon >= west && point.lon <= east && point.lat >= south && point.lat <= north;
}

function describeOfflineCoverageForPoint(point, label = 'точка') {
  const normalized = normalizePreviewPoint(point?.lat, point?.lon ?? point?.lng);
  if (!normalized) return 'Покрытие: координаты недоступны.';
  const bounds = getActivePmtilesPreviewBounds();
  if (!bounds) return `Покрытие: границы файла карты неизвестны, ${label} всё равно можно сохранить по GPS-координатам.`;
  const inside = isPointInsideLonLatBounds(normalized.lat, normalized.lon, bounds);
  return inside
    ? `Покрытие: ${label} внутри области текущей офлайн-карты.`
    : `Покрытие: ${label} вне области текущей офлайн-карты. GPS-координаты можно сохранить, но подложка здесь может быть пустой.`;
}

function updateOfflinePickedPointUi() {
  const hasPicked = Boolean(pickedMapPoint);
  const status = $('offlinePickedPointStatus');
  const coverage = $('offlineCoverageStatus');
  const preview = $('pmtilesPreviewMap');
  if (status) {
    status.textContent = hasPicked
      ? `Выбранная точка: ${fmtCoord(pickedMapPoint.lat)}, ${fmtCoord(pickedMapPoint.lon)}. Её можно сохранить как обычную грибную точку.`
      : 'Выбранная точка: нажми на офлайн-карту, чтобы отметить место.';
  }
  if (coverage) {
    coverage.textContent = hasPicked
      ? describeOfflineCoverageForPoint(pickedMapPoint, 'выбранная точка')
      : (pmtilesPreviewState.status === 'loaded' ? 'Покрытие: офлайн-карта открыта, выбери точку или нажми “Ко мне”.' : 'Покрытие: файл карты ещё не открыт.');
  }
  if (preview) preview.dataset.pickedPoint = hasPicked ? 'true' : 'false';
  setDisabled('savePmtilesPickedPointBtn', !hasPicked);
  setDisabled('clearPmtilesPickedPointBtn', !hasPicked);
}

function buildPmtilesPreviewUserLayerData() {
  const pointFeatures = [];
  const accuracyFeatures = [];
  const lineFeatures = [];
  const counts = { spots: 0, selectedSpot: 0, gps: 0, picked: 0, chat: 0, live: 0, accuracy: 0, tracks: 0, activeTrack: 0 };

  for (const spot of spots || []) {
    const isSelected = spot.id === selectedSpotId;
    const feature = previewPointFeature(isSelected ? 'selected-spot' : 'spot', spot.lat, spot.lon, {
      id: spot.id || '',
      label: spot.name || 'Грибная точка',
      type: spot.mushroomType || '',
      note: spot.note || ''
    });
    if (feature) {
      pointFeatures.push(feature);
      counts.spots += 1;
      if (isSelected) counts.selectedSpot += 1;
    }
  }

  if (currentPosition) {
    const gpsFeature = previewPointFeature('gps', currentPosition.lat, currentPosition.lon, {
      label: 'Я',
      accuracy: currentPosition.accuracy || null
    });
    if (gpsFeature) {
      pointFeatures.push(gpsFeature);
      counts.gps = 1;
      const accuracy = previewCirclePolygon(currentPosition.lon, currentPosition.lat, currentPosition.accuracy || 0);
      if (accuracy) {
        accuracyFeatures.push(accuracy);
        counts.accuracy = 1;
      }
    }
  }

  if (pickedMapPoint) {
    const pickedFeature = previewPointFeature('picked', pickedMapPoint.lat, pickedMapPoint.lon, { label: 'Выбрано' });
    if (pickedFeature) {
      pointFeatures.push(pickedFeature);
      counts.picked = 1;
    }
  }

  if (chatPreviewPoint) {
    const chatFeature = previewPointFeature('chat', chatPreviewPoint.lat, chatPreviewPoint.lon, {
      label: chatPreviewPoint.title || chatPreviewPoint.name || 'Точка из чата'
    });
    if (chatFeature) {
      pointFeatures.push(chatFeature);
      counts.chat = 1;
    }
  }

  for (const row of pmtilesPreviewLiveRows || []) {
    const loc = row.location || row;
    const liveFeature = previewPointFeature('live', loc.lat, loc.lon, {
      userId: row.userId || loc.user_id || '',
      label: row.name || loc.user_name || 'Друг',
      accuracy: loc.accuracy || null,
      updatedAt: loc.updated_at || row.updatedAt || ''
    });
    if (liveFeature) {
      pointFeatures.push(liveFeature);
      counts.live += 1;
    }
  }

  for (const track of tracks || []) {
    const feature = previewLineFeature('saved-track', track.points, {
      id: track.id || '',
      label: track.name || 'Маршрут',
      distanceMeters: track.distanceMeters || 0,
      pointCount: track.pointCount || track.points?.length || 0
    });
    if (feature) {
      lineFeatures.push(feature);
      counts.tracks += 1;
    }
  }

  if (trackRecording.active) {
    const activeFeature = previewLineFeature('active-track', trackRecording.points, {
      id: trackRecording.id || '',
      label: 'Запись маршрута',
      pointCount: trackRecording.points.length
    });
    if (activeFeature) {
      lineFeatures.push(activeFeature);
      counts.activeTrack = 1;
    }
  }

  return {
    points: { type: 'FeatureCollection', features: pointFeatures },
    accuracy: { type: 'FeatureCollection', features: accuracyFeatures },
    lines: { type: 'FeatureCollection', features: lineFeatures },
    counts
  };
}

function addPreviewLayerIfMissing(layer) {
  if (!pmtilesPreviewMap || !layer?.id || pmtilesPreviewMap.getLayer(layer.id)) return;
  pmtilesPreviewMap.addLayer(layer);
}

function ensurePmtilesPreviewUserLayerSources() {
  if (!pmtilesPreviewMap || typeof pmtilesPreviewMap.getSource !== 'function') return false;
  if (!pmtilesPreviewMap.getSource('pmtiles-preview-user-points')) {
    pmtilesPreviewMap.addSource('pmtiles-preview-user-points', { type: 'geojson', data: emptyFeatureCollection() });
  }
  if (!pmtilesPreviewMap.getSource('pmtiles-preview-user-accuracy')) {
    pmtilesPreviewMap.addSource('pmtiles-preview-user-accuracy', { type: 'geojson', data: emptyFeatureCollection() });
  }
  if (!pmtilesPreviewMap.getSource('pmtiles-preview-user-lines')) {
    pmtilesPreviewMap.addSource('pmtiles-preview-user-lines', { type: 'geojson', data: emptyFeatureCollection() });
  }

  addPreviewLayerIfMissing({
    id: 'pmtiles-preview-user-lines-halo',
    type: 'line',
    source: 'pmtiles-preview-user-lines',
    paint: { 'line-color': '#ffffff', 'line-width': ['match', ['get', 'kind'], 'active-track', 7, 6], 'line-opacity': 0.75 }
  });
  addPreviewLayerIfMissing({
    id: 'pmtiles-preview-user-lines',
    type: 'line',
    source: 'pmtiles-preview-user-lines',
    paint: {
      'line-color': ['match', ['get', 'kind'], 'active-track', '#2563eb', '#2f7d32'],
      'line-width': ['match', ['get', 'kind'], 'active-track', 4, 3],
      'line-opacity': 0.88
    }
  });

  addPreviewLayerIfMissing({
    id: 'pmtiles-preview-user-accuracy-fill',
    type: 'fill',
    source: 'pmtiles-preview-user-accuracy',
    paint: { 'fill-color': '#2563eb', 'fill-opacity': 0.12 }
  });
  addPreviewLayerIfMissing({
    id: 'pmtiles-preview-user-accuracy-line',
    type: 'line',
    source: 'pmtiles-preview-user-accuracy',
    paint: { 'line-color': '#2563eb', 'line-width': 1.2, 'line-opacity': 0.45 }
  });
  addPreviewLayerIfMissing({
    id: 'pmtiles-preview-user-points-halo',
    type: 'circle',
    source: 'pmtiles-preview-user-points',
    paint: {
      'circle-radius': ['match', ['get', 'kind'], 'gps', 11, 'live', 10, 'selected-spot', 10, 'picked', 10, 'chat', 10, 8],
      'circle-color': '#ffffff',
      'circle-opacity': 0.9
    }
  });
  addPreviewLayerIfMissing({
    id: 'pmtiles-preview-user-points',
    type: 'circle',
    source: 'pmtiles-preview-user-points',
    paint: {
      'circle-radius': ['match', ['get', 'kind'], 'gps', 7, 'live', 7, 'selected-spot', 7, 'picked', 7, 'chat', 7, 5.5],
      'circle-color': ['match', ['get', 'kind'], 'gps', '#2563eb', 'live', '#dc2626', 'selected-spot', '#f59e0b', 'picked', '#f97316', 'chat', '#8b5cf6', 'spot', '#2f7d32', '#444444'],
      'circle-stroke-color': ['match', ['get', 'kind'], 'spot', '#174a1d', 'selected-spot', '#7c2d12', '#ffffff'],
      'circle-stroke-width': 1.5,
      'circle-opacity': 0.96
    }
  });
  addPreviewLayerIfMissing({
    id: 'pmtiles-preview-user-labels',
    type: 'symbol',
    source: 'pmtiles-preview-user-points',
    minzoom: 11,
    layout: {
      'text-field': ['get', 'label'],
      'text-font': ['Noto Sans Regular'],
      'text-size': 11,
      'text-offset': [0, 1.25],
      'text-anchor': 'top',
      'text-allow-overlap': false
    },
    paint: {
      'text-color': '#243126',
      'text-halo-color': '#ffffff',
      'text-halo-width': 1.3
    }
  });
  return true;
}

function renderPmtilesPreviewUserLayers(reason = 'PMTiles preview user layers update') {
  if (!pmtilesPreviewMap || pmtilesPreviewState.status === 'error') return false;
  try {
    if (typeof pmtilesPreviewMap.isStyleLoaded === 'function' && !pmtilesPreviewMap.isStyleLoaded()) return false;
    if (!ensurePmtilesPreviewUserLayerSources()) return false;
    const data = buildPmtilesPreviewUserLayerData();
    pmtilesPreviewMap.getSource('pmtiles-preview-user-points')?.setData(data.points);
    pmtilesPreviewMap.getSource('pmtiles-preview-user-accuracy')?.setData(data.accuracy);
    pmtilesPreviewMap.getSource('pmtiles-preview-user-lines')?.setData(data.lines);
    setPmtilesPreviewUserLayerState({ status: 'rendered', counts: data.counts, error: null }, reason);
    const preview = $('pmtilesPreviewMap');
    if (preview) {
      preview.dataset.userPointCount = String(data.points.features.length);
      preview.dataset.trackLineCount = String(data.lines.features.length);
    }
    updateOfflinePickedPointUi();
    if (typeof pmtilesPreviewMap.triggerRepaint === 'function') pmtilesPreviewMap.triggerRepaint();
    return true;
  } catch (err) {
    setPmtilesPreviewUserLayerState({ status: 'error', error: err?.message || String(err) }, 'PMTiles preview user layers failed');
    return false;
  }
}

function isPmtilesPreviewLoaded() {
  return Boolean(pmtilesPreviewMap && pmtilesPreviewState.status === 'loaded');
}

function getCurrentPositionOnceForPmtilesFocus() {
  if (currentPosition) return Promise.resolve(currentPosition);
  if (!navigator.geolocation) {
    return Promise.reject(new Error('Геолокация не поддерживается этим браузером.'));
  }
  const requestId = beginApiRequest('Geolocation.getCurrentPosition', 'BROWSER', 'PMTiles preview center');
  return new Promise((resolve, reject) => {
    navigator.geolocation.getCurrentPosition(
      (pos) => {
        finishApiRequest(requestId, 'готово', `GPS ${meters(pos.coords.accuracy)}`);
        updateUserPosition(pos, false);
        resolve(currentPosition);
      },
      (err) => {
        finishApiRequest(requestId, 'ошибка', err.message);
        reject(new Error(`GPS ошибка: ${err.message}`));
      },
      { enableHighAccuracy: true, timeout: 15000, maximumAge: 5000 }
    );
  });
}

function focusPmtilesPreviewOnLatLon(lat, lon, zoom = 16, target = 'точка') {
  const point = normalizePreviewPoint(lat, lon);
  if (!point) throw new Error('Некорректные координаты для предпросмотра офлайн-карты.');
  if (!isPmtilesPreviewLoaded()) throw new Error('Предпросмотр офлайн-карты ещё не запущен.');
  renderPmtilesPreviewUserLayers(`PMTiles preview user layers refresh before focus ${target}`);
  if (typeof pmtilesPreviewMap.resize === 'function') pmtilesPreviewMap.resize();
  const currentZoom = typeof pmtilesPreviewMap.getZoom === 'function' ? Number(pmtilesPreviewMap.getZoom()) : zoom;
  const targetZoom = Math.max(Number.isFinite(currentZoom) ? currentZoom : zoom, zoom);
  const center = [point.lon, point.lat];
  if (typeof pmtilesPreviewMap.easeTo === 'function') {
    pmtilesPreviewMap.easeTo({ center, zoom: targetZoom, duration: 450 });
  } else if (typeof pmtilesPreviewMap.jumpTo === 'function') {
    pmtilesPreviewMap.jumpTo({ center, zoom: targetZoom });
  } else {
    throw new Error('Предпросмотр офлайн-карты не поддерживает центрирование.');
  }
  setPmtilesPreviewFocusState({
    status: 'focused',
    target,
    coords: center,
    zoom: targetZoom,
    error: null
  }, `PMTiles preview focused on ${target}`);
  const coverage = $('offlineCoverageStatus');
  if (coverage) coverage.textContent = describeOfflineCoverageForPoint(point, target);
  return true;
}

function handlePmtilesPreviewMapClick(event) {
  const lngLat = event?.lngLat;
  const lon = Number(lngLat?.lng ?? lngLat?.lon ?? (Array.isArray(lngLat) ? lngLat[0] : NaN));
  const lat = Number(lngLat?.lat ?? (Array.isArray(lngLat) ? lngLat[1] : NaN));
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return false;
  setPickedMapPoint({ lat, lng: lon }, 'offline-preview-tap');
  setPmtilesPreviewFocusState({
    status: 'focused',
    target: 'выбранная точка',
    coords: [lon, lat],
    zoom: typeof pmtilesPreviewMap?.getZoom === 'function' ? pmtilesPreviewMap.getZoom() : null,
    error: null
  }, 'PMTiles preview picked point');
  updateOfflinePickedPointUi();
  setButtonApiStatus(activeButtonDiagnostics || { buttonId: 'previewPmtilesBtn', label: 'Офлайн-карта' }, 'готово', 'выбранная точка отмечена на офлайн-карте');
  return true;
}

async function saveOfflinePickedMapPoint() {
  if (!pickedMapPoint) {
    markButtonBlocked('точка на офлайн-карте не выбрана');
    alert('Сначала нажми на офлайн-карту, чтобы выбрать место.');
    return false;
  }
  return saveSpotFromPosition(pickedMapPoint, 'offline-map-picked');
}

async function centerPmtilesPreviewOnMe() {
  setPmtilesPreviewFocusState({ status: 'pending', target: 'Я', error: null }, 'PMTiles preview center on me requested');
  try {
    if (!isPmtilesPreviewLoaded()) {
      const ok = await showPmtilesPreviewMap();
      if (!ok || !isPmtilesPreviewLoaded()) throw new Error('Предпросмотр офлайн-карты не удалось запустить.');
    }
    const position = await getCurrentPositionOnceForPmtilesFocus();
    if (!position) throw new Error('GPS-позиция недоступна.');
    const result = focusPmtilesPreviewOnLatLon(position.lat, position.lon, 16, 'Я');
    setButtonApiStatus(activeButtonDiagnostics || 'centerPmtilesOnMeBtn', 'готово', 'предпросмотр офлайн-карты центрирован на GPS');
    return result;
  } catch (err) {
    setPmtilesPreviewFocusState({ status: 'error', target: 'Я', error: err?.message || String(err) }, 'PMTiles preview center on me failed');
    throw err;
  }
}

function hasWebGLSupport() {
  const canvas = document.createElement('canvas');
  try {
    return Boolean(canvas.getContext('webgl2') || canvas.getContext('webgl') || canvas.getContext('experimental-webgl'));
  } catch (err) {
    return false;
  }
}

function loadScriptFromCandidates(urls, testFn, label) {
  if (testFn()) return Promise.resolve('already-loaded');

  const tryOne = (index) => new Promise((resolve, reject) => {
    if (index >= urls.length) {
      reject(new Error(`${label} failed to load from all candidates`));
      return;
    }

    const url = urls[index];
    const existing = Array.from(document.scripts).find((script) => script.src === url);
    if (existing && testFn()) {
      resolve(url);
      return;
    }

    const script = existing || document.createElement('script');
    let done = false;
    const timeout = window.setTimeout(() => {
      if (done) return;
      done = true;
      script.onerror = null;
      script.onload = null;
      reject(new Error(`${label} timeout: ${url}`));
    }, 12000);

    script.onload = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timeout);
      if (testFn()) {
        resolve(url);
      } else {
        tryOne(index + 1).then(resolve, reject);
      }
    };
    script.onerror = () => {
      if (done) return;
      done = true;
      window.clearTimeout(timeout);
      tryOne(index + 1).then(resolve, reject);
    };

    if (!existing) {
      script.src = url;
      script.async = true;
      script.crossOrigin = 'anonymous';
      document.head.appendChild(script);
    }
  });

  return tryOne(0);
}

function loadCssFromCandidates(urls) {
  for (const url of urls) {
    const existing = Array.from(document.querySelectorAll('link[rel="stylesheet"]')).find((link) => link.href === url);
    if (existing) return;
    const link = document.createElement('link');
    link.rel = 'stylesheet';
    link.href = url;
    link.crossOrigin = 'anonymous';
    document.head.appendChild(link);
    return;
  }
}

async function ensureExperimentalMapLibreRuntime() {
  loadCssFromCandidates(MAPLIBRE_CSS_URLS);
  await loadScriptFromCandidates(MAPLIBRE_SCRIPT_URLS, () => Boolean(window.maplibregl && window.maplibregl.Map), 'MapLibre GL JS');
  await loadScriptFromCandidates(PMTILES_SCRIPT_URLS, () => Boolean(window.pmtiles && window.pmtiles.PMTiles && window.pmtiles.Protocol), 'PMTiles JS');

  if (!pmtilesProtocol && window.maplibregl && window.pmtiles) {
    pmtilesProtocol = new window.pmtiles.Protocol();
    window.maplibregl.addProtocol('pmtiles', pmtilesProtocol.tile);
  }

  return {
    maplibreLoaded: Boolean(window.maplibregl && window.maplibregl.Map),
    pmtilesLoaded: Boolean(window.pmtiles && window.pmtiles.PMTiles),
    protocolRegistered: Boolean(pmtilesProtocol)
  };
}

function headerNumber(value) {
  if (value == null || value === '') return null;
  const parsed = Number(value);
  return Number.isFinite(parsed) ? parsed : null;
}

function normalizePmtilesHeader(header = {}) {
  return {
    specVersion: header.specVersion ?? header.version ?? null,
    rootDirectoryOffset: header.rootDirectoryOffset ?? null,
    rootDirectoryLength: header.rootDirectoryLength ?? null,
    jsonMetadataOffset: header.jsonMetadataOffset ?? null,
    jsonMetadataLength: header.jsonMetadataLength ?? null,
    leafDirectoryOffset: header.leafDirectoryOffset ?? null,
    leafDirectoryLength: header.leafDirectoryLength ?? null,
    tileDataOffset: header.tileDataOffset ?? null,
    tileDataLength: header.tileDataLength ?? null,
    addressedTilesCount: header.addressedTilesCount ?? null,
    tileEntriesCount: header.tileEntriesCount ?? null,
    tileContentsCount: header.tileContentsCount ?? null,
    clustered: header.clustered ?? null,
    internalCompression: header.internalCompression ?? null,
    tileCompression: header.tileCompression ?? null,
    tileType: header.tileType ?? null,
    minZoom: header.minZoom ?? null,
    maxZoom: header.maxZoom ?? null,
    minLon: header.minLon ?? null,
    minLat: header.minLat ?? null,
    maxLon: header.maxLon ?? null,
    maxLat: header.maxLat ?? null,
    centerZoom: header.centerZoom ?? null,
    centerLon: header.centerLon ?? null,
    centerLat: header.centerLat ?? null
  };
}

function parsePmtilesNumberList(value, expectedLength) {
  if (Array.isArray(value)) {
    const list = value.map((item) => Number(item));
    return list.length >= expectedLength && list.slice(0, expectedLength).every(Number.isFinite) ? list.slice(0, expectedLength) : null;
  }
  if (typeof value !== 'string') return null;
  const list = value.split(',').map((part) => Number(part.trim()));
  return list.length >= expectedLength && list.slice(0, expectedLength).every(Number.isFinite) ? list.slice(0, expectedLength) : null;
}

function normalizeLonLatBounds(bounds) {
  const list = parsePmtilesNumberList(bounds, 4);
  if (!list) return null;
  const [west, south, east, north] = list;
  if (![west, south, east, north].every(Number.isFinite)) return null;
  if (west < -180 || east > 180 || south < -90 || north > 90 || west >= east || south >= north) return null;
  return [west, south, east, north];
}

function isUsefulRegionalBounds(bounds) {
  if (!Array.isArray(bounds) || bounds.length !== 4) return false;
  const [west, south, east, north] = bounds.map(Number);
  if (![west, south, east, north].every(Number.isFinite)) return false;
  const width = Math.abs(east - west);
  const height = Math.abs(north - south);
  if (width <= 0 || height <= 0) return false;
  // Ignore near-world bounds: extracts can still include z0 world overview tiles.
  return width < 120 && height < 80;
}

function summarizePmtilesMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return null;
  const bounds = normalizeLonLatBounds(metadata.bounds);
  const centerList = parsePmtilesNumberList(metadata.center, 3) || parsePmtilesNumberList(metadata.center, 2);
  const vectorLayers = Array.isArray(metadata.vector_layers)
    ? metadata.vector_layers.map((layer) => layer.id || layer.name).filter(Boolean).slice(0, 32)
    : null;
  return {
    name: metadata.name || metadata.id || null,
    description: metadata.description || null,
    attribution: metadata.attribution || null,
    bounds,
    center: centerList ? { lon: centerList[0], lat: centerList[1], zoom: Number.isFinite(centerList[2]) ? centerList[2] : null } : null,
    minZoom: headerNumber(metadata.minzoom ?? metadata.minZoom ?? null),
    maxZoom: headerNumber(metadata.maxzoom ?? metadata.maxZoom ?? null),
    vectorLayers,
    keys: Object.keys(metadata).slice(0, 32)
  };
}

async function startMapLibreSmokeTest() {
  if (!window.maplibregl || !window.maplibregl.Map) throw new Error('MapLibre runtime is not loaded');
  if (!hasWebGLSupport()) throw new Error('WebGL is not available on this browser');

  const probeEl = document.createElement('div');
  probeEl.setAttribute('aria-hidden', 'true');
  probeEl.style.cssText = 'position:absolute;left:-9999px;top:-9999px;width:96px;height:96px;overflow:hidden;pointer-events:none;';
  document.body.appendChild(probeEl);

  await new Promise((resolve, reject) => {
    let finished = false;
    const timeout = window.setTimeout(() => {
      if (finished) return;
      finished = true;
      reject(new Error('MapLibre smoke test timeout'));
    }, 8000);

    let probeMap = null;
    try {
      probeMap = new window.maplibregl.Map({
        container: probeEl,
        style: {
          version: 8,
          sources: {},
          layers: [{ id: 'probe-background', type: 'background', paint: { 'background-color': '#eef2e8' } }]
        },
        center: [24.1052, 56.9496],
        zoom: 9,
        interactive: false,
        attributionControl: false,
        fadeDuration: 0
      });
    } catch (err) {
      window.clearTimeout(timeout);
      reject(err);
      return;
    }

    probeMap.once('load', () => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeout);
      try { probeMap.remove(); } catch (err) { console.warn('MapLibre probe remove failed', err); }
      probeEl.remove();
      resolve();
    });
    probeMap.once('error', (event) => {
      if (finished) return;
      finished = true;
      window.clearTimeout(timeout);
      try { probeMap.remove(); } catch (err) { console.warn('MapLibre probe remove failed', err); }
      probeEl.remove();
      reject(event.error || new Error('MapLibre smoke test error'));
    });
  });
}


function simplifyFetchError(err) {
  const message = err?.message || String(err || 'unknown error');
  if (/failed to fetch|load failed|networkerror|network error/i.test(message)) {
    return `${message} (network/CORS/redirect/range blocked)`;
  }
  return message;
}

function headerValue(headers, name) {
  try { return headers.get(name); } catch (err) { return null; }
}

function bytesToAscii(bytes, max = 12) {
  return Array.from(bytes.slice(0, max)).map((byte) => {
    if (byte >= 32 && byte <= 126) return String.fromCharCode(byte);
    return '.';
  }).join('');
}

function inferPmtilesDiagnosticsHint(diag) {
  const source = diag.sourceType || inferPmtilesSourceType(diag.url);
  const headError = diag.head?.error || '';
  const rangeError = diag.range?.error || '';
  const text = `${headError} ${rangeError}`;
  if (diag.range?.status === 404 || diag.head?.status === 404) return 'URL не указывает на файл .pmtiles или release asset не найден.';
  if (/CORS|Failed to fetch|blocked|network/i.test(text) && source === 'github-release-asset') {
    return 'Похоже на ограничение внешнего asset для browser Range/CORS. Файл можно скачивать вручную, но браузер может не читать его как live-источник карты.';
  }
  if (/CORS|Failed to fetch|blocked|network/i.test(text)) {
    return 'Похоже на CORS/Range/network блокировку. Для удалённого файла карты нужны Range requests и CORS.';
  }
  if (diag.range?.status === 200 && diag.range?.bytes > 1024 * 1024) {
    return 'Сервер проигнорировал Range и начал отдавать большой файл целиком. Для файла офлайн-карты нужен byte-range доступ.';
  }
  if (diag.range?.bytes != null && diag.range.bytes < 127) return 'Получено меньше 127 байт; header файла карты неполный.';
  if (diag.range?.magic && !/^PMTiles/.test(diag.range.magic)) return 'Первые байты не похожи на header файла карты; возможно URL ведёт не на файл карты, а на HTML/redirect/error page.';
  return null;
}

async function runLocalPmtilesFileDiagnostics(file, packageInfo = null) {
  const bytes = new Uint8Array(await file.slice(0, 127).arrayBuffer());
  const magic = bytesToAscii(bytes, 12);
  const ok = bytes.byteLength >= 127 && /^PMTiles/.test(magic || '');
  return {
    url: packageInfo?.url || `local-file://${file.name}`,
    absoluteUrl: packageInfo?.url || `local-file://${file.name}`,
    packageId: packageInfo?.id || localPmtilesFileState.packageId,
    packageName: packageInfo?.name || localPmtilesFileState.name,
    sourceType: packageInfo?.sourceType || 'local-file-session',
    sameOrigin: true,
    status: ok ? 'local-file-ready' : 'unexpected-response',
    summary: ok ? `local file ok, ${bytes.byteLength} bytes, ${magic}` : `local file header unexpected, ${bytes.byteLength} bytes, ${magic || 'no magic'}`,
    checkedAt: new Date().toISOString(),
    head: {
      ok: true,
      status: 'local-file',
      statusText: packageInfo?.storageType === 'opfs' ? 'OPFS File API' : packageInfo?.storageType === 'idb-blob' ? 'IndexedDB Blob' : 'File API',
      redirected: false,
      finalUrl: packageInfo?.url || `local-file://${file.name}`,
      contentLength: file.size || null,
      contentType: file.type || 'application/octet-stream',
      acceptRanges: 'blob-slice',
      accessControlAllowOrigin: 'not-needed-local-file',
      error: null
    },
    range: {
      ok,
      status: 'local-slice',
      statusText: 'File.slice',
      redirected: false,
      finalUrl: packageInfo?.url || `local-file://${file.name}`,
      bytes: bytes.byteLength,
      magic,
      contentRange: `bytes 0-${Math.max(0, bytes.byteLength - 1)}/${file.size || bytes.byteLength}`,
      contentLength: bytes.byteLength,
      contentType: file.type || 'application/octet-stream',
      acceptRanges: 'blob-slice',
      accessControlAllowOrigin: 'not-needed-local-file',
      error: null
    },
    hint: ok ? 'Локальное хранилище карты работает: CORS/redirect/HTTP Range не используются.' : 'Первые байты локального файла не похожи на header файла карты.'
  };
}

async function runPmtilesTransportDiagnostics(url = PMTILES_DEFAULT_URL, packageInfo = null) {
  const absoluteUrl = getAbsolutePmtilesUrl(url);
  const diag = {
    url,
    absoluteUrl,
    packageId: packageInfo?.id || null,
    packageName: packageInfo?.name || null,
    sourceType: packageInfo?.sourceType || inferPmtilesSourceType(url),
    sameOrigin: (() => { try { return new URL(absoluteUrl).origin === window.location.origin; } catch (err) { return false; } })(),
    status: 'checking',
    summary: 'checking transport',
    checkedAt: new Date().toISOString(),
    head: null,
    range: null,
    hint: null
  };

  try {
    const head = await fetch(absoluteUrl, { method: 'HEAD', cache: 'no-store', redirect: 'follow' });
    diag.head = {
      ok: head.ok,
      status: head.status,
      statusText: head.statusText,
      redirected: head.redirected,
      finalUrl: head.url,
      contentLength: headerNumber(headerValue(head.headers, 'content-length')),
      contentType: headerValue(head.headers, 'content-type'),
      acceptRanges: headerValue(head.headers, 'accept-ranges'),
      accessControlAllowOrigin: headerValue(head.headers, 'access-control-allow-origin'),
      error: null
    };
  } catch (err) {
    diag.head = { ok: false, status: null, error: simplifyFetchError(err) };
  }

  try {
    const range = await fetch(absoluteUrl, {
      method: 'GET',
      cache: 'no-store',
      redirect: 'follow',
      headers: { Range: 'bytes=0-126' }
    });
    const buffer = await range.arrayBuffer();
    const bytes = new Uint8Array(buffer);
    diag.range = {
      ok: range.ok,
      status: range.status,
      statusText: range.statusText,
      redirected: range.redirected,
      finalUrl: range.url,
      bytes: bytes.byteLength,
      magic: bytesToAscii(bytes, 12),
      contentRange: headerValue(range.headers, 'content-range'),
      contentLength: headerNumber(headerValue(range.headers, 'content-length')),
      contentType: headerValue(range.headers, 'content-type'),
      acceptRanges: headerValue(range.headers, 'accept-ranges'),
      accessControlAllowOrigin: headerValue(range.headers, 'access-control-allow-origin'),
      error: null
    };
  } catch (err) {
    diag.range = { ok: false, status: null, bytes: null, magic: null, error: simplifyFetchError(err) };
  }

  diag.hint = inferPmtilesDiagnosticsHint(diag);
  if (diag.range?.ok && diag.range.bytes >= 127 && /^PMTiles/.test(diag.range.magic || '')) {
    diag.status = 'transport-ready';
    diag.summary = `range ok, ${diag.range.bytes} bytes, ${diag.range.magic}`;
  } else if (diag.head?.status === 404 || diag.range?.status === 404) {
    diag.status = 'not-found';
    diag.summary = 'HTTP 404';
  } else if (diag.head?.error || diag.range?.error) {
    diag.status = 'transport-error';
    diag.summary = diag.range?.error || diag.head?.error || 'transport error';
  } else {
    diag.status = 'unexpected-response';
    diag.summary = `HEAD ${diag.head?.status || 'n/a'}, Range ${diag.range?.status || 'n/a'}`;
  }
  return diag;
}

function renderPmtilesProbeDetails() {
  const el = $('pmtilesProbeDetails');
  if (!el) return;
  const pkg = getSelectedOfflineMapPackage(true);
  const diag = pmtilesRuntimeProbe.diagnostics;
  if (!diag) {
    el.textContent = `Проверка: выбран пакет “${pkg.name}”. Нажми “Проверить выбранный файл карты”, чтобы увидеть HTTP/Range диагностику.`;
    return;
  }
  const parts = [`Проверка: ${diag.summary || diag.status}`];
  if (diag.sourceType === 'local-file-session') parts.push('источник: локальный File API');
  if (diag.sourceType === 'local-file-opfs') parts.push('источник: OPFS');
  if (diag.sourceType === 'local-file-idb') parts.push('источник: IndexedDB');
  if (diag.head) parts.push(`HEAD ${diag.head.status || 'n/a'}`);
  if (diag.range) parts.push(`Range ${diag.range.status || 'n/a'}${diag.range.bytes != null ? ` / ${diag.range.bytes} bytes` : ''}`);
  if (diag.hint) parts.push(`Подсказка: ${diag.hint}`);
  el.textContent = parts.join(' · ');
}

async function readPmtilesPackage(url = PMTILES_DEFAULT_URL, packageInfo = null) {
  let sizeBytes = null;
  const localFileMode = isLocalPmtilesPackage(packageInfo);
  const localFile = localFileMode
    ? (isPersistentPmtilesPackage(packageInfo) ? await readPersistedPmtilesFile(packageInfo) : localPmtilesFileState.file)
    : null;
  if (localFileMode && !localFile) {
    throw Object.assign(new Error('Локальный файл офлайн-карты не найден в хранилище приложения. Импортируй файл заново.'), { code: 'PMTILES_LOCAL_FILE_MISSING' });
  }
  const transportDiagnostics = localFileMode
    ? await runLocalPmtilesFileDiagnostics(localFile, packageInfo)
    : await runPmtilesTransportDiagnostics(url, packageInfo);
  sizeBytes = transportDiagnostics.head?.contentLength || transportDiagnostics.range?.contentLength || null;
  setPmtilesProbeState({ diagnostics: transportDiagnostics }, localFileMode ? 'Local PMTiles File diagnostics completed' : 'PMTiles transport diagnostics completed');
  renderPmtilesProbeDetails();

  if (transportDiagnostics.status === 'not-found') {
    localStorage.removeItem(OFFLINE_MAP_PACKAGE_META_KEY);
    throw Object.assign(new Error(`${url} not found`), { code: 'PMTILES_NOT_FOUND', status: 404, diagnostics: transportDiagnostics });
  }

  const registration = localFileMode ? registerPmtilesArchiveForPackage(packageInfo) : null;
  const archive = registration?.archive || new window.pmtiles.PMTiles(getAbsolutePmtilesUrl(url));
  const header = await archive.getHeader();
  let metadata = null;
  try {
    metadata = await archive.getMetadata();
  } catch (err) {
    recordMapDebug('PMTiles metadata read failed', err?.message || String(err));
  }

  const normalizedHeader = normalizePmtilesHeader(header);
  const summarizedMetadata = summarizePmtilesMetadata(metadata);
  const meta = {
    id: packageInfo?.id || `pmtiles:${url}`,
    name: summarizedMetadata?.name || packageInfo?.name || localPmtilesFileState.name || url.split('/').pop() || 'offline-test.pmtiles',
    format: 'pmtiles',
    runtime: 'maplibre-pmtiles-probe',
    source: packageInfo?.sourceType || packageInfo?.source || inferPmtilesSourceType(url),
    url,
    sizeBytes,
    bbox: [normalizedHeader.minLon, normalizedHeader.minLat, normalizedHeader.maxLon, normalizedHeader.maxLat].every((value) => value != null)
      ? [normalizedHeader.minLon, normalizedHeader.minLat, normalizedHeader.maxLon, normalizedHeader.maxLat]
      : null,
    minZoom: normalizedHeader.minZoom,
    maxZoom: normalizedHeader.maxZoom,
    center: normalizedHeader.centerLon != null && normalizedHeader.centerLat != null
      ? { lon: normalizedHeader.centerLon, lat: normalizedHeader.centerLat, zoom: normalizedHeader.centerZoom }
      : null,
    tileType: normalizedHeader.tileType,
    tileCompression: normalizedHeader.tileCompression,
    metadata: summarizedMetadata,
    packageVersion: packageInfo?.version || null,
    manifestId: offlineMapManifest.selectedPackageId || null,
    checkedAt: new Date().toISOString(),
    installedAt: new Date().toISOString()
  };
  localStorage.setItem(OFFLINE_MAP_PACKAGE_META_KEY, JSON.stringify(meta));
  offlinePackageMeta = meta;
  offlinePackageStatus = 'metadata-ready-runtime-experimental';
  return { header: normalizedHeader, metadata: summarizedMetadata, meta };
}

async function runPmtilesRuntimeProbe() {
  const activePackage = getActiveOfflineMapPackage();
  const url = activePackage.url;
  setPmtilesProbeState({
    url,
    status: 'loading-runtime',
    maplibreLoaded: false,
    pmtilesLoaded: false,
    webgl: hasWebGLSupport(),
    protocolRegistered: false,
    packageFound: false,
    header: null,
    metadata: null,
    error: null,
    diagnostics: null,
    packageId: activePackage.id || null,
    packageName: activePackage.name || null
  }, 'PMTiles runtime probe started');

  try {
    const runtime = await ensureExperimentalMapLibreRuntime();
    setPmtilesProbeState({
      status: 'starting-maplibre',
      maplibreLoaded: runtime.maplibreLoaded,
      pmtilesLoaded: runtime.pmtilesLoaded,
      protocolRegistered: runtime.protocolRegistered,
      webgl: hasWebGLSupport()
    }, 'MapLibre/PMTiles runtime loaded');

    await startMapLibreSmokeTest();

    setPmtilesProbeState({ status: 'checking-package' }, 'offline map preview module ready; checking map file');
    try {
      const result = await readPmtilesPackage(url, activePackage);
      setPmtilesProbeState({
        status: 'ready',
        packageFound: true,
        header: result.header,
        metadata: result.metadata,
        error: null
      }, 'пакет карты header/metadata read');
      setMapProviderState({ offlinePackageStatus: 'metadata-ready-runtime-experimental' }, 'пакет карты metadata ready; Leaflet remains primary');
      setCurrentPmtilesProbeButtonStatus('готово', 'header/metadata файла карты прочитаны');
      updateMapDebugUi(true);
      return true;
    } catch (err) {
      const notFound = err?.code === 'PMTILES_NOT_FOUND' || err?.status === 404;
      if (notFound) {
        offlinePackageStatus = 'not-installed';
        offlinePackageMeta = null;
        setPmtilesProbeState({
          status: 'maplibre-ready-no-package',
          packageFound: false,
          error: `${url} not found`
        }, 'MapLibre/PMTiles runtime ready, but selected offline map package is not available');
        setMapProviderState({ offlinePackageStatus: 'not-installed' }, 'PMTiles runtime ready; selected package missing');
        setCurrentPmtilesProbeButtonStatus('готово', 'модуль готов, выбранный файл карты не найден');
        updateMapDebugUi(true);
        return false;
      }
      setPmtilesProbeState({ status: 'package-error', error: err?.message || String(err), diagnostics: err?.diagnostics || pmtilesRuntimeProbe.diagnostics || null }, 'пакет карты read failed');
      setCurrentPmtilesProbeButtonStatus('ошибка', err?.message || String(err));
      updateMapDebugUi(true);
      return false;
    }
  } catch (err) {
    setPmtilesProbeState({
      status: window.maplibregl ? 'maplibre-failed' : 'runtime-failed',
      maplibreLoaded: Boolean(window.maplibregl && window.maplibregl.Map),
      pmtilesLoaded: Boolean(window.pmtiles && window.pmtiles.PMTiles),
      protocolRegistered: Boolean(pmtilesProtocol),
      webgl: hasWebGLSupport(),
      error: err?.message || String(err)
    }, 'PMTiles runtime probe failed');
    setCurrentPmtilesProbeButtonStatus('ошибка', err?.message || String(err));
    updateMapDebugUi(true);
    return false;
  }
}

function getRenderedTileCounts() {
  const tiles = Array.from(document.querySelectorAll('.leaflet-tile'));
  const loaded = tiles.filter((tile) => tile.classList.contains('leaflet-tile-loaded') && tile.naturalWidth !== 0).length;
  const broken = tiles.filter((tile) => tile.complete && tile.naturalWidth === 0).length;
  return { total: tiles.length, loaded, broken };
}

function keepOnlineRasterLayerForOfflineTransition(reason = 'browser offline') {
  if (!canUseMapRuntime() || isLeafletOfflineLiteRuntime() || !baseTileLayer) return false;

  const tiles = getRenderedTileCounts();
  if (tiles.loaded <= 0) {
    recordMapDebug('offline transition has no loaded tiles to keep', { reason, tiles });
    return false;
  }

  setMapProviderState({
    mapProvider: MAP_PROVIDER_ONLINE_RASTER,
    mapSourceStatus: 'online-stale-offline',
    fallbackActive: false
  }, reason);
  recordMapDebug('offline transition kept already rendered raster tiles', { reason, tiles });
  setMapStatus('Карта: офлайн, показаны загруженные тайлы', 'warn');
  safeInvalidateMap(0, 'offline transition keep raster');
  safeInvalidateMap(350, 'offline transition keep raster delayed');
  return true;
}

function removeBaseTileLayer(reason = 'remove base layer') {
  if (!baseTileLayer) return;
  try {
    baseTileLayer.remove();
    recordMapDebug('base tile layer removed', reason);
  } catch (err) {
    recordMapDebug('base tile layer remove failed', err?.message || String(err));
  }
  baseTileLayer = null;
}

function activateNoBasemapFallback(reason = 'basemap unavailable') {
  if (!canUseMapRuntime()) {
    setMapProviderState({ mapProvider: MAP_PROVIDER_NO_BASEMAP, mapSourceStatus: 'empty-ready', fallbackActive: true }, reason);
    return;
  }
  removeBaseTileLayer(reason);
  setMapProviderState({ mapProvider: MAP_PROVIDER_NO_BASEMAP, mapSourceStatus: 'empty-ready', fallbackActive: true }, reason);
  safeInvalidateMap(0, 'no-basemap fallback');
}

function mountOnlineRasterProvider(reason = 'mount online raster') {
  if (!canUseMapRuntime()) return false;
  if (isLeafletOfflineLiteRuntime()) {
    activateNoBasemapFallback('online raster requires full Leaflet runtime');
    return false;
  }
  removeBaseTileLayer('replace basemap provider');
  resetMapTileStats(MAP_PROVIDER_ONLINE_RASTER);
  baseTileLayer = createOnlineRasterLayer();
  baseTileLayer
    .on('loading', () => {
      mapTileStats.loading += 1;
      if (mapProvider === MAP_PROVIDER_ONLINE_RASTER && !(mapSourceStatus === 'online-stale-offline' && !navigator.onLine)) {
        mapSourceStatus = 'online-loading';
      }
      recordMapDebug('tile loading', { provider: MAP_PROVIDER_ONLINE_RASTER });
    })
    .on('tileload', (e) => {
      mapTileStats.load += 1;
      mapTileStats.lastTileUrl = e.tile?.currentSrc || e.tile?.src || null;
      if (mapProvider === MAP_PROVIDER_ONLINE_RASTER) {
        mapSourceStatus = navigator.onLine ? 'online-ready' : 'online-stale-offline';
        mapFallbackActive = false;
      }
      updateMapDebugUi(false);
    })
    .on('tileerror', (e) => {
      mapTileStats.error += 1;
      mapTileStats.lastError = e.tile?.currentSrc || e.tile?.src || 'unknown tile';
      mapSourceStatus = 'online-error';
      recordMapDebug('tile error', { provider: MAP_PROVIDER_ONLINE_RASTER, url: mapTileStats.lastError, errors: mapTileStats.error });
      setMapStatus('Карта: ошибка тайлов', 'bad');
      if (!navigator.onLine) {
        if (keepOnlineRasterLayerForOfflineTransition('browser offline during tile load')) return;
        activateNoBasemapFallback('online raster unavailable offline');
        return;
      }
      if (mapTileStats.error >= 3 && mapTileStats.load === 0) {
        activateNoBasemapFallback('online raster unavailable');
      }
    })
    .addTo(map);
  setMapProviderState({ mapProvider: MAP_PROVIDER_ONLINE_RASTER, mapSourceStatus: 'online-loading', fallbackActive: false }, reason);
  return true;
}

function mountMapProvider(providerId, reason = 'provider selected') {
  readOfflinePackageMeta();
  if (providerId === MAP_PROVIDER_OFFLINE_PMTILES) {
    setMapProviderState({
      mapProvider: MAP_PROVIDER_OFFLINE_PMTILES,
      mapSourceStatus: offlinePackageStatus === 'not-installed' ? 'offline-not-installed' : 'offline-runtime-not-enabled',
      fallbackActive: true
    }, reason);
    activateNoBasemapFallback('offline PMTiles runtime not enabled');
    return false;
  }
  if (providerId === MAP_PROVIDER_NO_BASEMAP) {
    activateNoBasemapFallback(reason);
    return true;
  }
  return mountOnlineRasterProvider(reason);
}

function selectInitialMapProvider() {
  readOfflinePackageMeta();
  if (isLeafletOfflineLiteRuntime()) return MAP_PROVIDER_NO_BASEMAP;
  if (!navigator.onLine && offlinePackageStatus !== 'ready') return MAP_PROVIDER_NO_BASEMAP;
  return MAP_PROVIDER_ONLINE_RASTER;
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

function normalizeAppScreen(screen) {
  return APP_SCREENS.includes(screen) ? screen : 'map';
}

function resizePmtilesPreviewMap(delay = 0, reason = 'screen change') {
  if (!pmtilesPreviewMap || typeof pmtilesPreviewMap.resize !== 'function') return;
  window.setTimeout(() => {
    try {
      pmtilesPreviewMap.resize();
      if (typeof pmtilesPreviewMap.triggerRepaint === 'function') pmtilesPreviewMap.triggerRepaint();
      recordMapDebug(`PMTiles preview resize: ${reason}`);
    } catch (err) {
      recordMapDebug('PMTiles preview resize failed', err?.message || String(err));
    }
  }, delay);
}

function resizeActiveScreenMaps(reason = 'screen change') {
  if (activeAppScreen === 'map') {
    safeInvalidateMap(0, reason);
    safeInvalidateMap(250, `${reason} delayed`);
    window.setTimeout(() => updateMapDebugUi(false), 300);
  }
  if (activeAppScreen === 'offline') {
    resizePmtilesPreviewMap(0, reason);
    resizePmtilesPreviewMap(250, `${reason} delayed`);
  }
}

function switchAppScreen(screen, options = {}) {
  const next = normalizeAppScreen(screen);
  const { persist = true, scrollTop = true } = options;
  activeAppScreen = next;
  if (next !== 'map' && onlineMapExpanded) setOnlineMapExpanded(false);

  document.querySelectorAll('[data-app-screen]').forEach((section) => {
    const isActive = section.dataset.appScreen === next;
    section.hidden = !isActive;
    section.classList.toggle('app-screen-active', isActive);
  });

  document.querySelectorAll('[data-screen-target]').forEach((button) => {
    const isActive = button.dataset.screenTarget === next;
    button.classList.toggle('active', isActive);
    if (isActive) button.setAttribute('aria-current', 'page');
    else button.removeAttribute('aria-current');
  });

  if (persist) {
    try { localStorage.setItem(APP_SCREEN_STORAGE_KEY, next); } catch {}
  }

  if (scrollTop) {
    const activeSection = document.querySelector(`[data-app-screen="${next}"]`);
    activeSection?.scrollIntoView({ behavior: 'smooth', block: 'start' });
  }

  resizeActiveScreenMaps(`active screen: ${next}`);
  renderSettingsDiagnostics();
  return next;
}

function restoreAppScreen() {
  let saved = 'map';
  try { saved = localStorage.getItem(APP_SCREEN_STORAGE_KEY) || 'map'; } catch {}
  switchAppScreen(saved, { persist: false, scrollTop: false });
}

function setMapAdvancedControlsVisibility(enabled, options = {}) {
  const next = Boolean(enabled);
  const { persist = true } = options;
  showMapAdvancedControls = next;

  const panel = $('mapAdvancedPanel');
  if (panel) panel.hidden = !next;

  document.querySelectorAll('[data-advanced-only]').forEach((element) => {
    element.hidden = !next;
  });

  const toggle = $('showMapAdvancedToggle');
  if (toggle) toggle.checked = next;

  const hint = $('mapAdvancedToggleHint');
  if (hint) {
    hint.textContent = next
      ? 'Включено: доступны инженерные действия, диагностика, ремонт карты, кэш и чистка БД.'
      : 'Выключено: технические действия скрыты, обычные сценарии остаются на виду.';
  }

  const pill = $('advancedModePill');
  if (pill) {
    pill.textContent = next ? 'включен' : 'выключен';
    pill.className = next ? 'pill on' : 'pill warn';
  }

  document.body.classList.toggle('map-advanced-enabled', next);

  if (persist) {
    try { localStorage.setItem(APP_ADVANCED_MODE_KEY, next ? '1' : '0'); } catch {}
  }

  renderSettingsDiagnostics();
  if (activeAppScreen === 'map') resizeActiveScreenMaps('advanced mode changed');
}

function restoreMapAdvancedControlsPreference() {
  let saved = '0';
  try {
    saved = localStorage.getItem(APP_ADVANCED_MODE_KEY)
      || localStorage.getItem('mushroom_show_map_advanced_controls_v1')
      || '0';
  } catch {}
  setMapAdvancedControlsVisibility(saved === '1', { persist: false });
}

function renderSettingsDiagnostics() {
  const provider = mapProviderSnapshot();
  const cfg = typeof getSupabaseConfig === 'function' ? getSupabaseConfig() : null;
  const gpsText = currentPosition
    ? `есть позиция, точность ${meters(currentPosition.accuracy)}`
    : 'геопозиция ещё не запускалась';
  const mapText = provider.mapProvider === MAP_PROVIDER_NO_BASEMAP || provider.fallbackActive
    ? 'подложка недоступна, точки и GPS продолжают работать'
    : provider.mapSourceStatus === 'online-ready'
      ? 'онлайн-подложка работает'
      : provider.mapSourceStatus || 'проверяется';
  const supabaseText = cfg
    ? (apiDebugEvents.length ? `настроена, запросов: ${apiDebugEvents.length}` : 'настроена, запросов ещё не было')
    : 'не настроена';
  const pmtilesText = localPmtilesFileState.status === 'selected'
    ? `импортирована карта: ${getUserFacingOfflineMapState().title}`
    : offlinePackageStatus === 'preview-ready-runtime-experimental'
      ? 'предпросмотр готов'
      : 'файл карты не выбран';
  const swText = 'serviceWorker' in navigator
    ? ('caches' in window ? 'кэш приложения доступен' : 'service worker доступен, Cache API недоступен')
    : 'кэш приложения недоступен';

  const setText = (id, value) => {
    const element = $(id);
    if (element) element.textContent = value;
  };

  setText('settingsOfflineModeStatus', pmtilesText);
  setText('settingsCacheStatus', `mushroom-spots-v${APP_VERSION}`);
  setText('settingsGpsDiagnostic', gpsText);
  setText('settingsMapDiagnostic', mapText);
  setText('settingsSupabaseDiagnostic', supabaseText);
  setText('settingsPmtilesDiagnostic', pmtilesText);
  setText('settingsServiceWorkerDiagnostic', swText);
  setText('settingsActiveScreenDiagnostic', activeAppScreen);
  setText('settingsOnlineDiagnostic', navigator.onLine ? 'онлайн' : 'офлайн');
  setText('settingsMapProviderDiagnostic', `${provider.mapProvider} / ${provider.mapSourceStatus}`);
  setText('settingsPmtilesRuntimeDiagnostic', `${offlinePackageStatus} / ${pmtilesRuntimeProbe.status}`);
  const clearStatus = $('offlineMapFilesClearStatus');
  if (clearStatus && !clearStatus.dataset.userUpdated) {
    const count = (rememberedPmtilesMapsState.maps || []).length;
    clearStatus.textContent = count ? `Импортированных офлайн-карт: ${count}.` : 'Файлы офлайн-карт не очищались.';
  }
}

function bindAppNavigationShell() {
  document.querySelectorAll('[data-screen-target]').forEach((button) => {
    button.addEventListener('click', () => {
      const target = button.dataset.screenTarget || 'map';
      if (target === 'spots') backToSpotCollections();
      switchAppScreen(target);
    });
  });

  if ($('showMapAdvancedToggle')) {
    $('showMapAdvancedToggle').addEventListener('change', (event) => {
      setMapAdvancedControlsVisibility(event.target.checked);
    });
  }
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
      setMapStatus('Карта: ошибка размера', 'bad');
    }
  }, delay);
}

function updateOnlineMapExpandInsets() {
  const topbar = document.querySelector('.topbar');
  const bottomNav = document.querySelector('.bottom-nav');
  const viewportHeight = window.innerHeight || document.documentElement.clientHeight || 0;
  const topInset = topbar ? Math.max(0, Math.round(topbar.getBoundingClientRect().bottom)) : 0;
  const bottomInset = bottomNav
    ? Math.max(0, Math.ceil(viewportHeight - bottomNav.getBoundingClientRect().top))
    : 0;
  document.documentElement.style.setProperty('--online-map-expand-top', `${topInset}px`);
  document.documentElement.style.setProperty('--online-map-expand-bottom', `${bottomInset}px`);
}

function renderOnlineMapExpandButton() {
  const button = $('mapExpandBtn');
  if (!button) return;
  button.textContent = onlineMapExpanded ? '↙' : '⛶';
  button.setAttribute('aria-pressed', onlineMapExpanded ? 'true' : 'false');
  button.setAttribute('aria-label', onlineMapExpanded ? 'Свернуть карту' : 'Развернуть карту');
}

function setOnlineMapExpanded(expanded) {
  onlineMapExpanded = Boolean(expanded);
  updateOnlineMapExpandInsets();
  document.body.classList.toggle('online-map-expanded', onlineMapExpanded);
  renderOnlineMapExpandButton();
  safeInvalidateMap(0, onlineMapExpanded ? 'online map expanded' : 'online map collapsed');
  safeInvalidateMap(250, onlineMapExpanded ? 'online map expanded delayed' : 'online map collapsed delayed');
  window.setTimeout(updateOnlineMapExpandInsets, 50);
  window.setTimeout(updateOnlineMapExpandInsets, 250);
  return onlineMapExpanded;
}

function toggleOnlineMapExpanded() {
  return setOnlineMapExpanded(!onlineMapExpanded);
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
    activeAppScreen,
    providerState: mapProviderSnapshot(),
    mapExists: Boolean(map),
    leafletLoaded: Boolean(window.L),
    leafletOfflineLite: isLeafletOfflineLiteRuntime(),
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

  updateOfflineMapStatusPill();
  updatePmtilesRuntimeStatusPill();

  if (!snapshot.leafletLoaded) {
    setMapStatus('Карта: движок не загружен', 'bad');
  } else if (snapshot.providerState.mapSourceStatus === 'online-stale-offline') {
    setMapStatus('Карта: офлайн, показаны загруженные тайлы', 'warn');
  } else if (snapshot.providerState.mapProvider === MAP_PROVIDER_NO_BASEMAP || snapshot.providerState.fallbackActive) {
    setMapStatus('Карта: подложка недоступна, точки и GPS продолжают работать', 'warn');
  } else if (snapshot.providerState.mapSourceStatus === 'online-ready' || snapshot.tileDom.loaded > 0) {
    setMapStatus('Карта: онлайн', 'on');
  } else if (snapshot.providerState.mapSourceStatus === 'offline-not-installed') {
    setMapStatus('Карта: офлайн-пакет не установлен', 'warn');
  } else if (snapshot.tileStats.error > 0) {
    setMapStatus('Карта: ошибка тайлов', 'bad');
  } else if (snapshot.tileDom.total > 0 && snapshot.tileDom.loaded === 0) {
    setMapStatus('Карта: тайлы не загружены', 'warn');
  } else if (activeAppScreen === 'map' && snapshot.mapElementRect && snapshot.mapElementRect.height < 100) {
    setMapStatus('Карта: малый контейнер', 'bad');
  } else {
    setMapStatus('Карта: онлайн загружается', 'warn');
  }

  if (textEl && (forceText || $('mapDebugDialog')?.open)) {
    textEl.textContent = formatDiagnosticsText();
  }

  renderSettingsDiagnostics();

  const hint = $('mapHint');
  if (hint) {
    if (!snapshot.leafletLoaded) {
      hint.textContent = 'Движок карты не загрузился. Локальные точки и GPS-координаты остаются в данных, но визуальная карта недоступна до полной загрузки приложения.';
    } else if (snapshot.providerState.mapSourceStatus === 'online-stale-offline') {
      hint.textContent = 'Интернет выключен. Приложение удерживает уже загруженные тайлы, чтобы карта не исчезала до перезагрузки. Новые участки подложки без офлайн-пакета не догрузятся, но точки и GPS продолжают работать.';
    } else if (snapshot.providerState.mapProvider === MAP_PROVIDER_NO_BASEMAP || snapshot.providerState.fallbackActive) {
      hint.textContent = 'Подложка карты недоступна. GPS, сохранённые точки, выбранная точка, точки из чата и геопозиции друзей продолжают работать поверх пустого фона.';
    } else if (snapshot.providerState.offlinePackageStatus === 'preview-ready-runtime-experimental') {
      hint.textContent = 'Предпросмотр офлайн-карты открыт в отдельном окне из выбранного файла. Точки, GPS и чат остаются доступными в обычном режиме приложения.';
    } else if (snapshot.providerState.offlinePackageStatus === 'metadata-ready-runtime-experimental') {
      hint.textContent = 'Выбранный файл офлайн-карты читается модулем предпросмотра. Если это внешний файл из списка карт, приложение проверяет ссылку без автоскачивания большой карты.';
    } else if (snapshot.tileStats.error > 0) {
      hint.textContent = `Есть ошибки загрузки тайлов: ${snapshot.tileStats.error}. Открой “!” и скопируй диагностику.`;
    } else if (snapshot.tileDom.total > 0 && snapshot.tileDom.loaded === 0) {
      hint.textContent = 'Тайлы созданы, но не загрузились. Проверь интернет или нажми “Починить карту”.';
    } else {
      hint.textContent = 'Сейчас используется online raster provider. Файл офлайн-карты ещё не выбран; точки и GPS отделены от подложки.';
    }
  }
}


function fmtBboxCoord(value) {
  return Number(value).toFixed(6);
}

function normalizeBboxBoundsFromCorners(a, b) {
  const lat1 = Number(a?.lat);
  const lon1 = Number(a?.lng ?? a?.lon);
  const lat2 = Number(b?.lat);
  const lon2 = Number(b?.lng ?? b?.lon);
  if (![lat1, lon1, lat2, lon2].every(Number.isFinite)) return null;
  const west = Math.min(lon1, lon2);
  const south = Math.min(lat1, lat2);
  const east = Math.max(lon1, lon2);
  const north = Math.max(lat1, lat2);
  if (west === east || south === north) return null;
  return { west, south, east, north };
}

function bboxArray(bounds) {
  if (!bounds) return null;
  return [bounds.west, bounds.south, bounds.east, bounds.north].map(fmtBboxCoord);
}

function buildPmtilesExtractCommand(bounds) {
  const parts = bboxArray(bounds);
  if (!parts) return '';
  return `./pmtiles extract "$SOURCE" ${BBOX_EXPORT_OUTPUT_FILE} \\\n  --bbox=${parts.join(',')} \\\n  --maxzoom=${BBOX_EXPORT_MAX_ZOOM}`;
}

function getBboxExportSnapshot() {
  return {
    mode: bboxExportState.mode,
    firstCorner: bboxExportState.firstCorner ? {
      lat: Number(bboxExportState.firstCorner.lat),
      lon: Number(bboxExportState.firstCorner.lng ?? bboxExportState.firstCorner.lon)
    } : null,
    bounds: bboxArray(bboxExportState.bounds),
    command: bboxExportState.command || '',
    source: bboxExportState.source || null,
    updatedAt: bboxExportState.updatedAt || null,
    error: bboxExportState.error || null
  };
}


function ensureBboxExportSelectionOverlay() {
  if (bboxExportSelectionOverlay && bboxExportSelectionOverlay.isConnected) return bboxExportSelectionOverlay;
  const mapEl = $('map');
  const host = mapEl?.closest?.('.map-wrap') || mapEl?.parentElement;
  if (!host) return null;

  const overlay = document.createElement('div');
  overlay.id = 'bboxSelectionOverlay';
  overlay.className = 'bbox-selection-overlay';
  overlay.setAttribute('role', 'button');
  overlay.setAttribute('aria-label', 'Выбор прямоугольника региона: нажми два противоположных угла на карте');
  overlay.tabIndex = 0;
  overlay.innerHTML = '<span id="bboxSelectionOverlayHint">Нажми первый угол региона</span>';

  const captureOptions = { passive: false, capture: true };
  ['pointerdown', 'mousedown', 'touchstart'].forEach((type) => overlay.addEventListener(type, rememberBboxExportPointerStart, captureOptions));
  ['pointerup', 'mouseup', 'touchend', 'click'].forEach((type) => overlay.addEventListener(type, handleBboxExportDomSelectionEvent, captureOptions));
  ['pointercancel', 'touchcancel', 'mouseleave', 'mouseout'].forEach((type) => overlay.addEventListener(type, () => { bboxExportPointerStart = null; }, captureOptions));
  overlay.addEventListener('contextmenu', (event) => {
    stopBboxExportDomEvent(event);
    bboxExportPointerStart = null;
  }, captureOptions);
  overlay.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') {
      stopBboxExportDomEvent(event);
      clearBboxExport();
    }
  });

  host.appendChild(overlay);
  bboxExportSelectionOverlay = overlay;
  return overlay;
}

function updateBboxExportSelectionOverlay() {
  if (bboxExportState.mode !== 'selecting') {
    if (bboxExportSelectionOverlay) {
      try { bboxExportSelectionOverlay.remove(); } catch {}
      bboxExportSelectionOverlay = null;
    }
    bboxExportPointerStart = null;
    return;
  }

  const overlay = ensureBboxExportSelectionOverlay();
  if (!overlay) return;
  overlay.hidden = false;
  overlay.dataset.phase = bboxExportState.firstCorner ? 'second-corner' : 'first-corner';
  const hint = overlay.querySelector('#bboxSelectionOverlayHint');
  if (hint) {
    hint.textContent = bboxExportState.firstCorner
      ? 'Нажми противоположный угол региона'
      : 'Нажми первый угол региона';
  }
}

function removeBboxExportLayer() {
  if (bboxExportLayer) {
    try { bboxExportLayer.remove(); } catch {}
    bboxExportLayer = null;
  }
}

function drawBboxExportLayer(bounds, tentative = false) {
  if (!canUseMapRuntime() || !bounds) return;
  removeBboxExportLayer();
  const latLngs = [
    [bounds.south, bounds.west],
    [bounds.south, bounds.east],
    [bounds.north, bounds.east],
    [bounds.north, bounds.west],
    [bounds.south, bounds.west]
  ];
  const options = {
    color: tentative ? '#f59e0b' : '#dc2626',
    weight: tentative ? 2 : 3,
    opacity: 0.95,
    fill: true,
    fillOpacity: tentative ? 0.04 : 0.08,
    dashArray: tentative ? '6 6' : null
  };
  try {
    if (window.L.rectangle && window.L.latLngBounds) {
      const leafletBounds = window.L.latLngBounds([[bounds.south, bounds.west], [bounds.north, bounds.east]]);
      bboxExportLayer = window.L.rectangle(leafletBounds, options).addTo(map);
    } else if (window.L.polyline) {
      bboxExportLayer = window.L.polyline(latLngs, options).addTo(map);
    }
  } catch (err) {
    bboxExportState.error = err?.message || String(err);
    recordMapDebug('bbox export layer draw failed', bboxExportState.error);
  }
}

function updateBboxExportUi() {
  const status = $('bboxExportStatus');
  const output = $('bboxCommandOutput');
  const snapshot = getBboxExportSnapshot();

  if (output) output.value = bboxExportState.command || '';

  if (status) {
    if (bboxExportState.mode === 'selecting' && !bboxExportState.firstCorner) {
      status.textContent = 'Регион: режим выбора включён. Нажми первый угол прямоугольника на основной карте.';
    } else if (bboxExportState.mode === 'selecting' && bboxExportState.firstCorner) {
      const c = bboxExportState.firstCorner;
      status.textContent = `Регион: первый угол выбран (${fmtBboxCoord(c.lng ?? c.lon)}, ${fmtBboxCoord(c.lat)}). Нажми противоположный угол.`;
    } else if (bboxExportState.command && snapshot.bounds) {
      status.textContent = `Регион готов: ${snapshot.bounds.join(',')}. Команда ниже уже содержит координаты с точностью 6 знаков.`;
    } else if (bboxExportState.error) {
      status.textContent = `Регион: ошибка — ${bboxExportState.error}`;
    } else {
      status.textContent = 'Регион не выбран. Нажми “Выбрать прямоугольник”, затем укажи на карте два противоположных угла.';
    }
  }

  setDisabled('copyBboxCommandBtn', !bboxExportState.command);
  setDisabled('clearBboxExportBtn', !bboxExportState.command && bboxExportState.mode === 'idle' && !bboxExportState.firstCorner);
  updateBboxExportSelectionOverlay();
  updateMapDebugUi(false);
}

function revealBboxExportResult(source = 'manual') {
  if (!bboxExportState.command) return;
  if (source === 'manual-two-corners') {
    switchAppScreen('offline', { scrollTop: false });
    window.setTimeout(() => {
      const panel = document.querySelector('.bbox-export-panel');
      try { panel?.scrollIntoView?.({ behavior: 'smooth', block: 'center' }); } catch {}
      const output = $('bboxCommandOutput');
      try { output?.focus?.({ preventScroll: true }); } catch {}
    }, 0);
  }
}

function setBboxExportBounds(bounds, source = 'manual') {
  if (!bounds) {
    bboxExportState = {
      ...bboxExportState,
      mode: 'idle',
      firstCorner: null,
      bounds: null,
      command: '',
      updatedAt: new Date().toISOString(),
      source,
      error: 'некорректный прямоугольник'
    };
    removeBboxExportLayer();
    updateBboxExportUi();
    return false;
  }
  bboxExportState = {
    mode: 'ready',
    firstCorner: null,
    bounds,
    command: buildPmtilesExtractCommand(bounds),
    updatedAt: new Date().toISOString(),
    source,
    error: null
  };
  drawBboxExportLayer(bounds, false);
  recordMapDebug('bbox export ready', getBboxExportSnapshot());
  updateBboxExportUi();
  revealBboxExportResult(source);
  return true;
}

function startBboxExportSelection() {
  if (!canUseMapRuntime()) {
    markButtonBlocked('карта недоступна');
    bboxExportState = { ...bboxExportState, mode: 'idle', error: 'карта недоступна' };
    updateBboxExportUi();
    return false;
  }
  cancelMapLongPress();
  lastBboxExportClick = null;
  bboxExportPointerStart = null;
  lastBboxExportDomSelectionAt = 0;
  lastBboxExportDomSelectionPoint = null;
  bboxExportState = {
    mode: 'selecting',
    firstCorner: null,
    bounds: null,
    command: '',
    updatedAt: new Date().toISOString(),
    source: 'manual-two-corners',
    error: null
  };
  removeBboxExportLayer();
  updateBboxExportUi();
  window.setTimeout(() => {
    try { bboxExportSelectionOverlay?.focus?.({ preventScroll: true }); } catch {}
  }, 0);
  setButtonApiStatus(activeButtonDiagnostics || { buttonId: 'startBboxExportBtn', label: getButtonDiagnosticLabel('startBboxExportBtn') }, 'готово', 'режим выбора региона включён');
  return true;
}

function isDuplicateBboxExportClick(latlng) {
  if (!latlng || !lastBboxExportClick) return false;
  const now = Date.now();
  const sameLat = Math.abs(Number(latlng.lat) - Number(lastBboxExportClick.lat)) < 0.000001;
  const sameLng = Math.abs(Number(latlng.lng) - Number(lastBboxExportClick.lng)) < 0.000001;
  return sameLat && sameLng && now - lastBboxExportClick.at < 350;
}

function rememberBboxExportClick(latlng) {
  lastBboxExportClick = { lat: Number(latlng.lat), lng: Number(latlng.lng), at: Date.now() };
}

function handleBboxExportMapClick(event) {
  if (bboxExportState.mode !== 'selecting') return;
  const latlng = event?.latlng;
  if (!latlng || !Number.isFinite(latlng.lat) || !Number.isFinite(latlng.lng)) return;
  if (isDuplicateBboxExportClick(latlng)) return;
  rememberBboxExportClick(latlng);

  if (!bboxExportState.firstCorner) {
    bboxExportState = {
      ...bboxExportState,
      firstCorner: { lat: latlng.lat, lng: latlng.lng },
      updatedAt: new Date().toISOString(),
      error: null
    };
    recordMapDebug('bbox export first corner selected', getBboxExportSnapshot());
    updateBboxExportUi();
    return;
  }

  const bounds = normalizeBboxBoundsFromCorners(bboxExportState.firstCorner, latlng);
  if (!bounds) {
    bboxExportState = { ...bboxExportState, error: 'второй угол совпадает с первым или координаты некорректны' };
    updateBboxExportUi();
    return;
  }
  setBboxExportBounds(bounds, 'manual-two-corners');
}

function handleBboxExportMouseMove(event) {
  if (bboxExportState.mode !== 'selecting' || !bboxExportState.firstCorner || !event?.latlng) return;
  const bounds = normalizeBboxBoundsFromCorners(bboxExportState.firstCorner, event.latlng);
  if (bounds) drawBboxExportLayer(bounds, true);
}

function useVisibleMapBbox() {
  if (!canUseMapRuntime() || !map.getBounds) {
    markButtonBlocked('границы видимой области недоступны');
    bboxExportState = { ...bboxExportState, error: 'границы видимой области недоступны' };
    updateBboxExportUi();
    return false;
  }
  const b = map.getBounds();
  const bounds = {
    west: b.getWest(),
    south: b.getSouth(),
    east: b.getEast(),
    north: b.getNorth()
  };
  const ok = setBboxExportBounds(bounds, 'visible-map-bounds');
  if (ok) setButtonApiStatus(activeButtonDiagnostics || { buttonId: 'useVisibleBboxBtn', label: getButtonDiagnosticLabel('useVisibleBboxBtn') }, 'готово', bboxArray(bounds).join(','));
  return ok;
}

function clearBboxExport() {
  bboxExportState = {
    mode: 'idle',
    firstCorner: null,
    bounds: null,
    command: '',
    updatedAt: new Date().toISOString(),
    source: null,
    error: null
  };
  removeBboxExportLayer();
  updateBboxExportUi();
  setButtonApiStatus(activeButtonDiagnostics || { buttonId: 'clearBboxExportBtn', label: getButtonDiagnosticLabel('clearBboxExportBtn') }, 'готово', 'регион сброшен');
}

async function copyBboxCommand() {
  if (!bboxExportState.command) {
    markButtonBlocked('регион не выбран');
    alert('Сначала выбери прямоугольник или возьми видимую область карты.');
    return false;
  }
  const text = bboxExportState.command;
  const requestId = beginApiRequest('Clipboard.writeText', 'BROWSER', 'pmtiles extract command');
  try {
    await navigator.clipboard.writeText(text);
    finishApiRequest(requestId, 'готово', 'команда скопирована');
    return true;
  } catch (err) {
    finishApiRequest(requestId, 'ошибка', err?.message || 'clipboard недоступен');
    const output = $('bboxCommandOutput');
    if (output) {
      output.focus();
      output.select();
    }
    alert('Не удалось скопировать автоматически. Команда выделена в поле ниже.');
    return false;
  }
}

function getBboxExportDomPoint(event) {
  const sourceEvent = event?.changedTouches?.[0] || event?.touches?.[0] || event;
  if (!sourceEvent) return null;
  const mapEl = $('map');
  const rect = mapEl?.getBoundingClientRect?.();
  if (!rect) return null;
  const x = Number(sourceEvent.clientX) - rect.left;
  const y = Number(sourceEvent.clientY) - rect.top;
  if (!Number.isFinite(x) || !Number.isFinite(y)) return null;
  return { x, y, clientX: Number(sourceEvent.clientX), clientY: Number(sourceEvent.clientY) };
}

function getBboxExportLatLngFromDomEvent(event) {
  if (!map) return null;
  const sourceEvent = event?.changedTouches?.[0] || event?.touches?.[0] || event;
  if (!sourceEvent) return null;
  if (typeof map.mouseEventToLatLng === 'function') {
    return map.mouseEventToLatLng(sourceEvent);
  }
  if (typeof map.containerPointToLatLng !== 'function') return null;
  const point = getBboxExportDomPoint(event);
  if (!point) return null;
  return map.containerPointToLatLng({ x: point.x, y: point.y });
}

function stopBboxExportDomEvent(event) {
  try { event?.preventDefault?.(); } catch {}
  try { event?.stopPropagation?.(); } catch {}
  try { event?.stopImmediatePropagation?.(); } catch {}
}

function shouldAcceptBboxExportPointer(event) {
  if (event?.pointerType === 'mouse') return event.button === 0 || event.button == null;
  if (event?.type?.startsWith?.('mouse')) return event.button === 0 || event.button == null;
  return true;
}

function rememberBboxExportPointerStart(event) {
  if (bboxExportState.mode !== 'selecting') return;
  stopBboxExportDomEvent(event);
  if (!shouldAcceptBboxExportPointer(event)) {
    bboxExportPointerStart = null;
    return;
  }
  const point = getBboxExportDomPoint(event);
  if (!point) return;
  bboxExportPointerStart = {
    x: point.clientX,
    y: point.clientY,
    pointerId: event?.pointerId ?? null,
    at: Date.now()
  };
}

function isBboxExportTapGesture(event) {
  if (!bboxExportPointerStart) return true;
  if (bboxExportPointerStart.pointerId != null && event?.pointerId != null && bboxExportPointerStart.pointerId !== event.pointerId) return false;
  const point = getBboxExportDomPoint(event);
  if (!point) return false;
  const dx = Math.abs(point.clientX - bboxExportPointerStart.x);
  const dy = Math.abs(point.clientY - bboxExportPointerStart.y);
  return dx <= 14 && dy <= 14;
}

function handleBboxExportDomSelectionEvent(event) {
  if (bboxExportState.mode !== 'selecting' || !map) return false;
  stopBboxExportDomEvent(event);
  if (!shouldAcceptBboxExportPointer(event)) {
    bboxExportPointerStart = null;
    return true;
  }

  const now = Date.now();
  const eventPoint = getBboxExportDomPoint(event);
  if (eventPoint && lastBboxExportDomSelectionPoint && now - lastBboxExportDomSelectionAt < 420) {
    const dx = Math.abs(eventPoint.clientX - lastBboxExportDomSelectionPoint.x);
    const dy = Math.abs(eventPoint.clientY - lastBboxExportDomSelectionPoint.y);
    if (dx <= 4 && dy <= 4) return true;
  }
  if (!isBboxExportTapGesture(event)) {
    bboxExportPointerStart = null;
    return true;
  }

  try {
    const latlng = getBboxExportLatLngFromDomEvent(event);
    bboxExportPointerStart = null;
    if (!latlng) {
      bboxExportState = { ...bboxExportState, error: 'не удалось прочитать координаты касания' };
      updateBboxExportUi();
      return true;
    }
    lastBboxExportDomSelectionAt = now;
    const selectedPoint = eventPoint || getBboxExportDomPoint(event);
    lastBboxExportDomSelectionPoint = selectedPoint ? { x: selectedPoint.clientX, y: selectedPoint.clientY } : null;
    handleBboxExportMapClick({ latlng, originalEvent: event });
    return true;
  } catch (err) {
    bboxExportPointerStart = null;
    bboxExportState = { ...bboxExportState, error: err?.message || 'не удалось прочитать координаты касания' };
    updateBboxExportUi();
    return true;
  }
}

function setupBboxExportSelection() {
  if (!map) return;
  map.on('click', handleBboxExportMapClick);
  map.on('mousemove', handleBboxExportMouseMove);
  const mapEl = $('map');
  if (mapEl) {
    const captureOptions = { passive: false, capture: true };
    ['pointerdown', 'mousedown', 'touchstart'].forEach((type) => mapEl.addEventListener(type, rememberBboxExportPointerStart, captureOptions));
    ['pointerup', 'mouseup', 'touchend', 'click'].forEach((type) => mapEl.addEventListener(type, handleBboxExportDomSelectionEvent, captureOptions));
    ['pointercancel', 'touchcancel', 'mouseout'].forEach((type) => mapEl.addEventListener(type, () => { bboxExportPointerStart = null; }, captureOptions));
  }
  updateBboxExportUi();
}


function updatePickedMapPointUi() {
  const hint = $('pickedMapPointHint');
  if (!hint) return;
  if (pickedMapPoint) {
    hint.textContent = `Выбрана точка на карте: ${fmtCoord(pickedMapPoint.lat)}, ${fmtCoord(pickedMapPoint.lon)}. Большая кнопка ниже сохранит именно эту точку. Если нужно сохранить своё GPS-место, сбрось выбор или используй “Другие способы сохранения”.`;
  } else {
    hint.textContent = 'Для сохранения точки не там, где ты стоишь, зажми место на карте пальцем примерно на секунду. На компьютере можно нажать правой кнопкой.';
  }
  updateActionButtonsUi();
}

function setPickedMapPoint(latlng, source = 'map') {
  if (!canUseMapRuntime()) {
    recordMapDebug('map point pick ignored: map runtime unavailable');
    return;
  }
  if (!latlng || !Number.isFinite(latlng.lat) || !Number.isFinite(latlng.lng)) return;
  pickedMapPoint = {
    lat: latlng.lat,
    lon: latlng.lng,
    accuracy: null,
    source,
    timestamp: new Date().toISOString()
  };
  if (!pickedMapPointMarker) {
    pickedMapPointMarker = L.marker([pickedMapPoint.lat, pickedMapPoint.lon], {
      title: 'Выбранная точка для сохранения',
      icon: makeMapIcon('picked')
    }).addTo(map).bindPopup('Выбранная точка для сохранения');
  } else {
    pickedMapPointMarker.setLatLng([pickedMapPoint.lat, pickedMapPoint.lon]);
  }
  pickedMapPointMarker.openPopup();
  pickedSaveEditorOpen = false;
  pickedSaveShareAfterSave = false;
  recordMapDebug('picked map point', pickedMapPoint);
  setSelectedMapObject('picked', { source });
  updatePickedMapPointUi();
  updateOfflinePickedPointUi();
  renderPmtilesPreviewUserLayers('picked point mirrored to offline map preview');
}

function clearPickedMapPoint(showStatus = false) {
  if (pickedMapPointMarker) {
    pickedMapPointMarker.remove();
    pickedMapPointMarker = null;
  }
  pickedMapPoint = null;
  if (selectedMapObject?.kind === 'picked') clearSelectedMapObjectOnly();
  updatePickedMapPointUi();
  updateOfflinePickedPointUi();
  if (showStatus) setButtonApiStatus(activeButtonDiagnostics || { buttonId: 'clearPickedMapPointBtn', label: getButtonDiagnosticLabel('clearPickedMapPointBtn') }, 'готово', 'выбранная точка сброшена');
  renderPmtilesPreviewUserLayers('picked point cleared from offline map preview');
}

function cancelMapLongPress() {
  if (mapLongPressTimer) {
    window.clearTimeout(mapLongPressTimer);
    mapLongPressTimer = null;
  }
  mapLongPressStart = null;
}

function setupMapPointPicking() {
  if (!map) return;

  map.on('contextmenu', (event) => {
    if (bboxExportState.mode === 'selecting') return;
    // Desktop right-click and some mobile long-tap implementations land here.
    setPickedMapPoint(event.latlng, 'map-contextmenu');
  });

  map.on('mousedown touchstart', (event) => {
    if (bboxExportState.mode === 'selecting') return;
    const latlng = event.latlng;
    if (!latlng) return;
    mapLongPressStart = { latlng, containerPoint: event.containerPoint || null };
    if (mapLongPressTimer) window.clearTimeout(mapLongPressTimer);
    mapLongPressTimer = window.setTimeout(() => {
      if (!mapLongPressStart) return;
      setPickedMapPoint(mapLongPressStart.latlng, 'map-long-press');
      mapLongPressTimer = null;
      mapLongPressStart = null;
    }, 850);
  });

  map.on('mousemove touchmove dragstart zoomstart popupopen', (event) => {
    if (!mapLongPressStart) return;
    if (!event.containerPoint || !mapLongPressStart.containerPoint) {
      cancelMapLongPress();
      return;
    }
    const dx = Math.abs(event.containerPoint.x - mapLongPressStart.containerPoint.x);
    const dy = Math.abs(event.containerPoint.y - mapLongPressStart.containerPoint.y);
    if (dx > 10 || dy > 10) cancelMapLongPress();
  });

  map.on('mouseup touchend touchcancel mouseout', cancelMapLongPress);
}

function repairMap() {
  if (!map) return;
  recordMapDebug('repairMap started');
  safeInvalidateMap(0, 'repair immediate');
  safeInvalidateMap(200, 'repair delayed 200');
  safeInvalidateMap(800, 'repair delayed 800');
  try {
    if (!navigator.onLine) {
      if (!keepOnlineRasterLayerForOfflineTransition('repair requested while browser offline')) {
        activateNoBasemapFallback('repair requested offline without loaded raster tiles');
      }
    } else if (!baseTileLayer) {
      mountMapProvider(MAP_PROVIDER_ONLINE_RASTER, 'repair requested online provider');
    } else if (baseTileLayer.redraw) {
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
  const labels = {
    user: 'Я',
    friend: 'Д',
    chat: 'Ч',
    picked: '+',
    spot: 'Г',
    'spot-selected': '✓'
  };
  const label = labels[kind] || '';
  const labelHtml = label ? `<span>${label}</span>` : '';
  return L.divIcon({
    className: '',
    html: `<div class="map-dot map-dot-${kind}">${labelHtml}</div>`,
    iconSize: [28, 28],
    iconAnchor: [14, 14],
    popupAnchor: [0, -16]
  });
}

function mapObjectDetailRow(label, value) {
  return `<div class="map-object-row"><span>${escapeHtml(label)}</span><strong>${value}</strong></div>`;
}

function distanceFromCurrentPositionLine(target) {
  if (!currentPosition || !target) return 'GPS не готов';
  const from = { lat: currentPosition.lat, lon: currentPosition.lon };
  const dist = distanceMeters(from, target);
  const bearing = bearingDegrees(from, target);
  return `${meters(dist)} · ${Math.round(bearing)}° ${directionName(bearing)}`;
}

function setSelectedMapObject(kind, payload = {}) {
  const previous = selectedMapObject;
  selectedMapObject = { kind, ...payload, selectedAt: new Date().toISOString() };
  mapObjectSheetCollapsed = false;
  if (kind !== 'picked') {
    pickedSaveEditorOpen = false;
    pickedSaveShareAfterSave = false;
  }
  if (kind !== 'saved' || previous?.kind !== 'saved' || previous.id !== payload.id) {
    savedSpotEditorOpen = false;
  }
  renderMapObjectPanel();
  updateSavedSpotMarkerStates();
}

function clearSelectedMapObjectOnly() {
  selectedMapObject = null;
  mapObjectSheetCollapsed = false;
  pickedSaveEditorOpen = false;
  pickedSaveShareAfterSave = false;
  savedSpotEditorOpen = false;
  spotListEditorOpen = false;
  renderMapObjectPanel();
  updateSavedSpotMarkerStates();
}

function clearChatPreviewPoint(showStatus = false) {
  if (chatPreviewPointMarker) {
    chatPreviewPointMarker.remove();
    chatPreviewPointMarker = null;
  }
  chatPreviewPoint = null;
  if (selectedMapObject?.kind === 'chat') clearSelectedMapObjectOnly();
  if (showStatus) setButtonApiStatus(activeButtonDiagnostics || { buttonId: 'mapObjectClearBtn', label: 'Сбросить выбор' }, 'готово', 'точка из чата скрыта');
  renderPmtilesPreviewUserLayers('chat point cleared from offline map preview');
}

function describeSelectedMapObject() {
  if (!selectedMapObject) return null;

  if (selectedMapObject.kind === 'saved') {
    const spot = spots.find((item) => item.id === selectedMapObject.id);
    if (!spot) return null;
    if (savedSpotEditorOpen) {
      return {
        kind: 'saved',
        title: 'Править точку',
        subtitle: 'Измени папку, название, тип или заметку. Координаты остаются прежними.',
        pill: 'редактирование',
        saveEditorVisible: true,
        primary: 'Сохранить изменения',
        editVisible: false,
        secondaryVisible: false,
        clearVisible: true,
        clear: 'Назад',
        dangerVisible: false,
        rows: [
          ['Точка', escapeHtml(spot.name || 'Грибная точка')],
          ['Координаты', `${fmtCoord(spot.lat)}, ${fmtCoord(spot.lon)}`],
          ['Важно', 'это обновит сохранённую точку, а не создаст новую']
        ]
      };
    }
    return {
      kind: 'saved',
      title: 'Сохранённая точка',
      subtitle: spot.name || 'Грибная точка',
      pill: 'сохранена',
      secondaryVisible: canSendSpotToChat(),
      editVisible: false,
      dangerVisible: false,
      primary: 'Открыть в точках',
      secondary: 'Поделиться в группе',
      clearVisible: false,
      rows: [
        ['Название', escapeHtml(spot.name || 'Грибная точка')],
        ['Папка', escapeHtml(spot.collection || SPOT_DEFAULT_COLLECTION)],
        ['Тип', escapeHtml(spot.mushroomType || 'не указан')],
        ['Координаты', `${fmtCoord(spot.lat)}, ${fmtCoord(spot.lon)}`],
        ['Расстояние', distanceFromCurrentPositionLine(spot)],
        ['Действие', 'правка и удаление доступны в разделе “Точки”']
      ]
    };
  }

  if (selectedMapObject.kind === 'picked') {
    if (!pickedMapPoint) return null;
    return {
      kind: 'picked',
      title: 'Карточка выбранной точки',
      subtitle: 'Мини-инфо по точке. Нажми ☆, чтобы сохранить её в папку.',
      pill: 'выбрано',
      saveEditorVisible: false,
      secondaryVisible: canSendSpotToChat(),
      editVisible: false,
      dangerVisible: false,
      primary: '☆ Сохранить',
      secondary: 'Сохранить и поделиться',
      clearVisible: false,
      rows: [
        ['Состояние', 'выбрано на карте, ещё не сохранено'],
        ['Координаты', `${fmtCoord(pickedMapPoint.lat)}, ${fmtCoord(pickedMapPoint.lon)}`],
        ['Расстояние', distanceFromCurrentPositionLine(pickedMapPoint)],
        ['Закладка', 'откроет окно сохранения с выбором папки и полями описания']
      ]
    };
  }

  if (selectedMapObject.kind === 'chat') {
    if (!chatPreviewPoint) return null;
    return {
      kind: 'chat',
      title: 'Точка из чата',
      subtitle: chatPreviewPoint.title || 'Координаты пришли из сообщения группы.',
      pill: 'чат-preview',
      secondaryVisible: false,
      editVisible: false,
      dangerVisible: false,
      primary: 'Показать здесь',
      secondary: '',
      clearVisible: false,
      rows: [
        ['Название', escapeHtml(chatPreviewPoint.title || 'Точка из чата')],
        ['Тип', escapeHtml(chatPreviewPoint.mushroomType || 'не указан')],
        ['Координаты', `${fmtCoord(chatPreviewPoint.lat)}, ${fmtCoord(chatPreviewPoint.lon)}`],
        ['Расстояние', distanceFromCurrentPositionLine(chatPreviewPoint)],
        ['Важно', 'это preview из чата, он не добавлен в локальные точки']
      ]
    };
  }

  if (selectedMapObject.kind === 'friend') {
    const loc = selectedMapObject.loc;
    if (!loc) return null;
    return {
      kind: 'friend',
      title: 'Live-друг',
      subtitle: selectedMapObject.name || 'Участник группы',
      pill: 'live-location',
      secondaryVisible: false,
      editVisible: false,
      dangerVisible: false,
      primary: 'Показать на карте',
      secondary: '',
      clearVisible: false,
      rows: [
        ['Имя', escapeHtml(selectedMapObject.name || 'Без имени')],
        ['Координаты', `${fmtCoord(loc.lat)}, ${fmtCoord(loc.lon)}`],
        ['Расстояние', distanceFromCurrentPositionLine(loc)],
        ['Обновлено', loc.updated_at ? fmtDate(loc.updated_at) : 'не указано'],
        ['Источник', 'live_locations, не локальная грибная точка']
      ]
    };
  }

  return null;
}

function renderMapObjectPanel() {
  const card = $('mapObjectCard');
  if (!card) return;
  const model = describeSelectedMapObject();
  if (!model) {
    selectedMapObject = null;
    mapObjectSheetCollapsed = false;
    card.hidden = true;
    card.classList.remove('map-object-collapsed', 'map-object-editing');
    setHidden('mapObjectSaveEditor', true);
    const collapseBtn = $('mapObjectCollapseBtn');
    if (collapseBtn) collapseBtn.setAttribute('aria-expanded', 'true');
    return;
  }

  card.hidden = false;
  card.dataset.objectKind = model.kind;
  card.classList.toggle('map-object-collapsed', mapObjectSheetCollapsed);
  card.classList.toggle('map-object-editing', Boolean(model.saveEditorVisible));
  setText('mapObjectTitle', model.title);
  setText('mapObjectSubtitle', model.subtitle);
  setText('mapObjectPill', model.pill);
  const details = $('mapObjectDetails');
  if (details) {
    details.innerHTML = model.rows.map(([label, value]) => mapObjectDetailRow(label, value)).join('');
  }
  setHidden('mapObjectSaveEditor', !model.saveEditorVisible);
  setText('mapObjectPrimaryBtn', model.primary);
  setText('mapObjectEditBtn', model.edit || 'Править');
  setText('mapObjectSecondaryBtn', model.secondary || 'Поделиться в группе');
  setText('mapObjectClearBtn', model.clear || 'Назад');
  setText('mapObjectDangerBtn', model.danger || 'Удалить');
  setHidden('mapObjectEditBtn', !model.editVisible);
  setHidden('mapObjectSecondaryBtn', !model.secondaryVisible);
  setHidden('mapObjectClearBtn', !model.clearVisible);
  setHidden('mapObjectDangerBtn', !model.dangerVisible);
  const collapseBtn = $('mapObjectCollapseBtn');
  if (collapseBtn) {
    collapseBtn.textContent = mapObjectSheetCollapsed ? 'Развернуть' : 'Свернуть';
    collapseBtn.setAttribute('aria-expanded', mapObjectSheetCollapsed ? 'false' : 'true');
    collapseBtn.setAttribute('aria-label', mapObjectSheetCollapsed ? 'Развернуть карточку выбранного объекта' : 'Свернуть карточку выбранного объекта');
  }
}

function toggleMapObjectSheetCollapsed() {
  if (!selectedMapObject) return false;
  mapObjectSheetCollapsed = !mapObjectSheetCollapsed;
  renderMapObjectPanel();
  return true;
}

function revealSelectedSpotCardOnMap() {
  const card = $('selectedCard');
  if (!card) return false;
  card.hidden = false;
  card.setAttribute('tabindex', '-1');
  const prefersReducedMotion = Boolean(window.matchMedia?.('(prefers-reduced-motion: reduce)').matches);
  const behavior = prefersReducedMotion ? 'auto' : 'smooth';
  const reveal = () => {
    card.scrollIntoView({ behavior, block: 'start', inline: 'nearest' });
    try { card.focus({ preventScroll: true }); } catch {}
  };
  window.requestAnimationFrame(reveal);
  window.setTimeout(reveal, 180);
  return true;
}

function readLegacySpotFormData() {
  return {
    name: $('spotName')?.value?.trim() || '',
    mushroomType: $('mushroomType')?.value?.trim() || '',
    note: $('spotNote')?.value?.trim() || '',
    collection: $('spotCollection')?.value?.trim() || SPOT_DEFAULT_COLLECTION,
    photoFile: $('spotPhoto')?.files?.[0] || null
  };
}


function resetSavePlaceDialogForm({ preserveCollection = true } = {}) {
  for (const id of ['spotName', 'mushroomType', 'spotNote']) {
    const el = $(id);
    if (el) el.value = '';
  }
  const photo = $('spotPhoto');
  if (photo) photo.value = '';
  const collection = $('spotCollection');
  if (collection && !preserveCollection) collection.value = SPOT_DEFAULT_COLLECTION;
}

function makeSavePlaceDialogTarget(source) {
  if (source === 'map-picked') {
    if (!pickedMapPoint) return null;
    return {
      source: 'map-picked',
      position: pickedMapPoint,
      title: 'Сохранить выбранную точку',
      subtitle: 'Место выбрано на карте. Выбери папку, добавь описание и сохрани точку.',
      button: 'Сохранить',
      status: 'выбрано на карте'
    };
  }
  if (source === 'current-gps') {
    if (!currentPosition) return null;
    return {
      source: 'current-gps',
      position: currentPosition,
      title: 'Сохранить мою позицию',
      subtitle: 'GPS-позиция готова. Выбери папку, добавь описание и сохрани точку.',
      button: 'Сохранить',
      status: 'GPS готов'
    };
  }
  return null;
}

function openSavePlaceDialog(source, { shareAfterSave = false } = {}) {
  const target = makeSavePlaceDialogTarget(source);
  if (!target?.position) {
    markButtonBlocked(source === 'current-gps' ? 'нет GPS-координат' : 'точка на карте не выбрана');
    if (source === 'current-gps') alert('Сначала включи GPS и дождись координат.');
    else alert('Сначала зажми место на карте пальцем примерно на секунду.');
    return false;
  }
  savePlaceDialogState = {
    source: target.source,
    position: { ...target.position },
    shareAfterSave: Boolean(shareAfterSave),
    openedAt: new Date().toISOString()
  };
  updateSpotCollectionChoiceOptions();
  resetSavePlaceDialogForm({ preserveCollection: true });
  setText('savePlaceDialogTitle', target.title);
  setText('savePlaceDialogSubtitle', shareAfterSave
    ? `${target.subtitle} После сохранения точка будет отправлена в чат группы.`
    : target.subtitle);
  const coords = `Координаты: ${fmtCoord(target.position.lat)}, ${fmtCoord(target.position.lon)}${target.position.accuracy != null ? ` · точность ${meters(target.position.accuracy)}` : ''}`;
  setText('savePlaceDialogCoords', `${target.status} · ${coords}`);
  setText('savePlaceDialogSaveBtn', shareAfterSave ? 'Сохранить и поделиться' : target.button);
  setDisabled('savePlaceDialogSaveBtn', false);
  showDialogSafely('savePlaceDialog');
  window.requestAnimationFrame(() => {
    const first = $('spotCollection') || $('spotName');
    try { first?.focus({ preventScroll: true }); } catch {}
  });
  return true;
}

function closeSavePlaceDialog({ reset = false } = {}) {
  closeDialogSafely('savePlaceDialog');
  savePlaceDialogState = null;
  setDisabled('savePlaceDialogSaveBtn', true);
  if (reset) resetSavePlaceDialogForm({ preserveCollection: true });
  return true;
}

async function submitSavePlaceDialog() {
  if (!savePlaceDialogState?.position || !savePlaceDialogState?.source) {
    markButtonBlocked('нет координат для сохранения');
    closeSavePlaceDialog();
    return false;
  }
  if (savePlaceDialogState.shareAfterSave && !requireGroupChatReady()) return false;
  const state = { ...savePlaceDialogState, position: { ...savePlaceDialogState.position } };
  const spot = await saveSpotFromPosition(state.position, state.source, readLegacySpotFormData());
  if (!spot) return false;
  closeSavePlaceDialog({ reset: true });
  if (state.shareAfterSave) {
    selectedSpotId = spot.id;
    return sendSelectedSpotToChat();
  }
  return true;
}

function readMapObjectSpotFormData() {
  return {
    name: $('mapObjectName')?.value?.trim() || '',
    mushroomType: $('mapObjectType')?.value?.trim() || '',
    note: $('mapObjectNote')?.value?.trim() || '',
    collection: $('mapObjectCollection')?.value?.trim() || SPOT_DEFAULT_COLLECTION,
    photoFile: null
  };
}

function resetMapObjectSaveEditor() {
  for (const id of ['mapObjectName', 'mapObjectType', 'mapObjectNote']) {
    const el = $(id);
    if (el) el.value = '';
  }
  const collection = $('mapObjectCollection');
  if (collection) collection.value = SPOT_DEFAULT_COLLECTION;
}

function openPickedSaveEditor(shareAfterSave = false) {
  if (!pickedMapPoint) return false;
  pickedSaveEditorOpen = true;
  pickedSaveShareAfterSave = Boolean(shareAfterSave);
  const legacy = readLegacySpotFormData();
  const name = $('mapObjectName');
  const type = $('mapObjectType');
  const note = $('mapObjectNote');
  const collection = $('mapObjectCollection');
  if (name && !name.value && legacy.name) name.value = legacy.name;
  if (type && !type.value && legacy.mushroomType) type.value = legacy.mushroomType;
  if (note && !note.value && legacy.note) note.value = legacy.note;
  if (collection && legacy.collection) collection.value = legacy.collection;
  renderMapObjectPanel();
  window.requestAnimationFrame(() => {
    const first = $('mapObjectCollection') || $('mapObjectName');
    try { first?.focus({ preventScroll: true }); } catch {}
  });
  return true;
}

function openSavedSpotEditor() {
  if (!selectedMapObject || selectedMapObject.kind !== 'saved') return false;
  const spot = spots.find((item) => item.id === selectedMapObject.id);
  if (!spot) return false;
  savedSpotEditorOpen = true;
  const name = $('mapObjectName');
  const type = $('mapObjectType');
  const note = $('mapObjectNote');
  const collection = $('mapObjectCollection');
  if (name) name.value = spot.name || '';
  if (type) type.value = spot.mushroomType || '';
  if (note) note.value = spot.note || '';
  if (collection) collection.value = spot.collection || SPOT_DEFAULT_COLLECTION;
  renderMapObjectPanel();
  window.requestAnimationFrame(() => {
    const first = $('mapObjectCollection') || $('mapObjectName');
    try { first?.focus({ preventScroll: true }); } catch {}
  });
  return true;
}

async function updateSelectedSpotFromMapSheet() {
  if (!selectedMapObject || selectedMapObject.kind !== 'saved') return false;
  const spot = spots.find((item) => item.id === selectedMapObject.id);
  if (!spot) return false;
  const data = readMapObjectSpotFormData();
  const updated = {
    ...spot,
    name: data.name || spot.name || 'Грибная точка',
    mushroomType: data.mushroomType || '',
    note: data.note || '',
    collection: data.collection || SPOT_DEFAULT_COLLECTION,
    updatedAt: new Date().toISOString(),
    appVersion: APP_VERSION
  };
  await putSpot(updated);
  savedSpotEditorOpen = false;
  selectedSpotId = updated.id;
  await afterDataChanged();
  setSelectedMapObject('saved', { id: updated.id });
  updateSelectedDetails();
  renderList();
  return true;
}

async function deleteSelectedSpotFromMapSheet() {
  if (!selectedMapObject || selectedMapObject.kind !== 'saved') return false;
  const spot = spots.find((item) => item.id === selectedMapObject.id);
  if (!spot) return false;
  if (!confirm(`Удалить точку «${spot.name || 'Грибная точка'}»?`)) return false;
  await removeSpot(spot.id);
  selectedSpotId = null;
  selectedMapObject = null;
  savedSpotEditorOpen = false;
  if (navLine) { navLine.remove(); navLine = null; }
  setHidden('selectedCard', true);
  setHidden('spotListDetailsCard', true);
  await afterDataChanged();
  renderMapObjectPanel();
  updateActionButtonsUi();
  return true;
}

async function savePickedMapPointFromMapSheet(shareAfterSave = false) {
  if (!pickedMapPoint) {
    markButtonBlocked('точка на карте не выбрана');
    return false;
  }
  const shouldShare = Boolean(shareAfterSave || pickedSaveShareAfterSave);
  if (shouldShare && !requireGroupChatReady()) return false;
  const spot = await saveSpotFromPosition(pickedMapPoint, 'map-picked', readMapObjectSpotFormData());
  resetMapObjectSaveEditor();
  if (!spot) return false;
  if (shouldShare) {
    selectedSpotId = spot.id;
    return sendSelectedSpotToChat();
  }
  return true;
}

function runSelectedMapObjectPrimaryAction() {
  if (!selectedMapObject) return false;
  if (selectedMapObject.kind === 'saved') {
    const spot = spots.find((item) => item.id === selectedMapObject.id);
    if (!spot) return false;
    switchAppScreen('spots', { scrollTop: false });
    openSpotDetailsFromList(spot.id);
    return true;
  }
  if (selectedMapObject.kind === 'picked') {
    return openSavePlaceDialog('map-picked', { shareAfterSave: false });
  }
  if (selectedMapObject.kind === 'chat' && chatPreviewPoint) {
    if (canUseMapRuntime()) map.setView([chatPreviewPoint.lat, chatPreviewPoint.lon], Math.max(map.getZoom(), 16));
    return true;
  }
  if (selectedMapObject.kind === 'friend' && selectedMapObject.loc) {
    if (canUseMapRuntime()) map.setView([selectedMapObject.loc.lat, selectedMapObject.loc.lon], Math.max(map.getZoom(), 16));
    return true;
  }
  return false;
}

function runSelectedMapObjectSecondaryAction() {
  if (!selectedMapObject) return false;
  if (selectedMapObject.kind === 'saved') return sendSelectedSpotToChat();
  if (selectedMapObject.kind === 'picked') {
    return openSavePlaceDialog('map-picked', { shareAfterSave: true });
  }
  return false;
}

function runSelectedMapObjectEditAction() {
  if (!selectedMapObject) return false;
  if (selectedMapObject.kind === 'saved') return openSavedSpotEditor();
  return false;
}

function runSelectedMapObjectDangerAction() {
  if (!selectedMapObject) return false;
  if (selectedMapObject.kind === 'saved') return deleteSelectedSpotFromMapSheet();
  return false;
}

function closeMapObjectSheet() {
  if (!selectedMapObject) return false;
  if (selectedMapObject.kind === 'picked') {
    clearPickedMapPoint(true);
    return true;
  }
  if (selectedMapObject.kind === 'saved') {
    closeSpotDetails();
    return true;
  }
  if (selectedMapObject.kind === 'chat') {
    clearChatPreviewPoint(true);
    return true;
  }
  clearSelectedMapObjectOnly();
  return true;
}

function clearSelectedMapObject() {
  if (!selectedMapObject) return false;
  if (selectedMapObject.kind === 'picked') {
    if (pickedSaveEditorOpen) {
      pickedSaveEditorOpen = false;
      pickedSaveShareAfterSave = false;
      renderMapObjectPanel();
      return true;
    }
    clearPickedMapPoint(true);
    return true;
  }
  if (selectedMapObject.kind === 'saved') {
    if (savedSpotEditorOpen) {
      savedSpotEditorOpen = false;
      renderMapObjectPanel();
      return true;
    }
    closeSpotDetails();
    return true;
  }
  if (selectedMapObject.kind === 'chat') {
    clearChatPreviewPoint(true);
    return true;
  }
  clearSelectedMapObjectOnly();
  return true;
}

function selectLiveFriendMapObject(row) {
  if (!row?.location) return false;
  const loc = row.location;
  setSelectedMapObject('friend', {
    userId: row.userId,
    name: row.name,
    loc: {
      lat: loc.lat,
      lon: loc.lon,
      accuracy: loc.accuracy,
      updated_at: loc.updated_at
    }
  });
  switchAppScreen('map', { scrollTop: false });
  if (canUseMapRuntime()) map.setView([loc.lat, loc.lon], Math.max(map.getZoom(), 16));
  return true;
}

function updateSavedSpotMarkerStates() {
  if (!canUseMapRuntime()) return;
  for (const [id, marker] of spotMarkers.entries()) {
    const icon = makeMapIcon(id === selectedSpotId ? 'spot-selected' : 'spot');
    if (typeof marker.setIcon === 'function') marker.setIcon(icon);
    else if (marker.options) marker.options.icon = icon;
  }
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
      if (!database.objectStoreNames.contains(TRACKS_STORE)) {
        const trackStore = database.createObjectStore(TRACKS_STORE, { keyPath: 'id' });
        trackStore.createIndex('createdAt', 'createdAt');
      }
      if (!database.objectStoreNames.contains(OFFLINE_MAP_FILES_STORE)) {
        database.createObjectStore(OFFLINE_MAP_FILES_STORE, { keyPath: 'id' });
      }
    };
    req.onsuccess = () => {
      const database = req.result;
      database.onversionchange = () => {
        try { database.close(); } catch {}
      };
      resolve(database);
    };
    req.onerror = () => reject(req.error);
  });
}

function closeDbConnection() {
  if (!db) return;
  try { db.close(); } catch {}
  db = null;
}

function store(name, mode='readonly') {
  return db.transaction(name, mode).objectStore(name);
}

function readAllFromStore(storeName) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readonly');
    const objectStore = transaction.objectStore(storeName);
    const req = objectStore.getAll();
    let rows = [];
    req.onsuccess = () => { rows = Array.isArray(req.result) ? req.result : []; };
    req.onerror = () => reject(req.error);
    transaction.oncomplete = () => resolve(rows);
    transaction.onerror = () => reject(transaction.error || req.error);
    transaction.onabort = () => reject(transaction.error || new Error('IndexedDB read transaction aborted'));
  });
}

function writeToStore(storeName, operation) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(storeName, 'readwrite');
    const objectStore = transaction.objectStore(storeName);
    try {
      operation(objectStore);
    } catch (err) {
      try { transaction.abort(); } catch {}
      reject(err);
      return;
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('IndexedDB write transaction failed'));
    transaction.onabort = () => reject(transaction.error || new Error('IndexedDB write transaction aborted'));
  });
}

function putStoreValue(storeName, value) {
  return writeToStore(storeName, (objectStore) => objectStore.put(value));
}

function getStoreValue(storeName, key) {
  return new Promise((resolve, reject) => {
    const req = store(storeName).get(key);
    req.onsuccess = () => resolve(req.result || null);
    req.onerror = () => reject(req.error);
  });
}

function getAllSpots() {
  return readAllFromStore(SPOTS_STORE)
    .then((rows) => rows.sort((a,b) => String(b.createdAt).localeCompare(String(a.createdAt))));
}

function putSpot(spot) {
  return writeToStore(SPOTS_STORE, (objectStore) => objectStore.put(spot));
}

function removeSpot(id) {
  return writeToStore(SPOTS_STORE, (objectStore) => objectStore.delete(id));
}

function getAllTracks() {
  return readAllFromStore(TRACKS_STORE)
    .then((rows) => rows.map(normalizeTrackForStorage).filter(Boolean).sort((a, b) => String(b.startedAt || b.createdAt).localeCompare(String(a.startedAt || a.createdAt))));
}

function putTrack(track) {
  return writeToStore(TRACKS_STORE, (objectStore) => objectStore.put(track));
}

function removeTrack(id) {
  return writeToStore(TRACKS_STORE, (objectStore) => objectStore.delete(id));
}

function getSetting(key) {
  return new Promise((resolve, reject) => {
    const req = store(SETTINGS_STORE).get(key);
    req.onsuccess = () => resolve(req.result ? req.result.value : null);
    req.onerror = () => reject(req.error);
  });
}

function setSetting(key, value) {
  return writeToStore(SETTINGS_STORE, (objectStore) => objectStore.put({ key, value, updatedAt: new Date().toISOString() }));
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
    mapProvider = MAP_PROVIDER_NO_BASEMAP;
    mapSourceStatus = 'engine-missing';
    mapFallbackActive = true;
    mapProviderLastReason = 'Leaflet JS is not loaded';
    mapProviderChangedAt = new Date().toISOString();
    setMapStatus('Карта: движок не загружен', 'bad');
    recordMapDebug('Leaflet JS is not loaded', mapProviderSnapshot());
    return;
  }

  setMapProviderState({ mapEngine: isLeafletOfflineLiteRuntime() ? MAP_ENGINE_LEAFLET_LITE : MAP_ENGINE_LEAFLET }, isLeafletOfflineLiteRuntime() ? 'local fallback map runtime loaded' : 'full Leaflet runtime loaded');

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

  if (map.attributionControl && map.attributionControl.setPrefix) {
    map.attributionControl.setPrefix(false);
  }

  mountMapProvider(selectInitialMapProvider(), 'initial provider selection');

  map.on('load moveend zoomend resize', () => updateMapDebugUi(false));
  setupMapPointPicking();
  setupBboxExportSelection();

  // Leaflet can render broken/offset tiles if the map is initialized while
  // the PWA layout is still settling, especially after install-to-home-screen,
  // orientation changes, or service worker updates.
  if (mapProvider === MAP_PROVIDER_ONLINE_RASTER) {
    setMapStatus('Карта: онлайн загружается', 'warn');
  } else {
    updateMapDebugUi(false);
  }
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
  recordTrackPointFromCurrentPosition(currentPosition);
  updateActionButtonsUi();

  const latlng = [latitude, longitude];
  if (canUseMapRuntime()) {
    if (!userMarker) {
      userMarker = L.marker(latlng, { title: 'Я здесь', icon: makeMapIcon('user') }).addTo(map).bindPopup('Я здесь');
      accuracyCircle = L.circle(latlng, { radius: accuracy || 0 }).addTo(map);
    } else {
      userMarker.setLatLng(latlng);
      accuracyCircle.setLatLng(latlng).setRadius(accuracy || 0);
    }
    if (center) map.setView(latlng, Math.max(map.getZoom(), 16));
    safeInvalidateMap(0, 'render/update');
  }
  updateSelectedDetails();
  renderList();
  renderPmtilesPreviewUserLayers('GPS mirrored to offline map preview');
}

function normalizeTrackPoint(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const lat = Number(raw.lat);
  const lon = Number(raw.lon ?? raw.lng);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) return null;
  const timestamp = typeof raw.timestamp === 'string' && raw.timestamp ? raw.timestamp : new Date().toISOString();
  return {
    lat,
    lon,
    accuracy: raw.accuracy == null || Number.isNaN(Number(raw.accuracy)) ? null : Number(raw.accuracy),
    altitude: raw.altitude == null || Number.isNaN(Number(raw.altitude)) ? null : Number(raw.altitude),
    altitudeAccuracy: raw.altitudeAccuracy == null || Number.isNaN(Number(raw.altitudeAccuracy)) ? null : Number(raw.altitudeAccuracy),
    speed: raw.speed == null || Number.isNaN(Number(raw.speed)) ? null : Number(raw.speed),
    heading: raw.heading == null || Number.isNaN(Number(raw.heading)) ? null : Number(raw.heading),
    timestamp
  };
}

function positionToTrackPoint(pos) {
  if (!pos?.coords) return null;
  return normalizeTrackPoint({
    lat: pos.coords.latitude,
    lon: pos.coords.longitude,
    accuracy: pos.coords.accuracy,
    altitude: pos.coords.altitude,
    altitudeAccuracy: pos.coords.altitudeAccuracy,
    speed: pos.coords.speed,
    heading: pos.coords.heading,
    timestamp: new Date(pos.timestamp || Date.now()).toISOString()
  });
}

function getTrackDistanceMeters(points = []) {
  let total = 0;
  for (let index = 1; index < points.length; index += 1) {
    total += distanceMeters(points[index - 1], points[index]);
  }
  return Math.round(total);
}

function getTrackDurationSeconds(trackOrPoints, fallbackStoppedAt = null) {
  const startedAt = Array.isArray(trackOrPoints) ? trackOrPoints[0]?.timestamp : trackOrPoints?.startedAt;
  const stoppedAt = Array.isArray(trackOrPoints)
    ? (fallbackStoppedAt || trackOrPoints.at(-1)?.timestamp)
    : (trackOrPoints?.stoppedAt || trackOrPoints?.updatedAt || trackOrPoints?.startedAt);
  const start = startedAt ? new Date(startedAt).getTime() : NaN;
  const stop = stoppedAt ? new Date(stoppedAt).getTime() : Date.now();
  if (!Number.isFinite(start) || !Number.isFinite(stop)) return 0;
  return Math.max(0, Math.round((stop - start) / 1000));
}

function formatTrackDuration(seconds) {
  const total = Math.max(0, Math.round(Number(seconds) || 0));
  const hours = Math.floor(total / 3600);
  const minutes = Math.floor((total % 3600) / 60);
  const secs = total % 60;
  if (hours) return `${hours} ч ${String(minutes).padStart(2, '0')} мин`;
  return `${minutes} мин ${String(secs).padStart(2, '0')} сек`;
}

function formatTrackDistance(metersValue) {
  const value = Math.max(0, Number(metersValue) || 0);
  if (value >= 1000) return `${(value / 1000).toFixed(value >= 10000 ? 0 : 1)} км`;
  return `${Math.round(value)} м`;
}

function normalizeTrackForStorage(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const points = Array.isArray(raw.points) ? raw.points.map(normalizeTrackPoint).filter(Boolean) : [];
  const startedAt = typeof raw.startedAt === 'string' && raw.startedAt ? raw.startedAt : (points[0]?.timestamp || new Date().toISOString());
  const stoppedAt = typeof raw.stoppedAt === 'string' && raw.stoppedAt ? raw.stoppedAt : (points.at(-1)?.timestamp || startedAt);
  const durationSeconds = Number.isFinite(Number(raw.durationSeconds)) ? Math.max(0, Math.round(Number(raw.durationSeconds))) : getTrackDurationSeconds({ startedAt, stoppedAt });
  const distanceMetersValue = Number.isFinite(Number(raw.distanceMeters)) ? Math.max(0, Math.round(Number(raw.distanceMeters))) : getTrackDistanceMeters(points);
  return {
    id: String(raw.id || uid()),
    name: String(raw.name || `Маршрут ${tracks.length + 1}`),
    points,
    startedAt,
    stoppedAt,
    durationSeconds,
    distanceMeters: distanceMetersValue,
    pointCount: points.length,
    createdAt: typeof raw.createdAt === 'string' && raw.createdAt ? raw.createdAt : startedAt,
    updatedAt: typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : new Date().toISOString(),
    appVersion: String(raw.appVersion || APP_VERSION)
  };
}

function buildTrackFromRecording(stoppedAt = new Date().toISOString()) {
  const points = trackRecording.points.map(normalizeTrackPoint).filter(Boolean);
  if (points.length === 1) {
    points.push({ ...points[0], timestamp: stoppedAt });
  }
  return normalizeTrackForStorage({
    id: trackRecording.id || uid(),
    name: `Маршрут ${tracks.length + 1}`,
    points,
    startedAt: trackRecording.startedAt || points[0]?.timestamp || stoppedAt,
    stoppedAt,
    createdAt: trackRecording.startedAt || stoppedAt,
    updatedAt: stoppedAt,
    appVersion: APP_VERSION
  });
}

function recordTrackPoint(point, options = {}) {
  if (!trackRecording.active) return false;
  const normalized = normalizeTrackPoint(point);
  if (!normalized) return false;
  const last = trackRecording.points.at(-1);
  if (!options.force && last && last.timestamp === normalized.timestamp && last.lat === normalized.lat && last.lon === normalized.lon) return false;
  trackRecording.points.push(normalized);
  renderTrackRecorderUi();
  renderTrackLines();
  renderPmtilesPreviewUserLayers('active track mirrored to offline map preview');
  return true;
}

function recordTrackPointFromCurrentPosition(position) {
  if (!trackRecording.active || !position) return false;
  return recordTrackPoint(position);
}

function clearTrackWatch() {
  if (trackRecording.watchId == null || !navigator.geolocation?.clearWatch) return;
  try { navigator.geolocation.clearWatch(trackRecording.watchId); } catch {}
  trackRecording.watchId = null;
}

function startTrackWatch() {
  if (!navigator.geolocation || trackRecording.watchId != null) return;
  const watchRequestId = beginApiRequest('Geolocation.watchPosition', 'BROWSER', 'route recorder');
  trackRecording.watchId = navigator.geolocation.watchPosition(
    (pos) => {
      finishApiRequest(watchRequestId, 'готово', `route GPS ${meters(pos.coords.accuracy)}`);
      updateUserPosition(pos, false);
    },
    (err) => {
      finishApiRequest(watchRequestId, 'ошибка', err.message);
      trackRecording.lastError = err.message || 'GPS ошибка';
      renderTrackRecorderUi();
    },
    { enableHighAccuracy: true, timeout: 20000, maximumAge: 2000 }
  );
}

async function startTrackRecording() {
  if (trackRecording.active) return false;
  if (!navigator.geolocation) {
    markButtonBlocked('геолокация не поддерживается');
    alert('Запись маршрута требует GPS. Этот браузер не поддерживает геолокацию.');
    return false;
  }
  const startedAt = new Date().toISOString();
  trackRecording = { active: true, id: uid(), startedAt, points: [], watchId: null, lastError: null };
  setText('trackStatusText', 'Запрашиваю GPS для записи маршрута…');
  renderTrackRecorderUi();
  const requestId = beginApiRequest('Geolocation.getCurrentPosition', 'BROWSER', 'route recorder start');
  try {
    await new Promise((resolve, reject) => {
      navigator.geolocation.getCurrentPosition(
        (pos) => {
          finishApiRequest(requestId, 'готово', `route GPS ${meters(pos.coords.accuracy)}`);
          updateUserPosition(pos, false);
          resolve();
        },
        (err) => {
          finishApiRequest(requestId, 'ошибка', err.message);
          reject(err);
        },
        { enableHighAccuracy: true, timeout: 15000, maximumAge: 0 }
      );
    });
    startTrackWatch();
    renderTrackRecorderUi();
    return true;
  } catch (err) {
    clearTrackWatch();
    trackRecording = { active: false, id: null, startedAt: null, points: [], watchId: null, lastError: err.message || 'GPS ошибка' };
    renderTrackRecorderUi();
    alert(`GPS ошибка: ${err.message}. Маршрут не начат.`);
    return false;
  }
}

async function stopTrackRecording() {
  if (!trackRecording.active) return false;
  const stoppedAt = new Date().toISOString();
  clearTrackWatch();
  if (currentPosition && trackRecording.points.length === 1) {
    recordTrackPoint({ ...currentPosition, timestamp: stoppedAt }, { force: true });
  }
  const track = buildTrackFromRecording(stoppedAt);
  trackRecording = { active: false, id: null, startedAt: null, points: [], watchId: null, lastError: null };
  if (!track || track.points.length === 0) {
    renderTrackRecorderUi();
    alert('Маршрут не сохранён: GPS не дал ни одной точки.');
    return false;
  }
  await putTrack(track);
  await afterTrackDataChanged();
  setText('trackStatusText', `Маршрут сохранён: ${track.pointCount} GPS-точек, ${formatTrackDistance(track.distanceMeters)}.`);
  return true;
}

async function afterTrackDataChanged() {
  await refreshTracks();
  if (folderHandle) {
    try { await saveBackupToFolder(false); } catch (err) { console.warn('Folder backup failed', err); }
  }
  await updateStorageUi();
}

async function refreshTracks() {
  tracks = await getAllTracks();
  renderTrackRecorderUi();
  renderTrackLines();
  renderPmtilesPreviewUserLayers('saved tracks mirrored to offline map preview');
}

function getTrackDisplayStats(trackOrPoints) {
  const points = Array.isArray(trackOrPoints) ? trackOrPoints : (Array.isArray(trackOrPoints?.points) ? trackOrPoints.points : []);
  const distance = Array.isArray(trackOrPoints) ? getTrackDistanceMeters(points) : Number(trackOrPoints?.distanceMeters ?? getTrackDistanceMeters(points));
  const duration = Array.isArray(trackOrPoints) ? getTrackDurationSeconds(points) : Number(trackOrPoints?.durationSeconds ?? getTrackDurationSeconds(trackOrPoints));
  return { pointCount: points.length, distanceMeters: distance, durationSeconds: duration };
}

function renderTrackRecorderUi() {
  if (!$('trackRecorderCard')) return;
  const activeStats = {
    ...getTrackDisplayStats(trackRecording.points),
    durationSeconds: trackRecording.active ? getTrackDurationSeconds({ startedAt: trackRecording.startedAt, stoppedAt: new Date().toISOString() }) : getTrackDisplayStats(trackRecording.points).durationSeconds
  };
  const latestTrack = tracks[0] || null;
  const shownStats = trackRecording.active ? activeStats : (latestTrack ? getTrackDisplayStats(latestTrack) : { pointCount: 0, distanceMeters: 0, durationSeconds: 0 });
  setText('trackDurationValue', formatTrackDuration(shownStats.durationSeconds));
  setText('trackDistanceValue', formatTrackDistance(shownStats.distanceMeters));
  setText('trackPointCountValue', String(shownStats.pointCount));
  setText('trackRecorderPill', trackRecording.active ? 'запись идёт' : `${tracks.length} сохранено`);
  setPillState('trackRecorderPill', trackRecording.active ? 'on' : (tracks.length ? 'warn' : ''));
  setDisabled('startTrackBtn', trackRecording.active || !navigator.geolocation);
  setDisabled('stopTrackBtn', !trackRecording.active);
  if (trackRecording.active) {
    setText('trackStatusText', trackRecording.lastError
      ? `Запись активна, но GPS сообщил ошибку: ${trackRecording.lastError}`
      : `Запись активна. Пока собрано GPS-точек: ${trackRecording.points.length}.`);
  } else if (latestTrack) {
    setText('trackStatusText', `Последний маршрут: ${fmtDate(latestTrack.stoppedAt || latestTrack.updatedAt)} · ${latestTrack.pointCount} GPS-точек.`);
  } else {
    setText('trackStatusText', navigator.geolocation ? 'Маршрутов пока нет. Нажми “Начать маршрут”, когда приложение открыто и видит GPS.' : 'Маршрут требует GPS. В этом браузере геолокация недоступна.');
  }
  const list = $('trackList');
  if (!list) return;
  list.innerHTML = '';
  if (!tracks.length) {
    list.innerHTML = '<p class="hint">Сохранённых маршрутов пока нет.</p>';
    return;
  }
  for (const track of tracks) {
    const item = document.createElement('article');
    item.className = 'track-item';
    item.dataset.trackId = track.id;
    item.innerHTML = `
      <div class="track-item-main">
        <strong>${escapeHtml(track.name || 'Маршрут')}</strong>
        <p class="hint">${formatTrackDistance(track.distanceMeters)} · ${formatTrackDuration(track.durationSeconds)} · ${track.pointCount} GPS-точек</p>
        <p class="track-date">${fmtDate(track.startedAt)} → ${fmtDate(track.stoppedAt)}</p>
      </div>
      <div class="row track-actions">
        <button class="secondary btn-secondary small-btn" type="button" data-track-action="show">Показать</button>
        <button class="danger btn-danger small-btn" type="button" data-track-action="delete">Удалить</button>
      </div>
    `;
    item.querySelector('[data-track-action="show"]').onclick = withButtonDiagnostics('showTrackOnMapBtn', () => showTrackOnMap(track.id));
    item.querySelector('[data-track-action="delete"]').onclick = withButtonDiagnostics('deleteTrackBtn', () => deleteTrack(track.id));
    list.appendChild(item);
  }
}

function removeTrackLinesFromMap() {
  for (const line of trackLines.values()) {
    try { line.remove(); } catch {}
  }
  trackLines.clear();
  if (activeTrackLine) {
    try { activeTrackLine.remove(); } catch {}
    activeTrackLine = null;
  }
  const mapEl = $('map');
  if (mapEl) mapEl.dataset.trackLineCount = '0';
}

function drawTrackPolyline(points, options = {}) {
  if (!canUseMapRuntime() || !Array.isArray(points) || points.length < 2) return null;
  const latLngs = points.map((point) => [point.lat, point.lon]);
  const line = L.polyline(latLngs, { weight: options.weight || 4, opacity: options.opacity || 0.78, className: options.className || 'mushroom-track-line' }).addTo(map);
  if (line._path) {
    line._path.setAttribute('data-track-layer', options.active ? 'active' : 'saved');
    if (options.id) line._path.setAttribute('data-track-id', options.id);
  }
  return line;
}

function renderTrackLines() {
  if (!canUseMapRuntime()) return;
  removeTrackLinesFromMap();
  let lineCount = 0;
  for (const track of tracks) {
    const line = drawTrackPolyline(track.points, { id: track.id, className: 'mushroom-track-line saved-track-line' });
    if (line) {
      trackLines.set(track.id, line);
      lineCount += 1;
    }
  }
  if (trackRecording.active) {
    activeTrackLine = drawTrackPolyline(trackRecording.points, { active: true, weight: 5, className: 'mushroom-track-line active-track-line' });
    if (activeTrackLine) lineCount += 1;
  }
  const mapEl = $('map');
  if (mapEl) mapEl.dataset.trackLineCount = String(lineCount);
  safeInvalidateMap(0, 'render/tracks');
}

function showTrackOnMap(id) {
  const track = tracks.find((item) => item.id === id);
  if (!track) return false;
  switchAppScreen('map', { scrollTop: false });
  renderTrackLines();
  const line = trackLines.get(id);
  if (line && typeof line.getBounds === 'function') {
    try { map.fitBounds(line.getBounds(), { padding: [40, 40] }); } catch {}
  } else if (track.points[0] && canUseMapRuntime()) {
    map.setView([track.points[0].lat, track.points[0].lon], Math.max(map.getZoom(), 16));
  }
  setText('trackStatusText', `Показан маршрут: ${track.name}.`);
  return true;
}

async function deleteTrack(id) {
  const track = tracks.find((item) => item.id === id);
  if (!track) return false;
  if (!confirm(`Удалить маршрут «${track.name}»?`)) return false;
  await removeTrack(id);
  await afterTrackDataChanged();
  setText('trackStatusText', 'Маршрут удалён. Грибные точки не изменялись.');
  return true;
}

window.showTrackOnMap = showTrackOnMap;
window.deleteTrack = deleteTrack;

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
      $('gpsStatus').textContent = err.code === 1 ? 'доступ запрещён' : 'ошибка';
      setText('saveFlowDescription', err.code === 1 ? 'GPS запрещён в браузере. Можно сохранить выбранную точку вручную: зажми место на карте примерно на секунду.' : 'GPS не дал координаты. Можно попробовать ещё раз или выбрать точку на карте вручную.');
      alert(`GPS ошибка: ${err.message}. Можно сохранить место вручную долгим нажатием на карте.`);
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

function stableJsonStringify(value) {
  if (value === null || typeof value !== 'object') return JSON.stringify(value);
  if (Array.isArray(value)) return `[${value.map((item) => stableJsonStringify(item)).join(',')}]`;
  return `{${Object.keys(value).sort().map((key) => `${JSON.stringify(key)}:${stableJsonStringify(value[key])}`).join(',')}}`;
}

function fnv1aChecksum(text) {
  let hash = 0x811c9dc5;
  for (let i = 0; i < text.length; i++) {
    hash ^= text.charCodeAt(i);
    hash = Math.imul(hash, 0x01000193);
  }
  return `fnv1a32:${(hash >>> 0).toString(16).padStart(8, '0')}`;
}

function getBackupChecksum(data) {
  return fnv1aChecksum(stableJsonStringify(data));
}

function sanitizeSpotForBackup(raw) {
  if (!raw || typeof raw !== 'object' || Array.isArray(raw)) return null;
  const lat = Number(raw.lat);
  const lon = Number(raw.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon)) return null;
  return {
    id: String(raw.id || uid()),
    name: String(raw.name || ''),
    mushroomType: String(raw.mushroomType || ''),
    note: String(raw.note || ''),
    collection: normalizeSpotCollectionName(raw.collection) || SPOT_DEFAULT_COLLECTION,
    lat,
    lon,
    accuracy: raw.accuracy == null || Number.isNaN(Number(raw.accuracy)) ? null : Number(raw.accuracy),
    source: String(raw.source || 'import'),
    photo: typeof raw.photo === 'string' ? raw.photo : null,
    createdAt: typeof raw.createdAt === 'string' && raw.createdAt ? raw.createdAt : new Date().toISOString(),
    updatedAt: typeof raw.updatedAt === 'string' && raw.updatedAt ? raw.updatedAt : new Date().toISOString(),
    appVersion: String(raw.appVersion || APP_VERSION)
  };
}

function sanitizeTrackForBackup(raw) {
  const normalized = normalizeTrackForStorage(raw);
  if (!normalized) return null;
  return normalized;
}

function buildBackupPayload(options = {}) {
  const backupSpots = (options.spotsOverride || spots)
    .map(sanitizeSpotForBackup)
    .filter(Boolean);
  const backupTracks = (options.tracksOverride || tracks)
    .map(sanitizeTrackForBackup)
    .filter(Boolean);
  const customCollections = dedupeSpotCollections(
    options.customCollectionsOverride || customSpotCollections
  );
  const data = {
    spots: backupSpots,
    tracks: backupTracks,
    settings: {
      customCollections
    }
  };
  return {
    schema: BACKUP_SCHEMA,
    schemaVersion: BACKUP_SCHEMA_VERSION,
    exportedAt: new Date().toISOString(),
    appVersion: APP_VERSION,
    validation: {
      spotCount: backupSpots.length,
      trackCount: backupTracks.length,
      customCollectionCount: customCollections.length,
      checksum: getBackupChecksum(data)
    },
    data
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

async function saveSpotFromPosition(position, source, formData = null) {
  if (!position) return null;
  const data = formData || readLegacySpotFormData();
  const name = data.name || `Точка ${spots.length + 1}`;
  const photo = await fileToDataUrl(data.photoFile);
  const spot = {
    id: uid(),
    name,
    mushroomType: data.mushroomType || '',
    note: data.note || '',
    collection: data.collection || SPOT_DEFAULT_COLLECTION,
    lat: position.lat,
    lon: position.lon,
    accuracy: position.accuracy ?? null,
    source,
    photo,
    createdAt: new Date().toISOString(),
    updatedAt: new Date().toISOString(),
    appVersion: APP_VERSION
  };
  await putSpot(spot);
  lastSavedSpotId = spot.id;
  if (!formData) {
    $('spotName').value = '';
    $('mushroomType').value = '';
    $('spotNote').value = '';
    $('spotPhoto').value = '';
    if ($('spotCollection')) $('spotCollection').value = SPOT_DEFAULT_COLLECTION;
  }
  if (source === 'map-picked' || source === 'offline-map-picked') clearPickedMapPoint(false);
  await afterDataChanged();
  selectSpot(spot.id, true);
  showSaveResult(spot, source);
  const saveHint = $('saveHint');
  if (saveHint) saveHint.textContent = (source === 'map-picked' || source === 'offline-map-picked')
    ? (source === 'offline-map-picked' ? 'Сохранена выбранная точка с офлайн-карты.' : 'Сохранена выбранная точка на карте.')
    : 'Сохранена текущая GPS-точка.';
  updateSaveSpotFlowUi();
  return spot;
}

function showSaveResult(spot, source) {
  const card = $('saveResultCard');
  if (!card || !spot) return;
  const sourceText = (source === 'map-picked' || source === 'offline-map-picked') ? 'выбранная точка на карте' : 'текущая GPS-позиция';
  setText('saveResultTitle', 'Точка сохранена');
  setText('saveResultText', `“${spot.name}” сохранена как ${sourceText} в папку “${spot.collection || SPOT_DEFAULT_COLLECTION}”. Теперь её можно открыть в “Точках”${canSendSpotToChat() ? ' или отправить группе' : ''}.`);
  card.hidden = false;
  updateActionButtonsUi();
}

function hideSaveResult() {
  const card = $('saveResultCard');
  if (card) card.hidden = true;
}

function showLastSavedSpotOnMap() {
  if (!lastSavedSpotId) return;
  selectSpot(lastSavedSpotId, true);
}

function showLastSavedSpotInList() {
  if (!lastSavedSpotId) return;
  switchAppScreen('spots');
  openSpotDetailsFromList(lastSavedSpotId);
}

async function shareLastSavedSpotToChat() {
  if (!lastSavedSpotId) { markButtonBlocked('нет последней сохранённой точки'); return false; }
  selectSpot(lastSavedSpotId, false);
  return sendSelectedSpotToChat();
}

function closeSaveResult() {
  hideSaveResult();
  return true;
}

function prepareNextSpotSave() {
  hideSaveResult();
  const input = $('spotName');
  if (input) input.focus();
}

async function saveSmartSpot() {
  const target = getSaveSpotTarget();
  if (target.kind === 'none') {
    markButtonBlocked('место ещё не выбрано');
    setText('saveFlowDescription', 'Запрашиваю GPS для сохранения текущего места. Если нужно сохранить не своё место, выбери точку на карте долгим нажатием.');
    startGps(true);
    return false;
  }
  return openSavePlaceDialog(target.source, { shareAfterSave: false });
}

async function saveCurrentSpot() {
  return openSavePlaceDialog('current-gps', { shareAfterSave: false });
}

async function savePickedMapPoint() {
  return openSavePlaceDialog('map-picked', { shareAfterSave: false });
}

async function savePickedMapPointAndShare() {
  if (!requireGroupChatReady()) return false;
  return openSavePlaceDialog('map-picked', { shareAfterSave: true });
}

async function averageAndSave() {
  if (!navigator.geolocation) { markButtonBlocked('геолокация не поддерживается'); return alert('Геолокация не поддерживается.'); }
  $('saveHint').textContent = 'Уточнение GPS: стой на месте 30 секунд…';
  const samples = [];
  const started = Date.now();
  const requestId = beginApiRequest('Geolocation.watchPosition', 'BROWSER', '30 sec averaging');
  const sampleWatch = navigator.geolocation.watchPosition(
    (pos) => {
      samples.push({ lat: pos.coords.latitude, lon: pos.coords.longitude, accuracy: pos.coords.accuracy });
      $('saveHint').textContent = `Уточнение GPS: ${samples.length} измерений, лучшая точность ${meters(Math.min(...samples.map(s=>s.accuracy||9999)))}`;
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
      $('saveHint').textContent = 'Не удалось уточнить GPS: измерения не собраны.';
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

function spotSourceLabel(source) {
  const normalized = String(source || '').trim();
  if (normalized === 'map-picked' || normalized === 'picked') return 'выбранная точка на карте';
  if (normalized === 'offline-map-picked') return 'выбранная точка на офлайн-карте';
  if (normalized === 'current-gps' || normalized === 'gps') return 'GPS-позиция';
  if (normalized === 'import') return 'импорт';
  return normalized || 'не указан';
}

function getSelectedSpot() {
  return spots.find(s => s.id === selectedSpotId) || null;
}

function buildSpotDetailsPanelHtml(spot) {
  if (!spot) return '<p class="hint">Точка не выбрана.</p>';
  const hasCurrentPosition = Boolean(currentPosition);
  let distanceLine = 'Включи GPS, чтобы видеть расстояние и направление.';
  if (hasCurrentPosition) {
    const from = { lat: currentPosition.lat, lon: currentPosition.lon };
    const dist = distanceMeters(from, spot);
    const bearing = bearingDegrees(from, spot);
    distanceLine = `${meters(dist)} · ${Math.round(bearing)}° ${directionName(bearing)}`;
  }
  const rows = [
    ['Папка', escapeHtml(spot.collection || SPOT_DEFAULT_COLLECTION)],
    ['Тип грибов', escapeHtml(spot.mushroomType || 'не указан')],
    ['Заметка', escapeHtml(spot.note || 'нет заметки')],
    ['Координаты', `${fmtCoord(spot.lat)}, ${fmtCoord(spot.lon)}`],
    ['Расстояние от GPS', distanceLine],
    ['Дата сохранения', spot.createdAt ? fmtDate(spot.createdAt) : 'не указана'],
    ['Источник', spot.source ? escapeHtml(spotSourceLabel(spot.source)) : 'не указан'],
    ['Точность', spot.accuracy != null ? meters(spot.accuracy) : 'не указана']
  ];
  return `
    <article class="spot-detail-panel">
      <div class="spot-detail-head">
        <div>
          <p class="hint spot-detail-kicker">Сохранённая грибная точка</p>
          <h3>${escapeHtml(spot.name || 'Грибная точка')}</h3>
        </div>
        <span class="pill">${escapeHtml(spot.mushroomType || 'без типа')}</span>
      </div>
      ${spot.photo ? `<img class="spot-detail-photo" src="${spot.photo}" alt="Фото места">` : ''}
      <div class="spot-detail-grid">
        ${rows.map(([label, value]) => `<div class="spot-detail-row"><span>${label}</span><strong>${value}</strong></div>`).join('')}
      </div>
    </article>`;
}

function markerPopup(spot) {
  return `<strong>${escapeHtml(spot.name)}</strong><br>${spot.mushroomType ? escapeHtml(spot.mushroomType)+'<br>' : ''}${fmtCoord(spot.lat)}, ${fmtCoord(spot.lon)}<br>Точность: ${meters(spot.accuracy)}<br><button class="btn-primary small-btn" onclick="window.selectSpotFromPopup('${spot.id}')">Открыть карточку</button>`;
}

function renderMarkers() {
  if (!canUseMapRuntime()) return;
  for (const marker of spotMarkers.values()) marker.remove();
  spotMarkers.clear();
  for (const spot of spots) {
    const iconKind = spot.id === selectedSpotId ? 'spot-selected' : 'spot';
    const marker = L.marker([spot.lat, spot.lon], { title: spot.name, icon: makeMapIcon(iconKind) }).addTo(map).bindPopup(markerPopup(spot));
    marker.on('click', () => selectSpot(spot.id, false));
    spotMarkers.set(spot.id, marker);
  }
  safeInvalidateMap(0, 'render/update');
  renderPmtilesPreviewUserLayers('saved spots mirrored to offline map preview');
  renderTrackLines();
}

function canSendSpotToChat() {
  return Boolean(getSupabaseConfig() && currentGroupId() && groupJoined);
}

function normalizedSpotType(spot) {
  return String(spot?.mushroomType || '').trim();
}

function normalizedSpotCollection(spot) {
  const collection = String(spot?.collection || '').trim();
  return collection || SPOT_DEFAULT_COLLECTION;
}

function spotTypeFilterValue(type) {
  const normalized = String(type || '').trim();
  return normalized || '__empty__';
}

function spotTypeFilterLabel(value) {
  return value === '__empty__' ? 'Без типа' : value;
}

function spotCollectionFilterValue(collection) {
  return String(collection || SPOT_DEFAULT_COLLECTION).trim() || SPOT_DEFAULT_COLLECTION;
}

function spotCollectionSortIndex(collection) {
  const index = SPOT_COLLECTIONS.indexOf(spotCollectionFilterValue(collection));
  return index === -1 ? SPOT_COLLECTIONS.length : index;
}

function sortSpotCollections(collections) {
  return Array.from(collections).sort((a, b) => {
    const ai = spotCollectionSortIndex(a);
    const bi = spotCollectionSortIndex(b);
    if (ai !== bi) return ai - bi;
    return spotCollectionFilterValue(a).localeCompare(spotCollectionFilterValue(b), 'ru');
  });
}

function isStarterSpotCollection(collection) {
  return SPOT_COLLECTIONS.some((item) => spotCollectionEquals(item, collection));
}

function isDeletedStarterSpotCollection(collection) {
  return deletedSpotCollections.some((item) => spotCollectionEquals(item, collection));
}

function getFirstAvailableSpotCollection(exclude = null) {
  const excludeKey = exclude ? spotCollectionIdentityKey(exclude) : null;
  return getAvailableSpotCollections().find((item) => !excludeKey || spotCollectionIdentityKey(item) !== excludeKey) || '';
}

function normalizeSpotCollectionName(value) {
  return String(value || '').trim().replace(/\s+/g, ' ');
}

function spotCollectionIdentityKey(value) {
  return normalizeSpotCollectionName(value).toLocaleLowerCase('ru');
}

function spotCollectionEquals(a, b) {
  return Boolean(spotCollectionIdentityKey(a)) && spotCollectionIdentityKey(a) === spotCollectionIdentityKey(b);
}

function isReservedSpotCollectionName(value) {
  const key = spotCollectionIdentityKey(value);
  return key === 'all' || key === spotCollectionIdentityKey('Все папки');
}

function dedupeSpotCollections(collections) {
  const seen = new Set();
  const result = [];
  for (const raw of collections || []) {
    const collection = normalizeSpotCollectionName(raw);
    if (!collection || collection.toLowerCase() === 'all') continue;
    const key = spotCollectionIdentityKey(collection);
    if (seen.has(key)) continue;
    seen.add(key);
    result.push(collection);
  }
  return sortSpotCollections(result);
}

function getDerivedCustomSpotCollections() {
  return dedupeSpotCollections(spots.map(normalizedSpotCollection));
}

function getCustomSpotCollections() {
  return dedupeSpotCollections([
    ...customSpotCollections,
    ...getDerivedCustomSpotCollections()
  ]);
}

function getAvailableSpotCollections() {
  const hidden = new Set(deletedSpotCollections.map(spotCollectionIdentityKey));
  return sortSpotCollections(new Set([
    ...SPOT_COLLECTIONS.filter((collection) => !hidden.has(spotCollectionIdentityKey(collection))),
    ...customSpotCollections,
    ...spots.map(normalizedSpotCollection)
  ]));
}

function spotCollectionExists(collection) {
  const normalized = normalizeSpotCollectionName(collection);
  if (!normalized) return false;
  const key = spotCollectionIdentityKey(normalized);
  return getAvailableSpotCollections().some((item) => spotCollectionIdentityKey(item) === key);
}

async function loadSpotCollections() {
  try {
    const [saved, deleted] = await Promise.all([
      getSetting(SPOT_CUSTOM_COLLECTIONS_SETTING_KEY),
      getSetting(SPOT_DELETED_COLLECTIONS_SETTING_KEY)
    ]);
    customSpotCollections = dedupeSpotCollections(Array.isArray(saved) ? saved : []);
    deletedSpotCollections = dedupeSpotCollections(Array.isArray(deleted) ? deleted : [])
      .filter(isStarterSpotCollection);
  } catch (err) {
    console.warn('Failed to load custom spot collections', err);
    customSpotCollections = [];
    deletedSpotCollections = [];
  }
}

async function saveSpotCollections() {
  customSpotCollections = dedupeSpotCollections(customSpotCollections);
  deletedSpotCollections = dedupeSpotCollections(deletedSpotCollections).filter(isStarterSpotCollection);
  await Promise.all([
    setSetting(SPOT_CUSTOM_COLLECTIONS_SETTING_KEY, customSpotCollections),
    setSetting(SPOT_DELETED_COLLECTIONS_SETTING_KEY, deletedSpotCollections)
  ]);
}

function unhideSpotCollection(collection) {
  deletedSpotCollections = deletedSpotCollections.filter((item) => !spotCollectionEquals(item, collection));
}

function hideStarterSpotCollection(collection) {
  if (!isStarterSpotCollection(collection)) return;
  if (!deletedSpotCollections.some((item) => spotCollectionEquals(item, collection))) {
    deletedSpotCollections.push(normalizeSpotCollectionName(collection));
  }
}

function optionHtml(value, label = value) {
  return `<option value="${escapeHtml(value)}">${escapeHtml(label)}</option>`;
}

function setSelectOptions(select, options, { allLabel = null, selected = null, exclude = null, counts = null } = {}) {
  if (!select) return;
  const previous = selected ?? select.value;
  const excludeKey = exclude ? spotCollectionIdentityKey(exclude) : null;
  const normalizedOptions = options.filter((option) => {
    if (!excludeKey) return true;
    return spotCollectionIdentityKey(option) !== excludeKey;
  });
  let html = allLabel ? optionHtml('all', allLabel) : '';
  html += normalizedOptions.map((option) => {
    const count = counts?.get(option);
    const suffix = typeof count === 'number' ? ` · ${count}` : '';
    return optionHtml(option, `${option}${suffix}`);
  }).join('');
  select.innerHTML = html;
  const values = new Set([...(allLabel ? ['all'] : []), ...normalizedOptions]);
  if (values.has(previous)) select.value = previous;
  else if (values.size) select.value = values.values().next().value;
}

function updateSpotCollectionChoiceOptions() {
  const collections = getAvailableSpotCollections();
  for (const id of ['spotCollection', 'mapObjectCollection', 'spotListCollection']) {
    const select = $(id);
    if (select) setSelectOptions(select, collections);
  }
}

function getSpotCollectionUsageCounts() {
  const counts = new Map(getAvailableSpotCollections().map((collection) => [collection, 0]));
  for (const spot of spots) {
    const collection = normalizedSpotCollection(spot);
    counts.set(collection, (counts.get(collection) || 0) + 1);
  }
  return counts;
}

function renderSpotCollectionManager(selectedOverride = null) {
  const manageSelect = $('spotCollectionManageSelect');
  const deleteTarget = $('spotCollectionDeleteTarget');
  const renameInput = $('spotCollectionRenameInput');
  const hint = $('spotCollectionManagerHint');
  const renameBtn = $('spotCollectionRenameBtn');
  const deleteBtn = $('spotCollectionDeleteBtn');
  const renameMenuBtn = $('spotCollectionRenameMenuBtn');
  const deleteMenuBtn = $('spotCollectionDeleteMenuBtn');
  if (!manageSelect) return;

  const collections = getAvailableSpotCollections();
  const counts = getSpotCollectionUsageCounts();
  setSelectOptions(manageSelect, collections, { selected: selectedOverride || activeSpotCollection || manageSelect.value, counts });
  const selected = normalizeSpotCollectionName(activeSpotCollection || manageSelect.value);
  if (selected && collections.some((item) => spotCollectionEquals(item, selected))) manageSelect.value = selected;
  const selectedCount = counts.get(selected) || 0;

  if (renameInput && document.activeElement !== renameInput) renameInput.value = selected;
  if (deleteTarget) {
    const firstTarget = collections.find((item) => !spotCollectionEquals(item, selected)) || '';
    const preferredTarget = deleteTarget.value && !spotCollectionEquals(deleteTarget.value, selected)
      ? deleteTarget.value
      : firstTarget;
    setSelectOptions(deleteTarget, collections, { selected: preferredTarget, exclude: selected });
    if (!deleteTarget.value && firstTarget) deleteTarget.value = firstTarget;
  }

  const canEditSelected = Boolean(selected);
  const canDeleteSelected = Boolean(selected) && (selectedCount === 0 || Boolean(getFirstAvailableSpotCollection(selected)));
  setDisabled('spotCollectionRenameBtn', !canEditSelected);
  setDisabled('spotCollectionDeleteBtn', !canDeleteSelected);
  setDisabled('spotCollectionRenameMenuBtn', !canEditSelected);
  setDisabled('spotCollectionDeleteMenuBtn', !canDeleteSelected);
  const deleteBlockedTitle = canDeleteSelected ? '' : 'Нужна другая папка для переноса меток';
  if (renameBtn) renameBtn.title = canEditSelected ? '' : 'Выбери папку';
  if (deleteBtn) deleteBtn.title = deleteBlockedTitle;
  if (renameMenuBtn) renameMenuBtn.title = canEditSelected ? '' : 'Выбери папку';
  if (deleteMenuBtn) deleteMenuBtn.title = deleteBlockedTitle;

  if (hint) {
    if (!activeSpotCollection) hint.textContent = 'Выбери папку, чтобы открыть метки внутри. Любую существующую папку можно переименовать или удалить через меню ⋯.';
    else hint.textContent = `Папка «${selected}»: меток ${selectedCount}. Действия папки находятся в меню ⋯ рядом с заголовком.`;
  }
}

function updateSpotCollectionUi(selectedOverride = null) {
  updateSpotCollectionChoiceOptions();
  renderSpotCollectionManager(selectedOverride);
}

function setSpotCollectionManagerHint(text) {
  const hint = $('spotCollectionManagerHint');
  if (hint) hint.textContent = text;
}

function closeSpotFolderPanels() {
  setHidden('spotFolderEditPanel', true);
  setHidden('spotFolderDeletePanel', true);
  closeSpotFolderDeleteDialogs();
  const folderMenu = $('spotFolderMenu');
  if (folderMenu) folderMenu.open = false;
}

function syncKebabMenuOpenClass(menu) {
  if (!menu || !menu.classList?.contains('kebab-menu')) return;
  const spotItem = menu.closest?.('.spot-item');
  if (spotItem) spotItem.classList.toggle('spot-menu-open', Boolean(menu.open));
  const folderHead = menu.closest?.('.spot-folder-head');
  if (folderHead) folderHead.classList.toggle('folder-menu-open', Boolean(menu.open));
}

function closeKebabMenus(except = null) {
  document.querySelectorAll('details.kebab-menu[open]').forEach((menu) => {
    if (menu !== except) {
      menu.open = false;
      syncKebabMenuOpenClass(menu);
    }
  });
}

function bindKebabMenuBehavior() {
  if (bindKebabMenuBehavior.bound) return;
  bindKebabMenuBehavior.bound = true;

  document.addEventListener('click', (event) => {
    const menu = event.target?.closest?.('details.kebab-menu');
    if (menu) {
      closeKebabMenus(menu);
      return;
    }
    closeKebabMenus();
  });

  document.addEventListener('toggle', (event) => {
    const menu = event.target;
    if (!menu || menu.tagName !== 'DETAILS' || !menu.classList?.contains('kebab-menu')) return;
    syncKebabMenuOpenClass(menu);
    if (!menu.open) return;
    closeKebabMenus(menu);
  }, true);

  document.addEventListener('keydown', (event) => {
    if (event.key === 'Escape') closeKebabMenus();
  });
}

function openSpotFolderRenamePanel() {
  if (!activeSpotCollection) return false;
  const manageSelect = $('spotCollectionManageSelect');
  if (manageSelect) manageSelect.value = activeSpotCollection;
  renderSpotCollectionManager(activeSpotCollection);
  setHidden('spotFolderDeletePanel', true);
  setHidden('spotFolderEditPanel', false);
  const input = $('spotCollectionRenameInput');
  if (input) {
    input.value = activeSpotCollection;
    window.requestAnimationFrame(() => {
      try { input.focus({ preventScroll: true }); input.select(); } catch {}
    });
  }
  const folderMenu = $('spotFolderMenu');
  if (folderMenu) folderMenu.open = false;
  return true;
}

function getSpotsInCollection(collection) {
  const name = normalizeSpotCollectionName(collection);
  if (!name) return [];
  return spots.filter((spot) => spotCollectionEquals(normalizedSpotCollection(spot), name));
}

function closeSpotFolderDeleteDialogs() {
  closeDialogSafely('spotFolderDeleteDialog');
  closeDialogSafely('spotFolderDeleteDangerDialog');
}

function getSpotFolderDeleteTarget(collection) {
  const selected = normalizeSpotCollectionName(collection);
  const explicit = normalizeSpotCollectionName($('spotFolderDeleteTarget')?.value);
  if (explicit && !spotCollectionEquals(explicit, selected) && spotCollectionExists(explicit)) return explicit;
  return getFirstAvailableSpotCollection(selected);
}

function renderSpotFolderDeleteDialog() {
  const state = spotFolderDeleteDialogState;
  if (!state?.collection) return;
  const collection = state.collection;
  const affected = getSpotsInCollection(collection);
  const count = affected.length;
  const collections = getAvailableSpotCollections();
  const canMove = Boolean(getFirstAvailableSpotCollection(collection));
  setText('spotFolderDeleteDialogTitle', `Удалить папку «${collection}»?`);
  setText('spotFolderDeleteDialogCount', count ? `В папке: ${formatSpotCountLabel(count)}.` : 'Папка пустая.');
  setText('spotFolderDeleteMoveHint', canMove
    ? 'Безопасный вариант: удалить только папку, а метки перенести в другую папку.'
    : 'Перенос недоступен: нет другой папки. Можно отменить или удалить папку вместе с метками.');
  const targetSelect = $('spotFolderDeleteTarget');
  if (targetSelect) {
    const preferred = getSpotFolderDeleteTarget(collection);
    setSelectOptions(targetSelect, collections, { selected: preferred, exclude: collection });
  }
  setHidden('spotFolderDeleteMoveBlock', !count);
  setHidden('spotFolderDeleteEmptyText', Boolean(count));
  setHidden('spotFolderDeleteAllRequestBtn', !count);
  const moveBtnLabel = count ? 'Удалить папку и перенести метки' : 'Удалить пустую папку';
  setText('spotFolderDeleteMoveBtn', moveBtnLabel);
  setDisabled('spotFolderDeleteMoveBtn', Boolean(count) && !canMove);
  const dangerText = `Точно удалить папку «${collection}» и метки внутри: ${formatSpotCountLabel(count)}?`;
  setText('spotFolderDeleteDangerTitle', `Удалить папку и метки?`);
  setText('spotFolderDeleteDangerText', dangerText);
}

function openSpotFolderDeletePanel() {
  return openSpotFolderDeleteDialog();
}

function openSpotFolderDeleteDialog() {
  if (!activeSpotCollection) return false;
  const collection = normalizeSpotCollectionName(activeSpotCollection);
  if (!collection) return false;
  const manageSelect = $('spotCollectionManageSelect');
  if (manageSelect) manageSelect.value = collection;
  spotFolderDeleteDialogState = { collection };
  renderSpotCollectionManager(collection);
  setHidden('spotFolderEditPanel', true);
  setHidden('spotFolderDeletePanel', true);
  const folderMenu = $('spotFolderMenu');
  if (folderMenu) folderMenu.open = false;
  renderSpotFolderDeleteDialog();
  showDialogSafely('spotFolderDeleteDialog');
  return true;
}

function requestDeleteSpotCollectionWithSpots() {
  if (!spotFolderDeleteDialogState?.collection) return false;
  renderSpotFolderDeleteDialog();
  closeDialogSafely('spotFolderDeleteDialog');
  showDialogSafely('spotFolderDeleteDangerDialog');
  return true;
}

async function finishDeleteSpotCollection({ deleteSpots = false } = {}) {
  const oldName = normalizeSpotCollectionName(spotFolderDeleteDialogState?.collection || activeSpotCollection || $('spotCollectionManageSelect')?.value);
  const affected = getSpotsInCollection(oldName);
  const target = getSpotFolderDeleteTarget(oldName);
  if (!oldName) { setSpotCollectionManagerHint('Выбери папку для удаления.'); return false; }
  if (!deleteSpots && affected.length && !spotCollectionExists(target)) {
    setSpotCollectionManagerHint('Папка для переноса не найдена.');
    renderSpotFolderDeleteDialog();
    showDialogSafely('spotFolderDeleteDialog');
    return false;
  }

  const now = new Date().toISOString();
  const affectedIds = new Set(affected.map((spot) => spot.id));
  if (deleteSpots) {
    for (const spot of affected) await removeSpot(spot.id);
  } else {
    for (const spot of affected) {
      await putSpot({ ...spot, collection: target, updatedAt: now, appVersion: APP_VERSION });
    }
  }
  customSpotCollections = dedupeSpotCollections(customSpotCollections.filter((item) => (
    !spotCollectionEquals(item, oldName)
  )));
  hideStarterSpotCollection(oldName);
  await saveSpotCollections();
  if (activeSpotCollection && spotCollectionEquals(activeSpotCollection, oldName)) activeSpotCollection = null;
  if (deleteSpots && selectedSpotId && affectedIds.has(selectedSpotId)) selectedSpotId = null;
  if (deleteSpots && selectedMapObject?.kind === 'saved' && affectedIds.has(selectedMapObject.id)) selectedMapObject = null;
  if (deleteSpots && navLine) { navLine.remove(); navLine = null; }
  closeSpotFolderDeleteDialogs();
  spotFolderDeleteDialogState = null;
  await afterDataChanged();
  updateSpotCollectionFilterOptions('all');
  updateSpotCollectionUi(target || 'all');
  closeSpotFolderPanels();
  renderList();
  renderMapObjectPanel();
  updateActionButtonsUi();
  if (deleteSpots) {
    setSpotCollectionManagerHint(`Папка «${oldName}» удалена вместе с метками: ${affected.length}.`);
  } else {
    setSpotCollectionManagerHint(`Папка «${oldName}» удалена. Перенесено меток: ${affected.length}.`);
  }
  return true;
}

async function deleteSpotCollectionAndMoveSpots() {
  return finishDeleteSpotCollection({ deleteSpots: false });
}

async function deleteSpotCollectionAndAllSpots() {
  return finishDeleteSpotCollection({ deleteSpots: true });
}

async function createSpotCollection() {
  const input = $('spotCollectionNameInput');
  const name = normalizeSpotCollectionName(input?.value);
  if (!name) { setSpotCollectionManagerHint('Введи название новой папки.'); return false; }
  if (isReservedSpotCollectionName(name)) {
    setSpotCollectionManagerHint('Название “Все папки” зарезервировано для фильтра.');
    return false;
  }
  if (spotCollectionExists(name)) {
    setSpotCollectionManagerHint(`Папка «${name}» уже есть.`);
    return false;
  }
  unhideSpotCollection(name);
  customSpotCollections = dedupeSpotCollections([...customSpotCollections, name]);
  await saveSpotCollections();
  if (input) input.value = '';
  updateSpotCollectionFilterOptions();
  updateSpotCollectionUi(name);
  renderList();
  setSpotCollectionManagerHint(`Папка «${name}» создана. Открой её из списка папок, чтобы увидеть метки.`);
  return true;
}

async function renameSelectedSpotCollection() {
  const select = $('spotCollectionManageSelect');
  const oldName = normalizeSpotCollectionName(activeSpotCollection || select?.value);
  const newName = normalizeSpotCollectionName($('spotCollectionRenameInput')?.value);
  if (!oldName) { setSpotCollectionManagerHint('Выбери папку для переименования.'); return false; }
  if (!newName) { setSpotCollectionManagerHint('Введи новое название папки.'); return false; }
  if (spotCollectionEquals(oldName, newName)) {
    setSpotCollectionManagerHint('Новое название совпадает с текущим.');
    return false;
  }
  if (spotCollectionExists(newName)) {
    setSpotCollectionManagerHint(`Папка «${newName}» уже есть.`);
    return false;
  }

  const now = new Date().toISOString();
  const affected = spots.filter((spot) => spotCollectionEquals(normalizedSpotCollection(spot), oldName));
  for (const spot of affected) {
    await putSpot({ ...spot, collection: newName, updatedAt: now, appVersion: APP_VERSION });
  }
  customSpotCollections = dedupeSpotCollections(customSpotCollections.map((item) => (
    spotCollectionEquals(item, oldName) ? newName : item
  )));
  hideStarterSpotCollection(oldName);
  unhideSpotCollection(newName);
  if (!customSpotCollections.some((item) => spotCollectionEquals(item, newName))) {
    customSpotCollections.push(newName);
  }
  await saveSpotCollections();
  if (activeSpotCollection && spotCollectionEquals(activeSpotCollection, oldName)) activeSpotCollection = newName;
  const filter = $('spotCollectionFilter');
  if (filter && spotCollectionEquals(filter.value, oldName)) filter.value = newName;
  await afterDataChanged();
  updateSpotCollectionFilterOptions(newName);
  updateSpotCollectionUi(newName);
  closeSpotFolderPanels();
  renderList();
  setSpotCollectionManagerHint(`Папка «${oldName}» переименована в «${newName}». Обновлено меток: ${affected.length}.`);
  return true;
}

async function deleteSelectedSpotCollection() {
  return openSpotFolderDeleteDialog();
}


function updateSpotCollectionFilterOptions(selected = null) {
  const select = $('spotCollectionFilter');
  if (!select) return;
  const previous = selected ?? activeSpotCollection ?? select.value ?? 'all';
  const collections = getAvailableSpotCollections();
  setSelectOptions(select, collections, { allLabel: 'Все папки', selected: previous });
}

function updateSpotTypeFilterOptions() {
  const select = $('spotTypeFilter');
  if (!select) return;
  const previous = select.value || 'all';
  const sourceSpots = activeSpotCollection
    ? spots.filter((spot) => spotCollectionEquals(normalizedSpotCollection(spot), activeSpotCollection))
    : spots;
  const types = Array.from(new Set(sourceSpots.map(normalizedSpotType).map(spotTypeFilterValue)))
    .sort((a, b) => spotTypeFilterLabel(a).localeCompare(spotTypeFilterLabel(b), 'ru'));
  select.innerHTML = '<option value="all">Все типы</option>' + types
    .map((type) => `<option value="${escapeHtml(type)}">${escapeHtml(spotTypeFilterLabel(type))}</option>`)
    .join('');
  select.value = types.includes(previous) ? previous : 'all';
}

function formatSpotCountLabel(count) {
  const normalized = Number(count) || 0;
  const mod10 = normalized % 10;
  const mod100 = normalized % 100;
  if (mod10 === 1 && mod100 !== 11) return `${normalized} метка`;
  if (mod10 >= 2 && mod10 <= 4 && (mod100 < 12 || mod100 > 14)) return `${normalized} метки`;
  return `${normalized} меток`;
}

function buildSpotCardMeta(spot) {
  const parts = [];
  parts.push(spot.mushroomType ? escapeHtml(spot.mushroomType) : 'Тип не указан');
  parts.push(spot.createdAt ? fmtDate(spot.createdAt) : 'Дата не указана');
  const dist = currentPosition ? meters(distanceMeters({ lat: currentPosition.lat, lon: currentPosition.lon }, spot)) : 'GPS не готов';
  parts.push(`Расстояние: ${dist}`);
  if (spot.accuracy != null) parts.push(`точность ${meters(spot.accuracy)}`);
  return parts.join(' · ');
}

function renderSpotListItem(spot, canUseChat) {
  const item = document.createElement('article');
  item.className = `spot-item ${spot.id === selectedSpotId ? 'active' : ''}`;
  item.dataset.spotId = spot.id;

  const content = document.createElement('button');
  content.type = 'button';
  content.className = 'spot-item-main';
  content.onclick = () => openSpotDetailsFromList(spot.id);
  content.innerHTML = `
    <div class="spot-item-copy">
      <div class="spot-title">${escapeHtml(spot.name || 'Грибная точка')}</div>
      <div class="spot-meta">${buildSpotCardMeta(spot)}</div>
      ${spot.note ? `<div class="spot-note-preview">${escapeHtml(spot.note)}</div>` : ''}
    </div>
    ${spot.photo ? `<img class="thumb" src="${spot.photo}" alt="Фото места">` : ''}
  `;
  item.appendChild(content);

  const menu = document.createElement('details');
  menu.className = 'kebab-menu spot-item-kebab-menu';
  menu.innerHTML = `
    <summary aria-label="Действия метки ${escapeHtml(spot.name || 'Грибная точка')}">⋯</summary>
    <div class="kebab-menu-panel" role="menu"></div>
  `;
  const panel = menu.querySelector('.kebab-menu-panel');

  const showBtn = document.createElement('button');
  showBtn.type = 'button';
  showBtn.className = 'secondary btn-secondary';
  showBtn.textContent = 'Показать на карте';
  showBtn.onclick = withButtonDiagnostics('spotItemShowOnMapBtn', () => {
    selectedSpotId = spot.id;
    menu.open = false;
    return showSelectedSpotOnMap();
  });
  panel.appendChild(showBtn);

  const shareBtn = document.createElement('button');
  shareBtn.type = 'button';
  shareBtn.className = 'secondary btn-secondary';
  shareBtn.textContent = 'Отправить в чат';
  shareBtn.disabled = !canUseChat;
  shareBtn.title = canUseChat ? 'Отправить метку в чат группы' : 'Группа или чат пока не готовы';
  shareBtn.onclick = withButtonDiagnostics('spotItemShareBtn', () => {
    selectedSpotId = spot.id;
    menu.open = false;
    return sendSelectedSpotToChat();
  });
  panel.appendChild(shareBtn);

  const editBtn = document.createElement('button');
  editBtn.type = 'button';
  editBtn.className = 'secondary btn-secondary';
  editBtn.textContent = 'Править';
  editBtn.onclick = withButtonDiagnostics('spotItemEditBtn', () => {
    selectedSpotId = spot.id;
    menu.open = false;
    openSpotDetailsFromList(spot.id);
    return startSpotListEditor();
  });
  panel.appendChild(editBtn);

  const deleteBtn = document.createElement('button');
  deleteBtn.type = 'button';
  deleteBtn.className = 'danger btn-danger';
  deleteBtn.textContent = 'Удалить';
  deleteBtn.onclick = withButtonDiagnostics('spotItemDeleteBtn', async () => {
    menu.open = false;
    selectedSpotId = spot.id;
    return deleteSelectedFromSpotList();
  });
  panel.appendChild(deleteBtn);

  item.appendChild(menu);
  return item;
}


function makeSpotHistoryState(level, overrides = {}) {
  return {
    ...(window.history && typeof window.history.state === 'object' && window.history.state ? window.history.state : {}),
    [SPOTS_HISTORY_STATE_KEY]: true,
    screen: 'spots',
    spotsLevel: level,
    collection: overrides.collection ?? activeSpotCollection ?? null,
    selectedSpotId: overrides.selectedSpotId ?? selectedSpotId ?? null
  };
}

function replaceSpotHistoryState(level, overrides = {}) {
  if (suppressSpotHistorySync || !window.history?.replaceState) return false;
  try {
    window.history.replaceState(makeSpotHistoryState(level, overrides), '', window.location.href);
    return true;
  } catch (err) {
    console.warn('Could not replace spots history state', err);
    return false;
  }
}

function pushSpotHistoryState(level, overrides = {}) {
  if (suppressSpotHistorySync || !window.history?.pushState) return false;
  try {
    window.history.pushState(makeSpotHistoryState(level, overrides), '', window.location.href);
    return true;
  } catch (err) {
    console.warn('Could not push spots history state', err);
    return false;
  }
}

function handleSpotHistoryPopState(event) {
  const state = event?.state || null;
  if (!state || state[SPOTS_HISTORY_STATE_KEY] !== true || state.screen !== 'spots') return;

  suppressSpotHistorySync = true;
  try {
    if (activeAppScreen !== 'spots') switchAppScreen('spots', { persist: true, scrollTop: false });

    if (state.spotsLevel === 'details' && state.selectedSpotId) {
      activeSpotCollection = normalizeSpotCollectionName(state.collection) || SPOT_DEFAULT_COLLECTION;
      selectedSpotId = null;
      spotListEditorOpen = false;
      renderList();
      openSpotDetailsFromList(state.selectedSpotId, { pushHistory: false });
      return;
    }

    if (state.spotsLevel === 'collection' && state.collection) {
      activeSpotCollection = normalizeSpotCollectionName(state.collection) || SPOT_DEFAULT_COLLECTION;
      selectedSpotId = null;
      spotListEditorOpen = false;
      closeSpotFolderPanels();
      setHidden('spotListDetailsCard', true);
      renderList();
      return;
    }

    backToSpotCollections();
  } finally {
    suppressSpotHistorySync = false;
  }
}

function renderSpotFolderCard(collection, count) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'spot-folder-card';
  card.dataset.collection = collection;
  card.onclick = () => openSpotCollection(collection);
  const label = count === 1 ? '1 метка' : `${count} меток`;
  card.innerHTML = `
    <span class="spot-folder-icon" aria-hidden="true">🗂️</span>
    <span class="spot-folder-copy">
      <strong>${escapeHtml(collection)}</strong>
      <small>${label}</small>
    </span>
    <span class="spot-folder-chevron" aria-hidden="true">›</span>
  `;
  return card;
}

function renderSpotFolders() {
  const foldersView = $('spotFoldersView');
  const detailView = $('spotFolderDetailView');
  const list = $('spotFoldersList');
  const summary = $('spotsListSummary');
  const spotList = $('spotsList');
  setHidden('spotListDetailsCard', true);
  setHidden('spotFolderDetailView', true);
  setHidden('spotFoldersView', false);
  if (spotList) spotList.innerHTML = '';
  if (!foldersView || !list) return;

  const counts = getSpotCollectionUsageCounts();
  const collections = getAvailableSpotCollections();
  setHidden('spotCount', false);
  $('spotCount').textContent = `${collections.length} папок`;
  list.innerHTML = '';
  for (const collection of collections) {
    list.appendChild(renderSpotFolderCard(collection, counts.get(collection) || 0));
  }
  if (summary) summary.textContent = spots.length
    ? `Сохранено меток: ${spots.length}. Открой папку, чтобы увидеть список меток.`
    : 'Пока нет сохранённых меток. Папки уже готовы: новые точки появятся внутри выбранной папки.';
}

function openSpotCollection(collection, options = {}) {
  const normalized = normalizeSpotCollectionName(collection) || SPOT_DEFAULT_COLLECTION;
  if (!spotCollectionExists(normalized)) return false;
  if (options.pushHistory !== false) {
    replaceSpotHistoryState('folders', { collection: null, selectedSpotId: null });
  }
  activeSpotCollection = normalized;
  selectedSpotId = null;
  spotListEditorOpen = false;
  setHidden('spotListDetailsCard', true);
  closeSpotFolderPanels();
  const filter = $('spotCollectionFilter');
  if (filter) filter.value = normalized;
  renderList();
  if (options.pushHistory !== false) {
    pushSpotHistoryState('collection', { collection: normalized, selectedSpotId: null });
  }
  return true;
}

function backToSpotCollections(options = {}) {
  activeSpotCollection = null;
  selectedSpotId = null;
  spotListEditorOpen = false;
  closeSpotFolderPanels();
  setHidden('spotListDetailsCard', true);
  renderList();
  if (options.replaceHistory !== false) {
    replaceSpotHistoryState('folders', { collection: null, selectedSpotId: null });
  }
  return true;
}

function renderList() {
  updateSpotCollectionFilterOptions();
  updateSpotCollectionUi(activeSpotCollection);
  updateSpotTypeFilterOptions();

  if (activeSpotCollection && !spotCollectionExists(activeSpotCollection)) {
    activeSpotCollection = null;
  }
  if (!activeSpotCollection) {
    renderSpotFolders();
    return;
  }

  const foldersView = $('spotFoldersView');
  const detailView = $('spotFolderDetailView');
  setHidden('spotFoldersView', true);
  setHidden('spotFolderDetailView', false);
  if (foldersView) foldersView.hidden = true;
  if (detailView) detailView.hidden = false;

  const q = ($('searchInput')?.value || '').trim().toLowerCase();
  const typeFilter = $('spotTypeFilter')?.value || 'all';
  const sortMode = $('spotSortSelect')?.value || 'recent';
  const list = $('spotsList');
  const summary = $('spotsListSummary');
  const canUseChat = canSendSpotToChat();
  const counts = getSpotCollectionUsageCounts();
  if (!list) return;

  setText('activeSpotCollectionTitle', activeSpotCollection);
  setText('activeSpotCollectionCount', formatSpotCountLabel(counts.get(activeSpotCollection) || 0));
  setHidden('spotCount', true);
  const folderMenu = $('spotFolderMenu');
  if (folderMenu) {
    folderMenu.hidden = false;
  }
  setDisabled('spotCollectionRenameMenuBtn', false);
  setDisabled('spotCollectionDeleteMenuBtn', false);

  const filtered = spots
    .filter((spot) => spotCollectionEquals(normalizedSpotCollection(spot), activeSpotCollection))
    .filter((spot) => [spot.name, spot.mushroomType, spot.note].join(' ').toLowerCase().includes(q))
    .filter((spot) => typeFilter === 'all' || spotTypeFilterValue(normalizedSpotType(spot)) === typeFilter)
    .slice();

  filtered.sort((a, b) => {
    if (sortMode === 'name') return String(a.name || '').localeCompare(String(b.name || ''), 'ru');
    if (sortMode === 'nearest' && currentPosition) {
      const from = { lat: currentPosition.lat, lon: currentPosition.lon };
      return distanceMeters(from, a) - distanceMeters(from, b);
    }
    return String(b.createdAt || '').localeCompare(String(a.createdAt || ''));
  });

  const folderTotal = counts.get(activeSpotCollection) || 0;
  $('spotCount').textContent = filtered.length === folderTotal ? String(folderTotal) : `${filtered.length}/${folderTotal}`;
  if (summary) {
    if (!folderTotal) {
      summary.textContent = `В папке «${activeSpotCollection}» пока нет меток.`;
    } else if (!filtered.length) {
      summary.textContent = 'Поиск или фильтр ничего не нашли внутри этой папки.';
    } else {
      const sortText = sortMode === 'nearest' ? (currentPosition ? 'сначала ближайшие' : 'сначала последние, потому что GPS ещё не готов') : sortMode === 'name' ? 'по названию' : 'сначала последние';
      summary.textContent = `Показано ${filtered.length} из ${folderTotal} · папка «${activeSpotCollection}» · ${sortText}.`;
    }
  }

  list.innerHTML = '';
  if (!filtered.length) {
    const empty = document.createElement('div');
    empty.className = 'empty-state spots-empty-state';
    empty.innerHTML = folderTotal
      ? '<strong>Ничего не найдено</strong><p class="hint">Попробуй другой поиск, тип гриба или сортировку.</p>'
      : '<strong>В папке пока пусто</strong><p class="hint">Открой карту, выбери место и сохрани его в эту папку.</p>';
    list.appendChild(empty);
    return;
  }
  for (const spot of filtered) list.appendChild(renderSpotListItem(spot, canUseChat));
}

async function refreshSpots() {
  spots = await getAllSpots();
  if (selectedSpotId && !spots.some(s => s.id === selectedSpotId)) selectedSpotId = null;
  renderMarkers();
  renderList();
  updateSelectedDetails();
  await updateStorageUi();
}


function readSpotListEditorFormData() {
  return {
    name: $('spotListName')?.value?.trim() || '',
    mushroomType: $('spotListType')?.value?.trim() || '',
    note: $('spotListNote')?.value?.trim() || '',
    collection: $('spotListCollection')?.value?.trim() || SPOT_DEFAULT_COLLECTION
  };
}

function populateSpotListEditor(spot) {
  if (!spot) return;
  const name = $('spotListName');
  const type = $('spotListType');
  const note = $('spotListNote');
  const collection = $('spotListCollection');
  if (name) name.value = spot.name || '';
  if (type) type.value = spot.mushroomType || '';
  if (note) note.value = spot.note || '';
  if (collection) collection.value = spot.collection || SPOT_DEFAULT_COLLECTION;
}

function renderSpotListDetailsState() {
  const spot = getSelectedSpot();
  const editing = Boolean(spot && spotListEditorOpen);
  const canChat = canSendSpotToChat();

  setHidden('spotListEditor', !editing);
  setHidden('spotListDetails', editing || !spot);

  // View state: actions that operate on the saved spot as an existing object.
  setHidden('spotListShowOnMapBtn', editing || !spot);
  setHidden('spotListSendToChatBtn', editing || !spot || !canChat);
  setHidden('spotListEditBtn', editing || !spot);
  setHidden('spotListDeleteBtn', editing || !spot);
  setHidden('spotListCloseDetailsBtn', editing || !spot);

  // Edit state: only form controls are visible. View/destructive/navigation
  // actions stay hidden so the user cannot mix two modes in one card.
  setHidden('spotListSaveEditBtn', !editing);
  setHidden('spotListCancelEditBtn', !editing);

  setDisabled('spotListShowOnMapBtn', !spot || editing);
  setDisabled('spotListSendToChatBtn', !spot || editing || !canChat);
  setDisabled('spotListEditBtn', !spot || editing);
  setDisabled('spotListDeleteBtn', !spot || editing);
  setDisabled('spotListCloseDetailsBtn', !spot || editing);
  setDisabled('spotListSaveEditBtn', !editing);
  setDisabled('spotListCancelEditBtn', !editing);
}

function startSpotListEditor() {
  const spot = getSelectedSpot();
  if (!spot) return false;
  spotListEditorOpen = true;
  populateSpotListEditor(spot);
  renderSpotListDetailsState();
  window.requestAnimationFrame(() => {
    const first = $('spotListCollection') || $('spotListName');
    try { first?.focus({ preventScroll: true }); } catch {}
  });
  return true;
}

function cancelSpotListEditor() {
  spotListEditorOpen = false;
  renderSpotListDetailsState();
  return true;
}

async function saveSpotListEditorChanges() {
  const spot = getSelectedSpot();
  if (!spot) return false;
  const data = readSpotListEditorFormData();
  const updated = {
    ...spot,
    name: data.name || spot.name || 'Грибная точка',
    mushroomType: data.mushroomType || '',
    note: data.note || '',
    collection: data.collection || SPOT_DEFAULT_COLLECTION,
    updatedAt: new Date().toISOString(),
    appVersion: APP_VERSION
  };
  await putSpot(updated);
  selectedSpotId = updated.id;
  activeSpotCollection = updated.collection || SPOT_DEFAULT_COLLECTION;
  spotListEditorOpen = false;
  await afterDataChanged();
  updateSelectedDetails();
  renderList();
  return true;
}

async function deleteSelectedFromSpotList() {
  const spot = getSelectedSpot();
  if (!spot) return false;
  if (!confirm(`Удалить точку «${spot.name || 'Грибная точка'}»?`)) return false;
  await removeSpot(spot.id);
  if (selectedMapObject?.kind === 'saved' && selectedMapObject.id === spot.id) selectedMapObject = null;
  selectedSpotId = null;
  spotListEditorOpen = false;
  savedSpotEditorOpen = false;
  if (navLine) { navLine.remove(); navLine = null; }
  setHidden('selectedCard', true);
  setHidden('spotListDetailsCard', true);
  await afterDataChanged();
  renderMapObjectPanel();
  updateActionButtonsUi();
  return true;
}

function showSelectedSpotOnMap() {
  const spot = getSelectedSpot();
  if (!spot) { markButtonBlocked('сохранённая точка не выбрана'); alert('Сначала выбери сохранённую точку.'); return false; }
  switchAppScreen('map');
  $('selectedCard').hidden = false;
  setSelectedMapObject('saved', { id: spot.id });
  if (canUseMapRuntime()) {
    map.setView([spot.lat, spot.lon], Math.max(map.getZoom(), 16));
    const marker = spotMarkers.get(spot.id);
    if (marker) marker.openPopup();
    safeInvalidateMap(150, 'show selected spot on map');
  }
  updateSelectedDetails();
  return true;
}

function openSpotDetailsFromList(id, options = {}) {
  const spot = spots.find((item) => item.id === id);
  if (!spot) return false;
  const collection = normalizedSpotCollection(spot);
  if (options.pushHistory !== false) {
    replaceSpotHistoryState('collection', { collection, selectedSpotId: null });
  }
  activeSpotCollection = collection;
  spotListEditorOpen = false;
  selectSpot(id, false);
  const card = $('spotListDetailsCard');
  if (card) {
    card.hidden = false;
    renderSpotListDetailsState();
    card.scrollIntoView({ behavior: 'smooth', block: 'nearest' });
  }
  if (options.pushHistory !== false) {
    pushSpotHistoryState('details', { collection, selectedSpotId: id });
  }
  return true;
}

function closeSpotDetails() {
  selectedSpotId = null;
  savedSpotEditorOpen = false;
  spotListEditorOpen = false;
  if (selectedMapObject?.kind === 'saved') selectedMapObject = null;
  setHidden('selectedCard', true);
  setHidden('spotListDetailsCard', true);
  renderMapObjectPanel();
  updateSavedSpotMarkerStates();
  if (canUseMapRuntime()) map.closePopup();
  renderList();
  updateActionButtonsUi();
  renderPmtilesPreviewUserLayers('selected spot cleared from details panel');
}

function selectSpot(id, center=false) {
  const spot = spots.find(s => s.id === id);
  if (!spot) return;
  selectedSpotId = id;
  setSelectedMapObject('saved', { id });
  $('selectedCard').hidden = false;
  if (center) switchAppScreen('map');
  if (center && canUseMapRuntime()) map.setView([spot.lat, spot.lon], Math.max(map.getZoom(), 16));
  const marker = spotMarkers.get(id);
  if (marker && activeAppScreen === 'map') marker.openPopup();
  updateSelectedDetails();
  renderList();
  updateActionButtonsUi();
  renderPmtilesPreviewUserLayers('selected spot mirrored to offline map preview');
}
window.selectSpotFromPopup = (id) => {
  selectSpot(id, false);
  return revealSelectedSpotCardOnMap();
};

function updateSelectedDetails() {
  const spot = getSelectedSpot();
  if (!spot) {
    if (selectedMapObject?.kind === 'saved') selectedMapObject = null;
    renderMapObjectPanel();
    setHidden('selectedCard', true);
    setHidden('spotListDetailsCard', true);
    const selectedDetails = $('selectedDetails');
    if (selectedDetails) selectedDetails.innerHTML = '';
    const listDetails = $('spotListDetails');
    if (listDetails) listDetails.innerHTML = '';
    updateActionButtonsUi();
    return;
  }
  const html = buildSpotDetailsPanelHtml(spot);
  const selectedDetails = $('selectedDetails');
  if (selectedDetails) selectedDetails.innerHTML = html;
  const listDetails = $('spotListDetails');
  if (listDetails) listDetails.innerHTML = html;
  renderSpotListDetailsState();
  updateActionButtonsUi();
}

function showNavigationLine() {
  const spot = spots.find(s => s.id === selectedSpotId);
  if (!spot || !currentPosition) return alert('Нужна выбранная точка и активный GPS.');
  if (!canUseMapRuntime()) return alert('Карта недоступна, но координаты точки сохранены.');
  if (navLine) navLine.remove();
  navLine = L.polyline([[currentPosition.lat, currentPosition.lon], [spot.lat, spot.lon]], { weight: 4 }).addTo(map);
  map.fitBounds(navLine.getBounds(), { padding: [40, 40] });
}

function getBackupUserSummary(payload) {
  const spotCount = payload?.validation?.spotCount ?? payload?.data?.spots?.length ?? 0;
  const routeCount = payload?.validation?.trackCount ?? payload?.data?.tracks?.length ?? 0;
  const folderCount = payload?.validation?.customCollectionCount ?? payload?.data?.settings?.customCollections?.length ?? 0;
  return { spotCount, routeCount, folderCount };
}

function getBackupUserSummaryText(payload) {
  const { spotCount, routeCount, folderCount } = getBackupUserSummary(payload);
  return `Точек: ${spotCount}. Маршрутов: ${routeCount}. Пользовательских папок: ${folderCount}. Карты, группы, чат и ключи не входят в JSON.`;
}

function setBackupStatus(message) {
  setText('backupOperationStatus', message || '—');
}

async function markManualBackupExported(payload) {
  const now = new Date().toISOString();
  await setSetting('lastManualBackupAt', now);
  await setSetting('lastBackupSummary', getBackupUserSummaryText(payload));
  await updateStorageUi();
  setBackupStatus(`Экспорт готов. ${getBackupUserSummaryText(payload)} Сохрани файл вне браузера.`);
}

async function exportAll() {
  const payload = buildBackupPayload();
  downloadJson(`mushroom-spots-backup-${new Date().toISOString().slice(0,10)}.json`, payload);
  await markManualBackupExported(payload);
}


function exportSelected() {
  const spot = spots.find(s => s.id === selectedSpotId);
  if (!spot) return alert('Сначала выбери точку.');
  downloadJson(
    `mushroom-spot-${spot.name.replace(/[^a-zа-яё0-9]+/gi,'-')}.json`,
    buildBackupPayload({ spotsOverride: [spot], tracksOverride: [], customCollectionsOverride: [] })
  );
}

function assertPlainObject(value, message) {
  if (!value || typeof value !== 'object' || Array.isArray(value)) throw new Error(message);
}

function validateBackupSpot(raw, index) {
  assertPlainObject(raw, `Точка #${index + 1} имеет неправильную структуру`);
  const lat = Number(raw.lat);
  const lon = Number(raw.lon);
  if (!Number.isFinite(lat) || !Number.isFinite(lon) || Math.abs(lat) > 90 || Math.abs(lon) > 180) {
    throw new Error(`Точка #${index + 1} содержит неправильные координаты`);
  }
  const normalized = sanitizeSpotForBackup(raw);
  if (!normalized) throw new Error(`Точка #${index + 1} не прошла проверку`);
  normalized.updatedAt = new Date().toISOString();
  normalized.appVersion = APP_VERSION;
  return normalized;
}

function validateBackupTrack(raw, index) {
  assertPlainObject(raw, `Маршрут #${index + 1} имеет неправильную структуру`);
  if (!Array.isArray(raw.points)) throw new Error(`Маршрут #${index + 1} не содержит массив GPS-точек`);
  const points = raw.points.map((point, pointIndex) => {
    const normalized = normalizeTrackPoint(point);
    if (!normalized) throw new Error(`Маршрут #${index + 1}, GPS-точка #${pointIndex + 1} имеет неправильные координаты`);
    return normalized;
  });
  const normalized = normalizeTrackForStorage({ ...raw, points, updatedAt: new Date().toISOString(), appVersion: APP_VERSION });
  if (!normalized) throw new Error(`Маршрут #${index + 1} не прошёл проверку`);
  normalized.updatedAt = new Date().toISOString();
  normalized.appVersion = APP_VERSION;
  return normalized;
}

function validateBackupPayload(payload) {
  assertPlainObject(payload, 'JSON должен быть объектом резервной копии');
  if (payload.schema !== BACKUP_SCHEMA) throw new Error('JSON не является резервной копией этого приложения');
  if (payload.schemaVersion !== BACKUP_SCHEMA_VERSION) throw new Error('Версия схемы backup не поддерживается');
  assertPlainObject(payload.data, 'В backup нет секции data');
  assertPlainObject(payload.data.settings, 'В backup нет секции data.settings');
  if (!Array.isArray(payload.data.spots)) throw new Error('В backup нет массива data.spots');
  if (!Array.isArray(payload.data.settings.customCollections)) throw new Error('В backup нет массива data.settings.customCollections');
  const rawTracks = Array.isArray(payload.data.tracks) ? payload.data.tracks : [];

  const normalizedSpots = payload.data.spots.map((spot, index) => validateBackupSpot(spot, index));
  const normalizedTracks = rawTracks.map((track, index) => validateBackupTrack(track, index));
  const normalizedCollections = dedupeSpotCollections(payload.data.settings.customCollections.map((item, index) => {
    if (typeof item !== 'string') throw new Error(`Папка #${index + 1} имеет неправильную структуру`);
    return item;
  }));

  assertPlainObject(payload.validation, 'В backup нет validation metadata');
  if (payload.validation.spotCount !== normalizedSpots.length) throw new Error('Количество точек в backup не совпадает с metadata');
  if (payload.validation.trackCount != null && payload.validation.trackCount !== normalizedTracks.length) throw new Error('Количество маршрутов в backup не совпадает с metadata');
  if (payload.validation.customCollectionCount !== normalizedCollections.length) throw new Error('Количество папок в backup не совпадает с metadata');
  const expectedChecksum = getBackupChecksum(payload.data);
  if (payload.validation.checksum !== expectedChecksum) throw new Error('Контрольная сумма backup не совпадает');

  return { spots: normalizedSpots, tracks: normalizedTracks, customCollections: normalizedCollections };
}

function commitValidatedBackupImport(validated) {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction([SPOTS_STORE, SETTINGS_STORE, TRACKS_STORE], 'readwrite');
    const spotStore = transaction.objectStore(SPOTS_STORE);
    const settingStore = transaction.objectStore(SETTINGS_STORE);
    const trackStore = transaction.objectStore(TRACKS_STORE);
    try {
      for (const spot of validated.spots) spotStore.put(spot);
      for (const track of validated.tracks || []) trackStore.put(track);
      const mergedCollections = dedupeSpotCollections([
        ...customSpotCollections,
        ...validated.customCollections
      ]);
      settingStore.put({
        key: SPOT_CUSTOM_COLLECTIONS_SETTING_KEY,
        value: mergedCollections,
        updatedAt: new Date().toISOString()
      });
    } catch (err) {
      try { transaction.abort(); } catch {}
      reject(err);
      return;
    }
    transaction.oncomplete = () => resolve();
    transaction.onerror = () => reject(transaction.error || new Error('IndexedDB import transaction failed'));
    transaction.onabort = () => reject(transaction.error || new Error('IndexedDB import transaction aborted'));
  });
}

function formatBackupImportSuccess(validated) {
  return `Импорт завершён. Восстановлено точек: ${validated.spots.length}. Восстановлено маршрутов: ${(validated.tracks || []).length}. Восстановлено пользовательских папок: ${validated.customCollections.length}. Существующие данные не очищались.`;
}

function formatBackupImportError(error) {
  return `Импорт отклонён: ${error.message}. Данные на устройстве не изменены.`;
}

async function importJson(file) {
  if (!file) return;
  setBackupStatus('Проверяю файл резервной копии…');
  const text = await file.text();
  let parsed;
  try {
    parsed = JSON.parse(text);
  } catch {
    throw new Error('JSON повреждён или имеет неправильный формат');
  }
  const validated = validateBackupPayload(parsed);
  setBackupStatus(`Файл проверен. Готовлю восстановление: точек ${validated.spots.length}, маршрутов ${(validated.tracks || []).length}, папок ${validated.customCollections.length}.`);
  await commitValidatedBackupImport(validated);
  await loadSpotCollections();
  await afterDataChanged();
  await refreshTracks();
  updateSpotCollectionFilterOptions();
  updateSpotCollectionUi(activeSpotCollection);
  const message = formatBackupImportSuccess(validated);
  await setSetting('lastImportSummary', message);
  await updateStorageUi();
  setBackupStatus(message);
  alert(message);
}


async function deleteSelected() {
  const spot = spots.find(s => s.id === selectedSpotId);
  if (!spot) return;
  if (!confirm(`Удалить точку «${spot.name}»?`)) return;
  await removeSpot(spot.id);
  selectedSpotId = null;
  if (selectedMapObject?.kind === 'saved') selectedMapObject = null;
  savedSpotEditorOpen = false;
  spotListEditorOpen = false;
  $('selectedCard').hidden = true;
  setHidden('spotListDetailsCard', true);
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
  const lastFolder = await getSetting('lastFolderBackupAt');
  const lastManual = await getSetting('lastManualBackupAt');
  const last = [lastFolder, lastManual].filter(Boolean).sort().pop();
  $('lastBackupStatus').textContent = last ? fmtDate(last) : '—';
  const lastBackupSummary = await getSetting('lastBackupSummary');
  const lastImportSummary = await getSetting('lastImportSummary');
  if (lastImportSummary) setBackupStatus(lastImportSummary);
  else if (lastBackupSummary) setBackupStatus(`Последний экспорт: ${lastBackupSummary}`);
  else setBackupStatus('Backup JSON сохраняет точки, маршруты и пользовательские папки. Карты, группы, чат и ключи не входят в файл.');
  if (navigator.storage && navigator.storage.estimate) {
    try {
      const estimate = await navigator.storage.estimate();
      const used = estimate.usage ? Math.round(estimate.usage / 1024 / 1024) : 0;
      $('storageHint').textContent = `Сейчас локально: точек ${spots.length}, маршрутов ${tracks.length}, пользовательских папок ${customSpotCollections.length}. Примерно занято: ${used} МБ. На iPhone скачивай JSON вручную и храни файл вне браузера.`;
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
  if (!cfg) throw new Error('Подключение к БД не настроено.');
  const headers = {
    apikey: cfg.key,
    Authorization: `Bearer ${cfg.key}`,
    'Content-Type': 'application/json',
    ...(options.headers || {})
  };
  const method = options.method || 'GET';
  const requestUrl = `${cfg.url}/rest/v1/${path}`;
  const requestId = beginApiRequest('БД REST', method, requestUrl);
  let res;
  const controller = new AbortController();
  const timeoutMs = Number(options.timeoutMs || SUPABASE_TIMEOUT_MS);
  const timeout = setTimeout(() => controller.abort(), timeoutMs);
  try {
    res = await fetch(requestUrl, { ...options, headers, signal: options.signal || controller.signal });
  } catch (err) {
    const detail = err?.name === 'AbortError' ? `timeout ${timeoutMs}ms` : err.message;
    finishApiRequest(requestId, 'ошибка сети', detail);
    throw new Error(`Network fetch failed. URL=${requestUrl}. ${detail}`);
  } finally {
    clearTimeout(timeout);
  }
  if (!res.ok) {
    const text = await res.text().catch(() => '');
    finishApiRequest(requestId, `HTTP ${res.status}`, text || res.statusText);
    throw new Error(`БД ${res.status}: ${text || res.statusText}`);
  }
  finishApiRequest(requestId, `HTTP ${res.status}`, res.statusText || 'OK');
  if (res.status === 204) return null;
  const text = await res.text();
  return text ? JSON.parse(text) : null;
}

function ensureUserId() {
  let profile = getActiveProfile();
  if (!profile) {
    profile = makeLocalProfile(localStorage.getItem('mushroom_live_name') || '', localStorage.getItem('mushroom_live_group_id') || '', localStorage.getItem('mushroom_live_user_id'));
    peopleProfiles.push(profile);
    activeProfileId = profile.id;
    savePeopleProfiles();
  }
  userId = profile.id;
  localStorage.setItem('mushroom_live_user_id', userId);
  return userId;
}

function updateLiveUi() {
  if ($('groupStatus')) {
    if (groupJoined && memberSyncPending) {
      $('groupStatus').textContent = 'в группе локально';
      $('groupStatus').className = 'pill warn';
    } else {
      $('groupStatus').textContent = groupJoined ? 'в группе' : 'не в группе';
      $('groupStatus').className = groupJoined ? 'pill on' : 'pill';
    }
  }
  if ($('liveStatus')) {
    $('liveStatus').textContent = liveEnabled ? 'моя позиция видна' : 'моя позиция скрыта';
    $('liveStatus').className = liveEnabled ? 'pill on' : 'pill';
    if (!getSupabaseConfig()) $('liveStatus').className = 'pill warn';
  }
  updateGroupScreenUi();
  updateDbCleanupUi();
  updateChatUi();
  updateActionButtonsUi();
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
    $('liveHint').textContent = 'Группа создана. Ты уже вошёл в неё и видишь участников. Чтобы друзья видели твою точку на карте, нажми “Начать показ моей позиции”.';
  } else {
    $('liveHint').textContent = 'Группа создана. Скопируй приглашение и отправь друзьям. Синхронизация участников, чат и live-локации сейчас недоступны.';
    updateChatUi();
  }
}

async function copyInvite() {
  const group = $('groupId').value.trim();
  if (!group) { markButtonBlocked('нет ID группы'); return alert('Сначала создай или вставь ID группы.'); }
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
  updateActiveProfileFromInputs();
  renderPeopleProfiles();
}

function loadLiveInputs() {
  const profile = getActiveProfile();
  $('liveName').value = localStorage.getItem('mushroom_live_name') || profile?.displayName || '';
  $('groupId').value = localStorage.getItem('mushroom_live_group_id') || profile?.lastGroupId || '';
  const groupFromUrl = parseGroupFromUrl();
  if (groupFromUrl && profile) {
    profile.lastGroupId = groupFromUrl;
    savePeopleProfiles();
  }
  updateLiveUi();
  renderPeopleProfiles();
  return groupFromUrl;
}

function clearFriendMarkers() {
  for (const marker of friendMarkers.values()) marker.remove();
  friendMarkers.clear();
  if (selectedMapObject?.kind === 'friend') clearSelectedMapObjectOnly();
  pmtilesPreviewLiveRows = [];
  renderPmtilesPreviewUserLayers('live friends cleared from offline map preview');
}

async function joinGroup(silent = false) {
  const group = $('groupId').value.trim();
  const name = $('liveName').value.trim();
  if (!group) {
    if (!silent) { markButtonBlocked('нет ID группы'); alert('Создай группу или открой приглашение от друга.'); }
    return false;
  }
  if (!name) {
    if (!silent) { markButtonBlocked('не указано имя'); alert('Укажи своё имя.'); }
    return false;
  }

  saveLiveInputs();
  groupJoined = true;
  mergeSelfIntoGroupCache(group);
  renderCachedFriends(group, 'Локальный вход выполнен; обновляю сеть…');
  updateLiveUi();
  clearInterval(friendsTimer);
  clearInterval(memberSyncTimer);

  if (!getSupabaseConfig()) {
    setMemberSyncPending(true, 'БД не настроена');
    $('liveHint').textContent = 'Группа открыта локально. Синхронизация участников сейчас недоступна.';
    return true;
  }

  try {
    await upsertGroupMember(false);
    setMemberSyncPending(false, 'joined');
  } catch (err) {
    const message = handleMemberSyncFailure(err);
    $('liveHint').textContent = `Группа открыта локально, но имя участника ждёт сеть: ${message}`;
  }

  await refreshFriends();
  friendsTimer = setInterval(refreshFriends, 10000);
  await refreshGroupChat(false);
  startChatAutoRefresh();
  if (!silent && !memberSyncPending) {
    $('liveHint').textContent = 'Ты в группе. Можно видеть активных участников без передачи своей позиции. Чтобы друзья видели твою точку на карте, нажми “Начать показ моей позиции”.';
  }
  return true;
}

async function leaveGroup() {
  await stopLiveSharing(false);
  await deleteMyGroupMember().catch(err => console.warn('Could not delete own group member row', err));
  groupJoined = false;
  setMemberSyncPending(false, 'left group');
  stopChatAutoRefresh(true);
  clearInterval(friendsTimer);
  friendsTimer = null;
  clearFriendMarkers();
  clearPersistedGroupSelection();
  if ($('friendsList')) $('friendsList').innerHTML = '<p class="hint">Ты вышел из группы.</p>';
  if ($('liveLocationsList')) $('liveLocationsList').innerHTML = '<p class="hint">Live-локации скрыты после выхода из группы.</p>';
  updateGroupScreenUi(0, 0);
  updateLiveUi();
  $('liveHint').textContent = 'Ты вышел из группы. Чтобы вернуться, создай группу или открой приглашение заново.';
}

async function publishMyLocation() {
  if (!liveEnabled) return;
  const group = $('groupId').value.trim();
  const name = $('liveName').value.trim();
  if (!group || !name) throw new Error('Укажи имя и ID группы.');
  if (!currentPosition) {
    startGps(false);
    $('liveHint').textContent = 'Жду GPS-координаты перед отправкой позиции. Пока GPS не готов, группа и чат могут работать, но твой маркер не отправится.';
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


function setDbCleanupHint(text, isError = false) {
  const el = $('dbCleanupHint');
  if (!el) return;
  el.textContent = text;
  el.className = isError ? 'hint danger-text' : 'hint';
}

function updateDbCleanupUi() {
  const idEl = $('myLiveUserId');
  if (idEl) idEl.textContent = ensureUserId();
  const group = $('groupId')?.value?.trim() || '';
  const groupEl = $('cleanupGroupMirror');
  if (groupEl) groupEl.textContent = group || '—';
  const hasSupabase = Boolean(getSupabaseConfig());
  const hasGroup = Boolean(group);

  if ($('cleanMyDbBtn')) $('cleanMyDbBtn').disabled = !hasSupabase || !hasGroup;
  if ($('cleanCurrentGroupDbBtn')) $('cleanCurrentGroupDbBtn').disabled = !hasSupabase || !hasGroup;
  if ($('cleanStaleGroupDbBtn')) $('cleanStaleGroupDbBtn').disabled = !hasSupabase || !hasGroup;
  if ($('cleanMyEverywhereDbBtn')) $('cleanMyEverywhereDbBtn').disabled = !hasSupabase;

  if (!hasSupabase) {
    setDbCleanupHint('Чистка БД недоступна: нет подключения к БД. Локальные грибные точки не затрагиваются.');
  } else if (!hasGroup) {
    setDbCleanupHint('Для чистки текущей группы вставь или создай ID группы. Можно удалить “меня из всех групп” по локальному user_id.');
  } else {
    setDbCleanupHint('Готово к чистке live-локаций в БД. “Меня” = локальный user_id этого браузера; грибные точки IndexedDB не удаляются.');
  }
}

function getCurrentGroupForCleanup() {
  const group = $('groupId')?.value?.trim() || '';
  if (!group) throw new Error('Сначала создай или вставь ID группы.');
  return group;
}

function requireGroupTypedConfirmation(group, actionText) {
  const typed = prompt(`${actionText}\n\nЭто удалит live-записи из БД, но не тронет локальные грибные точки.\n\nДля подтверждения введи ID группы полностью:`, '');
  return typed === group;
}

function confirmDbCleanup(actionText) {
  return confirm(`${actionText}\n\nБудут удалены только live-записи из БД. Локальные грибные точки, заметки и фото не затрагиваются.`);
}

async function deleteLiveRows(filterQuery, label, options = {}) {
  if (!getSupabaseConfig()) throw new Error('Подключение к БД не настроено.');
  const select = options.select || 'group_id,user_id,user_name,updated_at';
  const path = `live_locations?${filterQuery}&select=${select}`;
  const rows = await supabaseFetch(path, {
    method: 'DELETE',
    headers: { Prefer: 'return=representation' }
  });
  const deleted = Array.isArray(rows) ? rows.length : 0;
  setDbCleanupHint(`${label}: удалено строк: ${deleted}.`);
  $('liveHint').textContent = `${label}: удалено live-записей: ${deleted}.`;
  return deleted;
}

async function afterDbCleanupRefresh() {
  updateLiveUi();
  updateDbCleanupUi();
  if (groupJoined && getSupabaseConfig()) {
    await refreshFriends();
    await refreshGroupChat(false);
  } else {
    clearFriendMarkers();
  }
}

async function cleanMyDbRow() {
  const group = getCurrentGroupForCleanup();
  const myId = ensureUserId();
  if (!confirmDbCleanup(`Удалить мою live-запись из текущей группы?\n\nГруппа: ${group}\nМой user_id: ${myId}`)) { markButtonCancelled('чистка отменена пользователем'); return; }

  liveEnabled = false;
  clearInterval(liveTimer);
  liveTimer = null;
  updateLiveUi();

  const encodedGroup = encodeURIComponent(group);
  const encodedUser = encodeURIComponent(myId);
  await deleteLiveRows(`group_id=eq.${encodedGroup}&user_id=eq.${encodedUser}`, 'Удаление меня из текущей группы');
  await afterDbCleanupRefresh();
}

async function cleanMyEverywhereDbRows() {
  const myId = ensureUserId();
  const typed = prompt(`Удалить мои live-записи из ВСЕХ групп?\n\nЭто использует локальный user_id этого браузера. Для подтверждения введи мой user_id полностью:`, '');
  if (typed !== myId) { markButtonCancelled('user_id не подтверждён'); return; }

  liveEnabled = false;
  clearInterval(liveTimer);
  liveTimer = null;
  updateLiveUi();

  const encodedUser = encodeURIComponent(myId);
  await deleteLiveRows(`user_id=eq.${encodedUser}`, 'Удаление меня из всех групп');
  await afterDbCleanupRefresh();
}

async function cleanCurrentGroupDbRows() {
  const group = getCurrentGroupForCleanup();
  if (!requireGroupTypedConfirmation(group, `Очистить ВСЮ текущую группу?\n\nГруппа: ${group}`)) { markButtonCancelled('ID группы не подтверждён'); return; }

  if (liveEnabled) {
    liveEnabled = false;
    clearInterval(liveTimer);
    liveTimer = null;
  }
  groupJoined = false;
  setMemberSyncPending(false, 'left group');
  stopChatAutoRefresh(true);
  clearInterval(friendsTimer);
  friendsTimer = null;

  const encodedGroup = encodeURIComponent(group);
  await deleteLiveRows(`group_id=eq.${encodedGroup}`, 'Очистка текущей группы');
  clearFriendMarkers();
  if ($('friendsList')) $('friendsList').innerHTML = '<p class="hint">Текущая группа очищена в БД.</p>';
    if ($('liveLocationsList')) $('liveLocationsList').innerHTML = '<p class="hint">Live-локации текущей группы очищены.</p>';
    updateGroupScreenUi(0, 0);
  updateLiveUi();
  updateDbCleanupUi();
}

async function cleanStaleGroupDbRows() {
  const group = getCurrentGroupForCleanup();
  const hours = 24;
  const cutoff = new Date(Date.now() - hours * 60 * 60 * 1000).toISOString();
  if (!confirmDbCleanup(`Удалить старые live-записи текущей группы?\n\nГруппа: ${group}\nКритерий: updated_at старше ${hours} ч\nДо: ${fmtDate(cutoff)}`)) { markButtonCancelled('чистка отменена пользователем'); return; }

  const encodedGroup = encodeURIComponent(group);
  const encodedCutoff = encodeURIComponent(cutoff);
  await deleteLiveRows(`group_id=eq.${encodedGroup}&updated_at=lt.${encodedCutoff}`, `Удаление старых записей группы старше ${hours} ч`);
  await afterDbCleanupRefresh();
}


function currentGroupId() {
  return $('groupId')?.value?.trim() || '';
}

function currentChatName() {
  return $('liveName')?.value?.trim() || 'Без имени';
}


function updateGroupScreenUi(memberCount = null, activeLocationCount = null, fromCache = false) {
  const hasSupabase = Boolean(getSupabaseConfig());
  const group = currentGroupId();
  const name = currentChatName();

  if ($('groupStateText')) {
    if (!group) {
      $('groupStateText').textContent = 'Ты не в группе';
    } else if (groupJoined && memberSyncPending) {
      $('groupStateText').textContent = 'Ты в группе локально';
    } else if (groupJoined) {
      $('groupStateText').textContent = `Ты в группе${name && name !== 'Без имени' ? ` как ${name}` : ''}`;
    } else {
      $('groupStateText').textContent = 'Группа выбрана, вход не выполнен';
    }
  }
  if ($('groupStateHint')) {
    if (!hasSupabase) {
      $('groupStateHint').textContent = 'Группа может открыться локально, но синхронизация участников и чат сейчас недоступны без подключения к БД.';
    } else if (!group) {
      $('groupStateHint').textContent = 'Создай группу или вставь ID от друга.';
    } else if (groupJoined) {
      $('groupStateHint').textContent = `ID группы: ${group}. Участники и чат привязаны к этому ID.`;
    } else {
      $('groupStateHint').textContent = 'Нажми “Войти в группу”, чтобы видеть участников и чат.';
    }
  }
  if ($('myLiveStateText')) {
    $('myLiveStateText').textContent = liveEnabled ? 'Геопозиция передаётся' : 'Геопозиция не передаётся';
  }
  if ($('myLiveStateHint')) {
    if (liveEnabled) {
      $('myLiveStateHint').textContent = 'Друзья увидят твою live-точку, пока есть связь и GPS.';
    } else if (groupJoined) {
      $('myLiveStateHint').textContent = 'Ты видишь группу, но твой маркер не появляется у друзей до запуска live-позиции.';
    } else {
      $('myLiveStateHint').textContent = 'Сначала войди в группу. Маркер на карте появляется только из live-локаций, а не из списка участников.';
    }
  }
  if ($('groupHint')) {
    $('groupHint').textContent = groupJoined
      ? 'Группа активна. Участники и live-локации разделены: участник без live-координат не создаёт маркер на карте.'
      : 'Группа может открыться локально даже без сети; синхронизация догонит при связи.';
  }
  if ($('groupMembersStatus')) {
    if (memberCount === null) {
      $('groupMembersStatus').textContent = groupJoined ? 'ожидаю данные' : 'нет группы';
      $('groupMembersStatus').className = groupJoined ? 'pill warn' : 'pill';
    } else {
      $('groupMembersStatus').textContent = memberCount ? `${memberCount} участн.` : 'нет участников';
      $('groupMembersStatus').className = memberCount ? (fromCache ? 'pill warn' : 'pill on') : 'pill';
    }
  }
  if ($('groupMembersHint')) {
    $('groupMembersHint').textContent = fromCache
      ? 'Показан локальный кэш участников. Он может быть устаревшим.'
      : 'Участники показывают, кто есть в группе. Сама запись участника не создаёт маркер на карте.';
  }
  if ($('liveLocationsStatus')) {
    if (activeLocationCount === null) {
      $('liveLocationsStatus').textContent = groupJoined ? 'ожидаю live' : 'нет live-данных';
      $('liveLocationsStatus').className = 'pill';
    } else {
      $('liveLocationsStatus').textContent = activeLocationCount ? `${activeLocationCount} на карте` : 'нет live-данных';
      $('liveLocationsStatus').className = activeLocationCount ? 'pill on' : 'pill';
    }
  }
  if ($('liveLocationsHint')) {
    $('liveLocationsHint').textContent = 'На карте появляются только активные live-локации из БД, а не все участники группы.';
  }
  if ($('friendsList') && !$('friendsList').children.length) {
    $('friendsList').innerHTML = groupJoined
      ? '<p class="hint">В группе пока нет участников. Если связи нет, список появится из кэша после первого успешного обновления.</p>'
      : '<p class="hint">Открой приглашение или нажми “Войти в группу”.</p>';
  }
  if ($('liveLocationsList') && !$('liveLocationsList').children.length) {
    $('liveLocationsList').innerHTML = groupJoined
      ? '<p class="hint">Нет активных live-локаций. Участники без live-координат не создают маркеры на карте.</p>'
      : '<p class="hint">Live-локации появятся после входа в группу и запуска передачи позиции у участников.</p>';
  }
}

function setChatHint(text, isError = false) {
  const el = $('chatHint');
  if (!el) return;
  el.textContent = text;
  el.className = isError ? 'hint danger-text' : 'hint';
}

function updateChatCounter() {
  const input = $('chatMessageInput');
  const counter = $('chatMessageCounter');
  if (!input || !counter) return;
  const length = input.value.length;
  counter.textContent = `${length}/${CHAT_MAX_LENGTH}`;
  counter.className = length > CHAT_MAX_LENGTH ? 'chat-counter danger-text' : 'chat-counter';
}

function updateChatUi() {
  const hasSupabase = Boolean(getSupabaseConfig());
  const group = currentGroupId();
  const canUseChat = hasSupabase && Boolean(group) && groupJoined;
  const sendBtn = $('chatSendBtn');
  const refreshBtn = $('chatRefreshBtn');
  const input = $('chatMessageInput');
  const cancelBtn = $('chatCancelEditBtn');
  const status = $('chatStatus');
  const editState = $('chatEditState');

  if (sendBtn) {
    sendBtn.disabled = !canUseChat || chatSendPending;
    sendBtn.textContent = chatSendPending
      ? (chatEditingMessageId ? 'Сохранение…' : 'Отправка…')
      : (chatEditingMessageId ? 'Сохранить правку' : 'Отправить');
  }
  if (refreshBtn) refreshBtn.disabled = !canUseChat || chatSendPending;
  if (input) input.disabled = !canUseChat || chatSendPending;
  if (cancelBtn) cancelBtn.hidden = !chatEditingMessageId;
  if (editState) {
    editState.hidden = !chatEditingMessageId;
    editState.textContent = chatEditingMessageId ? 'режим правки' : '';
  }
  if (status) {
    if (!hasSupabase) {
      status.textContent = 'чат недоступен';
      status.className = 'pill warn';
    } else if (!group) {
      status.textContent = 'нет группы';
      status.className = 'pill';
    } else if (!groupJoined) {
      status.textContent = 'сначала войди';
      status.className = 'pill';
    } else if (chatTimer) {
      status.textContent = 'авто 10 сек';
      status.className = 'pill on';
    } else {
      status.textContent = 'готов';
      status.className = 'pill on';
    }
  }
  updateChatCounter();

  if (!hasSupabase) {
    setChatHint('Чат недоступен: нет подключения к БД.');
  } else if (!group) {
    setChatHint('Создай группу или открой приглашение, чтобы читать и писать в чат группы.');
  } else if (!groupJoined) {
    setChatHint('Чат заблокирован: сначала нажми “Войти в группу” или открой приглашение.');
  } else if (!chatMessages.length) {
    setChatHint('Чат готов. Сообщения хранятся в БД и привязаны к текущему ID группы.');
  }
}

function resetChatComposer(clearText = false) {
  chatEditingMessageId = null;
  const input = $('chatMessageInput');
  if (clearText && input) {
    input.value = '';
    input.dispatchEvent(new Event('input', { bubbles: true }));
  }
  updateChatUi();
}

function stopChatAutoRefresh(clearList = false) {
  clearInterval(chatTimer);
  chatTimer = null;
  chatSendPending = false;
  resetChatComposer(clearList);
  if (clearList) {
    chatMessages = [];
    const list = $('groupChatList');
    if (list) list.innerHTML = '<p class="hint">Чат появится после входа в группу.</p>';
  }
  updateChatUi();
}

function startChatAutoRefresh() {
  clearInterval(chatTimer);
  if (!getSupabaseConfig() || !currentGroupId() || !groupJoined) {
    chatTimer = null;
    updateChatUi();
    return;
  }
  chatTimer = setInterval(() => refreshGroupChat(false).catch(err => setChatHint(`Ошибка автообновления чата: ${err.message}`, true)), CHAT_REFRESH_MS);
  updateChatUi();
}

function sanitizeChatBody(value) {
  return String(value || '').trim().slice(0, CHAT_MAX_LENGTH);
}

function trimTextForSpotMessage(value, maxLength) {
  return String(value || '').trim().replace(/\s+/g, ' ').slice(0, maxLength);
}

function roundCoord(value) {
  return Number(Number(value).toFixed(6));
}

function buildSpotChatPayloadFromSpot(spot) {
  return {
    v: 1,
    t: 'spot',
    lat: roundCoord(spot.lat),
    lng: roundCoord(spot.lon ?? spot.lng),
    n: trimTextForSpotMessage(spot.name || 'Грибная точка', 42),
    m: trimTextForSpotMessage(spot.mushroomType || '', 32),
    d: trimTextForSpotMessage(spot.note || '', 90),
    s: 'saved'
  };
}

function buildSpotChatPayloadFromPickedPoint() {
  if (!pickedMapPoint) return null;
  return {
    v: 1,
    t: 'spot',
    lat: roundCoord(pickedMapPoint.lat),
    lng: roundCoord(pickedMapPoint.lon),
    n: trimTextForSpotMessage($('spotName')?.value || 'Выбранная точка', 42),
    m: trimTextForSpotMessage($('mushroomType')?.value || '', 32),
    d: trimTextForSpotMessage($('spotNote')?.value || '', 90),
    s: 'picked'
  };
}

function encodeSpotChatBody(payload) {
  const normalized = {
    v: 1,
    t: 'spot',
    lat: roundCoord(payload.lat),
    lng: roundCoord(payload.lng ?? payload.lon),
    n: trimTextForSpotMessage(payload.n || payload.name || 'Грибная точка', 42),
    m: trimTextForSpotMessage(payload.m || payload.mushroomType || '', 32),
    d: trimTextForSpotMessage(payload.d || payload.note || '', 90),
    s: trimTextForSpotMessage(payload.s || payload.source || 'spot', 12)
  };
  let body = `${CHAT_SPOT_PREFIX}${JSON.stringify(normalized)}`;
  while (body.length > CHAT_MAX_LENGTH && normalized.d.length > 0) {
    normalized.d = normalized.d.slice(0, Math.max(0, normalized.d.length - 12));
    body = `${CHAT_SPOT_PREFIX}${JSON.stringify(normalized)}`;
  }
  while (body.length > CHAT_MAX_LENGTH && normalized.n.length > 12) {
    normalized.n = normalized.n.slice(0, Math.max(12, normalized.n.length - 8));
    body = `${CHAT_SPOT_PREFIX}${JSON.stringify(normalized)}`;
  }
  if (body.length > CHAT_MAX_LENGTH) throw new Error('Точка слишком длинная для сообщения чата.');
  return body;
}

function parseSpotChatBody(body) {
  const text = String(body || '');
  if (!text.startsWith(CHAT_SPOT_PREFIX)) return null;
  try {
    const payload = JSON.parse(text.slice(CHAT_SPOT_PREFIX.length));
    const lat = Number(payload.lat);
    const lng = Number(payload.lng ?? payload.lon);
    if (payload.t !== 'spot' || !Number.isFinite(lat) || !Number.isFinite(lng)) return null;
    if (Math.abs(lat) > 90 || Math.abs(lng) > 180) return null;
    return {
      v: 1,
      t: 'spot',
      lat,
      lng,
      n: trimTextForSpotMessage(payload.n || 'Грибная точка', 80),
      m: trimTextForSpotMessage(payload.m || '', 60),
      d: trimTextForSpotMessage(payload.d || '', 160),
      s: trimTextForSpotMessage(payload.s || 'spot', 20)
    };
  } catch (err) {
    console.warn('Invalid spot chat payload', err);
    return null;
  }
}

function requireGroupChatReady(actionLabel = 'Отправка точки в чат') {
  if (!getSupabaseConfig()) { markButtonBlocked('БД не настроена'); alert('Отправка точки в чат сейчас недоступна: нет подключения к БД.'); return false; }
  if (!currentGroupId()) { markButtonBlocked('нет ID группы'); alert('Сначала создай группу или открой приглашение.'); return false; }
  if (!groupJoined) { markButtonBlocked('чат доступен только после входа в группу'); alert('Сначала войди в группу.'); return false; }
  return true;
}

async function sendSpotPayloadToChat(payload, sourceLabel) {
  if (chatSendPending) {
    markButtonBlocked('сообщение уже отправляется');
    setChatHint('Дождись завершения текущей отправки.', true);
    return false;
  }
  if (!requireGroupChatReady()) return false;
  const body = encodeSpotChatBody(payload);
  const name = currentChatName();
  if ($('liveName') && !$('liveName').value.trim()) {
    $('liveName').value = name;
    saveLiveInputs();
  }
  chatSendPending = true;
  updateChatUi();
  try {
    await createChatMessage(body, name);
    setChatHint(`${sourceLabel} отправлена в чат как кликабельная карточка.`);
    await refreshGroupChat(false);
    startChatAutoRefresh();
    return true;
  } finally {
    chatSendPending = false;
    updateChatUi();
  }
}

async function sendPickedMapPointToChat() {
  if (!pickedMapPoint) { markButtonBlocked('точка на карте не выбрана'); alert('Сначала зажми место на карте пальцем примерно на секунду.'); return false; }
  return sendSpotPayloadToChat(buildSpotChatPayloadFromPickedPoint(), 'Выбранная точка');
}

async function sendSelectedSpotToChat() {
  const spot = spots.find(s => s.id === selectedSpotId);
  if (!spot) { markButtonBlocked('сохранённая точка не выбрана'); alert('Сначала выбери сохранённую точку.'); return false; }
  return sendSpotPayloadToChat(buildSpotChatPayloadFromSpot(spot), 'Сохранённая точка');
}

function showChatSpotOnMap(payload) {
  if (!payload) return;
  chatPreviewPoint = {
    lat: payload.lat,
    lon: payload.lng,
    title: payload.n || 'Точка из чата',
    mushroomType: payload.m || '',
    note: payload.d || '',
    shownAt: new Date().toISOString()
  };
  renderPmtilesPreviewUserLayers('chat point mirrored to offline map preview');
  setSelectedMapObject('chat');
  switchAppScreen('map', { scrollTop: false });
  if (!canUseMapRuntime()) {
    setChatHint(`Карта недоступна. Координаты точки из чата: ${fmtCoord(payload.lat)}, ${fmtCoord(payload.lng)}.`);
    return;
  }
  const latlng = [payload.lat, payload.lng];
  const title = payload.n || 'Точка из чата';
  const popup = `<strong>${escapeHtml(title)}</strong><br>${payload.m ? `${escapeHtml(payload.m)}<br>` : ''}${payload.d ? `${escapeHtml(payload.d)}<br>` : ''}${fmtCoord(payload.lat)}, ${fmtCoord(payload.lng)}<br><span class="hint">из чата группы</span>`;
  if (!chatPreviewPointMarker) {
    chatPreviewPointMarker = L.marker(latlng, { title: 'Точка из чата', icon: makeMapIcon('chat') }).addTo(map).bindPopup(popup);
  } else {
    chatPreviewPointMarker.setLatLng(latlng).setPopupContent(popup);
  }
  chatPreviewPointMarker.openPopup();
  map.setView(latlng, Math.max(map.getZoom(), 16));
  $('map')?.scrollIntoView({ behavior: 'smooth', block: 'center' });
  safeInvalidateMap(250, 'chat spot preview');
  setChatHint(`Открыта точка из чата: ${fmtCoord(payload.lat)}, ${fmtCoord(payload.lng)}.`);
}

function renderChatSpotCard(payload) {
  const card = document.createElement('button');
  card.type = 'button';
  card.className = 'chat-spot-card';
  card.innerHTML = `
    <div class="chat-spot-title">📍 ${escapeHtml(payload.n || 'Грибная точка')}</div>
    ${payload.m ? `<div class="chat-spot-meta">${escapeHtml(payload.m)}</div>` : ''}
    ${payload.d ? `<div class="chat-spot-note">${escapeHtml(payload.d)}</div>` : ''}
    <div class="chat-spot-coords">${fmtCoord(payload.lat)}, ${fmtCoord(payload.lng)}</div>
    <div class="chat-spot-open">Нажми, чтобы показать на карте</div>
  `;
  card.onclick = withButtonDiagnostics('chatShowSpotBtn', () => showChatSpotOnMap(payload));
  return card;
}

async function fetchGroupMessages() {
  const group = currentGroupId();
  if (!group) return [];
  const encodedGroup = encodeURIComponent(group);
  const rows = await supabaseFetch(`group_messages?group_id=eq.${encodedGroup}&select=id,group_id,user_id,display_name,body,created_at,updated_at&order=created_at.desc&limit=${CHAT_FETCH_LIMIT}`, { method: 'GET' });
  return Array.isArray(rows) ? rows.reverse() : [];
}

function renderGroupChat(rows = chatMessages) {
  const list = $('groupChatList');
  if (!list) return;
  const myId = ensureUserId();
  list.innerHTML = '';

  if (!getSupabaseConfig()) {
    list.innerHTML = '<p class="hint">Чат недоступен: БД не настроена.</p>';
    return;
  }
  if (!currentGroupId()) {
    list.innerHTML = '<p class="hint">Сначала создай группу или открой приглашение.</p>';
    return;
  }
  if (!groupJoined) {
    list.innerHTML = '<p class="hint">Чат появится после входа в группу.</p>';
    return;
  }
  if (!rows.length) {
    list.innerHTML = '<p class="hint">В чате пока нет сообщений.</p>';
    return;
  }

  for (const row of rows) {
    const isMine = row.user_id === myId;
    const edited = row.updated_at && row.created_at && new Date(row.updated_at).getTime() - new Date(row.created_at).getTime() > 1500;
    const item = document.createElement('div');
    item.className = `chat-message ${isMine ? 'chat-message-own' : ''}`;
    item.dataset.messageId = row.id;
    const spotPayload = parseSpotChatBody(row.body);
    item.innerHTML = `
      <div class="chat-message-head">
        <strong>${escapeHtml(row.display_name || 'Без имени')}${isMine ? ' · я' : ''}</strong>
        <span>${fmtDate(row.created_at)}${edited && !spotPayload ? ' · изменено' : ''}</span>
      </div>
    `;
    if (spotPayload) {
      item.classList.add('chat-message-spot');
      item.appendChild(renderChatSpotCard(spotPayload));
    } else {
      const body = document.createElement('div');
      body.className = 'chat-message-body';
      body.textContent = row.body || '';
      item.appendChild(body);
    }
    if (isMine) {
      const actions = document.createElement('div');
      actions.className = 'row chat-message-actions';
      if (!spotPayload) {
        const editBtn = document.createElement('button');
        editBtn.type = 'button';
        editBtn.className = 'secondary btn-secondary small-btn';
        editBtn.textContent = 'Править';
        editBtn.onclick = withButtonDiagnostics('chatEditMessageBtn', () => startEditChatMessage(row.id));
        actions.appendChild(editBtn);
      }
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'danger btn-danger small-btn';
      deleteBtn.textContent = 'Удалить';
      deleteBtn.onclick = withButtonDiagnostics('chatDeleteMessageBtn', () => deleteChatMessage(row.id));
      actions.appendChild(deleteBtn);
      item.appendChild(actions);
    }
    list.appendChild(item);
  }
  list.scrollTop = list.scrollHeight;
}

async function refreshGroupChat(showManualHint = true) {
  if (!getSupabaseConfig()) {
    updateChatUi();
    return false;
  }
  if (!currentGroupId()) {
    updateChatUi();
    return false;
  }
  if (!groupJoined) {
    markButtonBlocked('чат доступен только после входа в группу');
    updateChatUi();
    return false;
  }
  try {
    chatMessages = await fetchGroupMessages();
    renderGroupChat(chatMessages);
    if (showManualHint) setChatHint(`Чат обновлён: сообщений ${chatMessages.length}.`);
    updateChatUi();
    return true;
  } catch (err) {
    setChatHint(`Ошибка чата: ${err.message}`, true);
    return false;
  }
}

async function sendOrUpdateChatMessage() {
  if (chatSendPending) {
    markButtonBlocked('сообщение уже отправляется');
    setChatHint('Дождись завершения текущей отправки.', true);
    return false;
  }

  const group = currentGroupId();
  if (!group) { markButtonBlocked('нет ID группы'); return alert('Сначала создай группу или открой приглашение.'); }
  if (!getSupabaseConfig()) { markButtonBlocked('БД не настроена'); return alert('Сначала подключи БД и переопубликуй сайт.'); }
  if (!groupJoined) { markButtonBlocked('чат доступен только после входа в группу'); return alert('Сначала войди в группу.'); }

  const input = $('chatMessageInput');
  const body = sanitizeChatBody(input?.value || '');
  if (!body) { markButtonBlocked('пустое сообщение'); return alert('Нельзя отправить пустое сообщение.'); }
  if (body.length > CHAT_MAX_LENGTH) { markButtonBlocked('сообщение длиннее лимита'); return alert(`Сообщение должно быть не длиннее ${CHAT_MAX_LENGTH} символов.`); }

  const name = currentChatName();
  if ($('liveName') && !$('liveName').value.trim()) {
    $('liveName').value = name;
    saveLiveInputs();
  }

  chatSendPending = true;
  updateChatUi();
  try {
    if (chatEditingMessageId) {
      await updateChatMessage(chatEditingMessageId, body, name);
    } else {
      await createChatMessage(body, name);
    }
    resetChatComposer(true);
    await refreshGroupChat(false);
    startChatAutoRefresh();
    return true;
  } finally {
    chatSendPending = false;
    updateChatUi();
  }
}

async function createChatMessage(body, name) {
  const payload = {
    group_id: currentGroupId(),
    user_id: ensureUserId(),
    display_name: name,
    body,
    created_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  const rows = await supabaseFetch('group_messages', {
    method: 'POST',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(payload)
  });
  const created = Array.isArray(rows) ? rows.length : 0;
  setChatHint(created ? 'Сообщение отправлено.' : 'Сообщение отправлено.');
}

function startEditChatMessage(messageId) {
  const row = chatMessages.find(item => item.id === messageId);
  if (!row) return;
  if (row.user_id !== ensureUserId()) return alert('В этом MVP можно редактировать только сообщения этого браузера.');
  if (parseSpotChatBody(row.body)) { markButtonBlocked('точка в чате не редактируется'); return alert('Точку в чате пока нельзя редактировать. Можно удалить сообщение и отправить точку заново.'); }
  chatEditingMessageId = messageId;
  $('chatMessageInput').value = row.body || '';
  $('chatMessageInput').focus();
  setChatHint('Режим правки: измени текст и нажми “Сохранить правку”.');
  updateChatUi();
}

async function updateChatMessage(messageId, body, name) {
  const encodedId = encodeURIComponent(messageId);
  const encodedGroup = encodeURIComponent(currentGroupId());
  const encodedUser = encodeURIComponent(ensureUserId());
  const payload = {
    body,
    display_name: name,
    updated_at: new Date().toISOString()
  };
  const rows = await supabaseFetch(`group_messages?id=eq.${encodedId}&group_id=eq.${encodedGroup}&user_id=eq.${encodedUser}&select=id`, {
    method: 'PATCH',
    headers: { Prefer: 'return=representation' },
    body: JSON.stringify(payload)
  });
  const updated = Array.isArray(rows) ? rows.length : 0;
  if (!updated) throw new Error('Сообщение не найдено или уже не принадлежит этому локальному user_id.');
  setChatHint('Сообщение изменено.');
}

async function deleteChatMessage(messageId) {
  const row = chatMessages.find(item => item.id === messageId);
  if (!row) return;
  if (row.user_id !== ensureUserId()) return alert('В этом MVP можно удалять только сообщения этого браузера.');
  if (!confirm('Удалить это сообщение из чата группы?')) { markButtonCancelled('удаление сообщения отменено'); return; }

  const encodedId = encodeURIComponent(messageId);
  const encodedGroup = encodeURIComponent(currentGroupId());
  const encodedUser = encodeURIComponent(ensureUserId());
  const rows = await supabaseFetch(`group_messages?id=eq.${encodedId}&group_id=eq.${encodedGroup}&user_id=eq.${encodedUser}&select=id`, {
    method: 'DELETE',
    headers: { Prefer: 'return=representation' }
  });
  const deleted = Array.isArray(rows) ? rows.length : 0;
  if (chatEditingMessageId === messageId) resetChatComposer(true);
  setChatHint(`Удалено сообщений: ${deleted}.`);
  await refreshGroupChat(false);
}

async function upsertGroupMember(isLive = liveEnabled) {
  if (!getSupabaseConfig()) return false;
  const group = currentGroupId();
  if (!group) return false;
  const name = currentChatName();
  const payload = {
    group_id: group,
    user_id: ensureUserId(),
    display_name: name,
    is_live: Boolean(isLive),
    last_seen_at: new Date().toISOString(),
    updated_at: new Date().toISOString()
  };
  await supabaseFetch('group_members?on_conflict=group_id,user_id', {
    method: 'POST',
    headers: { Prefer: 'resolution=merge-duplicates,return=minimal' },
    body: JSON.stringify(payload)
  });
  const profile = getActiveProfile();
  if (profile) {
    profile.displayName = name;
    profile.lastGroupId = group;
    profile.lastJoinedAt = profile.lastJoinedAt || new Date().toISOString();
    profile.lastSyncedAt = new Date().toISOString();
    profile.updatedAt = new Date().toISOString();
    savePeopleProfiles();
    renderPeopleProfiles();
  }
  setMemberSyncPending(false, 'group_members synced');
  mergeSelfIntoGroupCache(group);
  return true;
}

async function deleteMyGroupMember() {
  const group = currentGroupId();
  if (!group || !getSupabaseConfig()) return false;
  const encodedGroup = encodeURIComponent(group);
  const encodedUser = encodeURIComponent(ensureUserId());
  await supabaseFetch(`group_members?group_id=eq.${encodedGroup}&user_id=eq.${encodedUser}`, {
    method: 'DELETE',
    headers: { Prefer: 'return=minimal' }
  });
  return true;
}

async function fetchGroupMembers() {
  const group = currentGroupId();
  if (!group || !getSupabaseConfig()) return [];
  const encodedGroup = encodeURIComponent(group);
  const rows = await supabaseFetch(`group_members?group_id=eq.${encodedGroup}&select=group_id,user_id,display_name,is_live,last_seen_at,updated_at&order=last_seen_at.desc`, { method: 'GET' });
  return Array.isArray(rows) ? rows : [];
}

async function fetchFriends() {
  const group = currentGroupId();
  if (!group) return { locations: [], members: [] };
  const encodedGroup = encodeURIComponent(group);
  let locations = [];
  let members = [];
  let locationError = null;
  let memberError = null;

  try {
    const rows = await supabaseFetch(`live_locations?group_id=eq.${encodedGroup}&select=group_id,user_id,user_name,lat,lon,accuracy,updated_at&order=updated_at.desc`, { method: 'GET' });
    locations = Array.isArray(rows) ? rows : [];
  } catch (err) {
    locationError = err;
  }

  try {
    members = await fetchGroupMembers();
  } catch (err) {
    memberError = err;
  }

  if (locationError && memberError) {
    throw new Error(`live_locations: ${locationError.message}; group_members: ${memberError.message}`);
  }
  if (locationError) $('liveHint').textContent = `Позиции временно недоступны: ${locationError.message}`;
  if (memberError) $('liveHint').textContent = `Участники без позиции временно недоступны: ${memberError.message}`;

  const data = { locations, members };
  saveGroupMembersCache(group, data);
  return data;
}

function renderFriends(data) {
  const memberList = $('friendsList');
  const liveList = $('liveLocationsList');
  if (memberList) memberList.innerHTML = '';
  if (liveList) liveList.innerHTML = '';

  const locations = Array.isArray(data) ? data : (data?.locations || []);
  const members = Array.isArray(data) ? [] : (data?.members || []);
  const fromCache = Boolean(data && !Array.isArray(data) && data.fromCache);
  const cachedAt = data && !Array.isArray(data) ? data.cachedAt : null;
  const now = Date.now();
  const myId = ensureUserId();
  const seenMarkerIds = new Set();
  const previewLiveRows = [];
  let activeLocationCount = 0;

  const people = new Map();
  for (const member of members) {
    people.set(member.user_id, { member, location: null });
  }
  for (const location of locations) {
    const previous = people.get(location.user_id) || { member: null, location: null };
    previous.location = location;
    people.set(location.user_id, previous);
  }

  const rows = Array.from(people.entries()).map(([id, value]) => ({
    userId: id,
    name: value.member?.display_name || value.location?.user_name || 'Без имени',
    member: value.member,
    location: value.location
  }));

  rows.sort((a, b) => {
    const at = new Date(a.location?.updated_at || a.member?.last_seen_at || 0).getTime();
    const bt = new Date(b.location?.updated_at || b.member?.last_seen_at || 0).getTime();
    return bt - at;
  });

  for (const row of rows) {
    const loc = row.location;
    const member = row.member;
    const locAgeMs = loc ? now - new Date(loc.updated_at).getTime() : Infinity;
    const memberAgeMs = member ? now - new Date(member.last_seen_at || member.updated_at).getTime() : Infinity;
    const hasActiveLocation = Boolean(loc) && locAgeMs <= 5 * 60 * 1000;
    const isPresent = Boolean(member) && memberAgeMs <= 10 * 60 * 1000;
    const suffix = row.userId === myId ? ' · я' : '';

    if (hasActiveLocation) {
      activeLocationCount += 1;
      if (row.userId !== myId && loc) previewLiveRows.push(row);
    }

    if (loc && row.userId !== myId && hasActiveLocation && canUseMapRuntime()) {
      seenMarkerIds.add(row.userId);
      const latlng = [loc.lat, loc.lon];
      let marker = friendMarkers.get(row.userId);
      const popup = `<strong>${escapeHtml(row.name)}</strong><br>${fmtCoord(loc.lat)}, ${fmtCoord(loc.lon)}<br>Точность: ${meters(loc.accuracy)}<br>Обновлено: ${fmtDate(loc.updated_at)}`;
      if (!marker) {
        marker = L.marker(latlng, { title: row.name, icon: makeMapIcon('friend') }).addTo(map).bindPopup(popup);
        marker.on('click', () => selectLiveFriendMapObject(row));
        friendMarkers.set(row.userId, marker);
      } else {
        marker.setLatLng(latlng).setPopupContent(popup);
        marker.off('click');
        marker.on('click', () => selectLiveFriendMapObject(row));
      }
    }

    if (memberList) {
      const memberItem = document.createElement('div');
      memberItem.className = `friend-item group-member-item ${fromCache ? 'friend-cached' : ''}`;
      let memberMeta;
      if (member) {
        memberMeta = `${isPresent ? 'в группе' : 'давно не обновлялся'} · позиция ${hasActiveLocation ? 'передаётся' : 'скрыта'}<br>Последний сигнал: ${fmtDate(member.last_seen_at || member.updated_at)}`;
      } else if (loc) {
        memberMeta = `есть live-локация, но запись участника не получена<br>Обновлено: ${fmtDate(loc.updated_at)}`;
      } else {
        memberMeta = 'нет данных';
      }
      memberItem.innerHTML = `<div><div class="friend-name">${escapeHtml(row.name)}${suffix}</div><div class="friend-meta">${memberMeta}</div></div>`;
      memberList.appendChild(memberItem);
    }

    if (liveList && loc) {
      const liveItem = document.createElement('div');
      liveItem.className = `friend-item live-location-item ${!hasActiveLocation ? 'friend-stale' : ''} ${fromCache ? 'friend-cached' : ''}`;
      const dist = currentPosition ? meters(distanceMeters({ lat: currentPosition.lat, lon: currentPosition.lon }, loc)) : '—';
      const meta = `${hasActiveLocation ? 'позиция на карте' : 'позиция устарела'} · ${fmtDate(loc.updated_at)}<br>Расстояние: ${dist} · GPS: ${meters(loc.accuracy)}`;
      liveItem.innerHTML = `<div><div class="friend-name">${escapeHtml(row.name)}${suffix}</div><div class="friend-meta">${meta}</div></div>`;
      liveItem.onclick = () => selectLiveFriendMapObject(row);
      liveList.appendChild(liveItem);
    }
  }

  for (const [id, marker] of friendMarkers.entries()) {
    if (!seenMarkerIds.has(id)) {
      marker.remove();
      friendMarkers.delete(id);
    }
  }
  if (selectedMapObject?.kind === 'friend' && !seenMarkerIds.has(selectedMapObject.userId)) {
    clearSelectedMapObjectOnly();
  }

  if (memberList && !rows.length) {
    memberList.innerHTML = groupJoined
      ? '<p class="hint">В группе пока нет участников. Если связи нет, список появится из кэша после первого успешного обновления.</p>'
      : '<p class="hint">Открой приглашение или нажми “Войти в группу”.</p>';
  }
  if (liveList && activeLocationCount === 0) {
    liveList.innerHTML = groupJoined
      ? '<p class="hint">Нет активных live-локаций. Участники без live-координат не создают маркеры на карте.</p>'
      : '<p class="hint">Live-локации появятся после входа в группу и запуска передачи позиции у участников.</p>';
  }

  safeInvalidateMap(0, 'render/update');
  pmtilesPreviewLiveRows = previewLiveRows;
  renderPmtilesPreviewUserLayers('live friends mirrored to offline map preview');

  if (rows.length && fromCache && memberList) {
    const cacheNote = document.createElement('p');
    cacheNote.className = 'hint';
    cacheNote.textContent = `Показан локальный кэш участников. Он может быть устаревшим; последнее успешное обновление: ${fmtDate(cachedAt)}.`;
    memberList.appendChild(cacheNote);
  }

  if (rows.length && activeLocationCount === 0 && !fromCache && liveList) {
    const note = document.createElement('p');
    note.className = 'hint';
    note.textContent = 'В группе есть участники, но сейчас ни у кого нет активной позиции на карте.';
    liveList.appendChild(note);
  }

  updateGroupScreenUi(rows.length, activeLocationCount, fromCache);
}

async function refreshFriends() {
  const group = currentGroupId();
  try {
    if (groupJoined) {
      try {
        await upsertGroupMember(liveEnabled);
      } catch (err) {
        console.warn('Could not refresh group member heartbeat', err);
        handleMemberSyncFailure(err);
      }
    }
    const rows = await fetchFriends();
    renderFriends(rows);
    return true;
  } catch (err) {
    const usedCache = group ? renderCachedFriends(group, `Ошибка обновления: ${err.message}`) : false;
    if (!usedCache) $('liveHint').textContent = `Ошибка участников: ${err.message}. Если связи нет, группа остаётся открытой локально.`;
    return false;
  }
}

async function startLiveSharing() {
  if (!getSupabaseConfig()) { markButtonBlocked('БД не настроена'); return alert('Сначала подключи БД и переопубликуй сайт.'); }
  const name = $('liveName').value.trim();
  const group = $('groupId').value.trim();
  if (!name) { markButtonBlocked('не указано имя'); return alert('Укажи своё имя.'); }
  if (!group) { markButtonBlocked('нет ID группы'); return alert('Создай группу или вставь ID группы от друга.'); }
  saveLiveInputs();
  if (!groupJoined) {
    const joined = await joinGroup(true);
    if (!joined) return;
  }
  liveEnabled = true;
  updateLiveUi();
  startGps(false);
  await publishMyLocation().catch(err => $('liveHint').textContent = err.message);
  await upsertGroupMember(true).catch(err => { console.warn('Could not update member live state', err); handleMemberSyncFailure(err); });
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
  try { await upsertGroupMember(false); } catch (err) { console.warn('Could not update member live state', err); handleMemberSyncFailure(err); }
  if (!keepWatching) {
    clearInterval(friendsTimer);
    friendsTimer = null;
  } else if (groupJoined) {
    await refreshFriends();
  }
  $('liveHint').textContent = keepWatching && groupJoined
    ? 'Трансляция остановлена. Ты остался в группе и продолжаешь видеть активных участников.'
    : 'Показ моей позиции остановлен.';
}

async function testSupabaseConnection() {
  try {
    const cfg = getSupabaseConfig();
    if (!cfg) throw new Error('Подключение к БД не настроено.');
    const rows = await supabaseFetch('live_locations?select=id&limit=1', { method: 'GET' });
    $('liveHint').textContent = `БД доступна. Ответ: ${Array.isArray(rows) ? rows.length : 'ok'}`;
  } catch (err) {
    $('liveHint').textContent = `Проверка БД не прошла: ${err.message}`;
  }
}

function bindUi() {
  bindAppNavigationShell();
  $('startGpsBtn').onclick = withButtonDiagnostics('startGpsBtn', () => startGps(true));
  $('centerMeBtn').onclick = withButtonDiagnostics('centerMeBtn', () => currentPosition && canUseMapRuntime() ? map.setView([currentPosition.lat, currentPosition.lon], 16) : startGps(true));
  if ($('mapExpandBtn')) $('mapExpandBtn').onclick = withButtonDiagnostics('mapExpandBtn', toggleOnlineMapExpanded);
  if ($('startTrackBtn')) $('startTrackBtn').onclick = withButtonDiagnostics('startTrackBtn', startTrackRecording);
  if ($('stopTrackBtn')) $('stopTrackBtn').onclick = withButtonDiagnostics('stopTrackBtn', stopTrackRecording);
  $('saveSpotBtn').onclick = withButtonDiagnostics('saveSpotBtn', saveSmartSpot);
  if ($('saveCurrentGpsOnlyBtn')) $('saveCurrentGpsOnlyBtn').onclick = withButtonDiagnostics('saveCurrentGpsOnlyBtn', saveCurrentSpot);
  if ($('savePickedMapPointBtn')) $('savePickedMapPointBtn').onclick = withButtonDiagnostics('savePickedMapPointBtn', savePickedMapPoint);
  if ($('sharePickedMapPointToChatBtn')) $('sharePickedMapPointToChatBtn').onclick = withButtonDiagnostics('sharePickedMapPointToChatBtn', sendPickedMapPointToChat);
  if ($('savePlaceDialogSaveBtn')) $('savePlaceDialogSaveBtn').onclick = withButtonDiagnostics('savePlaceDialogSaveBtn', submitSavePlaceDialog);
  if ($('savePlaceDialogCancelBtn')) $('savePlaceDialogCancelBtn').onclick = withButtonDiagnostics('savePlaceDialogCancelBtn', () => closeSavePlaceDialog());
  const savePlaceDialog = $('savePlaceDialog');
  if (savePlaceDialog) savePlaceDialog.addEventListener('close', () => { savePlaceDialogState = null; setDisabled('savePlaceDialogSaveBtn', true); });
  if ($('saveResultShareBtn')) $('saveResultShareBtn').onclick = withButtonDiagnostics('saveResultShareBtn', shareLastSavedSpotToChat);
  if ($('saveResultListBtn')) $('saveResultListBtn').onclick = withButtonDiagnostics('saveResultListBtn', showLastSavedSpotInList);
  if ($('saveResultCloseBtn')) $('saveResultCloseBtn').onclick = withButtonDiagnostics('saveResultCloseBtn', closeSaveResult);
  if ($('clearPickedMapPointBtn')) $('clearPickedMapPointBtn').onclick = withButtonDiagnostics('clearPickedMapPointBtn', () => clearPickedMapPoint(true));
  $('averageBtn').onclick = withButtonDiagnostics('averageBtn', averageAndSave);
  $('searchInput').oninput = renderList;
  if ($('spotCollectionFilter')) $('spotCollectionFilter').onchange = renderList;
  if ($('spotCollectionCreateBtn')) $('spotCollectionCreateBtn').onclick = withButtonDiagnostics('spotCollectionCreateBtn', createSpotCollection);
  if ($('spotCollectionManageSelect')) $('spotCollectionManageSelect').onchange = () => renderSpotCollectionManager();
  if ($('spotCollectionRenameBtn')) $('spotCollectionRenameBtn').onclick = withButtonDiagnostics('spotCollectionRenameBtn', renameSelectedSpotCollection);
  if ($('spotCollectionDeleteBtn')) $('spotCollectionDeleteBtn').onclick = withButtonDiagnostics('spotCollectionDeleteBtn', openSpotFolderDeleteDialog);
  if ($('spotCollectionNameInput')) $('spotCollectionNameInput').onkeydown = (event) => { if (event.key === 'Enter') { event.preventDefault(); createSpotCollection(); } };
  if ($('spotFolderBackBtn')) $('spotFolderBackBtn').onclick = withButtonDiagnostics('spotFolderBackBtn', backToSpotCollections);
  if ($('spotCollectionRenameMenuBtn')) $('spotCollectionRenameMenuBtn').onclick = withButtonDiagnostics('spotCollectionRenameMenuBtn', openSpotFolderRenamePanel);
  if ($('spotCollectionDeleteMenuBtn')) $('spotCollectionDeleteMenuBtn').onclick = withButtonDiagnostics('spotCollectionDeleteMenuBtn', openSpotFolderDeletePanel);
  if ($('spotCollectionEditCancelBtn')) $('spotCollectionEditCancelBtn').onclick = withButtonDiagnostics('spotCollectionEditCancelBtn', closeSpotFolderPanels);
  if ($('spotCollectionDeleteCancelBtn')) $('spotCollectionDeleteCancelBtn').onclick = withButtonDiagnostics('spotCollectionDeleteCancelBtn', closeSpotFolderPanels);
  if ($('spotFolderDeleteTarget')) $('spotFolderDeleteTarget').onchange = renderSpotFolderDeleteDialog;
  if ($('spotFolderDeleteCancelBtn')) $('spotFolderDeleteCancelBtn').onclick = withButtonDiagnostics('spotFolderDeleteCancelBtn', () => { closeSpotFolderDeleteDialogs(); spotFolderDeleteDialogState = null; return true; });
  if ($('spotFolderDeleteMoveBtn')) $('spotFolderDeleteMoveBtn').onclick = withButtonDiagnostics('spotFolderDeleteMoveBtn', deleteSpotCollectionAndMoveSpots);
  if ($('spotFolderDeleteAllRequestBtn')) $('spotFolderDeleteAllRequestBtn').onclick = withButtonDiagnostics('spotFolderDeleteAllRequestBtn', requestDeleteSpotCollectionWithSpots);
  if ($('spotFolderDeleteDangerCancelBtn')) $('spotFolderDeleteDangerCancelBtn').onclick = withButtonDiagnostics('spotFolderDeleteDangerCancelBtn', () => { closeDialogSafely('spotFolderDeleteDangerDialog'); showDialogSafely('spotFolderDeleteDialog'); return true; });
  if ($('spotFolderDeleteAllConfirmBtn')) $('spotFolderDeleteAllConfirmBtn').onclick = withButtonDiagnostics('spotFolderDeleteAllConfirmBtn', deleteSpotCollectionAndAllSpots);

  if ($('spotTypeFilter')) $('spotTypeFilter').onchange = renderList;
  if ($('spotSortSelect')) $('spotSortSelect').onchange = renderList;
  if ($('mapObjectPrimaryBtn')) $('mapObjectPrimaryBtn').onclick = withButtonDiagnostics('mapObjectPrimaryBtn', runSelectedMapObjectPrimaryAction);
  if ($('mapObjectSecondaryBtn')) $('mapObjectSecondaryBtn').onclick = withButtonDiagnostics('mapObjectSecondaryBtn', runSelectedMapObjectSecondaryAction);
  if ($('mapObjectEditBtn')) $('mapObjectEditBtn').onclick = withButtonDiagnostics('mapObjectEditBtn', runSelectedMapObjectEditAction);
  if ($('mapObjectDangerBtn')) $('mapObjectDangerBtn').onclick = withButtonDiagnostics('mapObjectDangerBtn', runSelectedMapObjectDangerAction);
  if ($('mapObjectCollapseBtn')) $('mapObjectCollapseBtn').onclick = withButtonDiagnostics('mapObjectCollapseBtn', toggleMapObjectSheetCollapsed);
  if ($('mapObjectCloseBtn')) $('mapObjectCloseBtn').onclick = withButtonDiagnostics('mapObjectCloseBtn', closeMapObjectSheet);
  if ($('mapObjectClearBtn')) $('mapObjectClearBtn').onclick = withButtonDiagnostics('mapObjectClearBtn', clearSelectedMapObject);
  if ($('showSelectedSpotOnMapBtn')) $('showSelectedSpotOnMapBtn').onclick = withButtonDiagnostics('showSelectedSpotOnMapBtn', showSelectedSpotOnMap);
  if ($('spotListShowOnMapBtn')) $('spotListShowOnMapBtn').onclick = withButtonDiagnostics('spotListShowOnMapBtn', showSelectedSpotOnMap);
  if ($('closeSelectedSpotBtn')) $('closeSelectedSpotBtn').onclick = withButtonDiagnostics('closeSelectedSpotBtn', closeSpotDetails);
  if ($('spotListCloseDetailsBtn')) $('spotListCloseDetailsBtn').onclick = withButtonDiagnostics('spotListCloseDetailsBtn', closeSpotDetails);
  if ($('spotListEditBtn')) $('spotListEditBtn').onclick = withButtonDiagnostics('spotListEditBtn', startSpotListEditor);
  if ($('spotListDeleteBtn')) $('spotListDeleteBtn').onclick = withButtonDiagnostics('spotListDeleteBtn', deleteSelectedFromSpotList);
  if ($('spotListSaveEditBtn')) $('spotListSaveEditBtn').onclick = withButtonDiagnostics('spotListSaveEditBtn', saveSpotListEditorChanges);
  if ($('spotListCancelEditBtn')) $('spotListCancelEditBtn').onclick = withButtonDiagnostics('spotListCancelEditBtn', cancelSpotListEditor);
  $('navigateBtn').onclick = withButtonDiagnostics('navigateBtn', showNavigationLine);
  $('shareSpotBtn').onclick = withButtonDiagnostics('shareSpotBtn', exportSelected);
  if ($('sendSelectedSpotToChatBtn')) $('sendSelectedSpotToChatBtn').onclick = withButtonDiagnostics('sendSelectedSpotToChatBtn', sendSelectedSpotToChat);
  if ($('spotListSendToChatBtn')) $('spotListSendToChatBtn').onclick = withButtonDiagnostics('spotListSendToChatBtn', sendSelectedSpotToChat);
  $('exportAllBtn').onclick = withButtonDiagnostics('exportAllBtn', exportAll);
  $('importFile').onchange = async (e) => { try { await importJson(e.target.files[0]); } catch(err) { const message = formatBackupImportError(err); setBackupStatus(message); alert(message); } finally { e.target.value = ''; } };
  $('chooseFolderBtn').onclick = withButtonDiagnostics('chooseFolderBtn', chooseBackupFolder);
  $('saveFolderBackupBtn').onclick = withButtonDiagnostics('saveFolderBackupBtn', () => saveBackupToFolder(true).catch(err => alert(`Ошибка backup: ${err.message}`)));
  $('requestPersistentBtn').onclick = withButtonDiagnostics('requestPersistentBtn', requestPersistentStorage);
  $('createGroupBtn').onclick = withButtonDiagnostics('createGroupBtn', createGroup);
  $('copyInviteBtn').onclick = withButtonDiagnostics('copyInviteBtn', copyInvite);
  if ($('savePersonProfileBtn')) $('savePersonProfileBtn').onclick = withButtonDiagnostics('savePersonProfileBtn', saveCurrentPersonProfile);
  if ($('newPersonProfileBtn')) $('newPersonProfileBtn').onclick = withButtonDiagnostics('newPersonProfileBtn', createNewPersonProfile);
  $('joinGroupBtn').onclick = withButtonDiagnostics('joinGroupBtn', () => joinGroup(false));
  $('leaveGroupBtn').onclick = withButtonDiagnostics('leaveGroupBtn', leaveGroup);
  $('startLiveBtn').onclick = withButtonDiagnostics('startLiveBtn', startLiveSharing);
  $('stopLiveBtn').onclick = withButtonDiagnostics('stopLiveBtn', () => stopLiveSharing(true));
  $('refreshFriendsBtn').onclick = withButtonDiagnostics('refreshFriendsBtn', () => {
    if (!groupJoined) {
      markButtonBlocked('сначала войди в группу');
      $('liveHint').textContent = 'Обновление участников доступно только после входа в группу.';
      return false;
    }
    return refreshFriends();
  });
  $('testSupabaseBtn').onclick = withButtonDiagnostics('testSupabaseBtn', testSupabaseConnection);
  if ($('chatSendBtn')) $('chatSendBtn').onclick = withButtonDiagnostics('chatSendBtn', sendOrUpdateChatMessage);
  if ($('chatRefreshBtn')) $('chatRefreshBtn').onclick = withButtonDiagnostics('chatRefreshBtn', () => refreshGroupChat(true));
  if ($('chatCancelEditBtn')) $('chatCancelEditBtn').onclick = withButtonDiagnostics('chatCancelEditBtn', () => resetChatComposer(true));
  if ($('chatMessageInput')) $('chatMessageInput').oninput = updateChatCounter;
  if ($('cleanMyDbBtn')) $('cleanMyDbBtn').onclick = withButtonDiagnostics('cleanMyDbBtn', cleanMyDbRow);
  if ($('cleanMyEverywhereDbBtn')) $('cleanMyEverywhereDbBtn').onclick = withButtonDiagnostics('cleanMyEverywhereDbBtn', cleanMyEverywhereDbRows);
  if ($('cleanCurrentGroupDbBtn')) $('cleanCurrentGroupDbBtn').onclick = withButtonDiagnostics('cleanCurrentGroupDbBtn', cleanCurrentGroupDbRows);
  if ($('cleanStaleGroupDbBtn')) $('cleanStaleGroupDbBtn').onclick = withButtonDiagnostics('cleanStaleGroupDbBtn', cleanStaleGroupDbRows);
  if ($('resetAppCacheBtn')) $('resetAppCacheBtn').onclick = withButtonDiagnostics('resetAppCacheBtn', resetAppCache);
  if ($('clearOfflineMapFilesBtn')) $('clearOfflineMapFilesBtn').onclick = withButtonDiagnostics('clearOfflineMapFilesBtn', clearImportedOfflineMapFiles);
  if ($('loadOfflineManifestBtn')) $('loadOfflineManifestBtn').onclick = withButtonDiagnostics('loadOfflineManifestBtn', () => loadOfflineMapManifest(true));
  if ($('saveOfflineManifestUrlBtn')) $('saveOfflineManifestUrlBtn').onclick = withButtonDiagnostics('saveOfflineManifestUrlBtn', saveOfflineManifestUrlFromInput);
  if ($('refreshOfflineRegionCatalogBtn')) $('refreshOfflineRegionCatalogBtn').onclick = withButtonDiagnostics('refreshOfflineRegionCatalogBtn', refreshOfflineRegionCatalogFromUi);
  if ($('offlineManifestUrlInput')) $('offlineManifestUrlInput').onkeydown = (event) => { if (event.key === 'Enter') { event.preventDefault(); refreshOfflineRegionCatalogFromUi(); } };
  const openLocalPmtilesPicker = (mode = 'add') => {
    pendingLocalPmtilesImportMode = mode;
    setButtonApiStatus(activeButtonDiagnostics, 'пендинг', 'ожидание выбора файла');
    $('localPmtilesFileInput')?.click();
  };
  if ($('chooseLocalPmtilesBtn')) $('chooseLocalPmtilesBtn').onclick = withButtonDiagnostics('chooseLocalPmtilesBtn', () => openLocalPmtilesPicker('add'));
  if ($('replaceLocalPmtilesBtn')) $('replaceLocalPmtilesBtn').onclick = withButtonDiagnostics('replaceLocalPmtilesBtn', () => openLocalPmtilesPicker('replace'));
  if ($('localPmtilesFileInput')) $('localPmtilesFileInput').onchange = async (event) => {
    const file = event.target.files && event.target.files[0];
    await selectLocalPmtilesFile(file);
    event.target.value = '';
  };
  if ($('offlinePackageSelect')) $('offlinePackageSelect').onchange = (event) => selectOfflineMapPackage(event.target.value, true);
  if ($('rememberedPmtilesMapSelect')) $('rememberedPmtilesMapSelect').onchange = (event) => selectRememberedPmtilesMap(event.target.value, true).catch(console.warn);
  if ($('renameRememberedPmtilesMapBtn')) $('renameRememberedPmtilesMapBtn').onclick = withButtonDiagnostics('renameRememberedPmtilesMapBtn', renameSelectedRememberedPmtilesMap);
  if ($('offlineImportNameForm')) $('offlineImportNameForm').onsubmit = (event) => { event.preventDefault(); saveOfflineImportNameFromDialog(); };
  if ($('offlineImportNameSaveBtn')) $('offlineImportNameSaveBtn').onclick = (event) => { event.preventDefault(); saveOfflineImportNameFromDialog(); };
  if ($('offlineImportNameKeepBtn')) $('offlineImportNameKeepBtn').onclick = keepOfflineImportNameFromDialog;
  if ($('openDuplicateOfflineMapBtn')) $('openDuplicateOfflineMapBtn').onclick = () => openExistingDuplicateOfflineMap().catch(console.warn);
  if ($('replaceDuplicateOfflineMapBtn')) $('replaceDuplicateOfflineMapBtn').onclick = () => replaceDuplicateOfflineMap().catch(console.warn);
  if ($('cancelDuplicateOfflineMapBtn')) $('cancelDuplicateOfflineMapBtn').onclick = cancelDuplicateOfflineMap;
  if ($('forgetRememberedPmtilesMapBtn')) $('forgetRememberedPmtilesMapBtn').onclick = withButtonDiagnostics('forgetRememberedPmtilesMapBtn', forgetSelectedRememberedPmtilesMap);
  if ($('probePmtilesBtn')) $('probePmtilesBtn').onclick = withButtonDiagnostics('probePmtilesBtn', runPmtilesRuntimeProbe);
  if ($('previewPmtilesBtn')) $('previewPmtilesBtn').onclick = withButtonDiagnostics('previewPmtilesBtn', showPmtilesPreviewMap);
  if ($('centerPmtilesOnMeBtn')) $('centerPmtilesOnMeBtn').onclick = withButtonDiagnostics('centerPmtilesOnMeBtn', centerPmtilesPreviewOnMe);
  if ($('savePmtilesPickedPointBtn')) $('savePmtilesPickedPointBtn').onclick = withButtonDiagnostics('savePmtilesPickedPointBtn', saveOfflinePickedMapPoint);
  if ($('clearPmtilesPickedPointBtn')) $('clearPmtilesPickedPointBtn').onclick = withButtonDiagnostics('clearPmtilesPickedPointBtn', () => clearPickedMapPoint(true));
  if ($('repairMapBtn')) $('repairMapBtn').onclick = withButtonDiagnostics('repairMapBtn', repairMap);
  if ($('startBboxExportBtn')) $('startBboxExportBtn').onclick = withButtonDiagnostics('startBboxExportBtn', () => { switchAppScreen('map'); return startBboxExportSelection(); });
  if ($('useVisibleBboxBtn')) $('useVisibleBboxBtn').onclick = withButtonDiagnostics('useVisibleBboxBtn', () => { switchAppScreen('map'); return useVisibleMapBbox(); });
  if ($('copyBboxCommandBtn')) $('copyBboxCommandBtn').onclick = withButtonDiagnostics('copyBboxCommandBtn', copyBboxCommand);
  if ($('clearBboxExportBtn')) $('clearBboxExportBtn').onclick = withButtonDiagnostics('clearBboxExportBtn', clearBboxExport);
  if ($('mapDebugBtn')) $('mapDebugBtn').onclick = withButtonDiagnostics('mapDebugBtn', () => { updateMapDebugUi(true); $('mapDebugDialog').showModal(); });
  if ($('settingsMapDebugBtn')) $('settingsMapDebugBtn').onclick = withButtonDiagnostics('settingsMapDebugBtn', () => { updateMapDebugUi(true); $('mapDebugDialog').showModal(); });
  if ($('refreshMapDebugBtn')) $('refreshMapDebugBtn').onclick = withButtonDiagnostics('refreshMapDebugBtn', () => updateMapDebugUi(true));
  if ($('repairMapFromDebugBtn')) $('repairMapFromDebugBtn').onclick = withButtonDiagnostics('repairMapFromDebugBtn', repairMap);
  if ($('copyMapDebugBtn')) $('copyMapDebugBtn').onclick = withButtonDiagnostics('copyMapDebugBtn', copyMapDebug);
  if ($('closeMapDebugBtn')) $('closeMapDebugBtn').onclick = withButtonDiagnostics('closeMapDebugBtn', () => $('mapDebugDialog').close());

  bindKebabMenuBehavior();

  window.addEventListener('popstate', handleSpotHistoryPopState);
  window.addEventListener('online', () => { mountMapProvider(MAP_PROVIDER_ONLINE_RASTER, 'browser online'); repairMap(); retryMemberSync('online').catch(console.warn); if (groupJoined) refreshGroupChat(false).catch(console.warn); });
  window.addEventListener('offline', () => { if (!keepOnlineRasterLayerForOfflineTransition('browser offline')) activateNoBasemapFallback('browser offline without loaded raster tiles'); updateMapDebugUi(true); });
  window.addEventListener('resize', () => { updateOnlineMapExpandInsets(); safeInvalidateMap(150, 'resize'); });
  window.addEventListener('orientationchange', () => { updateOnlineMapExpandInsets(); safeInvalidateMap(500, 'orientationchange'); });
  document.addEventListener('visibilitychange', () => {
    if (!document.hidden) safeInvalidateMap(250, 'visibilitychange');
  });
  window.addEventListener('focus', () => safeInvalidateMap(250, 'focus'));

  $('liveName').oninput = () => { updateActiveProfileFromInputs(); renderPeopleProfiles(); updateActionButtonsUi(); };
  $('liveName').onchange = saveLiveInputs;
  $('groupId').oninput = () => { updateActiveProfileFromInputs(); updateDbCleanupUi(); updateChatUi(); updateActionButtonsUi(); renderPeopleProfiles(); };
  $('groupId').onchange = () => {
    saveLiveInputs();
    groupJoined = false;
    setMemberSyncPending(false, 'group changed');
    clearInterval(friendsTimer);
    friendsTimer = null;
    clearFriendMarkers();
    renderFriends([]);
    stopChatAutoRefresh(true);
    updateLiveUi();
    updateDbCleanupUi();
    updateChatUi();
  };
  $('installHelpBtn').onclick = withButtonDiagnostics('installHelpBtn', () => $('helpDialog').showModal());
  $('closeHelpBtn').onclick = withButtonDiagnostics('closeHelpBtn', () => $('helpDialog').close());
}

async function init() {
  if ('serviceWorker' in navigator) navigator.serviceWorker.register('./sw.js').catch(console.warn);
  $('appVersion').textContent = `v${APP_VERSION} · Sprint 5.41.1`;
  db = await openDb();
  await loadSpotCollections();
  await restoreFolderHandle();
  loadPeopleProfiles();
  restoreMemberSyncPending();
  ensureUserId();
  initMap();
  bindUi();
  renderOnlineMapExpandButton();
  updateOnlineMapExpandInsets();
  offlineMapManifest.url = getConfiguredOfflineMapManifestUrl();
  renderOfflineMapPackageUi();
  restoreMapAdvancedControlsPreference();
  restoreAppScreen();
  loadRememberedPmtilesMaps();
  await activatePersistedPmtilesMap(getSelectedRememberedPmtilesMap(), false);
  if ($('screen-offline') && !$('screen-offline').hidden && localPmtilesFileState.status === 'selected') {
    showPmtilesPreviewMap().catch((err) => recordMapDebug('persistent PMTiles preview startup failed', err?.message || String(err)));
  }
  loadOfflineMapManifest(false).catch((err) => recordMapDebug('offline map manifest startup load failed', err?.message || String(err)));
  recordMapDebug('app initialized');
  const groupFromUrl = loadLiveInputs();
  renderPeopleProfiles();
  scheduleMemberSyncRetry();
  await refreshSpots();
  await refreshTracks();
  if (!getSupabaseConfig()) {
    updateLiveUi();
    $('liveHint').textContent = 'Для live-режима нужно подключение к БД.';
  } else if ($('groupId').value.trim()) {
    await joinGroup(true);
    $('liveHint').textContent = groupFromUrl
      ? 'Приглашение открыто: вход выполнен локально, имя участника синхронизируется при связи. Чтобы друзья видели твою точку на карте, нажми “Начать показ моей позиции”.'
      : 'Последняя группа восстановлена локально. Участники показываются из сети или кэша; чтобы друзья видели твою точку на карте, нажми “Начать показ моей позиции”.';
  } else {
    updateLiveUi();
  }
}

window.addEventListener('pagehide', () => { clearTrackWatch(); closeDbConnection(); });
window.addEventListener('beforeunload', () => { clearTrackWatch(); closeDbConnection(); });

init().catch(err => {
  console.error(err);
  alert(`Ошибка запуска: ${err.message}`);
});
