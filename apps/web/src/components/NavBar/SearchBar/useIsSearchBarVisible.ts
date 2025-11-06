import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMedia } from 'ui/src'

export function useIsSearchBarVisible() {
  const media = useMedia()
  const portfolioPageEnabled = useFeatureFlag(FeatureFlags.PortfolioPage)
  return portfolioPageEnabled ? !media.xxl : !media.xl
}
