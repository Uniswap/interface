import { createReducer } from '@reduxjs/toolkit'

import { Field, switchTokenField, typeInput } from './actions'

interface BurnState {
  readonly independentField: Field
  readonly independentTokenField: Field
  readonly typedValue: string
}

const initialState: BurnState = {
  independentField: Field.LIQUIDITY_PERCENT,
  independentTokenField: Field.CURRENCY_A,
  typedValue: '',
}

export default createReducer<BurnState>(initialState, builder =>
  builder
    .addCase(typeInput, (state, { payload: { field, typedValue } }) => {
      return {
        ...state,
        independentField: field,
        typedValue,
      }
    })
    .addCase(switchTokenField, (state, { payload: { field } }) => {
      return {
        ...state,
        independentTokenField: field,
      }
    }),
)
