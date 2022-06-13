import { createAction } from '@reduxjs/toolkit'

import { ProMMPoolData, UserPosition } from './hooks'

export const updatePools = createAction<{ pools: ProMMPoolData[] }>('prommPools/updatePools')
export const setLoading = createAction<boolean>('prommPools/setLoading')
export const setError = createAction<Error | undefined>('prommPools/setError')
export const setSelectedPool = createAction<{
  poolData: ProMMPoolData
  myLiquidity?: UserPosition
}>('prommPools/setSelectedPool')
export const setSharedPoolId = createAction<{ poolId: string | undefined }>('prommPools/setSharedPoolId')
