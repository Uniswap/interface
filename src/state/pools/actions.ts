import { createAction } from '@reduxjs/toolkit'

import { SubgraphPoolData, UserLiquidityPosition } from './hooks'

export const updatePools = createAction<{ pools: SubgraphPoolData[] }>('pools/updatePools')
export const setLoading = createAction<boolean>('pools/setLoading')
export const setError = createAction<Error | undefined>('pools/setError')
export const setSelectedPool = createAction<{
  poolData: SubgraphPoolData
  myLiquidity?: UserLiquidityPosition
}>('pools/setSelectedPool')
export const setSharedPoolId = createAction<{ poolId: string | undefined }>('pools/setSharedPoolId')
