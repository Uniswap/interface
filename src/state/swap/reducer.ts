import { createReducer } from '@reduxjs/toolkit'
import { Field, replaceSwapState, selectToken, setRecipient, switchTokens, typeInput } from './actions'

export interface SwapState {
  readonly independentField: Field
  readonly typedValue: string
  readonly [Field.INPUT]: {
    readonly address: string | undefined
  }
  readonly [Field.OUTPUT]: {
    readonly address: string | undefined
  }
  // the typed recipient address, or null if swap should go to sender
  readonly recipient: string | null
}

const initialState: SwapState = {
  independentField: Field.INPUT,
  typedValue: '',
  [Field.INPUT]: {
    address: ''
  },
  [Field.OUTPUT]: {
    address: ''
  },
  recipient: null
}

export default createReducer<SwapState>(initialState, builder =>
  builder
    .addCase(
      replaceSwapState,
      (state, { payload: { typedValue, recipient, field, inputTokenAddress, outputTokenAddress } }) => {
        return {
          [Field.INPUT]: {
            address: inputTokenAddress
          },
          [Field.OUTPUT]: {
            address: outputTokenAddress
          },
          independentField: field,
          typedValue: typedValue,
          recipient
        }
      }
    )
    .addCase(selectToken, (state, { payload: { address, field } }) => {
      const otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT
      if (address === state[otherField].address) {
        // the case where we have to swap the order
        return {
          ...state,
          independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
          [field]: { address },
          [otherField]: { address: state[field].address }
        }
      } else {
        // the normal case
        return {
          ...state,
          [field]: { address }
        }
      }
    })
    .addCase(switchTokens, state => {
      return {
        ...state,
        independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
        [Field.INPUT]: { address: state[Field.OUTPUT].address },
        [Field.OUTPUT]: { address: state[Field.INPUT].address }
      }
    })
    .addCase(typeInput, (state, { payload: { field, typedValue } }) => {
      return {
        ...state,
        independentField: field,
        typedValue
      }
    })
    .addCase(setRecipient, (state, { payload: { recipient } }) => {
      state.recipient = recipient
    })
)
