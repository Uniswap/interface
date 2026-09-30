import { useIsFocused } from '@react-navigation/native'
import { useQueryClient } from '@tanstack/react-query'
import { refetchGatedFeatures } from '@universe/compliance'
import { useHeartbeatCoordinator } from 'src/utils/useHeartbeatCoordinator'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

/** V2 REST queries carrying the multichain spot price and chart line */
const TDP_PRICE_DATA_API_QUERY_NAMES = ['getTokenMultiChain', 'getTokenHistoryPrice']

/**
 * Drives synchronized refresh loops for TDP data: a 60-second full refresh covering price
 * history and earn vaults/positions, plus regional availability for RWA pages.
 * A 30-second price-only refresh of the REST price queries runs in between so the header/spot
 * price doesn't lag behind the full tick.
 * Zerion-backed queries (balances/GetPortfolio) are intentionally not on the tick, to limit
 * Zerion call volume.
 * On the full tick, price refetches only after everything else has settled — each query
 * updates its own React Query consumers as soon as its own network response lands,
 * so racing them concurrently made the header price animate at a slightly different moment
 * each cycle depending on which request happened to finish first. Fetching price last makes
 * its update land at a consistent point in the tick instead.
 * Only the focused TDP ticks: TDP→TDP navigation pushes new instances that all stay mounted,
 * and `queryClient.refetchQueries` is client-global, so N unfocused coordinators would each
 * refetch all N screens' queries every tick. While another TDP is focused, its global refetch
 * keeps the unfocused screens' queries fresh; when focus was on a non-TDP screen nothing ticks,
 * so the coordinator fires an immediate full refresh on focus regain to cover pop-back.
 */
export function useMobileTDPHeartbeatCoordinator(isRWA: boolean): void {
  const queryClient = useQueryClient()
  const activeAddress = useActiveAccountAddress()
  const isFocused = useIsFocused()

  const priceRefresh = async (): Promise<void> => {
    // type: 'active' — the 30s cadence must not fan out to cached-but-unmounted token variants
    await Promise.allSettled(
      TDP_PRICE_DATA_API_QUERY_NAMES.map((name) =>
        queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.DataApiService, name], type: 'active' }),
      ),
    )
  }

  const refresh = async (): Promise<void> => {
    const otherTasks: Promise<unknown>[] = []

    if (isRWA) {
      otherTasks.push(refetchGatedFeatures(queryClient))
    }

    if (activeAddress) {
      otherTasks.push(
        queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.DataApiService, 'listEarnVaults'], type: 'active' }),
        queryClient.refetchQueries({
          queryKey: [ReactQueryCacheKey.DataApiService, 'listEarnPositions'],
          type: 'active',
        }),
      )
    }

    // Wait for everything else first, then refresh price last so its animation always
    // fires at the same point in the tick instead of racing the other requests.
    await Promise.allSettled(otherTasks)
    await priceRefresh()
  }

  useHeartbeatCoordinator({ refresh, priceRefresh, enabled: isFocused })
}
