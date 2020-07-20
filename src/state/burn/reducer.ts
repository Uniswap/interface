import { createReducer } from '@reduxjs/toolkit'
import { Field, typeInput } from './actions'

export interface BurnState {
  readonly independentField: Field
  readonly typedValue: string
}

const initialState: BurnState = {
  independentField: Field.LIQUIDITY_PERCENT,
  typedValue: '0'
}

export default createReducer<BurnState>(initialState, builder =>
  builder.addCase(typeInput, (state, { payload: { field, typedValue } }) => {
    return {
      ...state,
      independentField: field,
      typedValue
    }
  })
)
