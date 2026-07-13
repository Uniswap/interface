import { useQueryClient } from '@tanstack/react-query'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { useHeartbeatCoordinator } from '~/lib/hooks/useHeartbeatCoordinator'
import { PortfolioTab } from '~/pages/Portfolio/types'

type UsePortfolioHeartbeatCoordinatorParams = {
  tab: PortfolioTab
  enabled: boolean
  poolsEnabled?: boolean
}

/**
 * Drives a single 30-second refresh loop for portfolio data, scoped to the active tab.
 * Only the queries rendered by the current tab are refetched — e.g. chart data on Overview,
 * P&L on Tokens, positions on Pools, transactions on Activity. NFTs self-poll; Defi is a
 * stub with no live data. Pauses when the browser tab is not visible.
 * Pools tab refetches are additionally gated on poolsEnabled (PortfolioPoolsBalances flag).
 */
export function usePortfolioHeartbeatCoordinator({
  tab,
  enabled,
  poolsEnabled,
}: UsePortfolioHeartbeatCoordinatorParams): void {
  const queryClient = useQueryClient()

  const refresh = async () => {
    const tasks: Promise<unknown>[] = []

    switch (tab) {
      case PortfolioTab.Overview:
        tasks.push(
          queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetWalletBalances] }),
          queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetPortfolio] }),
          queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetPortfolioChart] }),
          queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetWalletTokensProfitLoss] }),
          queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.ListTransactions] }),
        )
        if (poolsEnabled) {
          tasks.push(queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.ListPositions] }))
        }
        break
      case PortfolioTab.Tokens:
        tasks.push(
          queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetWalletBalances] }),
          queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetPortfolio] }),
          queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetWalletTokensProfitLoss] }),
        )
        break
      case PortfolioTab.Pools:
        if (poolsEnabled) {
          tasks.push(
            queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetWalletBalances] }),
            queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.ListPositions] }),
          )
        }
        break
      case PortfolioTab.Activity:
        tasks.push(queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.ListTransactions] }))
        break
      case PortfolioTab.Nfts:
      case PortfolioTab.Defi:
        // NFTs self-poll via their own polling interval; Defi is a Coming Soon stub
        break
    }

    await Promise.allSettled(tasks)
  }

  useHeartbeatCoordinator({ refresh, intervalMs: PollingInterval.KindaFast, enabled })
}
