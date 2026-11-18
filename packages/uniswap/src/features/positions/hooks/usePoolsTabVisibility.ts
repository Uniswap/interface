import { Platform } from '@universe/chains'
import { PortfolioBalancePart } from 'uniswap/src/data/apiClients/dataApiService/balances/getWalletBalances/getWalletBalances'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioBalancePart } from 'uniswap/src/features/dataApi/balances/balancesRest'
import {
  POSITION_STATUS_FILTER_TO_STATUSES,
  PositionStatusFilterValue,
} from 'uniswap/src/features/positions/components/PositionStatusFilter'
import { SORT_BY_USD_VALUE_DESC, useWalletPositions } from 'uniswap/src/features/positions/hooks/useWalletPositions'

/**
 * Drives the home Pools tab (extension + mobile). Tab visibility uses the fast GetWalletBalances pools
 * count first, then the wallet positions list and its error state. includeHidden + all-statuses keep the tab reachable
 * regardless of the in-tab filter. `openPoolPositionsCount` counts only visible open positions —
 * hidden ones are intentionally excluded from the "view open positions" CTA.
 */
export function usePoolsTabVisibility(address: Address): {
  shouldShowPoolsTab: boolean
  openPoolPositionsCount: number
} {
  const { chains } = useEnabledChains()
  const { chains: evmChains } = useEnabledChains({ platform: Platform.EVM })

  const { data: poolsBalance } = usePortfolioBalancePart({
    part: PortfolioBalancePart.Pools,
    evmAddress: address,
    chainIds: chains,
    enabled: false,
  })
  const {
    positions: poolPositions,
    hiddenPositions: hiddenPoolPositions,
    error: poolsError,
  } = useWalletPositions({
    account: address,
    chainIds: evmChains,
    statuses: POSITION_STATUS_FILTER_TO_STATUSES[PositionStatusFilterValue.All],
    includeHidden: true,
    autoFetchAllPages: false,
    // Sort params are part of the query key; must match the Pools tab queries to share their cache entry.
    ...SORT_BY_USD_VALUE_DESC,
  })

  const shouldShowPoolsTab =
    (poolsBalance?.count ?? 0) > 0 || poolPositions.length > 0 || hiddenPoolPositions.length > 0 || !!poolsError
  const openPoolPositionsCount = poolPositions.filter((position) =>
    POSITION_STATUS_FILTER_TO_STATUSES[PositionStatusFilterValue.Open].includes(position.status),
  ).length

  return { shouldShowPoolsTab, openPoolPositionsCount }
}
