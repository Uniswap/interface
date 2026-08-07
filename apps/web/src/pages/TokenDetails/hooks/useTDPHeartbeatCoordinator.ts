import { useApolloClient } from '@apollo/client'
import { useQueryClient } from '@tanstack/react-query'
import { SynchronizedHeartbeatsConfigKey } from '@universe/gating'
import { useIsEarnEnabled } from 'uniswap/src/features/earn/hooks/useIsEarnEnabled'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { useActiveAddresses } from '~/features/accounts/store/hooks'
import { useHeartbeatCoordinator } from '~/lib/hooks/useHeartbeatCoordinator'
import { TDP_CHART_APOLLO_QUERY_NAMES } from '~/pages/TokenDetails/components/chart/hooks'

/** V2 REST queries carrying the spot price and chart line, refetched on every price tick. */
const TDP_PRICE_DATA_API_QUERY_NAMES = ['getToken', 'getTokenMultiChain', 'getTokenHistoryPrice', 'getTokenHistoryOHLC']

type UseTDPHeartbeatCoordinatorParams = {
  tokenQueryRefetch: () => Promise<unknown>
  balancesRefetch: () => void
  incrementRefreshEpoch: () => void
  enabled: boolean
  /** Effective V2-tokens decision from the TDP context (honors the Robinhood fallback), so the price tick refetches the same source the page renders. */
  isV2TokensEnabled: boolean
}

/**
 * Drives the TDP refresh loops: a 30s price tick (REST when V2 tokens is on, else the GQL
 * TokenPrice query) plus a config-cadence full tick for non-price data, fired in sync.
 */
export function useTDPHeartbeatCoordinator({
  tokenQueryRefetch,
  balancesRefetch,
  incrementRefreshEpoch,
  enabled,
  isV2TokensEnabled,
}: UseTDPHeartbeatCoordinatorParams): void {
  const apolloClient = useApolloClient()
  const queryClient = useQueryClient()
  const isEarnEnabled = useIsEarnEnabled()
  const { evmAddress, svmAddress } = useActiveAddresses()

  const priceRefresh = async (): Promise<unknown> => {
    if (!isV2TokensEnabled) {
      return apolloClient.refetchQueries({ include: ['TokenPrice'] })
    }
    // type: 'active' — the 30s cadence must not fan out to cached-but-unmounted token variants
    return Promise.allSettled(
      TDP_PRICE_DATA_API_QUERY_NAMES.map((name) =>
        queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.DataApiService, name], type: 'active' }),
      ),
    )
  }

  const refresh = async (): Promise<void> => {
    const tasks: Promise<unknown>[] = [
      tokenQueryRefetch(),
      apolloClient.refetchQueries({ include: [...TDP_CHART_APOLLO_QUERY_NAMES] }),
    ]

    // Balances and PnL support both platforms; earn is EVM-only
    if (evmAddress || svmAddress) {
      tasks.push(
        Promise.resolve(balancesRefetch()),
        queryClient.refetchQueries({ queryKey: [ReactQueryCacheKey.GetWalletTokenProfitLoss], type: 'active' }),
      )
    }

    if (isEarnEnabled && evmAddress) {
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
