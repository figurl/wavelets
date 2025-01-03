/* eslint-disable @typescript-eslint/no-explicit-any */

interface CacheEntry {
  result: any;
  size: number;
  timestamp: number;
  key: string;
}

const DB_NAME = "pyodideCache";
const STORE_NAME = "results";
const MAX_CACHE_SIZE = 100 * 1024 * 1024; // 100 MB

const openDatabase = (): Promise<IDBDatabase> => {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, 1);

    request.onerror = () => reject(request.error);
    request.onsuccess = () => resolve(request.result);

    request.onupgradeneeded = (event) => {
      const db = (event.target as IDBOpenDBRequest).result;
      if (!db.objectStoreNames.contains(STORE_NAME)) {
        db.createObjectStore(STORE_NAME);
      }
    };
  });
};

const calculateSize = (obj: any): number => {
  const str = JSON.stringify(obj);
  const bytes = new TextEncoder().encode(str).length;
  return bytes;
};

const getTotalCacheSize = async (db: IDBDatabase): Promise<number> => {
  return new Promise((resolve, reject) => {
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.getAll();

    request.onerror = () => reject(request.error);
    request.onsuccess = () => {
      const entries = request.result as CacheEntry[];
      const totalSize = entries.reduce((sum, entry) => sum + entry.size, 0);
      resolve(totalSize);
    };
  });
};

const purgeCacheIfNeeded = async (db: IDBDatabase): Promise<void> => {
  const totalSize = await getTotalCacheSize(db);

  if (totalSize > MAX_CACHE_SIZE) {
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);
    store.clear();
    console.log(
      `Cache size exceeded ${MAX_CACHE_SIZE} bytes. Cleared entire cache.`,
    );
  }
};

export const getCachedValue = async (key: string) => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_NAME, "readonly");
    const store = transaction.objectStore(STORE_NAME);
    const request = store.get(key);

    return new Promise((resolve) => {
      request.onerror = () => resolve(undefined);
      request.onsuccess = () => {
        const entry = request.result as CacheEntry | undefined;
        resolve(entry?.result);
      };
    });
  } catch (error) {
    console.error("Error accessing cache:", error);
    return undefined;
  }
};

export const setCachedValue = async (key: string, result: any) => {
  try {
    const db = await openDatabase();
    const transaction = db.transaction(STORE_NAME, "readwrite");
    const store = transaction.objectStore(STORE_NAME);

    const entry: CacheEntry = {
      result,
      size: calculateSize(result),
      timestamp: Date.now(),
      key,
    };

    store.put(entry, key);

    // Check and purge cache if needed
    await purgeCacheIfNeeded(db);
  } catch (error) {
    console.error("Error setting cache:", error);
  }
};
