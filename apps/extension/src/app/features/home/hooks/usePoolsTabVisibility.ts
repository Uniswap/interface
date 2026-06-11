import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { PortfolioBalancePart } from 'uniswap/src/data/rest/getWalletBalances/getWalletBalances'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { usePortfolioBalancePart } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import {
  POSITION_STATUS_FILTER_TO_STATUSES,
  PositionStatusFilterValue,
} from 'uniswap/src/features/positions/components/PositionStatusFilter'
import { useWalletPositions } from 'uniswap/src/features/positions/hooks/useWalletPositions'

/**
 * Drives the extension Home Pools tab. Tab visibility uses the fast GetWalletBalances pools count
 * first, then ListPositions and its error state. includeHidden + all-statuses keep the tab reachable
 * regardless of the in-tab filter. `openPoolPositionsCount` counts only visible open positions —
 * hidden ones are intentionally excluded from the "view open positions" CTA.
 */
export function usePoolsTabVisibility(address: Address): {
  shouldShowPoolsTab: boolean
  openPoolPositionsCount: number
} {
  const { chains } = useEnabledChains()
  const { chains: evmChains } = useEnabledChains({ platform: Platform.EVM })
  const isPoolsBalancesEnabled = useFeatureFlag(FeatureFlags.PortfolioPoolsBalances)

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
    disabled: !isPoolsBalancesEnabled,
  })

  const shouldShowPoolsTab =
    isPoolsBalancesEnabled &&
    ((poolsBalance?.count ?? 0) > 0 || poolPositions.length > 0 || hiddenPoolPositions.length > 0 || !!poolsError)
  const openPoolPositionsCount = poolPositions.filter((position) =>
    POSITION_STATUS_FILTER_TO_STATUSES[PositionStatusFilterValue.Open].includes(position.status),
  ).length

  return { shouldShowPoolsTab, openPoolPositionsCount }
}
