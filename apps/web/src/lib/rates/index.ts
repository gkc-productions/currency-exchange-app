import { MockRateProvider, type RateProvider } from "./provider";

type CacheEntry = {
  rate: number;
  timestamp: Date;
  expiresAt: number;
};

const TTL_MS = 30_000;
const cache = new Map<string, CacheEntry>();
const defaultProvider = new MockRateProvider();

export function getRateCacheSnapshot() {
  if (cache.size === 0) {
    return { size: 0, ageMs: null as number | null, lastUpdatedAt: null as Date | null };
  }
  let newestTimestamp = 0;
  for (const entry of cache.values()) {
    newestTimestamp = Math.max(newestTimestamp, entry.timestamp.getTime());
  }
  const ageMs = Date.now() - newestTimestamp;
  return { size: cache.size, ageMs, lastUpdatedAt: new Date(newestTimestamp) };
}

export async function getMarketRate(
  from: string,
  to: string,
  provider: RateProvider = defaultProvider
) {
  const key = `${from.toUpperCase()}:${to.toUpperCase()}`;
  const now = Date.now();
  const cached = cache.get(key);
  if (cached && cached.expiresAt > now) {
    return {
      rate: cached.rate,
      source: provider.name,
      timestamp: cached.timestamp,
    };
  }

  const quote = await provider.getRate(from, to);
  cache.set(key, {
    rate: quote.rate,
    timestamp: quote.timestamp,
    expiresAt: now + TTL_MS,
  });
  return { rate: quote.rate, source: provider.name, timestamp: quote.timestamp };
}
