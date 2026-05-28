import { createAction } from '@reduxjs/toolkit'

export enum Field {
  CURRENCY_A = 'CURRENCY_A',
  CURRENCY_B = 'CURRENCY_B',
}

export enum Bound {
  LOWER = 'LOWER',
  UPPER = 'UPPER',
}

export const typeInput = createAction<{ field: Field; typedValue: string; noLiquidity: boolean }>(
  'mintV3/typeInputMint',
)
export const typeStartPriceInput = createAction<{ typedValue: string }>('mintV3/typeStartPriceInput')
export const typeLeftRangeInput = createAction<{ typedValue: string }>('mintV3/typeLeftRangeInput')
export const typeRightRangeInput = createAction<{ typedValue: string }>('mintV3/typeRightRangeInput')
export const resetMintState = createAction<void>('mintV3/resetMintState')
export const setFullRange = createAction<void>('mintV3/setFullRange')
