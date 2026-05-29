const DB_NAME = 'mushroom-spots-db';
const DB_VERSION = 1;
const SPOTS_STORE = 'spots';

let dbPromise = null;

export function openDatabase() {
  if (dbPromise) return dbPromise;

  dbPromise = new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);

    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains(SPOTS_STORE)) {
        const store = db.createObjectStore(SPOTS_STORE, { keyPath: 'id' });
        store.createIndex('createdAt', 'createdAt');
        store.createIndex('species', 'species', { unique: false });
        store.createIndex('name', 'name', { unique: false });
      }
    };

    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });

  return dbPromise;
}

function tx(storeName, mode = 'readonly') {
  return openDatabase().then((db) => db.transaction(storeName, mode).objectStore(storeName));
}

export async function listSpots() {
  const store = await tx(SPOTS_STORE);
  return new Promise((resolve, reject) => {
    const request = store.getAll();
    request.onsuccess = () => resolve(request.result.sort((a, b) => b.createdAt.localeCompare(a.createdAt)));
    request.onerror = () => reject(request.error);
  });
}

export async function saveSpot(spot) {
  const store = await tx(SPOTS_STORE, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.put(spot);
    request.onsuccess = () => resolve(spot);
    request.onerror = () => reject(request.error);
  });
}

export async function getSpot(id) {
  const store = await tx(SPOTS_STORE);
  return new Promise((resolve, reject) => {
    const request = store.get(id);
    request.onsuccess = () => resolve(request.result ?? null);
    request.onerror = () => reject(request.error);
  });
}

export async function deleteSpot(id) {
  const store = await tx(SPOTS_STORE, 'readwrite');
  return new Promise((resolve, reject) => {
    const request = store.delete(id);
    request.onsuccess = () => resolve();
    request.onerror = () => reject(request.error);
  });
}

export async function bulkUpsertSpots(spots) {
  const db = await openDatabase();
  const transaction = db.transaction(SPOTS_STORE, 'readwrite');
  const store = transaction.objectStore(SPOTS_STORE);

  for (const spot of spots) {
    store.put(spot);
  }

  return new Promise((resolve, reject) => {
    transaction.oncomplete = () => resolve(spots.length);
    transaction.onerror = () => reject(transaction.error);
  });
}
