/**
 * Generate a random RFC 4122 v4 UUID.
 *
 * Thin wrapper around the Web Crypto `crypto.randomUUID()` — standard on Node 19+,
 * Bun, all evergreen browsers, and Hermes (React Native 0.74+). Centralised here
 * so callers don't reach into the global directly, and so test mocks/jsdom
 * polyfills have a single seam.
 */
export function uuid(): string {
  return crypto.randomUUID()
}
