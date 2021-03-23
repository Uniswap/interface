import { createReducer } from '@reduxjs/toolkit'

import { SubgraphPoolData } from './hooks'
import { setError, setLoading, updatePools } from './actions'

export interface PoolsState {
  readonly pools: SubgraphPoolData[]
  readonly loading: boolean
  readonly error?: Error
}

const initialState: PoolsState = {
  pools: [],
  loading: false,
  error: undefined
}

export default createReducer<PoolsState>(initialState, builder =>
  builder
    .addCase(updatePools, (state, { payload: { pools } }) => {
      return {
        ...state,
        pools
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
