import { createAction } from '@reduxjs/toolkit'

import { Farm } from 'state/farms/types'

export const setFarmsData = createAction<{ farms: Farm[] }>('farms/setFarmsData')
export const setLoading = createAction<boolean>('farms/setLoading')
export const setError = createAction<Error | undefined>('farms/setError')
