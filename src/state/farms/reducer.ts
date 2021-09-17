import { createReducer } from '@reduxjs/toolkit'

import { Farm } from 'state/farms/types'
import { setFarmsData, setLoading, setError } from './actions'

export interface FarmsState {
  readonly data: Farm[]
  readonly loading: boolean
  readonly error?: Error
}

const initialState: FarmsState = {
  data: [],
  loading: false,
  error: undefined
}

export default createReducer<FarmsState>(initialState, builder =>
  builder
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
