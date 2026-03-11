import { queryOptions, skipToken, useQuery, useQueryClient } from '@tanstack/react-query'
import { usePricesContext } from '@universe/prices/src/context/PriceServiceContext'
import { priceKeys } from '@universe/prices/src/queries/priceKeys'
import { tokenPriceQueryOptions } from '@universe/prices/src/queries/tokenPriceQueryOptions'
import type { TokenPriceData } from '@universe/prices/src/types'
import { useEffect } from 'react'

interface UsePriceOptions {
  chainId: number | undefined
  address: string | undefined
  live?: boolean
}

/**
 * Hook to get the live price for a token.
 * Reads from React Query cache and auto-subscribes via websocket.
 * Falls back to REST polling when WS data goes stale (if restBatcher is provided).
 *
 * Requires a PriceServiceProvider in the tree.
 */
export function usePrice(options: UsePriceOptions): number | undefined {
  const { chainId, address, live = true } = options
  const { wsClient, restBatcher } = usePricesContext()
  const queryClient = useQueryClient()

  const enabled = chainId !== undefined && !!address

  // Data is populated externally via queryClient.setQueryData from WS messages.
  // When restBatcher is provided, queryFn fires as a fallback when WS data goes stale.
  const { data } = useQuery(
    enabled
      ? tokenPriceQueryOptions({ chainId, address, restBatcher, queryClient })
      : queryOptions<TokenPriceData | undefined>({ queryKey: priceKeys.all, queryFn: skipToken, enabled: false }),
  )

  useEffect(() => {
    if (!enabled || !live) {
      return undefined
    }
    return wsClient.subscribe({
      channel: 'token_price',
      params: { chainId, tokenAddress: address.toLowerCase() },
    })
  }, [enabled, live, chainId, address, wsClient])

  const price: number | undefined = enabled ? (data?.price ?? undefined) : undefined
  return price
}
