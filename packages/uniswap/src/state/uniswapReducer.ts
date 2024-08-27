import { combineReducers } from 'redux'
import { fiatOnRampAggregatorApi } from 'uniswap/src/features/fiatOnRamp/api'
import { timingReducer } from 'uniswap/src/features/timing/slice'

export const uniswapReducers = {
  [fiatOnRampAggregatorApi.reducerPath]: fiatOnRampAggregatorApi.reducer,
  timing: timingReducer,
} as const

// used to type RootState
export const uniswapReducer = combineReducers(uniswapReducers)

export const uniswapPersistedStateList: Array<keyof typeof uniswapReducers> = []

export type UniswapState = ReturnType<typeof uniswapReducer>
