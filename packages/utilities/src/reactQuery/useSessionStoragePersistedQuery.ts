import { type QueryKey, useQueryClient } from '@tanstack/react-query'
import { useEffect, useState } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { hashKey } from 'utilities/src/reactQuery/hashKey'
import { jsonParse, jsonStringify } from 'utilities/src/serialization/json'

/**
 * Mirrors a single React Query cache entry to `sessionStorage` so it survives a
 * full-page navigation (e.g. OAuth redirect) without outliving the tab session.
 * Hydration is one-shot on mount; later writes flow through a cache subscription.
 * Uses `jsonStringify`/`jsonParse` to round-trip `bigint` fields safely.
 */
export function useSessionStoragePersistedQuery({
  queryKey,
  storageKey,
  enabled = true,
}: {
  queryKey: QueryKey
  storageKey: string
  enabled?: boolean
}): void {
  const queryClient = useQueryClient()

  // Hydration runs in `useState`'s lazy initializer because the cache must be populated
  // before the consuming `useQuery` runs on the same render — a `useEffect` fires too
  // late. `setQueryData` is idempotent, so a StrictMode double-call is harmless.
  useState(() => {
    if (!enabled) {
      return null
    }
    const raw = sessionStorage.getItem(storageKey)
    if (!raw) {
      return null
    }
    try {
      queryClient.setQueryData(queryKey, jsonParse(raw))
    } catch (err) {
      logger.warn(
        'useSessionStoragePersistedQuery',
        'hydrate',
        `Failed to parse cached entry for ${storageKey}; ignoring.`,
        { err },
      )
    }
    return null
  })

  // Hash the queryKey so the effect's dependency is a stable string instead
  // of an array reference that changes identity each render.
  const targetHash = hashKey(queryKey)

  useEffect(() => {
    if (!enabled) {
      return undefined
    }
    return queryClient.getQueryCache().subscribe((event) => {
      if (event.type !== 'updated' || event.query.queryHash !== targetHash) {
        return
      }
      const data = event.query.state.data
      if (data === undefined) {
        sessionStorage.removeItem(storageKey)
        return
      }
      try {
        sessionStorage.setItem(storageKey, jsonStringify(data))
      } catch (err) {
        logger.warn(
          'useSessionStoragePersistedQuery',
          'persist',
          `Failed to serialize entry for ${storageKey}; skipping write.`,
          { err },
        )
      }
    })
  }, [queryClient, targetHash, storageKey, enabled])
}
