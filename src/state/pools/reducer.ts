import { createReducer } from '@reduxjs/toolkit'

import { SubgraphPoolData } from './hooks'
import { updatePools } from './actions'

export interface PoolsState {
  readonly pools: SubgraphPoolData[]
}

const initialState: PoolsState = {
  pools: []
}

export default createReducer<PoolsState>(initialState, builder =>
  builder.addCase(updatePools, (state, { payload: { pools } }) => {
    return {
      ...state,
      pools
    }
  })
)
