/**
 * In-memory rate limiter.
 * Tracks timestamps per key (e.g. githubId) within a sliding window.
 * Suitable for MVP — single process only; does not survive restarts.
 */

const store = new Map<string, number[]>();

const WINDOW_MS = 60 * 60 * 1000; // 1 hour

/**
 * Returns true if the request is allowed, false if the rate limit is exceeded.
 * @param key      Unique identifier (e.g. githubId)
 * @param maxCount Maximum allowed requests per window
 */
export function checkRateLimit(key: string, maxCount: number): boolean {
  const now = Date.now();
  const windowStart = now - WINDOW_MS;

  const timestamps = (store.get(key) ?? []).filter((t) => t > windowStart);

  if (timestamps.length >= maxCount) {
    store.set(key, timestamps);
    return false;
  }

  timestamps.push(now);
  store.set(key, timestamps);
  return true;
}
