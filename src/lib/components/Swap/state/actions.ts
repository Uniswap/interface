import { createAction } from '@reduxjs/toolkit'

import { GasPrice, MaxSlippage } from './reducer'

export const toggleShowDetails = createAction<void>('swap/toggleShowDetails')

export const resetSettings = createAction<void>('swap/resetSettings')
export const setGasPrice = createAction<GasPrice>('swap/setGasPrice')
export const setMaxSlippage = createAction<MaxSlippage>('swap/setMaxSlippage')
export const setTransactionDeadline = createAction<number>('swap/setTransactionDeadline')
export const setExpertMode = createAction<boolean>('swap/setExpertMode')
export const setMultiHop = createAction<boolean>('swap/setMultiHop')
