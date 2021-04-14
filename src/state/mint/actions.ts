import { createAction } from '@reduxjs/toolkit'

export enum Field {
  CURRENCY_A = 'CURRENCY_A',
  CURRENCY_B = 'CURRENCY_B',
}

export enum Bound {
  LOWER = 'LOWER',
  UPPER = 'UPPER',
}

// save for % inputs
export enum RangeType {
  PERCENT = 'PERCENT',
  RATE = 'RATE',
}

export const typeInput = createAction<{ field: Field; typedValue: string; noLiquidity: boolean }>('mint/typeInputMint')
export const typeLowerRangeInput = createAction<{ typedValue: string }>('mint/typeLowerRangeInput')
export const typeUpperRangeInput = createAction<{ typedValue: string }>('mint/typeUpperRangeInput')
export const typeStartPriceInput = createAction<{ typedValue: string }>('mint/typeStartPriceInput')
export const resetMintState = createAction<void>('mint/resetMintState')
