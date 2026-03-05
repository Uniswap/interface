// ============================================================================
// Cache Provider Interface
// ============================================================================

/**
 * Contract for cache providers - allows swapping implementations
 * (e.g., SQLite, Redis, in-memory) without changing consuming code
 */
export interface CacheProvider {
  /**
   * Retrieve a value from cache by key
   * @param key Cache key
   * @returns Cached value or null if not found/expired
   */
  get<T>(key: string): Promise<T | null>

  /**
   * Store a value in cache with optional TTL
   * @param key Cache key
   * @param value Value to cache (will be serialized as JSON)
   * @param ttlSeconds Optional time-to-live in seconds (default: no expiration)
   */
  set<T>(key: string, value: T, ttlSeconds?: number): Promise<void>

  /**
   * Remove a specific key from cache
   * @param key Cache key to invalidate
   */
  invalidate(key: string): Promise<void>

  /**
   * Remove all keys matching a pattern (supports SQL LIKE patterns)
   * @param pattern Pattern to match (e.g., "commits:%" or "prs:abc%")
   */
  invalidatePattern(pattern: string): Promise<void>

  /**
   * Clear all entries from cache
   */
  clear(): Promise<void>
}
