import { createAction } from '@reduxjs/toolkit'

import { Pair } from '@dynamic-amm/sdk'
import { SubgraphPoolData, UserLiquidityPosition } from './hooks'

export const updatePools = createAction<{ pools: SubgraphPoolData[] }>('pools/updatePools')
export const setLoading = createAction<boolean>('pools/setLoading')
export const setError = createAction<Error | undefined>('pools/setError')
export const setSelectedPool = createAction<{
  pool: Pair
  subgraphPoolData: SubgraphPoolData
  myLiquidity?: UserLiquidityPosition
}>('pools/setSelectedPool')
