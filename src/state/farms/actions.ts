import { createAction } from '@reduxjs/toolkit'

import { Farm, FarmUserData } from 'state/farms/types'

export const setRewardTokens = createAction<string[]>('farms/setRewardTokens')
export const setFarmsPublicData = createAction<{ farms: Farm[] }>('farms/setFarmsPublicData')
export const setFarmsUserData = createAction<{ farmsUserData: FarmUserData[] }>('farms/setFarmsUserData')
export const setLoading = createAction<boolean>('farms/setLoading')
export const setError = createAction<Error | undefined>('farms/setError')
