/**
 * Generic cache used by providers. Allows caching of results to minimize
 * round trips to external data sources.
 *
 * @export
 * @interface ICache
 * @template T
 */
export interface ICache<T> {
  get(key: string): Promise<T | undefined>

  batchGet(keys: Set<string>): Promise<Record<string, T | undefined>>

  set(key: string, value: T, ttl?: number): Promise<boolean>

  has(key: string): Promise<boolean>
}
