import type { UniswapState } from 'uniswap/src/state/uniswapReducer'

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

/** Returns true if user has seen the modal globally (when disconnected) */
export const selectHasSeenToucanIntroModal = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.hasSeenToucanIntroModal === true

/** Returns true if user has seen the modal for a specific wallet */
export const selectHasSeenToucanIntroModalForWallet = (state: UniswapState, walletAddress: string): boolean =>
  state.uniswapBehaviorHistory.toucanIntroModalSeenByWallet?.[walletAddress.toLowerCase()] === true

export const selectHasDismissedCrosschainSwapsPromoBanner = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.hasDismissedCrosschainSwapsPromoBanner === true

export const selectHasDismissedPoolsBalanceCoachmark = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.hasDismissedPoolsBalanceCoachmark === true

export const selectHasDismissedPoolsOutageBanner = (state: UniswapState): boolean =>
  state.uniswapBehaviorHistory.hasDismissedPoolsOutageBanner === true
