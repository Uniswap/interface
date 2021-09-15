import { createReducer } from '@reduxjs/toolkit'
import { replaceBridgeState, selectCurrency, typeInput } from './actions'

export interface BridgeState {
  readonly typedValue: string
  readonly currencyId: string | undefined
  readonly protocolFeeTo: string | undefined
}

const initialState: BridgeState = {
  typedValue: '',
  currencyId: '',
  protocolFeeTo: undefined
}

export default createReducer<BridgeState>(initialState, builder =>
  builder
    .addCase(
      replaceBridgeState,
      (state, { payload: { typedValue, currencyId } }) => {
        return {
          ...state,
          currencyId: currencyId,
          typedValue: typedValue,
        }
      }
    )
    .addCase(selectCurrency, (state, { payload: { currencyId } }) => {
      return {
        ...state,
        currencyId: currencyId
      }
    })
    .addCase(typeInput, (state, { payload: { typedValue } }) => {
      return {
        ...state,
        typedValue
      }
    })
)
