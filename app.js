const APP_VERSION = '0.6.9';
const DB_NAME = 'mushroom-spots-db';
const DB_VERSION = 2;
const SPOTS_STORE = 'spots';
const SETTINGS_STORE = 'settings';
const BACKUP_FILE_NAME = 'mushroom-spots-backup.json';
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

const MAP_ENGINE_LEAFLET = 'leaflet';
const MAP_ENGINE_LEAFLET_LITE = 'leaflet-lite';
const MAP_ENGINE_MAPLIBRE = 'maplibre';
const MAP_PROVIDER_ONLINE_RASTER = 'online-raster';
const MAP_PROVIDER_OFFLINE_PMTILES = 'offline-pmtiles';
const MAP_PROVIDER_NO_BASEMAP = 'no-basemap';
const PMTILES_SAMPLE_URL = './offline-test.pmtiles';
const PMTILES_DEFAULT_URL = PMTILES_SAMPLE_URL;
const OFFLINE_MAP_MANIFEST_URL = './offline-map-packages.json';
const MAPLIBRE_GL_VERSION = '5.24.0';
const PMTILES_JS_VERSION = '4.4.1';
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

const MAP_PROVIDER_LABELS = {
  [MAP_PROVIDER_ONLINE_RASTER]: 'online raster',
  [MAP_PROVIDER_OFFLINE_PMTILES]: 'offline PMTiles',
  [MAP_PROVIDER_NO_BASEMAP]: 'no basemap'
};

let db;
let map;
let userMarker;
let accuracyCircle;
let currentPosition = null;
let watchId = null;
let spots = [];
let spotMarkers = new Map();
let selectedSpotId = null;
let pickedMapPoint = null;
let pickedMapPointMarker = null;
let chatPreviewPointMarker = null;
let mapLongPressTimer = null;
let mapLongPressStart = null;
let navLine = null;
let folderHandle = null;
let groupJoined = false;
let liveEnabled = false;
let liveTimer = null;
let friendsTimer = null;
let chatTimer = null;
let chatMessages = [];
let chatEditingMessageId = null;
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
let offlineMapManifest = {
  url: OFFLINE_MAP_MANIFEST_URL,
  status: 'not-loaded',
  packages: [],
  selectedPackageId: null,
  error: null,
  loadedAt: null
};
let localPmtilesFileState = {
  status: 'not-selected',
  file: null,
  packageId: null,
  key: null,
  name: null,
  sizeBytes: null,
  lastModified: null,
  selectedAt: null,
  error: null
};
let pmtilesPreviewState = {
  status: 'not-run',
  visible: false,
  sourceUrl: PMTILES_DEFAULT_URL,
  styleMode: null,
  error: null,
  loadedAt: null,
  lastEvent: null
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
  repairMapBtn: 'Починить карту',
  saveSpotBtn: 'Сохранить текущую GPS-точку',
  savePickedMapPointBtn: 'Сохранить выбранную точку на карте',
  sharePickedMapPointToChatBtn: 'Отправить выбранную точку в чат',
  clearPickedMapPointBtn: 'Сбросить выбранную точку на карте',
  averageBtn: 'Уточнить GPS 30 сек',
  navigateBtn: 'Показать направление',
  shareSpotBtn: 'Экспорт точки',
  sendSelectedSpotToChatBtn: 'Отправить сохранённую точку в чат',
  deleteSpotBtn: 'Удалить',
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
  testSupabaseBtn: 'Проверить Supabase',
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
  loadOfflineManifestBtn: 'Обновить manifest карт',
  chooseLocalPmtilesBtn: 'Выбрать локальный PMTiles',
  probePmtilesBtn: 'Проверить выбранный PMTiles',
  previewPmtilesBtn: 'Показать PMTiles preview',
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
  return url.toString();
}

async function resetAppCache() {
  const ok = confirm('Сбросить кэш приложения и перезагрузить страницу?\n\nЛокальные грибные точки, фото, имя, ID группы и backup-настройки останутся. Будут удалены только Cache Storage и регистрация Service Worker.');
  if (!ok) { markButtonCancelled('сброс кэша отменён пользователем'); return; }

  const deletedCaches = [];
  const unregisteredWorkers = [];

  if ('caches' in window) {
    const keys = await caches.keys();
    for (const key of keys) {
      const deleted = await caches.delete(key);
      deletedCaches.push(`${key}:${deleted ? 'deleted' : 'not-deleted'}`);
    }
  } else {
    setButtonApiStatus(activeButtonDiagnostics || 'resetAppCacheBtn', 'заблокировано', 'Cache API не поддерживается');
  }

  if ('serviceWorker' in navigator) {
    const regs = await navigator.serviceWorker.getRegistrations();
    for (const reg of regs) {
      const ok = await reg.unregister();
      unregisteredWorkers.push(`${reg.scope}:${ok ? 'unregistered' : 'not-unregistered'}`);
    }
  } else {
    setButtonApiStatus(activeButtonDiagnostics || 'resetAppCacheBtn', 'заблокировано', 'Service Worker не поддерживается');
  }

  const cacheDetail = deletedCaches.length ? `${deletedCaches.length} cache(s)` : 'cache отсутствует';
  const swDetail = unregisteredWorkers.length ? `${unregisteredWorkers.length} SW` : 'SW отсутствует';
  setButtonApiStatus(activeButtonDiagnostics || 'resetAppCacheBtn', 'готово', `${cacheDetail}, ${swDetail}; перезагрузка`);
  recordMapDebug('app cache reset requested', { deletedCaches, unregisteredWorkers });

  setTimeout(() => {
    window.location.replace(cacheBustUrl());
  }, 350);
}

function setDisabled(id, disabled) {
  const el = $(id);
  if (el) el.disabled = Boolean(disabled);
}

