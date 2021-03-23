import { createAction } from '@reduxjs/toolkit'

import { SubgraphPoolData } from './hooks'

export const updatePools = createAction<{ pools: SubgraphPoolData[] }>('pools/updatePools')
export const setLoading = createAction<boolean>('pools/setLoading')
export const setError = createAction<Error | undefined>('pools/setError')
