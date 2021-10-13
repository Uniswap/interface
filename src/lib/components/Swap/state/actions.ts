import { createAction } from '@reduxjs/toolkit'

import { GasPrice, MaxSlippage } from './reducer'

export const toggleShowDetails = createAction<void>('swap/toggleShowDetails')

export const resetSettings = createAction<void>('swap/resetSettings')
export const setGasPrice = createAction<[GasPrice, number?]>('swap/setGasPrice')
export const setMaxSlippage = createAction<[MaxSlippage, number?]>('swap/setMaxSlippage')
export const setTransactionDeadline = createAction<number>('swap/setTransactionDeadline')
export const toggleExpertMode = createAction<void>('swap/setExpertMode')
export const toggleMultihop = createAction<void>('swap/setMultihop')