function updateActionButtonsUi() {
  const hasSupabase = Boolean(getSupabaseConfig());
  const hasGroup = Boolean(currentGroupId());
  const hasPosition = Boolean(currentPosition);
  const hasPickedMapPoint = Boolean(pickedMapPoint);
  const hasSelected = Boolean(selectedSpotId);
  const canUseChat = hasSupabase && hasGroup && groupJoined;

  setDisabled('saveSpotBtn', !hasPosition);
  setDisabled('savePickedMapPointBtn', !hasPickedMapPoint);
  setDisabled('sharePickedMapPointToChatBtn', !hasPickedMapPoint || !canUseChat);
  setDisabled('clearPickedMapPointBtn', !hasPickedMapPoint);
  setDisabled('averageBtn', !navigator.geolocation);
  setDisabled('centerMeBtn', !hasPosition && !navigator.geolocation);
  setDisabled('navigateBtn', !hasSelected || !hasPosition);
  setDisabled('shareSpotBtn', !hasSelected);
  setDisabled('sendSelectedSpotToChatBtn', !hasSelected || !canUseChat);
  setDisabled('deleteSpotBtn', !hasSelected);

  if ($('joinGroupBtn')) $('joinGroupBtn').textContent = groupJoined ? 'В группе' : (currentChatName() !== 'Без имени' ? `Войти как ${currentChatName()}` : 'Войти в группу');
  setDisabled('copyInviteBtn', !hasGroup);
  setDisabled('joinGroupBtn', !hasSupabase || !hasGroup || groupJoined);
  setDisabled('leaveGroupBtn', !groupJoined);
  setDisabled('startLiveBtn', !hasSupabase || !hasGroup || liveEnabled);
  setDisabled('stopLiveBtn', !liveEnabled);
  setDisabled('refreshFriendsBtn', !hasSupabase || !hasGroup || !groupJoined);
  setDisabled('testSupabaseBtn', !hasSupabase);
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
  lines.push(`- pmtiles runtime: ${provider.pmtilesRuntime.status}`);
  lines.push(`- pmtiles file: ${provider.pmtilesRuntime.packageFound ? 'found' : 'not-found/unchecked'}`);
  lines.push(`- pmtiles url: ${provider.pmtilesRuntime.url}`);
  lines.push(`- pmtiles local file: ${provider.localPmtilesFile.status === 'selected' ? `${provider.localPmtilesFile.name} / ${formatBytes(provider.localPmtilesFile.sizeBytes)}` : provider.localPmtilesFile.status}`);
  if (provider.pmtilesRuntime.error) lines.push(`- pmtiles error: ${provider.pmtilesRuntime.error}`);
  if (provider.pmtilesRuntime.diagnostics) {
    const diag = provider.pmtilesRuntime.diagnostics;
    lines.push(`- pmtiles transport: ${diag.summary || diag.status || 'unknown'}`);
    if (diag.head) lines.push(`- pmtiles HEAD: ${diag.head.status || 'n/a'}${diag.head.error ? ` / ${diag.head.error}` : ''}`);
    if (diag.range) lines.push(`- pmtiles Range: ${diag.range.status || 'n/a'}${diag.range.bytes != null ? ` / ${diag.range.bytes} bytes` : ''}${diag.range.error ? ` / ${diag.range.error}` : ''}`);
    if (diag.hint) lines.push(`- pmtiles hint: ${diag.hint}`);
  }
  lines.push(`- packages manifest: ${provider.offlineMapManifest.status}`);
  lines.push(`- selected package: ${provider.offlineMapManifest.selectedPackageName || provider.offlineMapManifest.selectedPackageId || 'none'}`);
  lines.push(`- pmtiles preview: ${provider.pmtilesPreview.status}`);
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
    pmtilesPreview: {
      status: pmtilesPreviewState.status,
      visible: pmtilesPreviewState.visible,
      sourceUrl: pmtilesPreviewState.sourceUrl,
      styleMode: pmtilesPreviewState.styleMode,
      error: pmtilesPreviewState.error,
      loadedAt: pmtilesPreviewState.loadedAt,
      lastEvent: pmtilesPreviewState.lastEvent
    },
    offlineMapManifest: getOfflineMapManifestSnapshot(),
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
    setOfflineMapStatus('Карта: офлайн-пакет не установлен', 'warn');
  } else if (offlinePackageStatus === 'metadata-present-runtime-not-enabled') {
    setOfflineMapStatus('Офлайн-пакет найден, runtime ещё не подключён', 'warn');
  } else if (offlinePackageStatus === 'metadata-ready-runtime-experimental') {
    setOfflineMapStatus('PMTiles найден, рендер экспериментальный', 'warn');
  } else if (offlinePackageStatus === 'preview-ready-runtime-experimental') {
    setOfflineMapStatus('PMTiles preview готов', 'on');
  } else if (offlinePackageStatus === 'ready') {
    setOfflineMapStatus('Карта: офлайн-пакет готов', 'on');
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
    setPmtilesRuntimeStatus('PMTiles: preview отрисован', 'on');
  } else if (status === 'ready') {
    setPmtilesRuntimeStatus('PMTiles: пакет читается', 'on');
  } else if (status === 'maplibre-ready-no-package') {
    setPmtilesRuntimeStatus('PMTiles: runtime готов, файла нет', 'warn');
  } else if (status === 'not-run') {
    setPmtilesRuntimeStatus('PMTiles: не проверено', 'warn');
  } else if (status === 'loading-runtime' || status === 'checking-package' || status === 'starting-maplibre' || status === 'starting-maplibre-preview') {
    setPmtilesRuntimeStatus('PMTiles: проверка…', 'warn');
  } else if (status === 'runtime-failed' || status === 'package-error' || status === 'maplibre-failed') {
    setPmtilesRuntimeStatus('PMTiles: ошибка проверки', 'bad');
  } else {
    setPmtilesRuntimeStatus(`PMTiles: ${status}`, 'warn');
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

function setCurrentPmtilesPreviewButtonStatus(status, detail) {
  if (activeButtonDiagnostics && activeButtonDiagnostics.buttonId === 'previewPmtilesBtn') {
    setButtonApiStatus(activeButtonDiagnostics, status, detail);
  }
}

function updatePmtilesPreviewUi() {
  const panel = $('pmtilesPreviewPanel');
  const statusEl = $('pmtilesPreviewStatus');
  if (!panel || !statusEl) return;

  panel.hidden = !pmtilesPreviewState.visible;

  if (pmtilesPreviewState.status === 'loaded') {
    statusEl.textContent = `PMTiles preview: MapLibre отрисовал выбранный PMTiles (${getActivePmtilesPackageName()}). Это отдельный preview, основная карта остаётся Leaflet.`;
  } else if (pmtilesPreviewState.status === 'loading') {
    statusEl.textContent = 'PMTiles preview: загрузка MapLibre и подключение pmtiles:// source…';
  } else if (pmtilesPreviewState.status === 'source-loaded') {
    statusEl.textContent = 'PMTiles preview: источник подключён, ждём отрисовку первого кадра…';
  } else if (pmtilesPreviewState.status === 'metadata-only') {
    statusEl.textContent = `PMTiles preview: пакет ${getActivePmtilesPackageName()} читается, но это не raster-пакет для текущего preview. Нужен отдельный vector-style спринт.`;
  } else if (pmtilesPreviewState.status === 'error') {
    statusEl.textContent = `PMTiles preview: ошибка — ${pmtilesPreviewState.error || 'неизвестная ошибка'}`;
  } else {
    statusEl.textContent = 'PMTiles preview: не запускался.';
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
  return Boolean(pkg && pkg.sourceType === 'local-file-session' && pkg.fileRef === true);
}

function getLocalPmtilesFileSnapshot() {
  return {
    status: localPmtilesFileState.status,
    packageId: localPmtilesFileState.packageId,
    key: localPmtilesFileState.key,
    name: localPmtilesFileState.name,
    sizeBytes: localPmtilesFileState.sizeBytes,
    lastModified: localPmtilesFileState.lastModified,
    selectedAt: localPmtilesFileState.selectedAt,
    error: localPmtilesFileState.error
  };
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

function registerPmtilesArchiveForPackage(packageInfo = getActiveOfflineMapPackage()) {
  if (!window.pmtiles || !window.pmtiles.PMTiles || !pmtilesProtocol) return null;
  if (isLocalPmtilesPackage(packageInfo)) {
    const file = localPmtilesFileState.file;
    if (!file || localPmtilesFileState.packageId !== packageInfo.id) {
      throw new Error('Локальный PMTiles-файл не выбран в этой сессии. Выбери файл заново.');
    }
    const key = localPmtilesFileState.key || `local-pmtiles-${Date.now()}`;
    const source = createLocalPmtilesSource(file, key);
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
    name: 'Мини PMTiles sample',
    url: PMTILES_SAMPLE_URL,
    sourceType: 'same-origin-sample',
    role: 'diagnostic',
    enabled: true,
    sizeBytes: null,
    description: 'Маленький встроенный диагностический пакет для проверки PMTiles runtime.'
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
      sourceType: pkg.sourceType,
      version: pkg.version,
      sizeBytes: pkg.sizeBytes,
      enabled: pkg.enabled,
      role: pkg.role,
      fileRef: Boolean(pkg.fileRef),
      localSession: Boolean(pkg.localSession)
    })),
    localFile: getLocalPmtilesFileSnapshot()
  };
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
  if (!selected.url) throw new Error('У выбранного PMTiles-пакета нет URL в manifest');
  return selected;
}

