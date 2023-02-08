import { createAction } from '@reduxjs/toolkit'

import { Field, FullRange } from './type'

export const typeInput = createAction<{
  field: Field
  typedValue: string
  noLiquidity: boolean
  positionIndex: number
}>('mintV3/typeInputMint')
export const typeStartPriceInput = createAction<{ typedValue: string }>('mintV3/typeStartPriceInput')
export const typeLeftRangeInput = createAction<{ typedValue: string; positionIndex: number }>(
  'mintV3/typeLeftRangeInput',
)
export const typeRightRangeInput = createAction<{ typedValue: string; positionIndex: number }>(
  'mintV3/typeRightRangeInput',
)
export const resetMintState = createAction<void>('mintV3/resetMintState')
export const setRange = createAction<{
  leftRangeTypedValue: string | FullRange
  rightRangeTypedValue: string | FullRange
  positionIndex: number
}>('mintV3/setRange')
export const addPosition = createAction<void>('mintV3/addPosition')
export const removePosition = createAction<{ positionIndex: number }>('mintV3/removePosition')
