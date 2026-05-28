import { type QueryClient, skipToken } from '@tanstack/react-query'
import { priceKeys } from '@universe/prices/src/queries/priceKeys'
import { REST_POLL_INTERVAL_MS, STALE_PRICE_THRESHOLD_MS } from '@universe/prices/src/sources/rest/constants'
import type { RestPriceBatcher } from '@universe/prices/src/sources/rest/RestPriceBatcher'
import type { TokenPriceData } from '@universe/prices/src/types'
import { persistableQueryOptions } from 'utilities/src/reactQuery/persistableQueryOptions'

export interface TokenPriceQueryOptionsParams {
  chainId: number
  address: string
  restBatcher?: RestPriceBatcher
  queryClient?: QueryClient
  getIsWsConnected?: () => boolean
}

/** Returns true when cached price data exists and is recent enough
 *  that REST polling can be skipped. */
function isCachedPriceFresh(data: TokenPriceData | null | undefined): boolean {
  return !!data && Date.now() - data.timestamp <= STALE_PRICE_THRESHOLD_MS
}

// oxlint-disable-next-line typescript/explicit-function-return-type
export function tokenPriceQueryOptions({
  chainId,
  address,
  restBatcher,
  queryClient,
  getIsWsConnected,
}: TokenPriceQueryOptionsParams) {
  const key = priceKeys.token(chainId, address)
  return persistableQueryOptions<TokenPriceData | null>({
    queryKey: key,
    queryFn: restBatcher
      ? async (): Promise<TokenPriceData | null> => {
          // Skip the REST call entirely when the cache already holds a recent
          // WebSocket update. This avoids unnecessary network requests while WS
          // is actively delivering prices.
          const existing = queryClient?.getQueryData<TokenPriceData>(key)
          if (existing && Date.now() - existing.timestamp < REST_POLL_INTERVAL_MS) {
            return existing
          }

          const fresh = await restBatcher.fetch({ chainId, address: address.toLowerCase() })
          if (!fresh) {
            return null
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
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    structuralSharing: false,
    // Poll REST when WS is disconnected, or when WS is "connected" but
    // the cached price has gone stale (silent WS failure safety net).
    refetchInterval: restBatcher
      ? (query): number | false => {
          if (getIsWsConnected?.() && isCachedPriceFresh(query.state.data)) {
            return false
          }
          return REST_POLL_INTERVAL_MS
        }
      : false,
  })
}
