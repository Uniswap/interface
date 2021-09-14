import { createReducer } from '@reduxjs/toolkit'
import { replaceBridgeState, selectCurrency, setRecipient, typeInput } from './actions'

export interface BridgeState {
  readonly typedValue: string
  readonly currencyId: string | undefined
  // the typed recipient address or ENS name, or null if swap should go to sender
  readonly recipient: string | null
  readonly protocolFeeTo: string | undefined
}

const initialState: BridgeState = {
  typedValue: '',
  currencyId: '',
  recipient: null,
  protocolFeeTo: undefined
}

export default createReducer<BridgeState>(initialState, builder =>
  builder
    .addCase(
      replaceBridgeState,
      (state, { payload: { typedValue, currencyId, recipient } }) => {
        return {
          ...state,
          currencyId: currencyId,
          typedValue: typedValue,
          recipient
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
    .addCase(setRecipient, (state, { payload: { recipient } }) => {
      state.recipient = recipient
    })
)
