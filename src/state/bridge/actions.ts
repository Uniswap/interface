import { createAction } from '@reduxjs/toolkit'

export const selectCurrency = createAction<{ currencyId: string }>('bridge/selectCurrency')
export const typeInput = createAction<{ typedValue: string }>('bridge/typeInput')
export const replaceBridgeState = createAction<{
  typedValue: string
  currencyId?: string
}>('bridge/replaceBridgeState')