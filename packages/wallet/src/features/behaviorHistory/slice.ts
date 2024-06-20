import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export enum ExtensionOnboardingState {
  Undefined, // We'll query for the status at every app launch
  ReadyToOnboard, // User ready to onboard, should see promo banner
  Completed, // User has onboarded or dismissed call to action
}

export enum ExtensionBetaFeedbackState {
  ReadyToShow, // Ready to show feedback modal
  Shown, // Feedback modal shown
}

/**
 * Used to store persisted info about a users interactions with UI.
 * We use this to show conditional UI, usually only for the first time a user views a new feature.
 */
export interface BehaviorHistoryState {
  hasViewedReviewScreen: boolean // used for hold to swap tip on swap UI
  hasSubmittedHoldToSwap: boolean
  hasSkippedUnitagPrompt: boolean
  hasCompletedUnitagsIntroModal: boolean
  extensionOnboardingState: ExtensionOnboardingState
  extensionBetaFeedbackState: ExtensionBetaFeedbackState | undefined
}

export const initialBehaviorHistoryState: BehaviorHistoryState = {
  hasViewedReviewScreen: false,
  hasSubmittedHoldToSwap: false,
  hasSkippedUnitagPrompt: false,
  hasCompletedUnitagsIntroModal: false,
  extensionOnboardingState: ExtensionOnboardingState.Undefined,
  extensionBetaFeedbackState: undefined,
}

const slice = createSlice({
  name: 'behaviorHistory',
  initialState: initialBehaviorHistoryState,
  reducers: {
    setHasViewedReviewScreen: (state, action: PayloadAction<boolean>) => {
      state.hasViewedReviewScreen = action.payload
    },
    setHasSubmittedHoldToSwap: (state, action: PayloadAction<boolean>) => {
      state.hasSubmittedHoldToSwap = action.payload
    },
    setHasSkippedUnitagPrompt: (state, action: PayloadAction<boolean>) => {
      state.hasSkippedUnitagPrompt = action.payload
    },
    setHasCompletedUnitagsIntroModal: (state, action: PayloadAction<boolean>) => {
      state.hasCompletedUnitagsIntroModal = action.payload
    },
    setExtensionOnboardingState: (state, action: PayloadAction<ExtensionOnboardingState>) => {
      state.extensionOnboardingState = action.payload
    },
    setExtensionBetaFeedbackState: (state, action: PayloadAction<ExtensionBetaFeedbackState>) => {
      state.extensionBetaFeedbackState = action.payload
    },
  },
})

export const {
  setHasViewedReviewScreen,
  setHasSubmittedHoldToSwap,
  setHasSkippedUnitagPrompt,
  setHasCompletedUnitagsIntroModal,
  setExtensionOnboardingState,
  setExtensionBetaFeedbackState,
} = slice.actions

export const behaviorHistoryReducer = slice.reducer
