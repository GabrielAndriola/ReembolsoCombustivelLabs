type CacheEntry<T> = {
  expiresAt: number;
  value: T;
};

const store = new Map<string, CacheEntry<unknown>>();

export const cache = {
  get<T>(key: string) {
    const entry = store.get(key) as CacheEntry<T> | undefined;

    if (!entry) {
      return null;
    }

    if (entry.expiresAt <= Date.now()) {
      store.delete(key);
      return null;
    }

    return entry.value;
  },

  set<T>(key: string, value: T, ttlMs: number) {
    store.set(key, {
      value,
      expiresAt: Date.now() + ttlMs
    });

    return value;
  },

  delete(key: string) {
    store.delete(key);
  },

  deleteByPrefix(prefix: string) {
    for (const key of store.keys()) {
      if (key.startsWith(prefix)) {
        store.delete(key);
      }
    }
  }
};
