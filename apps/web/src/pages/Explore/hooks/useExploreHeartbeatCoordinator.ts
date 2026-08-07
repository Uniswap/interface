import { useApolloClient } from '@apollo/client'
import { useQueryClient } from '@tanstack/react-query'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { EXPLORE_TRANSACTIONS_APOLLO_QUERY_NAMES } from '~/data/useAllTransactions'
import { useFixedIntervalHeartbeatCoordinator } from '~/lib/hooks/useHeartbeatCoordinator'
import { ExploreTab } from '~/types/explore'

// Explore polls on a fixed cadence — not driven by the synchronized_heartbeats config.
const EXPLORE_POLL_INTERVAL_SECONDS = 60

type UseExploreHeartbeatCoordinatorParams = {
  tab: ExploreTab
  enabled: boolean
}

/**
 * Drives the Explore refresh loop every minute: the always-visible stats section plus the active
 * tab's query.
 */
export function useExploreHeartbeatCoordinator({ tab, enabled }: UseExploreHeartbeatCoordinatorParams): void {
  const queryClient = useQueryClient()
  const apolloClient = useApolloClient()
  const isV2TransactionsEnabled = useFeatureFlag(FeatureFlags.V2EndpointsTransactions)

  const refresh = async (): Promise<void> => {
    const tasks: Promise<unknown>[] = [
      // Stats section is always visible — refresh ExploreStats + ProtocolStats on every tick
      queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.ExploreStatsService], type: 'active' }),
    ]

    switch (tab) {
      case ExploreTab.Tokens:
        tasks.push(queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.TopTokens], type: 'active' }))
        break
      case ExploreTab.Pools:
        tasks.push(
          queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.DataApiService, 'listTopPools'], type: 'active' }),
        )
        break
      case ExploreTab.Transactions:
        tasks.push(
          isV2TransactionsEnabled
            ? queryClient.refetchQueries({
                queryKey: [ReactQueryCacheKey.DataApiService, 'listTransactions'],
                type: 'active',
              })
            : apolloClient.refetchQueries({ include: [...EXPLORE_TRANSACTIONS_APOLLO_QUERY_NAMES] }),
        )
        break
      case ExploreTab.Toucan:
        break
    }

    await Promise.allSettled(tasks)
  }

  useFixedIntervalHeartbeatCoordinator({ refresh, pollIntervalSeconds: EXPLORE_POLL_INTERVAL_SECONDS, enabled })
}
