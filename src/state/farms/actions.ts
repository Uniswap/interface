import { createAction } from '@reduxjs/toolkit'

import { Farm } from 'state/types'

export const setFarmsPublicData = createAction<{ farms: Farm[] }>('farms/setFarmsPublicData')
export const setLoading = createAction<boolean>('farms/setLoading')
export const setError = createAction<Error | undefined>('farms/setError')
