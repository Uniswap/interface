import { Field, selectCurrency, typeInput } from './actions'
import { createReducer } from '@reduxjs/toolkit'

export interface BridgeState {
  readonly independentField: Field
  readonly typedValue: string
  readonly [Field.INPUT]: {
    readonly currencyId: string | undefined
  }
}

const initialState: BridgeState = {
  independentField: Field.INPUT,
  typedValue: '',
  [Field.INPUT]: {
    currencyId: ''
  }
}

export default createReducer<BridgeState>(initialState, builder =>
  builder
    .addCase(selectCurrency, (state, { payload: { currencyId, field } }) => {
      return {
        ...state,
        [field]: { currencyId: currencyId }
      }
    })
    .addCase(typeInput, (state, { payload: { field, typedValue } }) => {
      return {
        ...state,
        independentField: field,
        typedValue
      }
    })
)
