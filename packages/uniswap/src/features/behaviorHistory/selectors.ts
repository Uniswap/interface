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
