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
export const typeStartPriceInput = createAction<{ typedValue: string }>('mint/typeStartPriceInput')
export const typeLeftRangeInput = createAction<{ typedValue: string }>('mint/typeLeftRangeInput')
export const typeRightRangeInput = createAction<{ typedValue: string }>('mint/typeRightRangeInput')
export const resetMintState = createAction<void>('mint/resetMintState')