function getActivePmtilesPackageUrl() {
  return getSelectedOfflineMapPackage(true).url || PMTILES_DEFAULT_URL;
}

function getActivePmtilesPackageName() {
  return getSelectedOfflineMapPackage(true).name || 'PMTiles package';
}

function formatBytes(bytes) {
  const value = Number(bytes);
  if (!Number.isFinite(value) || value <= 0) return 'размер неизвестен';
  if (value < 1024) return `${Math.round(value)} B`;
  if (value < 1024 * 1024) return `${Math.round(value / 1024)} KB`;
  if (value < 1024 * 1024 * 1024) return `${Math.round(value / 1024 / 1024)} MB`;
  return `${(value / 1024 / 1024 / 1024).toFixed(1)} GB`;
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
    error: null,
    loadedAt: null,
    lastEvent: userAction ? 'selected package changed by user' : 'selected package restored'
  };
  if (pmtilesPreviewMap) {
    try { pmtilesPreviewMap.remove(); } catch (err) { console.warn('PMTiles preview map remove failed', err); }
    pmtilesPreviewMap = null;
  }
  setMapProviderState({ offlinePackageStatus: 'not-installed' }, `selected PMTiles package: ${pkg.id}`);
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
    status.textContent = `Локальный файл: ${localPmtilesFileState.name} · ${formatBytes(localPmtilesFileState.sizeBytes)} · выбран в этой сессии · изменён ${modified}. После перезапуска PWA файл нужно выбрать заново.`;
  } else if (localPmtilesFileState.status === 'error') {
    status.textContent = `Локальный файл: ошибка — ${localPmtilesFileState.error || 'неизвестно'}`;
  } else {
    status.textContent = 'Локальный файл: не выбран. Можно скачать .pmtiles из Release asset и выбрать его здесь, без CORS/Range-запросов к GitHub.';
  }
}

function makeLocalPmtilesPackage(file) {
  const safeName = String(file.name || 'local.pmtiles').trim() || 'local.pmtiles';
  const packageId = `local-file-${Date.now()}`;
  const key = `${packageId}-${Math.random().toString(16).slice(2)}`;
  localPmtilesFileState = {
    status: 'selected',
    file,
    packageId,
    key,
    name: safeName,
    sizeBytes: file.size || null,
    lastModified: file.lastModified || null,
    selectedAt: new Date().toISOString(),
    error: null
  };
  return {
    id: packageId,
    name: `Локальный файл: ${safeName}`,
    url: `local-file://${key}/${encodeURIComponent(safeName)}`,
    sourceType: 'local-file-session',
    role: 'local-user-file',
    version: null,
    sizeBytes: file.size || null,
    bounds: null,
    minZoom: null,
    maxZoom: null,
    enabled: true,
    required: false,
    description: 'Локально выбранный PMTiles-файл. Хранится только в текущей сессии браузера.',
    releaseTag: null,
    checksum: null,
    fileRef: true,
    localSession: true
  };
}

async function selectLocalPmtilesFile(file) {
  try {
    if (!file) return null;
    if (!/\.pmtiles$/i.test(file.name || '')) throw new Error('Выбери файл с расширением .pmtiles');
    const pkg = makeLocalPmtilesPackage(file);
    offlineMapManifest.packages = [pkg, ...(offlineMapManifest.packages || []).filter((item) => !isLocalPmtilesPackage(item))];
    offlineMapManifest.selectedPackageId = pkg.id;
    if (offlineMapManifest.status === 'not-loaded') offlineMapManifest.status = 'local-session';
    selectOfflineMapPackage(pkg.id, true);
    setButtonApiStatus({ buttonId: 'chooseLocalPmtilesBtn', label: BUTTON_DIAGNOSTIC_LABELS.chooseLocalPmtilesBtn }, 'готово', `${file.name} · ${formatBytes(file.size)}`);
    recordMapDebug('local PMTiles file selected', getLocalPmtilesFileSnapshot());
    renderOfflineMapPackageUi();
    updateMapDebugUi(true);
    return pkg;
  } catch (err) {
    localPmtilesFileState = { ...localPmtilesFileState, status: 'error', error: err?.message || String(err) };
    setButtonApiStatus({ buttonId: 'chooseLocalPmtilesBtn', label: BUTTON_DIAGNOSTIC_LABELS.chooseLocalPmtilesBtn }, 'ошибка', localPmtilesFileState.error);
    renderLocalPmtilesFileUi();
    updateMapDebugUi(true);
    return null;
  }
}

