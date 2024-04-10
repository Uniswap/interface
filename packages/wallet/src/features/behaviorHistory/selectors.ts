import { SharedState } from 'wallet/src/state/reducer'

export const selectHasViewedReviewScreen = (state: SharedState): boolean =>
  state.behaviorHistory.hasViewedReviewScreen

export const selectHasSubmittedHoldToSwap = (state: SharedState): boolean =>
  state.behaviorHistory.hasSubmittedHoldToSwap

export const selectHasSkippedUnitagPrompt = (state: SharedState): boolean =>
  state.behaviorHistory.hasSkippedUnitagPrompt

export const selectHasCompletedUnitagsIntroModal = (state: SharedState): boolean =>
  state.behaviorHistory.hasCompletedUnitagsIntroModal

export const selectHasViewedUniconV2IntroModal = (state: SharedState): boolean =>
  state.behaviorHistory.hasViewedUniconV2IntroModal
