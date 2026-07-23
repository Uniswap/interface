import { useApolloClient } from '@apollo/client'
import { useQueryClient } from '@tanstack/react-query'
import { GQLQueries } from '@universe/api'
import { useHeartbeatCoordinator } from 'src/utils/useHeartbeatCoordinator'
import { useIsEarnEnabled } from 'uniswap/src/features/earn/hooks/useIsEarnEnabled'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { useActiveAccountAddress } from 'wallet/src/features/wallet/hooks'

/**
 * Drives synchronized refresh loops for TDP data: a 60-second full refresh covering token
 * stats, price history, balances, and earn vaults/positions, plus a 30-second price-only
 * refresh of TokenPriceHistory in between so the header/spot price doesn't lag behind the
 * full tick.
 * On the full tick, price refetches only after everything else has settled — each query
 * updates its own Apollo/React Query consumers as soon as its own network response lands,
 * so racing them concurrently made the header price animate at a slightly different moment
 * each cycle depending on which request happened to finish first. Fetching price last makes
 * its update land at a consistent point in the tick instead.
 */
export function useMobileTDPHeartbeatCoordinator({ enabled }: { enabled: boolean }): void {
  const apollo = useApolloClient()
  const queryClient = useQueryClient()
  const isEarnEnabled = useIsEarnEnabled()
  const activeAddress = useActiveAccountAddress()

  const priceRefresh = async (): Promise<void> => {
    await apollo.refetchQueries({ include: [GQLQueries.TokenPriceHistory] })
  }

  const refresh = async (): Promise<void> => {
    const otherTasks: Promise<unknown>[] = [apollo.refetchQueries({ include: [GQLQueries.TokenDetailsScreen] })]

    if (activeAddress) {
      otherTasks.push(queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetPortfolio] }))
    }

    if (isEarnEnabled && activeAddress) {
      otherTasks.push(
        queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.DataApiService, 'listEarnVaults'] }),
        queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.DataApiService, 'listEarnPositions'] }),
      )
    }

    // Wait for everything else first, then refresh price last so its animation always
    // fires at the same point in the tick instead of racing the other requests.
    await Promise.allSettled(otherTasks)
    await apollo.refetchQueries({ include: [GQLQueries.TokenPriceHistory] })
  }

  useHeartbeatCoordinator({ refresh, priceRefresh, enabled })
}
