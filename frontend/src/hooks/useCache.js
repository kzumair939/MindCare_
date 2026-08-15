import { useRef, useCallback } from "react";

/**
 * A simple in-memory + sessionStorage caching hook for API calls.
 *
 * Usage:
 *   const { cachedFetch, invalidate } = useCache();
 *   const data = await cachedFetch("myKey", () => api.get("/endpoint"), 5 * 60 * 1000);
 *
 * @returns {{ cachedFetch, invalidate }}
 *   - cachedFetch(key, fetcher, ttlMs) – returns cached data if fresh, else calls fetcher()
 *   - invalidate(key) – removes a specific cache entry (call after mutations)
 *   - invalidateAll() – clears every entry created by this hook
 */
const SESSION_PREFIX = "__mc_cache__";

// Module-level in-memory store shared across hook instances (survives re-renders)
const memoryStore = new Map(); // key -> { data, expiresAt }

export function useCache() {
  // We track which keys *this* instance created for invalidateAll
  const ownKeys = useRef(new Set());

  const cachedFetch = useCallback(async (key, fetcher, ttlMs = 5 * 60 * 1000) => {
    const storageKey = SESSION_PREFIX + key;
    const now = Date.now();

    // 1. Check in-memory first (fastest – zero serialization)
    const mem = memoryStore.get(key);
    if (mem && mem.expiresAt > now) {
      return mem.data;
    }

    // 2. Fall back to sessionStorage (survives component remount, cleared on tab close)
    try {
      const raw = sessionStorage.getItem(storageKey);
      if (raw) {
        const parsed = JSON.parse(raw);
        if (parsed.expiresAt > now) {
          // Warm up memory store from sessionStorage
          memoryStore.set(key, parsed);
          ownKeys.current.add(key);
          return parsed.data;
        }
        // Stale – clean up
        sessionStorage.removeItem(storageKey);
      }
    } catch (_) {
      // sessionStorage unavailable (private mode, quota exceeded) – proceed without it
    }

    // 3. Cache miss – call the actual fetcher
    const result = await fetcher();
    const entry = { data: result, expiresAt: now + ttlMs };

    memoryStore.set(key, entry);
    ownKeys.current.add(key);

    try {
      sessionStorage.setItem(storageKey, JSON.stringify(entry));
    } catch (_) {
      // Quota exceeded – memory-only is fine
    }

    return result;
  }, []);

  const invalidate = useCallback((key) => {
    memoryStore.delete(key);
    try { sessionStorage.removeItem(SESSION_PREFIX + key); } catch (_) {}
  }, []);

  const invalidateAll = useCallback(() => {
    ownKeys.current.forEach((key) => {
      memoryStore.delete(key);
      try { sessionStorage.removeItem(SESSION_PREFIX + key); } catch (_) {}
    });
    ownKeys.current.clear();
  }, []);

  return { cachedFetch, invalidate, invalidateAll };
}

export default useCache;
