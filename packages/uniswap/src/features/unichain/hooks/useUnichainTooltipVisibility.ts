import { useSelector } from 'react-redux'
import {
  selectHasSeenUnichainPromotionBridgingTooltip,
  selectHasSeenUnichainPromotionNetworkSelectorTooltip,
} from 'uniswap/src/features/behaviorHistory/selectors'
import { FeatureFlags } from 'uniswap/src/features/gating/flags'
import { useFeatureFlag } from 'uniswap/src/features/gating/hooks'
import { selectIsTestnetModeEnabled } from 'uniswap/src/features/settings/selectors'

export function useUnichainTooltipVisibility(): {
  shouldShowUnichainNetworkSelectorTooltip: boolean
  shouldShowUnichainBridgingTooltip: boolean
} {
  const unichainEnabled = useFeatureFlag(FeatureFlags.Unichain)
  const unichainPromoEnabled = useFeatureFlag(FeatureFlags.UnichainPromo)
  const hasSeenUnichainPromotionNetworkSelectorTooltip = useSelector(
    selectHasSeenUnichainPromotionNetworkSelectorTooltip,
  )
  const hasSeenUnichainPromotionBridgingTooltip = useSelector(selectHasSeenUnichainPromotionBridgingTooltip)
  const isTestnetModeEnabled = useSelector(selectIsTestnetModeEnabled)

  // Don't show promotion if:
  // - unichain isn't enabled
  // - the feature flag is off
  // - testnet mode is on
  if (!unichainEnabled || !unichainPromoEnabled || isTestnetModeEnabled) {
    return {
      shouldShowUnichainNetworkSelectorTooltip: false,
      shouldShowUnichainBridgingTooltip: false,
    }
  }

  return {
    shouldShowUnichainNetworkSelectorTooltip: !hasSeenUnichainPromotionNetworkSelectorTooltip,
    shouldShowUnichainBridgingTooltip: !hasSeenUnichainPromotionBridgingTooltip,
  }
}
