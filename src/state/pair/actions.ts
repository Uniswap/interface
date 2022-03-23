import { createAction } from '@reduxjs/toolkit'

export enum Field {
  CURRENCY_A = 'CURRENCY_A',
  CURRENCY_B = 'CURRENCY_B',
}

export const selectCurrency = createAction<{ field: Field; currencyId: string }>('pair/selectCurrency')
