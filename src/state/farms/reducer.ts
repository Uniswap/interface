import { createReducer } from '@reduxjs/toolkit'

import { Farm } from 'state/farms/types'
import { setRewardTokens, setFarmsPublicData, setLoading, setError, setFarmsUserData } from './actions'

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
    .addCase(setFarmsPublicData, (state, { payload: { farms } }) => {
      return {
        ...state,
        data: farms
      }
    })
    .addCase(setFarmsUserData, (state, { payload: { farmsUserData } }) => {
      farmsUserData.forEach(farmUserData => {
        const { pid } = farmUserData
        const index = state.data.findIndex(farm => farm.pid === pid)
        state.data[index] = { ...state.data[index], userData: farmUserData }
      })
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
