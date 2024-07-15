import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { CustomEndpoint } from 'wallet/src/data/links'

export interface TweaksState {
  customEndpoint?: CustomEndpoint
}

export const initialTweaksState: TweaksState = {}

export const slice = createSlice({
  name: 'tweaks',
  initialState: initialTweaksState,
  reducers: {
    setCustomEndpoint: (
      state,
      { payload: { customEndpoint } }: PayloadAction<{ customEndpoint?: CustomEndpoint }>
    ) => {
      state.customEndpoint = customEndpoint
    },
  },
})

export const { setCustomEndpoint } = slice.actions
export const { reducer: tweaksReducer } = slice