async function loadOfflineMapManifest(userAction = false) {
  offlineMapManifest = {
    ...offlineMapManifest,
    status: 'loading',
    error: null
  };
  renderOfflineMapPackageUi();
  if (userAction && activeButtonDiagnostics?.buttonId === 'loadOfflineManifestBtn') {
    setButtonApiStatus(activeButtonDiagnostics, 'пендинг', 'загрузка offline-map-packages.json');
  }

  try {
    const res = await fetch(OFFLINE_MAP_MANIFEST_URL, { cache: 'no-store' });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const json = await res.json();
    const localPackage = (offlineMapManifest.packages || []).find((pkg) => isLocalPmtilesPackage(pkg) && pkg.id === localPmtilesFileState.packageId);
    const packages = ensureSamplePackage(Array.isArray(json.packages) ? json.packages : []);
    if (localPackage && localPmtilesFileState.file) packages.unshift(localPackage);
    const savedSelectedId = localPackage ? localPackage.id : localStorage.getItem(OFFLINE_MAP_SELECTED_PACKAGE_KEY);
    const selectedPackage = packages.find((pkg) => pkg.id === savedSelectedId && pkg.enabled) || packages.find((pkg) => pkg.enabled) || defaultOfflineMapPackage();
    offlineMapManifest = {
      url: OFFLINE_MAP_MANIFEST_URL,
      status: 'loaded',
      schemaVersion: json.schemaVersion || null,
      packages,
      selectedPackageId: selectedPackage.id,
      error: null,
      loadedAt: new Date().toISOString()
    };
    localStorage.setItem(OFFLINE_MAP_SELECTED_PACKAGE_KEY, selectedPackage.id);
    pmtilesRuntimeProbe = { ...pmtilesRuntimeProbe, url: selectedPackage.url, packageId: selectedPackage.id, packageName: selectedPackage.name };
    pmtilesPreviewState = { ...pmtilesPreviewState, sourceUrl: selectedPackage.url };
    renderOfflineMapPackageUi();
    recordMapDebug('offline map manifest loaded', getOfflineMapManifestSnapshot());
    if (userAction && activeButtonDiagnostics?.buttonId === 'loadOfflineManifestBtn') {
      setButtonApiStatus(activeButtonDiagnostics, 'готово', `найдено пакетов: ${packages.length}`);
    }
    return offlineMapManifest;
  } catch (err) {
    const sample = defaultOfflineMapPackage();
    offlineMapManifest = {
      url: OFFLINE_MAP_MANIFEST_URL,
      status: 'error',
      packages: [sample],
      selectedPackageId: sample.id,
      error: err?.message || String(err),
      loadedAt: null
    };
    pmtilesRuntimeProbe = { ...pmtilesRuntimeProbe, url: sample.url, packageId: sample.id, packageName: sample.name };
    pmtilesPreviewState = { ...pmtilesPreviewState, sourceUrl: sample.url };
    renderOfflineMapPackageUi();
    recordMapDebug('offline map manifest load failed; sample fallback active', offlineMapManifest.error);
    if (userAction && activeButtonDiagnostics?.buttonId === 'loadOfflineManifestBtn') {
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

function createPmtilesVectorPreviewStyle(protocolUrl) {
  return {
    version: 8,
    sources: {
      'pmtiles-preview': {
        type: 'vector',
        url: protocolUrl
      }
    },
    layers: [
      { id: 'pmtiles-preview-background', type: 'background', paint: { 'background-color': '#f2efe9' } },
      { id: 'pmtiles-preview-water', type: 'fill', source: 'pmtiles-preview', 'source-layer': 'water', paint: { 'fill-color': '#b9d7ea', 'fill-opacity': 0.9 } },
      { id: 'pmtiles-preview-landuse', type: 'fill', source: 'pmtiles-preview', 'source-layer': 'landuse', paint: { 'fill-color': '#d7e8c7', 'fill-opacity': 0.55 } },
      { id: 'pmtiles-preview-buildings', type: 'fill', source: 'pmtiles-preview', 'source-layer': 'buildings', minzoom: 12, paint: { 'fill-color': '#d8c3a5', 'fill-opacity': 0.65 } },
      { id: 'pmtiles-preview-roads', type: 'line', source: 'pmtiles-preview', 'source-layer': 'roads', paint: { 'line-color': '#ffffff', 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.4, 12, 1.6, 16, 5] } },
      { id: 'pmtiles-preview-roads-casing', type: 'line', source: 'pmtiles-preview', 'source-layer': 'roads', paint: { 'line-color': '#b8a98c', 'line-width': ['interpolate', ['linear'], ['zoom'], 6, 0.2, 12, 0.8, 16, 2] } }
    ]
  };
}

async function showPmtilesPreviewMap() {
  const panel = $('pmtilesPreviewPanel');
  const container = $('pmtilesPreviewMap');
  if (!panel || !container) throw new Error('PMTiles preview container is missing');

  panel.hidden = false;
  setPmtilesPreviewState({
    status: 'loading',
    visible: true,
    sourceUrl: getActivePmtilesPackageUrl(),
    styleMode: null,
    error: null,
    loadedAt: null
  }, 'PMTiles preview started');
  setCurrentPmtilesPreviewButtonStatus('пендинг', 'загрузка MapLibre/PMTiles preview');

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
      try { pmtilesPreviewMap.remove(); } catch (err) { console.warn('PMTiles preview map remove failed', err); }
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
    const center = result.meta?.center && Number.isFinite(result.meta.center.lon) && Number.isFinite(result.meta.center.lat)
      ? [result.meta.center.lon, result.meta.center.lat]
      : [0, 0];
    const zoom = Number.isFinite(result.meta?.center?.zoom) ? result.meta.center.zoom : (isVectorPreview ? 10 : 0);
    const style = isVectorPreview ? createPmtilesVectorPreviewStyle(protocolUrl) : createPmtilesRasterPreviewStyle(protocolUrl);
    const styleMode = isVectorPreview ? 'vector-source-url' : 'raster-source-url';

    await new Promise((resolve, reject) => {
      let finished = false;
      const timeout = window.setTimeout(() => {
        if (finished) return;
        finished = true;
        reject(new Error('PMTiles preview timeout'));
      }, 12000);

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
      } catch (err) {
        window.clearTimeout(timeout);
        reject(err);
        return;
      }

      pmtilesPreviewMap.once('load', () => {
        setPmtilesPreviewState({ status: 'source-loaded', visible: true, styleMode }, 'PMTiles preview MapLibre load event');
      });

      pmtilesPreviewMap.once('idle', () => {
        if (finished) return;
        finished = true;
        window.clearTimeout(timeout);
        resolve();
      });

      pmtilesPreviewMap.on('error', (event) => {
        const message = event?.error?.message || 'MapLibre preview error';
        recordMapDebug('PMTiles preview non-fatal MapLibre error', message);
        // Do not reject immediately: mini test packages can emit recoverable source warnings.
      });
    });

    setMapProviderState({ offlinePackageStatus: 'preview-ready-runtime-experimental' }, 'PMTiles preview rendered; Leaflet remains primary');
    setPmtilesPreviewState({
      status: 'loaded',
      visible: true,
      styleMode,
      error: null,
      loadedAt: new Date().toISOString()
    }, 'PMTiles preview rendered');
    setCurrentPmtilesPreviewButtonStatus('готово', 'PMTiles preview отрисован отдельно от основной карты');
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

function summarizePmtilesMetadata(metadata) {
  if (!metadata || typeof metadata !== 'object') return null;
  return {
    name: metadata.name || metadata.id || null,
    description: metadata.description || null,
    attribution: metadata.attribution || null,
    vectorLayers: Array.isArray(metadata.vector_layers) ? metadata.vector_layers.map((layer) => layer.id || layer.name).filter(Boolean).slice(0, 24) : null,
    keys: Object.keys(metadata).slice(0, 24)
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
    return 'Похоже на ограничение GitHub Release asset для browser Range/CORS. Asset может скачиваться вручную, но не читаться как live PMTiles source.';
  }
  if (/CORS|Failed to fetch|blocked|network/i.test(text)) {
    return 'Похоже на CORS/Range/network блокировку. Для remote PMTiles нужны Range requests и CORS.';
  }
  if (diag.range?.status === 200 && diag.range?.bytes > 1024 * 1024) {
    return 'Сервер проигнорировал Range и начал отдавать большой файл целиком. Для PMTiles нужен byte-range доступ.';
  }
  if (diag.range?.bytes != null && diag.range.bytes < 127) return 'Получено меньше 127 байт; PMTiles header неполный.';
  if (diag.range?.magic && !/^PMTiles/.test(diag.range.magic)) return 'Первые байты не похожи на PMTiles header; возможно URL ведёт не на .pmtiles, а на HTML/redirect/error page.';
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
    sourceType: 'local-file-session',
    sameOrigin: true,
    status: ok ? 'local-file-ready' : 'unexpected-response',
    summary: ok ? `local file ok, ${bytes.byteLength} bytes, ${magic}` : `local file header unexpected, ${bytes.byteLength} bytes, ${magic || 'no magic'}`,
    checkedAt: new Date().toISOString(),
    head: {
      ok: true,
      status: 'local-file',
      statusText: 'File API',
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
    hint: ok ? 'Локальный File API работает: CORS/redirect/HTTP Range не используются.' : 'Первые байты локального файла не похожи на PMTiles header.'
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
    el.textContent = `Проверка: выбран пакет “${pkg.name}”. Нажми “Проверить выбранный PMTiles”, чтобы увидеть HTTP/Range диагностику.`;
    return;
  }
  const parts = [`Проверка: ${diag.summary || diag.status}`];
  if (diag.sourceType === 'local-file-session') parts.push('источник: локальный File API');
  if (diag.head) parts.push(`HEAD ${diag.head.status || 'n/a'}`);
  if (diag.range) parts.push(`Range ${diag.range.status || 'n/a'}${diag.range.bytes != null ? ` / ${diag.range.bytes} bytes` : ''}`);
  if (diag.hint) parts.push(`Подсказка: ${diag.hint}`);
  el.textContent = parts.join(' · ');
}

async function readPmtilesPackage(url = PMTILES_DEFAULT_URL, packageInfo = null) {
  let sizeBytes = null;
  const localFileMode = isLocalPmtilesPackage(packageInfo);
  const localFile = localFileMode ? localPmtilesFileState.file : null;
  if (localFileMode && !localFile) {
    throw Object.assign(new Error('Локальный PMTiles-файл не выбран в этой сессии. Выбери файл заново.'), { code: 'PMTILES_LOCAL_FILE_MISSING' });
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

    setPmtilesProbeState({ status: 'checking-package' }, 'MapLibre smoke test passed; checking PMTiles package');
    try {
      const result = await readPmtilesPackage(url, activePackage);
      setPmtilesProbeState({
        status: 'ready',
        packageFound: true,
        header: result.header,
        metadata: result.metadata,
        error: null
      }, 'PMTiles package header/metadata read');
      setMapProviderState({ offlinePackageStatus: 'metadata-ready-runtime-experimental' }, 'PMTiles package metadata ready; Leaflet remains primary');
      setCurrentPmtilesProbeButtonStatus('готово', 'PMTiles header/metadata прочитаны');
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
        }, 'MapLibre/PMTiles runtime ready, but selected PMTiles package is not available');
        setMapProviderState({ offlinePackageStatus: 'not-installed' }, 'PMTiles runtime ready; selected package missing');
        setCurrentPmtilesProbeButtonStatus('готово', 'runtime готов, выбранный PMTiles не найден');
        updateMapDebugUi(true);
        return false;
      }
      setPmtilesProbeState({ status: 'package-error', error: err?.message || String(err), diagnostics: err?.diagnostics || pmtilesRuntimeProbe.diagnostics || null }, 'PMTiles package read failed');
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
    setMapStatus('Карта: подложка недоступна, точки работают', 'warn');
  } else if (snapshot.providerState.mapSourceStatus === 'online-ready' || snapshot.tileDom.loaded > 0) {
    setMapStatus('Карта: онлайн', 'on');
  } else if (snapshot.providerState.mapSourceStatus === 'offline-not-installed') {
    setMapStatus('Карта: офлайн-пакет не установлен', 'warn');
  } else if (snapshot.tileStats.error > 0) {
    setMapStatus('Карта: ошибка тайлов', 'bad');
  } else if (snapshot.tileDom.total > 0 && snapshot.tileDom.loaded === 0) {
    setMapStatus('Карта: тайлы не загружены', 'warn');
  } else if (snapshot.mapElementRect && snapshot.mapElementRect.height < 100) {
    setMapStatus('Карта: малый контейнер', 'bad');
  } else {
    setMapStatus('Карта: онлайн загружается', 'warn');
  }

  if (textEl && (forceText || $('mapDebugDialog')?.open)) {
    textEl.textContent = formatDiagnosticsText();
  }

  const hint = $('mapHint');
  if (hint) {
    if (!snapshot.leafletLoaded) {
      hint.textContent = 'Движок карты Leaflet не загрузился. Локальные точки и GPS-координаты остаются в данных, но визуальная карта недоступна до загрузки app shell/CDN.';
    } else if (snapshot.providerState.mapSourceStatus === 'online-stale-offline') {
      hint.textContent = 'Интернет выключен. Приложение удерживает уже загруженные тайлы, чтобы карта не исчезала до перезагрузки. Новые участки подложки без офлайн-пакета не догрузятся, но точки и GPS продолжают работать.';
    } else if (snapshot.providerState.mapProvider === MAP_PROVIDER_NO_BASEMAP || snapshot.providerState.fallbackActive) {
      hint.textContent = 'Подложка карты недоступна. GPS, сохранённые точки, выбранная точка, чат-точки и live-маркеры продолжают работать поверх пустой карты.';
    } else if (snapshot.providerState.offlinePackageStatus === 'preview-ready-runtime-experimental') {
      hint.textContent = 'PMTiles preview отрисован отдельным MapLibre-контейнером из выбранного manifest-пакета. Это не замена основной карты: Leaflet online-raster, точки, GPS и чат остаются рабочим слоем.';
    } else if (snapshot.providerState.offlinePackageStatus === 'metadata-ready-runtime-experimental') {
      hint.textContent = 'Выбранный PMTiles-пакет читается экспериментальным MapLibre/PMTiles probe. Если это GitHub Release asset, приложение проверяет URL из manifest без автоскачивания большой карты; основная карта пока остаётся на Leaflet online-raster.';
    } else if (snapshot.tileStats.error > 0) {
      hint.textContent = `Есть ошибки загрузки тайлов: ${snapshot.tileStats.error}. Открой “!” и скопируй диагностику.`;
    } else if (snapshot.tileDom.total > 0 && snapshot.tileDom.loaded === 0) {
      hint.textContent = 'Тайлы созданы, но не загрузились. Проверь интернет или нажми “Починить карту”.';
    } else {
      hint.textContent = 'Сейчас используется online raster provider. Офлайн-пакет PMTiles ещё не установлен; точки и GPS отделены от подложки.';
    }
  }
}


