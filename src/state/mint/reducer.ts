import { createReducer } from '@reduxjs/toolkit'
import {
  Field,
  resetMintState,
  typeInput,
  typeLowerRangeInput,
  typeUpperRangeInput,
  RangeType,
  updateRangeType,
} from './actions'

export interface MintState {
  readonly independentField: Field
  readonly typedValue: string
  readonly otherTypedValue: string // for the case when there's no liquidity
  readonly lowerRangeTypedValue: string
  readonly upperRangeTypedValue: string
  readonly rangeType: RangeType
}

const initialState: MintState = {
  independentField: Field.CURRENCY_A,
  typedValue: '',
  otherTypedValue: '',
  lowerRangeTypedValue: '',
  upperRangeTypedValue: '',
  rangeType: RangeType.RATE,
}

export default createReducer<MintState>(initialState, (builder) =>
  builder
    .addCase(resetMintState, () => initialState)
    .addCase(updateRangeType, (state, { payload: { rangeType } }) => {
      return {
        ...state,
        rangeType,
      }
    })
    .addCase(typeLowerRangeInput, (state, { payload: { typedValue } }) => {
      return {
        ...state,
        lowerRangeTypedValue: typedValue,
      }
    })
    .addCase(typeUpperRangeInput, (state, { payload: { typedValue } }) => {
      return {
        ...state,
        upperRangeTypedValue: typedValue,
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
            otherTypedValue: state.typedValue,
          }
        }
      } else {
        return {
          ...state,
          independentField: field,
          typedValue,
          otherTypedValue: '',
        }
      }
    })
)
