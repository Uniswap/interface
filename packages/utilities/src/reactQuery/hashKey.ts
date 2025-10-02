import { MutationKey, hashKey as originalHashKey, QueryKey } from '@tanstack/react-query'

/**
 * Enhanced hash key for React Query that ensures stable keys even with arrays.
 *
 * This wrapper ensures that query keys with arrays in different orders
 * produce the same hash, preventing duplicate cache entries.
 *
 * @example
 * These will produce the same hash:
 * hashKey(['token', { chainId: ['1', '2'] }])
 * hashKey(['token', { chainId: ['2', '1'] }])
 *
 */
export function hashKey(queryKey: QueryKey | MutationKey): string {
  const normalizedKey = normalizeArrays(queryKey)
  return originalHashKey(normalizedKey)
}

/**
 * Recursively normalize arrays in the queryKey structure
 */
export function normalizeArrays<T>(value: T): T {
  if (value === null || value === undefined) {
    return value
  }

  // Handle arrays
  if (Array.isArray(value)) {
    const normalized = value.map((item: T) => normalizeArrays(item))

    return [...normalized].sort((a, b) => {
      // Use the original hashKey for consistent comparison
      // This ensures objects with differently ordered keys compare correctly
      const aHash = originalHashKey([a])
      const bHash = originalHashKey([b])
      return aHash < bHash ? -1 : aHash > bHash ? 1 : 0
    }) as T
  }

  // Handle objects - recursively normalize but don't sort keys
  if (typeof value === 'object' && value.constructor === Object) {
    const normalized: Record<string, unknown> = {}
    for (const key in value) {
      if (Object.hasOwn(value, key)) {
        normalized[key] = normalizeArrays((value as Record<string, unknown>)[key])
      }
    }
    return normalized as T
  }

  // Handle primitives (string, number, boolean)
  return value
}