function updatePickedMapPointUi() {
  const hint = $('pickedMapPointHint');
  if (!hint) return;
  if (pickedMapPoint) {
    hint.textContent = `Выбрана точка на карте: ${fmtCoord(pickedMapPoint.lat)}, ${fmtCoord(pickedMapPoint.lon)}. Заполни название/тип/заметку и нажми “Сохранить выбранную точку” или “Отправить выбранную точку в чат”.`;
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
  recordMapDebug('picked map point', pickedMapPoint);
  updatePickedMapPointUi();
}

function clearPickedMapPoint(showStatus = false) {
  if (pickedMapPointMarker) {
    pickedMapPointMarker.remove();
    pickedMapPointMarker = null;
  }
  pickedMapPoint = null;
  updatePickedMapPointUi();
  if (showStatus) setButtonApiStatus(activeButtonDiagnostics || { buttonId: 'clearPickedMapPointBtn', label: getButtonDiagnosticLabel('clearPickedMapPointBtn') }, 'готово', 'выбранная точка сброшена');
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
    // Desktop right-click and some mobile long-tap implementations land here.
    setPickedMapPoint(event.latlng, 'map-contextmenu');
  });

  map.on('mousedown touchstart', (event) => {
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
  const label = kind === 'user' ? 'Я' : kind === 'friend' ? 'Д' : kind === 'chat' ? 'Ч' : '';
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

async function saveSpotFromPosition(position, source) {
  if (!position) return;
  const name = $('spotName').value.trim() || `Точка ${spots.length + 1}`;
  const photo = await fileToDataUrl($('spotPhoto').files[0]);
  const spot = {
    id: uid(),
    name,
    mushroomType: $('mushroomType').value.trim(),
    note: $('spotNote').value.trim(),
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
  $('spotName').value = '';
  $('mushroomType').value = '';
  $('spotNote').value = '';
  $('spotPhoto').value = '';
  if (source === 'map-picked') clearPickedMapPoint(false);
  await afterDataChanged();
  selectSpot(spot.id, true);
  $('saveHint').textContent = source === 'map-picked'
    ? 'Сохранена выбранная точка на карте.'
    : 'Сохранена текущая GPS-точка.';
}

async function saveCurrentSpot() {
  if (!currentPosition) {
    markButtonBlocked('нет GPS-координат');
    alert('Сначала включи GPS и дождись координат.');
    return;
  }
  await saveSpotFromPosition(currentPosition, 'current-gps');
}

async function savePickedMapPoint() {
  if (!pickedMapPoint) {
    markButtonBlocked('точка на карте не выбрана');
    alert('Сначала зажми место на карте пальцем примерно на секунду.');
    return;
  }
  await saveSpotFromPosition(pickedMapPoint, 'map-picked');
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

function markerPopup(spot) {
  return `<strong>${escapeHtml(spot.name)}</strong><br>${spot.mushroomType ? escapeHtml(spot.mushroomType)+'<br>' : ''}${fmtCoord(spot.lat)}, ${fmtCoord(spot.lon)}<br>Точность: ${meters(spot.accuracy)}<br><button onclick="window.selectSpotFromPopup('${spot.id}')">Выбрать</button>`;
}

function renderMarkers() {
  if (!canUseMapRuntime()) return;
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
  if (center && canUseMapRuntime()) map.setView([spot.lat, spot.lon], Math.max(map.getZoom(), 16));
  const marker = spotMarkers.get(id);
  if (marker) marker.openPopup();
  updateSelectedDetails();
  renderList();
  updateActionButtonsUi();
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
  if (!canUseMapRuntime()) return alert('Карта недоступна, но координаты точки сохранены.');
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
    throw new Error(`Supabase ${res.status}: ${text || res.statusText}`);
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
    $('liveHint').textContent = 'Группа создана. Скопируй приглашение и отправь друзьям. Для live-режима нужен Supabase в config.js.';
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
    setMemberSyncPending(true, 'Supabase не настроен');
    $('liveHint').textContent = 'Группа открыта локально. Для синхронизации участников нужен Supabase URL и anon public key в config.js.';
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
    setDbCleanupHint('Чистка БД недоступна: нужен Supabase URL и anon public key в config.js. Локальные грибные точки не затрагиваются.');
  } else if (!hasGroup) {
    setDbCleanupHint('Для чистки текущей группы вставь или создай ID группы. Можно удалить “меня из всех групп” по локальному user_id.');
  } else {
    setDbCleanupHint('Готово к чистке live_locations. “Меня” = локальный user_id этого браузера; грибные точки IndexedDB не удаляются.');
  }
}

function getCurrentGroupForCleanup() {
  const group = $('groupId')?.value?.trim() || '';
  if (!group) throw new Error('Сначала создай или вставь ID группы.');
  return group;
}

function requireGroupTypedConfirmation(group, actionText) {
  const typed = prompt(`${actionText}\n\nЭто удалит live-записи из Supabase, но не тронет локальные грибные точки.\n\nДля подтверждения введи ID группы полностью:`, '');
  return typed === group;
}

function confirmDbCleanup(actionText) {
  return confirm(`${actionText}\n\nБудут удалены только live-записи из таблицы live_locations. Локальные грибные точки, заметки и фото не затрагиваются.`);
}

async function deleteLiveRows(filterQuery, label, options = {}) {
  if (!getSupabaseConfig()) throw new Error('Supabase не настроен в config.js.');
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
  $('friendsList').innerHTML = '<p class="hint">Текущая группа очищена в БД.</p>';
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
    sendBtn.disabled = !canUseChat;
    sendBtn.textContent = chatEditingMessageId ? 'Сохранить правку' : 'Отправить';
  }
  if (refreshBtn) refreshBtn.disabled = !canUseChat;
  if (input) input.disabled = !canUseChat;
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
    setChatHint('Чат недоступен: нужен Supabase URL и anon public key в config.js.');
  } else if (!group) {
    setChatHint('Создай группу или открой приглашение, чтобы читать и писать в чат группы.');
  } else if (!groupJoined) {
    setChatHint('Чат заблокирован: сначала нажми “Войти в группу” или открой приглашение.');
  } else if (!chatMessages.length) {
    setChatHint('Чат готов. Сообщения хранятся в Supabase group_messages и привязаны к текущему ID группы.');
  }
}

function resetChatComposer(clearText = false) {
  chatEditingMessageId = null;
  if (clearText && $('chatMessageInput')) $('chatMessageInput').value = '';
  updateChatUi();
}

function stopChatAutoRefresh(clearList = false) {
  clearInterval(chatTimer);
  chatTimer = null;
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
  if (!getSupabaseConfig()) { markButtonBlocked('Supabase не настроен'); alert('Для отправки точки в чат нужен Supabase в config.js.'); return false; }
  if (!currentGroupId()) { markButtonBlocked('нет ID группы'); alert('Сначала создай группу или открой приглашение.'); return false; }
  if (!groupJoined) { markButtonBlocked('чат доступен только после входа в группу'); alert('Сначала войди в группу.'); return false; }
  return true;
}

async function sendSpotPayloadToChat(payload, sourceLabel) {
  if (!requireGroupChatReady()) return false;
  const body = encodeSpotChatBody(payload);
  const name = currentChatName();
  if ($('liveName') && !$('liveName').value.trim()) {
    $('liveName').value = name;
    saveLiveInputs();
  }
  await createChatMessage(body, name);
  setChatHint(`${sourceLabel} отправлена в чат как кликабельная карточка.`);
  await refreshGroupChat(false);
  startChatAutoRefresh();
  return true;
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
    list.innerHTML = '<p class="hint">Чат недоступен: не настроен Supabase.</p>';
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
        editBtn.className = 'secondary small-btn';
        editBtn.textContent = 'Править';
        editBtn.onclick = withButtonDiagnostics('chatEditMessageBtn', () => startEditChatMessage(row.id));
        actions.appendChild(editBtn);
      }
      const deleteBtn = document.createElement('button');
      deleteBtn.type = 'button';
      deleteBtn.className = 'danger small-btn';
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
  const group = currentGroupId();
  if (!group) { markButtonBlocked('нет ID группы'); return alert('Сначала создай группу или открой приглашение.'); }
  if (!getSupabaseConfig()) { markButtonBlocked('Supabase не настроен'); return alert('Сначала вставь Supabase URL и anon public key в config.js и переопубликуй сайт.'); }
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

  if (chatEditingMessageId) {
    await updateChatMessage(chatEditingMessageId, body, name);
  } else {
    await createChatMessage(body, name);
  }
  resetChatComposer(true);
  await refreshGroupChat(false);
  startChatAutoRefresh();
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
  const list = $('friendsList');
  list.innerHTML = '';
  const locations = Array.isArray(data) ? data : (data?.locations || []);
  const members = Array.isArray(data) ? [] : (data?.members || []);
  const fromCache = Boolean(data && !Array.isArray(data) && data.fromCache);
  const cachedAt = data && !Array.isArray(data) ? data.cachedAt : null;
  const now = Date.now();
  const myId = ensureUserId();
  const seenMarkerIds = new Set();
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
    if (hasActiveLocation) activeLocationCount += 1;

    if (loc && row.userId !== myId && hasActiveLocation && canUseMapRuntime()) {
      seenMarkerIds.add(row.userId);
      const latlng = [loc.lat, loc.lon];
      let marker = friendMarkers.get(row.userId);
      const popup = `<strong>${escapeHtml(row.name)}</strong><br>${fmtCoord(loc.lat)}, ${fmtCoord(loc.lon)}<br>Точность: ${meters(loc.accuracy)}<br>Обновлено: ${fmtDate(loc.updated_at)}`;
      if (!marker) {
        marker = L.marker(latlng, { title: row.name, icon: makeMapIcon('friend') }).addTo(map).bindPopup(popup);
        friendMarkers.set(row.userId, marker);
      } else {
        marker.setLatLng(latlng).setPopupContent(popup);
      }
    }

    const item = document.createElement('div');
    item.className = `friend-item ${loc && !hasActiveLocation ? 'friend-stale' : ''} ${fromCache ? 'friend-cached' : ''}`;
    const suffix = row.userId === myId ? ' · я' : '';
    let meta;
    if (loc) {
      const dist = currentPosition ? meters(distanceMeters({ lat: currentPosition.lat, lon: currentPosition.lon }, loc)) : '—';
      meta = `${hasActiveLocation ? 'позиция на карте' : 'позиция устарела'} · ${fmtDate(loc.updated_at)}<br>Расстояние: ${dist} · GPS: ${meters(loc.accuracy)}`;
      item.onclick = () => { if (canUseMapRuntime()) map.setView([loc.lat, loc.lon], Math.max(map.getZoom(), 16)); };
    } else if (fromCache) {
      meta = `из кэша · позиция скрыта<br>Последний сигнал: ${fmtDate(member?.last_seen_at || member?.updated_at)} · кэш: ${fmtDate(cachedAt)}`;
    } else {
      meta = `${isPresent ? 'в группе' : 'давно не обновлялся'} · позиция скрыта<br>Последний сигнал: ${fmtDate(member?.last_seen_at || member?.updated_at)}`;
    }
    item.innerHTML = `<div><div class="friend-name">${escapeHtml(row.name)}${suffix}</div><div class="friend-meta">${meta}</div></div>`;
    list.appendChild(item);
  }

  for (const [id, marker] of friendMarkers.entries()) {
    if (!seenMarkerIds.has(id)) {
      marker.remove();
      friendMarkers.delete(id);
    }
  }

  if (!rows.length) {
    list.innerHTML = groupJoined ? '<p class="hint">В группе пока нет участников. Если связи нет, список появится из кэша после первого успешного обновления.</p>' : '<p class="hint">Открой приглашение или нажми “Войти в группу”.</p>';
  }
  safeInvalidateMap(0, 'render/update');

  if (rows.length && fromCache) {
    const cacheNote = document.createElement('p');
    cacheNote.className = 'hint';
    cacheNote.textContent = `Показан локальный кэш участников. Он может быть устаревшим; последнее успешное обновление: ${fmtDate(cachedAt)}.`;
    list.appendChild(cacheNote);
  }

  if (rows.length && activeLocationCount === 0 && !fromCache) {
    const note = document.createElement('p');
    note.className = 'hint';
    note.textContent = 'В группе есть участники, но сейчас ни у кого нет активной позиции на карте.';
    list.appendChild(note);
  }
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
    if (!usedCache) $('liveHint').textContent = `Ошибка участников: ${err.message}`;
    return false;
  }
}

