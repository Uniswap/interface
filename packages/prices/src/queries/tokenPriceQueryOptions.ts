import { type QueryClient, skipToken } from '@tanstack/react-query'
import { normalizeTokenAddressForCache } from '@universe/chains'
import { priceKeys } from '@universe/prices/src/queries/priceKeys'
import {
  REST_FRESHNESS_WINDOW_MS,
  REST_POLL_INTERVAL_MS,
  STALE_PRICE_THRESHOLD_MS,
} from '@universe/prices/src/sources/rest/constants'
import type { RestPriceBatcher } from '@universe/prices/src/sources/rest/RestPriceBatcher'
import type { TokenPriceData } from '@universe/prices/src/types'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'

export interface TokenPriceQueryOptionsParams {
  chainId: number
  address: string
  restBatcher?: RestPriceBatcher
  queryClient?: QueryClient
}

/** True when the cached price is recent enough that a poll tick can skip the wire. */
function canSkipRestFetch(data: TokenPriceData | null | undefined): boolean {
  return !!data && Date.now() - data.timestamp < REST_FRESHNESS_WINDOW_MS
}

/** True when the cached price is younger than the silent-stream threshold. */
function isCachedPriceFresh(data: TokenPriceData | null | undefined): boolean {
  return !!data && Date.now() - data.timestamp <= STALE_PRICE_THRESHOLD_MS
}

// oxlint-disable-next-line typescript/explicit-function-return-type
export function tokenPriceQueryOptions({ chainId, address, restBatcher, queryClient }: TokenPriceQueryOptionsParams) {
  const key = priceKeys.token(chainId, address)
  return persistableQueryOptions<TokenPriceData | null>({
    queryKey: key,
    queryFn: restBatcher
      ? async (): Promise<TokenPriceData | null> => {
          // Skip the REST call entirely when the cache already holds a recent
          // update (WS tick or prior fetch). This keeps the unconditional poll
          // below off the wire while the stream is healthy.
          const existing = queryClient?.getQueryData<TokenPriceData>(key)
          if (existing && canSkipRestFetch(existing)) {
            return existing
          }

          const fresh = await restBatcher.fetch({ chainId, address: normalizeTokenAddressForCache(address) })
          if (!fresh) {
            // REST omitting this token must not clobber a cached price (this is
            // a routine poll path); re-read to also keep a mid-flight WS tick.
            return queryClient?.getQueryData<TokenPriceData>(key) ?? null
          }
          // Re-read cache after the async fetch to catch any WS updates that
          // arrived while the REST request was in flight.
          const current = queryClient?.getQueryData<TokenPriceData>(key)
          if (current && current.timestamp >= fresh.timestamp) {
            return current
          }
          return fresh
        }
      : skipToken,
    /**
     * Infinity while the entry is fresh: WS ticks keep it current and the poll
     * below is the safety net. An aged entry (e.g. rehydrated from disk) reads
     * as stale so an observer switching ONTO its key fetches immediately —
     * `refetchOnMount` does not run on a key change, and without this the
     * withheld price waits out a full poll interval (e.g. the Buy form
     * switching from mainnet ETH to ETH on Arbitrum).
     */
    staleTime:
      restBatcher && queryClient ? (query): number => (isCachedPriceFresh(query.state.data) ? Infinity : 0) : Infinity,
    /**
     * `'always'`, not `true`: `staleTime` is Infinity while the entry is
     * fresh, so `true` would not fire. Covers the gap the interval below cannot: interval fetches are
     * paused while the tab is unfocused, so the return to the foreground is
     * refreshed here. Cheap, because the `queryFn` skips the wire while the
     * cached entry is younger than `REST_FRESHNESS_WINDOW_MS`. Gated on BOTH
     * params: no `restBatcher` and there is nothing to refetch, no
     * `queryClient` and the skip-if-fresh guard can never hit, which would
     * make every focus a real batch fetch per mounted price query.
     */
    refetchOnWindowFocus: restBatcher && queryClient ? 'always' : false,
    refetchOnReconnect: restBatcher && queryClient ? 'always' : false,
    // Persisted entries rehydrate at arbitrary age and would otherwise render
    // until the first poll tick. Same 'always'-over-true reasoning as above.
    refetchOnMount:
      restBatcher && queryClient
        ? (query): false | 'always' => (isCachedPriceFresh(query.state.data) ? false : 'always')
        : false,
    structuralSharing: false,
    /**
     * Unconditional, never a callback that can return `false`: query-core
     * CLEARS the timer on `false` and only re-evaluates on a cache write or a
     * re-render — and a silently dead stream produces neither, freezing the
     * price indefinitely. The always-armed poll is the per-token safety net;
     * the `queryFn` skip-if-fresh guard keeps healthy tokens off the wire —
     * which is why this shares the focus/mount gate on BOTH params: without a
     * `queryClient` the guard can never hit and every tick would be a real
     * batch fetch per mounted price query.
     */
    refetchInterval: restBatcher && queryClient ? REST_POLL_INTERVAL_MS : false,
  })
}
