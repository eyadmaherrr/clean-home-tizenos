/**
 * Persistence for the app. Small settings and lists live in localStorage (namespaced JSON);
 * larger cached Quran payloads live in IndexedDB. Both were verified to survive app restarts
 * on a Tizen 6.0 TV. Nothing else in the app touches localStorage or IndexedDB directly.
 */
const NS = "qp.";

export const Storage = {
  get<T>(key: string, fallback: T): T {
    try {
      const raw = localStorage.getItem(NS + key);
      return raw == null ? fallback : (JSON.parse(raw) as T);
    } catch {
      return fallback;
    }
  },
  set<T>(key: string, value: T): void {
    try {
      localStorage.setItem(NS + key, JSON.stringify(value));
    } catch {
      /* quota or disabled storage: the app keeps working without persistence */
    }
  },
  remove(key: string): void {
    try { localStorage.removeItem(NS + key); } catch { /* ignore */ }
  },
};

const DB_NAME = "quran-play";
const STORE = "cache";
let dbPromise: Promise<IDBDatabase | null> | null = null;

function db(): Promise<IDBDatabase | null> {
  if (dbPromise) return dbPromise;
  dbPromise = new Promise((resolve) => {
    try {
      if (!window.indexedDB) return resolve(null);
      const req = indexedDB.open(DB_NAME, 1);
      req.onupgradeneeded = () => { req.result.createObjectStore(STORE); };
      req.onsuccess = () => resolve(req.result);
      req.onerror = () => resolve(null);
    } catch {
      resolve(null);
    }
  });
  return dbPromise;
}

/** Key/value cache in IndexedDB. Every call resolves (undefined on any failure). */
export const Cache = {
  async get<T>(key: string): Promise<T | undefined> {
    const d = await db();
    if (!d) return undefined;
    return new Promise((resolve) => {
      try {
        const req = d.transaction(STORE, "readonly").objectStore(STORE).get(key);
        req.onsuccess = () => resolve(req.result as T | undefined);
        req.onerror = () => resolve(undefined);
      } catch {
        resolve(undefined);
      }
    });
  },
  async set<T>(key: string, value: T): Promise<void> {
    const d = await db();
    if (!d) return;
    return new Promise((resolve) => {
      try {
        const tx = d.transaction(STORE, "readwrite");
        tx.objectStore(STORE).put(value, key);
        tx.oncomplete = () => resolve();
        tx.onerror = () => resolve();
      } catch {
        resolve();
      }
    });
  },
};
