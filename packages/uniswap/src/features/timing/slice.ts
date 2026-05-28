import { createSlice, PayloadAction } from '@reduxjs/toolkit'

/**
 * Used for measuring time to complete key flows for analytics.
 */

export interface TimingState {
  swap: {
    startTimestamp: number | undefined
  }
}

export const initialTimingState: TimingState = {
  swap: {
    startTimestamp: undefined,
  },
}

export const slice = createSlice({
  name: 'timing',
  initialState: initialTimingState,
  reducers: {
    updateSwapStartTimestamp: (state, { payload: { timestamp } }: PayloadAction<{ timestamp?: number }>) => {
      state.swap.startTimestamp = timestamp
    },
  },
})

export const { updateSwapStartTimestamp } = slice.actions
export const { reducer: timingReducer } = slice
