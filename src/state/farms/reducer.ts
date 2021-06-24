import { createReducer } from '@reduxjs/toolkit'

import { Farm } from 'state/farms/types'
import { setRewardTokens, setFarmsData, setLoading, setError } from './actions'

export interface FarmsState {
  readonly data: Farm[]
  readonly loading: boolean
  readonly error?: Error
  rewardTokens: string[]
}

const initialState: FarmsState = {
  data: [],
  loading: false,
  error: undefined,
  rewardTokens: []
}

export default createReducer<FarmsState>(initialState, builder =>
  builder
    .addCase(setRewardTokens, (state, { payload: rewardTokens }) => {
      return {
        ...state,
        rewardTokens
      }
    })
    .addCase(setFarmsData, (state, { payload: { farms } }) => {
      return {
        ...state,
        data: farms
      }
    })
    .addCase(setLoading, (state, { payload: loading }) => {
      return {
        ...state,
        loading
      }
    })
    .addCase(setError, (state, { payload: error }) => {
      return {
        ...state,
        error
      }
    })
)
