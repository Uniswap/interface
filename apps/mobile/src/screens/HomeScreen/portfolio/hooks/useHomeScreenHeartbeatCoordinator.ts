import { useQueryClient } from '@tanstack/react-query'
import { NFT_QUERY_KEY_PREFIX } from '@universe/data-api'
import { HomeTab } from 'src/screens/HomeScreen/portfolio/types'
import { useHeartbeatCoordinator } from 'src/utils/useHeartbeatCoordinator'
import { WALLET_POSITIONS_QUERY_KEY_PREFIX } from 'uniswap/src/data/apiClients/liquidityService/queryKeys'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'

/**
 * Drives synchronized refresh loops for the Home portfolio header + tabs: wallet balances on
 * the 60s full tick only, the Tokens tab balance list on both ticks (30s) while that tab is
 * active, and positions/NFTs on the full tick while their tab is active. The portfolio value
 * chart is intentionally not on the tick — the Zerion-backed queries here are scoped to the
 * active tab and kept at a conservative cadence to limit call volume.
 */
export function useHomeScreenHeartbeatCoordinator({ activeTab }: { activeTab: HomeTab | undefined }): void {
  const queryClient = useQueryClient()

  const priceRefresh = async (): Promise<void> => {
    if (activeTab === HomeTab.Tokens) {
      await queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetPortfolio], type: 'active' })
    }
  }

  const refresh = async (): Promise<void> => {
    const tasks: Promise<unknown>[] = [
      queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetWalletBalances], type: 'active' }),
    ]

    if (activeTab === HomeTab.Tokens) {
      tasks.push(queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetPortfolio], type: 'active' }))
    }

    if (activeTab === HomeTab.Pools) {
      tasks.push(queryClient.refetchQueries({ queryKey: WALLET_POSITIONS_QUERY_KEY_PREFIX, type: 'active' }))
    }

    if (activeTab === HomeTab.NFTs) {
      tasks.push(queryClient.refetchQueries({ queryKey: NFT_QUERY_KEY_PREFIX, type: 'active' }))
    }

    await Promise.allSettled(tasks)
  }

  useHeartbeatCoordinator({ refresh, priceRefresh })
}
