import { useQueryClient } from '@tanstack/react-query'
import { SynchronizedHeartbeatsConfigKey } from '@universe/gating'
import { WALLET_POSITIONS_QUERY_KEY_PREFIX } from 'uniswap/src/data/apiClients/liquidityService/queryKeys'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { PortfolioTab } from '~/hooks/usePortfolioRoutes/types'
import { useHeartbeatCoordinator } from '~/lib/hooks/useHeartbeatCoordinator'
import { usePortfolioAddresses } from '~/pages/Portfolio/hooks/usePortfolioAddresses'
import { useShowDemoView } from '~/pages/Portfolio/hooks/useShowDemoView'

type UsePortfolioHeartbeatEnabledParams = {
  tab: PortfolioTab
  poolsEnabled?: boolean
}

/**
 * Whether the portfolio heartbeat will actually refresh `tab`'s data. Shared by the coordinator
 * itself and by pages that must disable their own overlapping self-poll, so the two can't drift
 * apart the way separately-derived `enabled` conditions can.
 */
export function usePortfolioHeartbeatEnabled({ tab, poolsEnabled }: UsePortfolioHeartbeatEnabledParams): boolean {
  const showDemoView = useShowDemoView()
  const portfolioAddresses = usePortfolioAddresses()
  const isConnected = !showDemoView && !!(portfolioAddresses.evmAddress || portfolioAddresses.svmAddress)
  // The Pools tab's refresh is a no-op unless poolsEnabled; every other tab always has data to refresh.
  const tabHasData = tab !== PortfolioTab.Pools || Boolean(poolsEnabled)
  return isConnected && tabHasData
}

type UsePortfolioHeartbeatCoordinatorParams = {
  tab: PortfolioTab
  poolsEnabled?: boolean
}

/**
 * Drives the portfolio refresh loop at the configured cadence, refetching only the queries
 * rendered by the active tab. When disabled, the standalone PortfolioBalance poll takes over.
 */
export function usePortfolioHeartbeatCoordinator({ tab, poolsEnabled }: UsePortfolioHeartbeatCoordinatorParams): void {
  const queryClient = useQueryClient()
  const enabled = usePortfolioHeartbeatEnabled({ tab, poolsEnabled })

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
        )
        if (poolsEnabled) {
          tasks.push(queryClient.refetchQueries({ queryKey: WALLET_POSITIONS_QUERY_KEY_PREFIX, type: 'active' }))
        }
        break
      case PortfolioTab.Tokens:
        tasks.push(
          queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetWalletBalances], type: 'active' }),
          queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetPortfolio], type: 'active' }),
          queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetWalletTokensProfitLoss], type: 'active' }),
        )
        break
      case PortfolioTab.Pools:
        if (poolsEnabled) {
          tasks.push(
            queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetWalletBalances], type: 'active' }),
            queryClient.refetchQueries({ queryKey: WALLET_POSITIONS_QUERY_KEY_PREFIX, type: 'active' }),
          )
        }
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
