export interface KeyValue {
  get(key: string): string | null;
  set(key: string, value: string): void;
  remove(key: string): void;
}

export function memoryKv(seed: Record<string, string> = {}): KeyValue {
  const data = { ...seed };
  return {
    get: (key) => (key in data ? data[key] : null),
    set: (key, value) => {
      data[key] = value;
    },
    remove: (key) => {
      delete data[key];
    },
  };
}

function safeStore(store: Storage): KeyValue {
  return {
    get(key) {
      try {
        return store.getItem(key);
      } catch {
        return null;
      }
    },
    set(key, value) {
      try {
        store.setItem(key, value);
      } catch {
        /* private mode */
      }
    },
    remove(key) {
      try {
        store.removeItem(key);
      } catch {
        /* private mode */
      }
    },
  };
}

export function localKv(): KeyValue {
  return safeStore(localStorage);
}

export function sessionKv(): KeyValue {
  return safeStore(sessionStorage);
}
