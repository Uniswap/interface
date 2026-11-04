import { useQueryClient } from '@tanstack/react-query'
import { SynchronizedHeartbeatsConfigKey } from '@universe/gating'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { useActiveAddresses } from '~/connection/accounts/hooks'
import { useHeartbeatCoordinator } from '~/lib/hooks/useHeartbeatCoordinator'

/** V2 REST queries carrying the spot price and chart line, refetched on every price tick. */
const TDP_PRICE_DATA_API_QUERY_NAMES = ['getTokenMultiChain', 'getTokenHistoryPrice', 'getTokenHistoryOHLC']

type UseTDPHeartbeatCoordinatorParams = {
  tokenQueryRefetch: () => Promise<unknown>
  balancesRefetch: () => void
  incrementRefreshEpoch: () => void
  enabled: boolean
}

/**
 * Drives the TDP refresh loops: a 30s REST price tick plus a config-cadence full tick for
 * non-price data, fired in sync.
 */
export function useTDPHeartbeatCoordinator({
  tokenQueryRefetch,
  balancesRefetch,
  incrementRefreshEpoch,
  enabled,
}: UseTDPHeartbeatCoordinatorParams): void {
  const queryClient = useQueryClient()
  const { evmAddress, svmAddress } = useActiveAddresses()

  const priceRefresh = async (): Promise<unknown> => {
    // type: 'active' — the 30s cadence must not fan out to cached-but-unmounted token variants
    return Promise.allSettled(
      TDP_PRICE_DATA_API_QUERY_NAMES.map((name) =>
        queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.DataApiService, name], type: 'active' }),
      ),
    )
  }

  const refresh = async (): Promise<void> => {
    const tasks: Promise<unknown>[] = [tokenQueryRefetch()]

    // Balances and PnL support both platforms; earn is EVM-only
    if (evmAddress || svmAddress) {
      tasks.push(
        Promise.resolve(balancesRefetch()),
        queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetWalletTokenProfitLoss], type: 'active' }),
      )
    }

    if (evmAddress) {
      tasks.push(
        queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.DataApiService, 'listEarnVaults'], type: 'active' }),
        queryClient.refetchQueries({
          queryKey: [ReactQueryCacheKey.DataApiService, 'listEarnPositions'],
          type: 'active',
        }),
      )
    }

    await Promise.allSettled(tasks)
    incrementRefreshEpoch()
  }

  useHeartbeatCoordinator({
    refresh,
    priceRefresh,
    configKey: SynchronizedHeartbeatsConfigKey.TdpPollIntervalSeconds,
    enabled,
  })
}
