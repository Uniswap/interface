import { createAction } from '@reduxjs/toolkit'

export enum Field {
  INPUT = 'INPUT'
}

export const selectCurrency = createAction<{ field: Field; currencyId: string }>('bridge/selectCurrency')
export const typeInput = createAction<{ field: Field; typedValue: string }>('bridge/typeInput')
