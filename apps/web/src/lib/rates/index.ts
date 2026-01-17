import { MockRateProvider, type RateProvider } from "./provider";

type CacheEntry = {
  rate: number;
  timestamp: Date;
  expiresAt: number;
};

const TTL_MS = 30_000;
const cache = new Map<string, CacheEntry>();
const defaultProvider = new MockRateProvider();

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
