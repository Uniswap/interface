import { createAction } from '@reduxjs/toolkit'
import { ChainId } from '@swapr/sdk'

export const selectCurrency = createAction<{ currencyId: string }>('bridge/selectCurrency')
export const typeInput = createAction<{ typedValue: string }>('bridge/typeInput')
export const replaceBridgeState = createAction<{
  typedValue: string
  currencyId?: string
  toInNet: ChainId
}>('bridge/replaceBridgeState')