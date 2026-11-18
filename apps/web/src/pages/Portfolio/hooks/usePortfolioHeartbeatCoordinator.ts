import { useQueryClient } from '@tanstack/react-query'
import { SynchronizedHeartbeatsConfigKey } from '@universe/gating'
import { WALLET_POSITIONS_QUERY_KEY_PREFIX } from 'uniswap/src/data/apiClients/liquidityService/queryKeys'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { PortfolioTab } from '~/hooks/usePortfolioRoutes/types'
import { useHeartbeatCoordinator } from '~/lib/hooks/useHeartbeatCoordinator'
import { usePortfolioAddresses } from '~/pages/Portfolio/hooks/usePortfolioAddresses'
import { useShowDemoView } from '~/pages/Portfolio/hooks/useShowDemoView'

/**
 * Whether the portfolio heartbeat is running. Shared by the coordinator itself and by pages that must
 * disable their own overlapping self-poll, so the two can't drift apart the way separately-derived
 * `enabled` conditions can.
 */
export function usePortfolioHeartbeatEnabled(): boolean {
  const showDemoView = useShowDemoView()
  const portfolioAddresses = usePortfolioAddresses()
  return !showDemoView && !!(portfolioAddresses.evmAddress || portfolioAddresses.svmAddress)
}

type UsePortfolioHeartbeatCoordinatorParams = {
  tab: PortfolioTab
}

/**
 * Drives the portfolio refresh loop at the configured cadence, refetching only the queries
 * rendered by the active tab. When disabled, the standalone PortfolioBalance poll takes over.
 */
export function usePortfolioHeartbeatCoordinator({ tab }: UsePortfolioHeartbeatCoordinatorParams): void {
  const queryClient = useQueryClient()
  const enabled = usePortfolioHeartbeatEnabled()

  const refresh = async (): Promise<void> => {
    const tasks: Promise<unknown>[] = []

    switch (tab) {
      case PortfolioTab.Overview:
        tasks.push(
          queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetWalletBalances], type: 'active' }),
          queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetPortfolio], type: 'active' }),
          queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetPortfolioChart], type: 'active' }),
          queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetWalletTokensProfitLoss], type: 'active' }),
          queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.ListTransactions], type: 'active' }),
          queryClient.refetchQueries({ queryKey: WALLET_POSITIONS_QUERY_KEY_PREFIX, type: 'active' }),
        )
        break
      case PortfolioTab.Tokens:
        tasks.push(
          queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetWalletBalances], type: 'active' }),
          queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetPortfolio], type: 'active' }),
          queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetWalletTokensProfitLoss], type: 'active' }),
        )
        break
      case PortfolioTab.Pools:
        tasks.push(
          queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetWalletBalances], type: 'active' }),
          queryClient.refetchQueries({ queryKey: WALLET_POSITIONS_QUERY_KEY_PREFIX, type: 'active' }),
        )
        break
      case PortfolioTab.Activity:
        tasks.push(queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.ListTransactions], type: 'active' }))
        break
      case PortfolioTab.Nfts:
      case PortfolioTab.Defi:
        // NFTs self-poll via their own polling interval; Defi is a Coming Soon stub
        break
    }

    await Promise.allSettled(tasks)
  }

  useHeartbeatCoordinator({ refresh, configKey: SynchronizedHeartbeatsConfigKey.PortfolioPollIntervalSeconds, enabled })
}
