import { createReducer } from '@reduxjs/toolkit'

import {
  Field,
  replaceLimitState,
  selectCurrency,
  setBuying,
  setRecipient,
  switchCurrencies,
  typeInput,
} from './actions'

export interface LimitState {
  readonly priceTypedValue: string
  readonly tokenTypedValue: string
  readonly [Field.TOKEN]: {
    readonly currencyId: string | undefined
  }
  readonly [Field.PRICE]: {
    readonly currencyId: string | undefined
  }
  // the typed recipient address or ENS name, or null if Limit should go to sender
  readonly recipient: string | null
  readonly buying: boolean
}

const initialState: LimitState = {
  priceTypedValue: '',
  tokenTypedValue: '',
  [Field.TOKEN]: {
    currencyId: '',
  },
  [Field.PRICE]: {
    currencyId: '',
  },
  recipient: null,
  buying: true,
}

export default createReducer<LimitState>(initialState, (builder) =>
  builder
    .addCase(
      replaceLimitState,
      (
        state,
        { payload: { tokenTypedValue, priceTypedValue, recipient, field, tokenCurrencyId, priceCurrencyId, buying } }
      ) => {
        return {
          [Field.TOKEN]: {
            currencyId: tokenCurrencyId,
          },
          [Field.PRICE]: {
            currencyId: priceCurrencyId,
          },
          independentField: field,
          tokenTypedValue,
          priceTypedValue,
          recipient,
          buying,
        }
      }
    )
    .addCase(selectCurrency, (state, { payload: { currencyId, field } }) => {
      const otherField = field === Field.TOKEN ? Field.PRICE : Field.TOKEN
      if (currencyId === state[otherField].currencyId) {
        // the case where we have to Limit the order
        return {
          ...state,
          [field]: { currencyId: currencyId },
          [otherField]: { currencyId: state[field].currencyId },
        }
      } else {
        // the normal case
        return {
          ...state,
          [field]: { currencyId: currencyId },
        }
      }
    })
    .addCase(switchCurrencies, (state) => {
      return {
        ...state,
        [Field.TOKEN]: { currencyId: state[Field.PRICE].currencyId },
        [Field.PRICE]: { currencyId: state[Field.TOKEN].currencyId },
      }
    })
    .addCase(typeInput, (state, { payload: { field, typedValue } }) => {
      if (field === Field.PRICE) {
        return {
          ...state,
          priceTypedValue: typedValue,
        }
      } else if (field === Field.TOKEN) {
        return {
          ...state,
          tokenTypedValue: typedValue,
        }
      }
      return state
    })
    .addCase(setRecipient, (state, { payload: { recipient } }) => {
      state.recipient = recipient
    })
    .addCase(setBuying, (state, { payload: { buying } }) => {
      state.buying = buying
    })
)
