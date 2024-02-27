import { createSlice, PayloadAction } from '@reduxjs/toolkit'

/**
 * Used to store persisted info about a users interactions with UI.
 * We use this to show conditional UI, usually only for the first time a user views a new feature.
 */
export interface BehaviorHistoryState {
  hasViewedReviewScreen: boolean // used for hold to swap tip on swap UI
  hasSubmittedHoldToSwap: boolean
  hasSkippedUnitagPrompt: boolean
  hasCompletedUnitagsIntroModal: boolean
}

export const initialBehaviorHistoryState: BehaviorHistoryState = {
  hasViewedReviewScreen: false,
  hasSubmittedHoldToSwap: false,
  hasSkippedUnitagPrompt: false,
  hasCompletedUnitagsIntroModal: false,
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
  },
})

export const {
  setHasViewedReviewScreen,
  setHasSubmittedHoldToSwap,
  setHasSkippedUnitagPrompt,
  setHasCompletedUnitagsIntroModal,
} = slice.actions

export const behaviorHistoryReducer = slice.reducer