async function startLiveSharing() {
  if (!getSupabaseConfig()) { markButtonBlocked('Supabase не настроен'); return alert('Сначала вставь Supabase URL и anon public key в config.js и переопубликуй сайт.'); }
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
    if (!cfg) throw new Error('Supabase не настроен в config.js.');
    const rows = await supabaseFetch('live_locations?select=id&limit=1', { method: 'GET' });
    $('liveHint').textContent = `Supabase OK. URL=${cfg.url}. Ответ: ${Array.isArray(rows) ? rows.length : 'ok'}`;
  } catch (err) {
    $('liveHint').textContent = `Supabase test failed: ${err.message}`;
  }
}

function bindUi() {
  $('startGpsBtn').onclick = withButtonDiagnostics('startGpsBtn', () => startGps(true));
  $('centerMeBtn').onclick = withButtonDiagnostics('centerMeBtn', () => currentPosition && canUseMapRuntime() ? map.setView([currentPosition.lat, currentPosition.lon], 16) : startGps(true));
  $('saveSpotBtn').onclick = withButtonDiagnostics('saveSpotBtn', saveCurrentSpot);
  if ($('savePickedMapPointBtn')) $('savePickedMapPointBtn').onclick = withButtonDiagnostics('savePickedMapPointBtn', savePickedMapPoint);
  if ($('sharePickedMapPointToChatBtn')) $('sharePickedMapPointToChatBtn').onclick = withButtonDiagnostics('sharePickedMapPointToChatBtn', sendPickedMapPointToChat);
  if ($('clearPickedMapPointBtn')) $('clearPickedMapPointBtn').onclick = withButtonDiagnostics('clearPickedMapPointBtn', () => clearPickedMapPoint(true));
  $('averageBtn').onclick = withButtonDiagnostics('averageBtn', averageAndSave);
  $('searchInput').oninput = renderList;
  $('navigateBtn').onclick = withButtonDiagnostics('navigateBtn', showNavigationLine);
  $('shareSpotBtn').onclick = withButtonDiagnostics('shareSpotBtn', exportSelected);
  if ($('sendSelectedSpotToChatBtn')) $('sendSelectedSpotToChatBtn').onclick = withButtonDiagnostics('sendSelectedSpotToChatBtn', sendSelectedSpotToChat);
  $('deleteSpotBtn').onclick = withButtonDiagnostics('deleteSpotBtn', deleteSelected);
  $('exportAllBtn').onclick = withButtonDiagnostics('exportAllBtn', exportAll);
  $('importFile').onchange = async (e) => { try { await importJson(e.target.files[0]); } catch(err) { alert(`Ошибка импорта: ${err.message}`); } finally { e.target.value = ''; } };
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
  if ($('loadOfflineManifestBtn')) $('loadOfflineManifestBtn').onclick = withButtonDiagnostics('loadOfflineManifestBtn', () => loadOfflineMapManifest(true));
  if ($('chooseLocalPmtilesBtn')) $('chooseLocalPmtilesBtn').onclick = withButtonDiagnostics('chooseLocalPmtilesBtn', () => {
    setButtonApiStatus(activeButtonDiagnostics, 'пендинг', 'ожидание выбора файла');
    $('localPmtilesFileInput')?.click();
  });
  if ($('localPmtilesFileInput')) $('localPmtilesFileInput').onchange = async (event) => {
    const file = event.target.files && event.target.files[0];
    await selectLocalPmtilesFile(file);
    event.target.value = '';
  };
  if ($('offlinePackageSelect')) $('offlinePackageSelect').onchange = (event) => selectOfflineMapPackage(event.target.value, true);
  if ($('probePmtilesBtn')) $('probePmtilesBtn').onclick = withButtonDiagnostics('probePmtilesBtn', runPmtilesRuntimeProbe);
  if ($('previewPmtilesBtn')) $('previewPmtilesBtn').onclick = withButtonDiagnostics('previewPmtilesBtn', showPmtilesPreviewMap);
  if ($('repairMapBtn')) $('repairMapBtn').onclick = withButtonDiagnostics('repairMapBtn', repairMap);
  if ($('mapDebugBtn')) $('mapDebugBtn').onclick = withButtonDiagnostics('mapDebugBtn', () => { updateMapDebugUi(true); $('mapDebugDialog').showModal(); });
  if ($('refreshMapDebugBtn')) $('refreshMapDebugBtn').onclick = withButtonDiagnostics('refreshMapDebugBtn', () => updateMapDebugUi(true));
  if ($('repairMapFromDebugBtn')) $('repairMapFromDebugBtn').onclick = withButtonDiagnostics('repairMapFromDebugBtn', repairMap);
  if ($('copyMapDebugBtn')) $('copyMapDebugBtn').onclick = withButtonDiagnostics('copyMapDebugBtn', copyMapDebug);
  if ($('closeMapDebugBtn')) $('closeMapDebugBtn').onclick = withButtonDiagnostics('closeMapDebugBtn', () => $('mapDebugDialog').close());

  window.addEventListener('online', () => { mountMapProvider(MAP_PROVIDER_ONLINE_RASTER, 'browser online'); repairMap(); retryMemberSync('online').catch(console.warn); if (groupJoined) refreshGroupChat(false).catch(console.warn); });
  window.addEventListener('offline', () => { if (!keepOnlineRasterLayerForOfflineTransition('browser offline')) activateNoBasemapFallback('browser offline without loaded raster tiles'); updateMapDebugUi(true); });
  window.addEventListener('resize', () => safeInvalidateMap(150, 'resize'));
  window.addEventListener('orientationchange', () => safeInvalidateMap(500, 'orientationchange'));
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
  $('appVersion').textContent = `v${APP_VERSION} · Sprint 4.9`;
  db = await openDb();
  await restoreFolderHandle();
  loadPeopleProfiles();
  restoreMemberSyncPending();
  ensureUserId();
  initMap();
  bindUi();
  loadOfflineMapManifest(false).catch((err) => recordMapDebug('offline map manifest startup load failed', err?.message || String(err)));
  recordMapDebug('app initialized');
  const groupFromUrl = loadLiveInputs();
  renderPeopleProfiles();
  scheduleMemberSyncRetry();
  await refreshSpots();
  if (!getSupabaseConfig()) {
    updateLiveUi();
    $('liveHint').textContent = 'Для live-режима нужен Supabase URL и anon public key в файле config.js.';
  } else if ($('groupId').value.trim()) {
    await joinGroup(true);
    $('liveHint').textContent = groupFromUrl
      ? 'Приглашение открыто: вход выполнен локально, имя участника синхронизируется при связи. Чтобы друзья видели твою точку на карте, нажми “Начать показ моей позиции”.'
      : 'Последняя группа восстановлена локально. Участники показываются из сети или кэша; чтобы друзья видели твою точку на карте, нажми “Начать показ моей позиции”.';
  } else {
    updateLiveUi();
  }
}

init().catch(err => {
  console.error(err);
  alert(`Ошибка запуска: ${err.message}`);
});
