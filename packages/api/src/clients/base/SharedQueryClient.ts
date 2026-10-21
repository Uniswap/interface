import { type Mutation, MutationCache, QueryCache, QueryClient } from '@tanstack/react-query'
import { FetchError } from '@universe/api/src/clients/base/errors'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { hashKey } from 'utilities/src/reactQuery/hashKey'
import { assertNoSecretsInPersistedSink, surfacePersistedSinkError } from 'utilities/src/security/persistedSinkTripwire'
import { ONE_DAY_MS, ONE_SECOND_MS } from 'utilities/src/time/time'

// The label lands in the thrown message and in logger.error, so it must never carry key values: only
// the leading cache-key name, which is a constant by convention, is safe to repeat.
function describeKey(key: readonly unknown[] | undefined, fallback: string): string {
  const head = key?.[0]
  return typeof head === 'string' ? head : fallback
}

function describeMutation(mutation: Mutation<unknown, unknown, unknown, unknown>): string {
  return describeKey(mutation.options.mutationKey, 'unkeyed mutation')
}

export const SharedQueryClient = new QueryClient({
  // Dev/test tripwires for wallet secrets entering the cache (see utilities/src/security). Both
  // MutationCache callbacks are awaited inside the mutation's try block, so a throw fails that
  // mutation cleanly; QueryCache.onSuccess runs inside the fetch promise chain, where a throw would
  // hang the query, so it surfaces the error asynchronously instead.
  mutationCache: new MutationCache({
    onMutate: (variables, mutation) =>
      assertNoSecretsInPersistedSink({
        sink: 'react-query mutation variables',
        value: variables,
        label: describeMutation(mutation),
      }),
    onSuccess: (...args) => {
      const [data, , , mutation] = args
      assertNoSecretsInPersistedSink({
        sink: 'react-query mutation data',
        value: data,
        label: describeMutation(mutation),
      })
    },
  }),
  queryCache: new QueryCache({
    onSuccess: (data, query) => {
      const label = describeKey(query.queryKey, 'unnamed query')
      try {
        assertNoSecretsInPersistedSink({ sink: 'react-query query key', value: query.queryKey, label })
        assertNoSecretsInPersistedSink({ sink: 'react-query query data', value: data, label })
      } catch (error) {
        surfacePersistedSinkError(error)
      }
    },
  }),
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
