import type { HistoryStore, QueueStore, QueuedJob, StoredReading } from "./types";

const DB_NAME = "fahim";
const DB_VERSION = 1;

function openDb(): Promise<IDBDatabase> {
  return new Promise((resolve, reject) => {
    const request = indexedDB.open(DB_NAME, DB_VERSION);
    request.onupgradeneeded = () => {
      const db = request.result;
      if (!db.objectStoreNames.contains("readings")) {
        db.createObjectStore("readings", { keyPath: "id" });
      }
      if (!db.objectStoreNames.contains("queue")) {
        db.createObjectStore("queue", { keyPath: "id" });
      }
    };
    request.onsuccess = () => resolve(request.result);
    request.onerror = () => reject(request.error);
  });
}

function withStore<T>(
  name: "readings" | "queue",
  mode: IDBTransactionMode,
  run: (store: IDBObjectStore) => IDBRequest<T>,
): Promise<T> {
  return openDb().then(
    (db) =>
      new Promise<T>((resolve, reject) => {
        const tx = db.transaction(name, mode);
        const request = run(tx.objectStore(name));
        tx.oncomplete = () => {
          db.close();
          resolve(request.result);
        };
        tx.onerror = () => {
          db.close();
          reject(tx.error ?? request.error);
        };
        tx.onabort = () => {
          db.close();
          reject(tx.error ?? request.error);
        };
      }),
  );
}

export function createIdbHistory(): HistoryStore {
  return {
    async list() {
      const all = await withStore<StoredReading[]>("readings", "readonly", (store) => store.getAll());
      return all.sort((a, b) => b.createdAt - a.createdAt);
    },
    async put(item) {
      await withStore("readings", "readwrite", (store) => store.put(item));
    },
    async delete(id) {
      await withStore("readings", "readwrite", (store) => store.delete(id));
    },
    async clear() {
      await withStore("readings", "readwrite", (store) => store.clear());
    },
  };
}

export function createIdbQueue(): QueueStore {
  return {
    async list() {
      const all = await withStore<QueuedJob[]>("queue", "readonly", (store) => store.getAll());
      return all.sort((a, b) => a.createdAt - b.createdAt);
    },
    async put(item) {
      await withStore("queue", "readwrite", (store) => store.put(item));
    },
    async delete(id) {
      await withStore("queue", "readwrite", (store) => store.delete(id));
    },
  };
}
