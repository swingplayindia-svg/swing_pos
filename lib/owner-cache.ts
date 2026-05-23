/** In-memory cache for owner portal (per browser tab). */

export const OWNER_CACHE_TTL = {
  turf: 5 * 60 * 1000,
  bookings: 90 * 1000,
  closures: 5 * 60 * 1000,
} as const;

type CacheEntry<T> = {
  data: T;
  expiresAt: number;
};

const store = new Map<string, CacheEntry<unknown>>();
const inflight = new Map<string, Promise<unknown>>();

export function ownerCacheKey(
  turfId: string,
  resource: "turf" | "bookings" | "closures",
  extra?: string,
) {
  const base = `owner:${turfId}:${resource}`;
  return extra ? `${base}:${extra}` : base;
}

export function getOwnerCached<T>(key: string): T | null {
  const entry = store.get(key);
  if (!entry) return null;
  if (Date.now() > entry.expiresAt) {
    store.delete(key);
    return null;
  }
  return entry.data as T;
}

export function setOwnerCached<T>(key: string, data: T, ttlMs: number): void {
  store.set(key, { data, expiresAt: Date.now() + ttlMs });
}

export function invalidateOwnerCache(
  turfId: string,
  scope: "all" | "turf" | "bookings" | "closures" = "all",
): void {
  const prefix =
    scope === "all"
      ? `owner:${turfId}:`
      : ownerCacheKey(turfId, scope === "turf" ? "turf" : scope);

  for (const key of [...store.keys()]) {
    if (key.startsWith(prefix)) store.delete(key);
  }
  for (const key of [...inflight.keys()]) {
    if (key.startsWith(prefix)) inflight.delete(key);
  }
}

export function clearAllOwnerCache(): void {
  store.clear();
  inflight.clear();
}

/** Fetch with TTL cache + in-flight deduplication. */
export async function fetchOwnerCached<T>(
  key: string,
  ttlMs: number,
  fetcher: () => Promise<T>,
  options?: { force?: boolean },
): Promise<T> {
  if (!options?.force) {
    const hit = getOwnerCached<T>(key);
    if (hit !== null) return hit;
  } else {
    store.delete(key);
  }

  const pending = inflight.get(key);
  if (pending) return pending as Promise<T>;

  const promise = fetcher()
    .then((data) => {
      setOwnerCached(key, data, ttlMs);
      inflight.delete(key);
      return data;
    })
    .catch((err) => {
      inflight.delete(key);
      throw err;
    });

  inflight.set(key, promise);
  return promise;
}
