import { createReducer } from '@reduxjs/toolkit'

import { Field, typeInput } from './actions'

interface BurnProAmmState {
  readonly independentField: Field
  readonly independentTokenField: Field
  readonly typedValue: string
}

const initialState: BurnProAmmState = {
  independentField: Field.LIQUIDITY_PERCENT,
  independentTokenField: Field.CURRENCY_A,
  typedValue: '',
}

export default createReducer<BurnProAmmState>(initialState, builder =>
  builder.addCase(typeInput, (state, { payload: { field, typedValue } }) => {
    return {
      ...state,
      independentField: field,
      typedValue,
    }
  }),
)
