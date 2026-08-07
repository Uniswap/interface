import { QueryClient } from '@tanstack/react-query'
import { FetchError } from '@universe/api/src/clients/base/errors'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { hashKey } from 'utilities/src/reactQuery/hashKey'
import { ONE_DAY_MS, ONE_SECOND_MS } from 'utilities/src/time/time'

export const SharedQueryClient = new QueryClient({
  defaultOptions: {
    queries: {
      // Ideally, these default values should never be used.
      // Each query should set its own `staleTime` and `gcTime` depending on how often the data is expected to change,
      // and how important it is to keep the data fresh every time a component mounts.
      staleTime: 15 * ONE_SECOND_MS,
      gcTime: ONE_DAY_MS,
      // Retry once, only if the error is a 500 fetch error.
      retry: (failureCount, error): boolean => {
        if (failureCount < 2 && error instanceof FetchError && error.response.status === 500) {
          return true
        }

        return false
      },
      queryKeyHashFn: hashKey,
    },
  },
})

// SHORT-TERM: persisted, wallet-independent "is this token permissioned" status. Once a
// token is confirmed permissioned it stays permissioned (monotonic), so these entries never need
// invalidation; they live forever (`gcTime: Infinity`) and are persisted to disk via `meta.persist`
// + `sharedDehydrateOptions` (web: on cache change; native: on app background). The trading-API header
// builder reads them synchronously so the first quote for a known permissioned token uses Universal
// Router 2.2.0 without waiting on `/permissions`. Registered here (not lazily) so the defaults exist
// before the persister restores the cache at app boot. See `permissionedTokenStatusCache` for the
// removal trigger.
SharedQueryClient.setQueryDefaults([ReactQueryCacheKey.PermissionedTokenStatus], {
  staleTime: Infinity,
  gcTime: Infinity,
  meta: { persist: true },
})
