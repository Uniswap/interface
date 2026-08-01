import { useApolloClient } from '@apollo/client'
import { useQueryClient } from '@tanstack/react-query'
import { GQLQueries } from '@universe/api'
import { HomeTab } from 'src/screens/HomeScreen/portfolio/types'
import { useHeartbeatCoordinator } from 'src/utils/useHeartbeatCoordinator'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

/**
 * Drives synchronized refresh loops for the Home portfolio header + tabs: a 60-second full
 * refresh covering wallet balances and the portfolio value chart (always visible above the
 * tabs), plus a 30-second price-only refresh of wallet balances in between. Tab-specific data
 * only refreshes while its tab is active — the Tokens tab's balance list on both ticks, and
 * positions/NFTs only on the full tick — matching web's Portfolio heartbeat. Every query in a
 * tick fires concurrently so they land as close together as possible.
 */
export function useHomeScreenHeartbeatCoordinator({
  enabled,
  activeTab,
}: {
  enabled: boolean
  activeTab: HomeTab | undefined
}): void {
  const queryClient = useQueryClient()
  const apollo = useApolloClient()

  const priceRefresh = async (): Promise<void> => {
    const tasks: Promise<unknown>[] = [queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetWalletBalances] })]

    if (activeTab === HomeTab.Tokens) {
      tasks.push(queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetPortfolio] }))
    }

    await Promise.allSettled(tasks)
  }

  const refresh = async (): Promise<void> => {
    const tasks: Promise<unknown>[] = [
      queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetWalletBalances] }),
      queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetPortfolioChart] }),
    ]

    if (activeTab === HomeTab.Tokens) {
      tasks.push(queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetPortfolio] }))
    }

    if (activeTab === HomeTab.Pools) {
      tasks.push(queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.ListPositions] }))
    }

    if (activeTab === HomeTab.NFTs) {
      tasks.push(apollo.refetchQueries({ include: [GQLQueries.NftsTab] }))
    }

    await Promise.allSettled(tasks)
  }

  useHeartbeatCoordinator({ refresh, priceRefresh, enabled })
}
