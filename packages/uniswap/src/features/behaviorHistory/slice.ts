import { createSlice, PayloadAction } from '@reduxjs/toolkit'

/**
 * Used to store persisted info about a users interactions with UI.
 * We use this to show conditional UI, usually only for the first time a user views a new feature.
 */
export interface UniswapBehaviorHistoryState {
  hasViewedBridgingBanner?: boolean
  hasDismissedBridgingWarning?: boolean
  hasDismissedLowNetworkTokenWarning?: boolean
  unichainPromotion?: {
    coldBannerDismissed?: boolean
    warmBannerDismissed?: boolean
  }
}

export const initialUniswapBehaviorHistoryState: UniswapBehaviorHistoryState = {
  hasViewedBridgingBanner: false,
  hasDismissedBridgingWarning: false,
  hasDismissedLowNetworkTokenWarning: false,
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
    setHasDismissedLowNetworkTokenWarning: (state, action: PayloadAction<boolean>) => {
      state.hasDismissedLowNetworkTokenWarning = action.payload
    },
    setHasDismissedUnichainColdBanner: (state, action: PayloadAction<boolean>) => {
      state.unichainPromotion ??= {}
      state.unichainPromotion.coldBannerDismissed = action.payload
    },
    setHasDismissedUnichainWarmBanner: (state, action: PayloadAction<boolean>) => {
      state.unichainPromotion ??= {}
      state.unichainPromotion.warmBannerDismissed = action.payload
    },

    // Should only be used for testing
    resetUniswapBehaviorHistory: (_state, _action: PayloadAction) => {
      return initialUniswapBehaviorHistoryState
    },
  },
})

export const {
  setHasViewedBridgingBanner,
  setHasDismissedBridgingWarning,
  setHasDismissedLowNetworkTokenWarning,
  setHasDismissedUnichainColdBanner,
  setHasDismissedUnichainWarmBanner,
  resetUniswapBehaviorHistory,
} = slice.actions

export const uniswapBehaviorHistoryReducer = slice.reducer
