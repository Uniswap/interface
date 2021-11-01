import { createReducer } from '@reduxjs/toolkit'

import { Field, replaceSwapState, selectCurrency, setRecipient, switchCurrencies } from './actions'
import { typeInput } from './actions'

export interface SwapState {
  readonly independentField: Field
  readonly fixedField: Field
  readonly typedValue: string
  readonly inputValue: string
  readonly [Field.INPUT]: {
    readonly currencyId: string | undefined | null
  }
  readonly [Field.OUTPUT]: {
    readonly currencyId: string | undefined | null
  }
  readonly [Field.PRICE]: {
    readonly currencyId: string | undefined | null
  }
  // the typed recipient address or ENS name, or null if swap should go to sender
  readonly recipient: string | null
}

export const initialState: SwapState = {
  independentField: Field.INPUT,
  fixedField: Field.INPUT,
  typedValue: '',
  inputValue: '',
  [Field.INPUT]: {
    currencyId: '',
  },
  [Field.OUTPUT]: {
    currencyId: '',
  },
  [Field.PRICE]: {
    currencyId: '',
  },
  recipient: null,
}

export default createReducer<SwapState>(initialState, (builder) =>
  builder
    .addCase(
      replaceSwapState,
      (
        state,
        { payload: { typedValue, inputValue, recipient, field, fixedField, inputCurrencyId, outputCurrencyId } }
      ) => {
        return {
          [Field.INPUT]: {
            currencyId: inputCurrencyId ?? null,
          },
          [Field.OUTPUT]: {
            currencyId: outputCurrencyId ?? null,
          },
          [Field.PRICE]: {
            currencyId: outputCurrencyId ?? null,
          },
          independentField: field,
          fixedField,
          typedValue,
          inputValue,
          recipient,
        }
      }
    )
    .addCase(selectCurrency, (state, { payload: { currencyId, field } }) => {
      const otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT
      if (field === Field.PRICE)
        return {
          ...state,
        }

      if (currencyId === state[otherField].currencyId) {
        // the case where we have to swap the order
        return {
          ...state,
          independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
          [field]: { currencyId },
          [otherField]: { currencyId: state[field].currencyId },
        }
      } else {
        // the normal case
        return {
          ...state,
          [field]: { currencyId },
        }
      }
    })
    .addCase(switchCurrencies, (state) => {
      return {
        ...initialState,
        [Field.INPUT]: { currencyId: state[Field.OUTPUT].currencyId },
        [Field.OUTPUT]: { currencyId: state[Field.INPUT].currencyId },
      }
    })
    .addCase(typeInput, (state, { payload: { field, typedValue } }) => {
      return field === Field.INPUT
        ? {
            ...state,
            inputValue: typedValue,
            independentField: field,
            typedValue,
          }
        : {
            ...state,
            independentField: field,
            typedValue,
          }
    })
    .addCase(setRecipient, (state, { payload: { recipient } }) => {
      state.recipient = recipient
    })
)
