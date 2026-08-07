import { queryOptions, skipToken, useQuery, useQueryClient } from '@tanstack/react-query'
import { usePricesContext } from '@universe/prices/src/context/PriceServiceContext'
import { priceKeys } from '@universe/prices/src/queries/priceKeys'
import { tokenPriceQueryOptions } from '@universe/prices/src/queries/tokenPriceQueryOptions'
import type { PoolPriceRoute, TokenPriceData } from '@universe/prices/src/types'
import { useEffect } from 'react'

interface UsePriceOptions {
  chainId: number | undefined
  address: string | undefined
  live?: boolean
  /**
   * Realtime pool room serving this token's spot price (pool_price channel);
   * absent = token-keyed channels. Injected by the app — which pool represents
   * a token is app knowledge.
   */
  poolRoute?: PoolPriceRoute
}

/**
 * Hook to get the live price for a token along with its loading status.
 * Reads from React Query cache and auto-subscribes via websocket.
 * Falls back to REST polling when WS data goes stale (if restBatcher is provided).
 *
 * Requires a PriceServiceProvider in the tree.
 */
export function usePrice(options: UsePriceOptions): { price: number | undefined; isLoading: boolean } {
  const { chainId, address, live = true, poolRoute } = options
  const { wsClient, restBatcher } = usePricesContext()
  const queryClient = useQueryClient()

  const enabled = chainId !== undefined && !!address

  const getIsWsConnected = wsClient ? wsClient.isConnected.bind(wsClient) : () => false

  // Data is populated externally via queryClient.setQueryData from WS messages.
  // When restBatcher is provided and WS is disconnected, queryFn fires as a
  // fallback. When WS is connected, refetchInterval is disabled to avoid
  // redundant REST calls.
  const { data, isPending } = useQuery(
    enabled
      ? tokenPriceQueryOptions({ chainId, address, restBatcher, queryClient, getIsWsConnected })
      : queryOptions<TokenPriceData | null>({ queryKey: priceKeys.all, queryFn: skipToken, enabled: false }),
  )

  // Route fields (not the object identity) drive the effect so a stable route
  // doesn't churn subscriptions, while a route appearing upgrades in place.
  const routeProtocolVersion = poolRoute?.protocolVersion
  const routePoolId = poolRoute?.poolId
  useEffect(() => {
    if (!enabled || !live || !wsClient) {
      return undefined
    }
    const route =
      routeProtocolVersion && routePoolId ? { protocolVersion: routeProtocolVersion, poolId: routePoolId } : undefined
    return wsClient.subscribe({
      channel: 'token_price',
      params: { chainId, tokenAddress: address.toLowerCase(), poolRoute: route },
    })
  }, [enabled, live, chainId, address, wsClient, routeProtocolVersion, routePoolId])

  const price: number | undefined = enabled ? (data?.price ?? undefined) : undefined
  // Use isPending rather than React Query's isLoading (isPending && isFetching): in the
  // WS-only configuration (skipToken queryFn, no REST fetch) isFetching is never true, so
  // isLoading would stay false while waiting for the first WS message. isPending correctly
  // reports "no data yet" until the first WS/REST update settles the cache.
  return { price, isLoading: enabled && isPending }
}
