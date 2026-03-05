import { createSlice, type PayloadAction } from '@reduxjs/toolkit'
import { type CustomEndpoint } from 'uniswap/src/data/links'

export interface TweaksState {
  customEndpoint?: CustomEndpoint
}

export const initialTweaksState: TweaksState = {}

const slice = createSlice({
  name: 'tweaks',
  initialState: initialTweaksState,
  reducers: {
    setCustomEndpoint: (state, { payload: { customEndpoint } }: PayloadAction<{ customEndpoint?: CustomEndpoint }>) => {
      state.customEndpoint = customEndpoint
    },
    resetTweaks: () => initialTweaksState,
  },
})

export const { setCustomEndpoint, resetTweaks } = slice.actions
export const { reducer: tweaksReducer } = slice
