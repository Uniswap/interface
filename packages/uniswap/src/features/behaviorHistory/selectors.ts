import { UniswapState } from 'uniswap/src/state/uniswapReducer'

export const selectHasViewedBridgingBanner = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.hasViewedBridgingBanner === true

export const selectHasDismissedBridgingWarning = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.hasDismissedBridgingWarning === true

export const selectHasDismissedLowNetworkTokenWarning = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.hasDismissedLowNetworkTokenWarning === true

export const selectHasDismissedUnichainColdBanner = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.unichainPromotion?.coldBannerDismissed === true

export const selectHasDismissedUnichainWarmBanner = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.unichainPromotion?.warmBannerDismissed === true

export const selectHasSeenUnichainPromotionNetworkSelectorAnimation = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.unichainPromotion?.networkSelectorAnimationSeen === true

export const selectHasSeenUnichainPromotionNetworkSelectorTooltip = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.unichainPromotion?.networkSelectorTooltipSeen === true

export const selectHasSeenUnichainPromotionBridgingTooltip = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.unichainPromotion?.bridgingTooltipSeen === true

export const selectHasSeenUnichainPromotionBridgingAnimation = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.unichainPromotion?.bridgingAnimationSeen === true

export const selectIsFirstUnichainBridgeSelection = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.unichainPromotion?.isFirstUnichainBridgeSelection === true
