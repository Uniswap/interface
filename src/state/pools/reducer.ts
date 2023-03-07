import { createReducer } from '@reduxjs/toolkit'

import { setError, setLoading, setSelectedPool, setSharedPoolId, setUrlOnEthPowAck, updatePools } from './actions'
import { SubgraphPoolData, UserLiquidityPosition } from './hooks'

interface SelectedPool {
  poolData: SubgraphPoolData
  myLiquidity: UserLiquidityPosition | undefined
}

interface PoolsState {
  readonly pools: SubgraphPoolData[]
  readonly loading: boolean
  readonly error: Error | undefined
  readonly selectedPool: SelectedPool | undefined
  readonly sharedPoolId: string | undefined
  readonly urlOnEthPoWAckModal: string
}

const initialState: PoolsState = {
  pools: [],
  loading: false,
  error: undefined,
  selectedPool: undefined,
  sharedPoolId: undefined,
  urlOnEthPoWAckModal: '',
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
    })
    .addCase(setUrlOnEthPowAck, (state, { payload: url }) => {
      return {
        ...state,
        urlOnEthPoWAckModal: url,
      }
    }),
)
