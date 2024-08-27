import { WalletState } from 'wallet/src/state/walletReducer'

export const selectHasViewedReviewScreen = (state: WalletState): boolean => state.behaviorHistory.hasViewedReviewScreen

export const selectHasSubmittedHoldToSwap = (state: WalletState): boolean =>
  state.behaviorHistory.hasSubmittedHoldToSwap

export const selectHasSkippedUnitagPrompt = (state: WalletState): boolean =>
  state.behaviorHistory.hasSkippedUnitagPrompt

export const selectHasCompletedUnitagsIntroModal = (state: WalletState): boolean =>
  state.behaviorHistory.hasCompletedUnitagsIntroModal

export const selectHasViewedWelcomeWalletCard = (state: WalletState): boolean =>
  state.behaviorHistory.hasViewedWelcomeWalletCard

export const selectHasUsedExplore = (state: WalletState): boolean => state.behaviorHistory.hasUsedExplore
