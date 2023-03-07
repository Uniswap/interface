import { createAction } from '@reduxjs/toolkit'

import { Farm } from 'state/farms/classic/types'

export const setFarmsData = createAction<{ [key: string]: Farm[] }>('farms/setFarmsData')
export const setLoading = createAction<boolean>('farms/setLoading')
export const setShowConfirm = createAction<boolean>('vesting/setShowConfirm')
export const setAttemptingTxn = createAction<boolean>('vesting/setAttemptingTxn')
export const setTxHash = createAction<string>('vesting/setTxHash')
export const setYieldPoolsError = createAction<Error | null>('vesting/setYieldPoolsError')
