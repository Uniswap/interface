import { MobileState } from 'src/app/reducer'

export const selectHasViewedReviewScreen = (state: MobileState): boolean =>
  state.behaviorHistory.hasViewedReviewScreen

export const selectHasSubmittedHoldToSwap = (state: MobileState): boolean =>
  state.behaviorHistory.hasSubmittedHoldToSwap
