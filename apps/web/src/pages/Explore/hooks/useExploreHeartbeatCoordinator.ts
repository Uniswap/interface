import { useQueryClient, type InfiniteData, type Query } from '@tanstack/react-query'
import { GET_PROTOCOL_STATS_QUERY_KEY_PREFIX } from 'uniswap/src/data/apiClients/dataApiService/explore/useGetProtocolStatsQuery'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { useFixedIntervalHeartbeatCoordinator } from '~/lib/hooks/useHeartbeatCoordinator'
import { ExploreTab } from '~/types/explore'

// Explore polls on a fixed cadence — not driven by the synchronized_heartbeats config.
const EXPLORE_POLL_INTERVAL_SECONDS = 60

// Refetching an infinite query re-fetches every loaded page sequentially, so one pass costs
// pages × RTT. Deep enough, a pass outlasts the poll interval — each tick then cancels and
// restarts the cascade from page 1, so data never commits while requests fire non-stop. A tick
// only buys freshness at the head of the list anyway, so skip queries scrolled past this depth.
const MAX_HEARTBEAT_REFETCH_PAGES = 5

export function isShallowInfiniteQuery(query: Query): boolean {
  const pages = (query.state.data as InfiniteData<unknown> | undefined)?.pages
  return !Array.isArray(pages) || pages.length <= MAX_HEARTBEAT_REFETCH_PAGES
}

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

  const refetchShallowInfiniteQueries = (queryKey: readonly unknown[]): Promise<unknown> =>
    queryClient.refetchQueries(
      { queryKey, type: 'active', predicate: isShallowInfiniteQuery },
      // Cancelling an in-flight fetchNextPage makes the user's load-more complete with zero row
      // growth, which permanently latches the table's infinite scroll — never cancel.
      { cancelRefetch: false },
    )

  const refresh = async (): Promise<void> => {
    const tasks: Promise<unknown>[] = [
      // Stats section is always visible — refresh protocol stats on every tick
      queryClient.refetchQueries({ queryKey: [...GET_PROTOCOL_STATS_QUERY_KEY_PREFIX], type: 'active' }),
    ]

    switch (tab) {
      case ExploreTab.Tokens:
        tasks.push(refetchShallowInfiniteQueries([ReactQueryCacheKey.TopTokens]))
        break
      case ExploreTab.Pools:
        tasks.push(refetchShallowInfiniteQueries([ReactQueryCacheKey.DataApiService, 'listPools']))
        break
      case ExploreTab.Transactions:
        tasks.push(refetchShallowInfiniteQueries([ReactQueryCacheKey.DataApiService, 'listTransactions']))
        break
      case ExploreTab.Toucan:
        break
    }

    await Promise.allSettled(tasks)
  }

  useFixedIntervalHeartbeatCoordinator({ refresh, pollIntervalSeconds: EXPLORE_POLL_INTERVAL_SECONDS, enabled })
}
