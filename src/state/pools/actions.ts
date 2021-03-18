import { createAction } from '@reduxjs/toolkit'

import { SubgraphPoolData } from './hooks'

export const updatePools = createAction<{ pools: SubgraphPoolData[] }>('pools/updatePools')
