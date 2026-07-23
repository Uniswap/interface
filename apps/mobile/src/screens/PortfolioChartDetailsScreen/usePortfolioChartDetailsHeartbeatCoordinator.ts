import { useQueryClient } from '@tanstack/react-query'
import { useHeartbeatCoordinator } from 'src/utils/useHeartbeatCoordinator'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

/**
 * Drives synchronized refresh loops for the portfolio chart/PnL screen: a 60-second full
 * refresh covering the value chart and PnL, plus a 30-second price-only refresh of wallet
 * balances in between (balances carry the USD valuations users watch most closely).
 */
export function usePortfolioChartDetailsHeartbeatCoordinator({ enabled }: { enabled: boolean }): void {
  const queryClient = useQueryClient()

  const priceRefresh = async (): Promise<void> => {
    await queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetWalletBalances] })
  }

  const refresh = async (): Promise<void> => {
    await Promise.allSettled([
      queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetWalletBalances] }),
      queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetPortfolioChart] }),
      queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetWalletProfitLoss] }),
    ])
  }

  useHeartbeatCoordinator({ refresh, priceRefresh, enabled })
}
