import { UniswapState } from 'uniswap/src/state/uniswapReducer'

export const selectHasViewedBridgingBanner = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.hasViewedBridgingBanner === true

export const selectHasDismissedBridgingWarning = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.hasDismissedBridgingWarning === true

export const selectHasDismissedLowNetworkTokenWarning = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.hasDismissedLowNetworkTokenWarning === true

export const selectHasViewedContractAddressExplainer = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.hasViewedContractAddressExplainer === true

export const selectHasShownMismatchToast = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.hasShownMismatchToast === true

export const selectHasSeenToucanIntroModal = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.hasSeenToucanIntroModal === true

export const selectHasDismissedUniswapWrapped2025Banner = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.hasDismissedUniswapWrapped2025Banner === true
