import { useApolloClient } from '@apollo/client'
import { useQueryClient } from '@tanstack/react-query'
import { useIsEarnEnabled } from 'uniswap/src/features/earn/hooks/useIsEarnEnabled'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { useActiveAddresses } from '~/features/accounts/store/hooks'
import { useHeartbeatCoordinator } from '~/lib/hooks/useHeartbeatCoordinator'
import { TDP_CHART_APOLLO_QUERY_NAMES } from '~/pages/TokenDetails/components/chart/hooks'
import { TDP_HEARTBEAT_INTERVAL_MS } from '~/pages/TokenDetails/hooks/tdpHeartbeatConstants'

type UseTDPHeartbeatCoordinatorParams = {
  tokenQueryRefetch: () => Promise<unknown>
  balancesRefetch: () => void
  incrementRefreshEpoch: () => void
  enabled: boolean
}

/**
 * Drives a single 60-second refresh loop for non-price TDP data: token stats, balances,
 * earn vaults/positions, and volume/TVL chart queries. All sources fire together so
 * AnimatedNumber animations can pulse in sync. Pauses when the tab is not visible.
 */
export function useTDPHeartbeatCoordinator({
  tokenQueryRefetch,
  balancesRefetch,
  incrementRefreshEpoch,
  enabled,
}: UseTDPHeartbeatCoordinatorParams): void {
  const apolloClient = useApolloClient()
  const queryClient = useQueryClient()
  const isEarnEnabled = useIsEarnEnabled()
  const { evmAddress } = useActiveAddresses()

  const refresh = async () => {
    const tasks: Promise<unknown>[] = [
      tokenQueryRefetch(),
      apolloClient.refetchQueries({ include: [...TDP_CHART_APOLLO_QUERY_NAMES] }),
    ]

    if (evmAddress) {
      tasks.push(
        Promise.resolve(balancesRefetch()),
        queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetWalletTokenProfitLoss] }),
      )
    }

    if (isEarnEnabled && evmAddress) {
      tasks.push(
        queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.DataApiService, 'listEarnVaults'] }),
        queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.DataApiService, 'listEarnPositions'] }),
      )
    }

    await Promise.allSettled(tasks)
    incrementRefreshEpoch()
  }

  useHeartbeatCoordinator({ refresh, intervalMs: TDP_HEARTBEAT_INTERVAL_MS, enabled })
}
