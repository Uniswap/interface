import { type QueryClient, queryOptions, skipToken } from '@tanstack/react-query'
import { priceKeys } from '@universe/prices/src/queries/priceKeys'
import { REST_POLL_INTERVAL_MS } from '@universe/prices/src/sources/rest/constants'
import type { RestPriceBatcher } from '@universe/prices/src/sources/rest/RestPriceBatcher'
import type { TokenPriceData } from '@universe/prices/src/types'

export interface TokenPriceQueryOptionsParams {
  chainId: number
  address: string
  restBatcher?: RestPriceBatcher
  queryClient?: QueryClient
}

// eslint-disable-next-line @typescript-eslint/explicit-function-return-type
export function tokenPriceQueryOptions({ chainId, address, restBatcher, queryClient }: TokenPriceQueryOptionsParams) {
  const key = priceKeys.token(chainId, address)
  return queryOptions<TokenPriceData | undefined>({
    queryKey: key,
    queryFn: restBatcher
      ? async (): Promise<TokenPriceData | undefined> => {
          const fresh = await restBatcher.fetch({ chainId, address: address.toLowerCase() })
          if (!fresh) {
            return fresh
          }
          // Guard against REST responses overwriting newer WebSocket data.
          // refetchInterval fires independently of staleTime, so without this
          // check a 30s-old REST response could clobber a sub-second WS update.
          const existing = queryClient?.getQueryData<TokenPriceData>(key)
          if (existing && existing.timestamp >= fresh.timestamp) {
            return existing
          }
          return fresh
        }
      : skipToken,
    staleTime: Infinity,
    refetchOnWindowFocus: false,
    refetchOnMount: false,
    structuralSharing: false,
    refetchInterval: restBatcher ? REST_POLL_INTERVAL_MS : false,
  })
}
