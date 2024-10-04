import { createSlice, PayloadAction } from '@reduxjs/toolkit'

/**
 * Used to store persisted info about a users interactions with UI.
 * We use this to show conditional UI, usually only for the first time a user views a new feature.
 */
export interface UniswapBehaviorHistoryState {
  hasViewedBridgingBanner?: boolean
  hasDismissedBridgingWarning?: boolean
}

export const initialUniswapBehaviorHistoryState: UniswapBehaviorHistoryState = {
  hasViewedBridgingBanner: false,
  hasDismissedBridgingWarning: false,
}

const slice = createSlice({
  name: 'uniswapBehaviorHistory',
  initialState: initialUniswapBehaviorHistoryState,
  reducers: {
    setHasViewedBridgingBanner: (state, action: PayloadAction<boolean>) => {
      state.hasViewedBridgingBanner = action.payload
    },
    setHasDismissedBridgingWarning: (state, action: PayloadAction<boolean>) => {
      state.hasDismissedBridgingWarning = action.payload
    },

    // Should only be used for testing
    resetUniswapBehaviorHistory: (_state, _action: PayloadAction) => {
      return initialUniswapBehaviorHistoryState
    },
  },
})

export const { setHasViewedBridgingBanner, setHasDismissedBridgingWarning, resetUniswapBehaviorHistory } = slice.actions

export const uniswapBehaviorHistoryReducer = slice.reducer
