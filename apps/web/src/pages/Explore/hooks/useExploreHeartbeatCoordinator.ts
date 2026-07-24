import { useApolloClient } from '@apollo/client'
import { useQueryClient } from '@tanstack/react-query'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { EXPLORE_TRANSACTIONS_APOLLO_QUERY_NAMES } from '~/appGraphql/data/useAllTransactions'
import { useHeartbeatCoordinator } from '~/lib/hooks/useHeartbeatCoordinator'
import { ExploreTab } from '~/types/explore'

type UseExploreHeartbeatCoordinatorParams = {
  tab: ExploreTab
  enabled: boolean
}

/**
 * Drives a single 30-second refresh loop for Explore page data, scoped to the active tab.
 * The stats section (TVL + volume) is always refreshed. Tab-specific queries only fire when
 * that tab is active — top tokens on Tokens, top pools on Pools, transactions on Transactions.
 * Pauses when the browser tab is not visible.
 */
export function useExploreHeartbeatCoordinator({ tab, enabled }: UseExploreHeartbeatCoordinatorParams): void {
  const queryClient = useQueryClient()
  const apolloClient = useApolloClient()

  const refresh = async () => {
    const tasks: Promise<unknown>[] = [
      // Stats section is always visible — refresh ExploreStats + ProtocolStats on every tick
      queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.ExploreStatsService] }),
    ]

    switch (tab) {
      case ExploreTab.Tokens:
        tasks.push(queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.TopTokens] }))
        break
      case ExploreTab.Pools:
        tasks.push(queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.DataApiService, 'listTopPools'] }))
        break
      case ExploreTab.Transactions:
        tasks.push(apolloClient.refetchQueries({ include: [...EXPLORE_TRANSACTIONS_APOLLO_QUERY_NAMES] }))
        break
      case ExploreTab.Toucan:
        break
    }

    await Promise.allSettled(tasks)
  }

  useHeartbeatCoordinator({ refresh, intervalMs: PollingInterval.KindaFast, enabled })
}
