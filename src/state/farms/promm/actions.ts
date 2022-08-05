import { createAction } from '@reduxjs/toolkit'

import { ProMMFarm } from './types'

export const updatePrommFarms = createAction<{ [address: string]: ProMMFarm[] }>('prommFarms/updatePrommFarms')
export const setLoading = createAction<boolean>('prommFarms/setLoading')
export const setShowConfirm = createAction<boolean>('prommVesting/setShowConfirm')
export const setAttemptingTxn = createAction<boolean>('prommVesting/setAttemptingTxn')
export const setVestingTxHash = createAction<string>('prommVesting/setVestingTxHash')
export const setError = createAction<string>('prommVesting/setError')
