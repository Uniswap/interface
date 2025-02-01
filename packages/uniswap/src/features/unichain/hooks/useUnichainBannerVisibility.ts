import { useSelector } from 'react-redux'
import { PollingInterval } from 'uniswap/src/constants/misc'
import { useUniswapContext } from 'uniswap/src/contexts/UniswapContext'
import { selectHasDismissedUnichainColdBanner } from 'uniswap/src/features/behaviorHistory/selectors'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { useSortedPortfolioBalances } from 'uniswap/src/features/dataApi/balances'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export function useUnichainBannerVisibility(): {
  shouldShowUnichainBannerCold: boolean
  shouldShowUnichainBannerWarm: boolean
} {
  const { account } = useUniswapContext()
  const { data: sortedBalancesData } = useSortedPortfolioBalances({
    address: account?.address,
    // Not needed often given usage, and will get updated from other sources
    pollInterval: PollingInterval.Slow,
  })
  const unichainPromoEnabled = useFeatureFlag(FeatureFlags.UnichainPromo)
  const hasDismissedUnichainColdBanner = useSelector(selectHasDismissedUnichainColdBanner)

  const unichainVisibleBalances =
    sortedBalancesData?.balances.filter((b) => b.currencyInfo.currency.chainId === UniverseChainId.Unichain) ?? []
  const hasUnichainEth = unichainVisibleBalances.some((b) => b.currencyInfo.currency.isNative)
  const hasUnichainTokens = unichainVisibleBalances.some((b) => b.currencyInfo.currency.isToken)
  const hasUnichainBalance = hasUnichainEth || hasUnichainTokens

  return {
    shouldShowUnichainBannerCold: unichainPromoEnabled && !hasDismissedUnichainColdBanner && !hasUnichainBalance,
    shouldShowUnichainBannerWarm: unichainPromoEnabled && hasUnichainEth && !hasUnichainTokens,
  }
}
