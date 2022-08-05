import { createAction } from '@reduxjs/toolkit'

export enum Field {
  LIQUIDITY_PERCENT = 'LIQUIDITY_PERCENT',
  CURRENCY_A = 'CURRENCY_A',
  CURRENCY_B = 'CURRENCY_B',
}

export const typeInput = createAction<{ field: Field; typedValue: string }>('burnProAmm/typeInputBurn')
// export const selectPercent = createAction<{ percent: number }>('burnProAmm/selectBurnPercent')
