import { useMedia } from 'ui/src'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'

export function useIsSearchBarVisible() {
  const media = useMedia()
  const portfolioPageEnabled = useFeatureFlag(FeatureFlags.PortfolioPage)
  return portfolioPageEnabled ? !media.xxl : !media.xl
}
