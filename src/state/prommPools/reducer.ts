import { createReducer } from '@reduxjs/toolkit'

import { ProMMPoolData, UserPosition } from './hooks'
import { setError, setLoading, setSelectedPool, setSharedPoolId, updatePools } from './actions'

interface SelectedPool {
  poolData: ProMMPoolData
  myLiquidity: UserPosition | undefined
}

export interface PoolsState {
  readonly pools: ProMMPoolData[]
  readonly loading: boolean
  readonly error: Error | undefined
  readonly selectedPool: SelectedPool | undefined
  readonly sharedPoolId: string | undefined
}

const initialState: PoolsState = {
  pools: [],
  loading: false,
  error: undefined,
  selectedPool: undefined,
  sharedPoolId: undefined,
}

export default createReducer<PoolsState>(initialState, builder =>
  builder
    .addCase(updatePools, (state, { payload: { pools } }) => {
      return {
        ...state,
        pools,
        selectedPool: undefined,
      }
    })
    .addCase(setLoading, (state, { payload: loading }) => {
      return {
        ...state,
        loading,
        selectedPool: undefined,
      }
    })
    .addCase(setError, (state, { payload: error }) => {
      return {
        ...state,
        error,
        selectedPool: undefined,
      }
    })
    .addCase(setSelectedPool, (state, { payload: { poolData, myLiquidity } }) => {
      return {
        ...state,
        selectedPool: {
          poolData,
          myLiquidity,
        },
      }
    })
    .addCase(setSharedPoolId, (state, { payload: { poolId } }) => {
      return {
        ...state,
        sharedPoolId: poolId,
      }
    }),
)
