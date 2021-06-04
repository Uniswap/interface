import { createReducer } from '@reduxjs/toolkit'
import {
  Field,
  resetMintState,
  typeInput,
  typeStartPriceInput,
  typeLeftRangeInput,
  typeRightRangeInput,
} from './actions'

export interface MintState {
  readonly independentField: Field
  readonly typedValue: string
  readonly startPriceTypedValue: string // for the case when there's no liquidity
  readonly leftRangeTypedValue: string
  readonly rightRangeTypedValue: string
}

export const initialState: MintState = {
  independentField: Field.CURRENCY_A,
  typedValue: '',
  startPriceTypedValue: '',
  leftRangeTypedValue: '',
  rightRangeTypedValue: '',
}

export default createReducer<MintState>(initialState, (builder) =>
  builder
    .addCase(resetMintState, () => initialState)
    .addCase(typeStartPriceInput, (state, { payload: { typedValue } }) => {
      return {
        ...state,
        startPriceTypedValue: typedValue,
      }
    })
    .addCase(typeLeftRangeInput, (state, { payload: { typedValue } }) => {
      return {
        ...state,
        leftRangeTypedValue: typedValue,
      }
    })
    .addCase(typeRightRangeInput, (state, { payload: { typedValue } }) => {
      return {
        ...state,
        rightRangeTypedValue: typedValue,
      }
    })
    .addCase(typeInput, (state, { payload: { field, typedValue, noLiquidity } }) => {
      if (noLiquidity) {
        // they're typing into the field they've last typed in
        if (field === state.independentField) {
          return {
            ...state,
            independentField: field,
            typedValue,
          }
        }
        // they're typing into a new field, store the other value
        else {
          return {
            ...state,
            independentField: field,
            typedValue,
          }
        }
      } else {
        return {
          ...state,
          independentField: field,
          typedValue,
        }
      }
    })
)
