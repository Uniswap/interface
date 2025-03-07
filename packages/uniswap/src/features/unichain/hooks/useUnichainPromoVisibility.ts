import { useRef } from 'react'
import { useSelector } from 'react-redux'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import {
  selectHasDismissedUnichainColdBanner,
  selectHasDismissedUnichainWarmBanner,
} from 'uniswap/src/features/behaviorHistory/selectors'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSortedPortfolioBalances } from 'uniswap/src/features/dataApi/balances'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { selectIsTestnetModeEnabled } from 'uniswap/src/features/settings/selectors'

export function useUnichainPromoVisibility(): {
  shouldShowUnichainBannerCold: boolean
  shouldShowUnichainBannerWarm: boolean
} {
  const { account } = useUniswapContext()
  const { data: sortedBalancesData, loading } = useSortedPortfolioBalances({
    address: account?.address,
    // Not needed often given usage, and will get updated from other sources
    pollInterval: PollingInterval.Slow,
  })
  const unichainEnabled = useFeatureFlag(FeatureFlags.Unichain)
  const unichainPromoEnabled = useFeatureFlag(FeatureFlags.UnichainPromo)
  const hasDismissedUnichainColdBanner = useSelector(selectHasDismissedUnichainColdBanner)
  const hasDismissedUnichainWarmBanner = useSelector(selectHasDismissedUnichainWarmBanner)
  const isTestnetModeEnabled = useSelector(selectIsTestnetModeEnabled)

  const hasLoadedRef = useRef(false)
  hasLoadedRef.current = hasLoadedRef.current || (!loading && !!sortedBalancesData)

  // Don't show promotion if:
  // - unichain isn't enabled
  // - the feature flag is off
  // - data hasn't loaded at least once
  // - testnet mode is on
  if (!unichainEnabled || !unichainPromoEnabled || !hasLoadedRef.current || isTestnetModeEnabled) {
    return {
      shouldShowUnichainBannerCold: false,
      shouldShowUnichainBannerWarm: false,
    }
  }

  const unichainVisibleBalances =
    sortedBalancesData?.balances.filter((b) => b.currencyInfo.currency.chainId === UniverseChainId.Unichain) ?? []
  const hasUnichainEth = unichainVisibleBalances.some((b) => b.currencyInfo.currency.isNative)
  const hasUnichainTokens = unichainVisibleBalances.some((b) => b.currencyInfo.currency.isToken)
  const hasUnichainBalance = hasUnichainEth || hasUnichainTokens

  return {
    shouldShowUnichainBannerCold: !hasDismissedUnichainColdBanner && !hasUnichainBalance,
    shouldShowUnichainBannerWarm: !hasDismissedUnichainWarmBanner && hasUnichainEth && !hasUnichainTokens,
  }
}
