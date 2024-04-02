import { createSlice, PayloadAction } from '@reduxjs/toolkit'

export enum ExtensionOnboardingState {
  Undefined, // We'll query for the status at every app launch
  ReadyToOnboard, // User ready to onboard, should see promo banner
  Completed, // User has onboarded or dismissed call to action
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
  hasViewedUniconV2IntroModal: boolean
  extensionOnboardingState: ExtensionOnboardingState
}

export const initialBehaviorHistoryState: BehaviorHistoryState = {
  hasViewedReviewScreen: false,
  hasSubmittedHoldToSwap: false,
  hasSkippedUnitagPrompt: false,
  hasCompletedUnitagsIntroModal: false,
  hasViewedUniconV2IntroModal: false,
  extensionOnboardingState: ExtensionOnboardingState.Undefined,
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
    setHasViewedUniconV2IntroModal: (state, action: PayloadAction<boolean>) => {
      state.hasViewedUniconV2IntroModal = action.payload
    },
    setExtensionOnboardingState: (state, action: PayloadAction<ExtensionOnboardingState>) => {
      state.extensionOnboardingState = action.payload
    },
  },
})

export const {
  setHasViewedReviewScreen,
  setHasSubmittedHoldToSwap,
  setHasSkippedUnitagPrompt,
  setHasCompletedUnitagsIntroModal,
  setHasViewedUniconV2IntroModal,
  setExtensionOnboardingState,
} = slice.actions

export const behaviorHistoryReducer = slice.reducer
