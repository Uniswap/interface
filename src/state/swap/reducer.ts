import { createReducer } from '@reduxjs/toolkit'
import { FeeConfig } from 'hooks/useSwapV2Callback'
import {
  chooseToSaveGas,
  Field,
  replaceSwapState,
  selectCurrency,
  resetSelectCurrency,
  setRecipient,
  switchCurrencies,
  switchCurrenciesV2,
  typeInput,
  setFeeConfig,
} from './actions'

export interface SwapState {
  readonly independentField: Field
  readonly typedValue: string
  readonly [Field.INPUT]: {
    readonly currencyId: string | undefined
  }
  readonly [Field.OUTPUT]: {
    readonly currencyId: string | undefined
  }
  // the typed recipient address or ENS name, or null if swap should go to sender
  readonly recipient: string | null
  readonly saveGas: boolean
  readonly feeConfig: FeeConfig | undefined
}

const initialState: SwapState = {
  independentField: Field.INPUT,
  typedValue: '',
  [Field.INPUT]: {
    currencyId: '',
  },
  [Field.OUTPUT]: {
    currencyId: '',
  },
  recipient: null,
  saveGas: false,
  feeConfig: undefined,
}

export default createReducer<SwapState>(initialState, builder =>
  builder
    .addCase(
      replaceSwapState,
      (state, { payload: { typedValue, recipient, field, inputCurrencyId, outputCurrencyId, feeConfig } }) => {
        return {
          [Field.INPUT]: {
            currencyId: inputCurrencyId,
          },
          [Field.OUTPUT]: {
            currencyId: outputCurrencyId,
          },
          independentField: field,
          typedValue: typedValue,
          recipient,
          saveGas: state.saveGas,
          feeConfig,
        }
      },
    )
    .addCase(selectCurrency, (state, { payload: { currencyId, field } }) => {
      const otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT
      if (currencyId === state[otherField].currencyId) {
        // the case where we have to swap the order
        return {
          ...state,
          typedValue: '',
          independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
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
    .addCase(resetSelectCurrency, (state, { payload: { field } }) => {
      return {
        ...state,
        [field]: { currencyId: '' },
      }
    })
    .addCase(switchCurrencies, state => {
      return {
        ...state,
        independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
        [Field.INPUT]: { currencyId: state[Field.OUTPUT].currencyId },
        [Field.OUTPUT]: { currencyId: state[Field.INPUT].currencyId },
      }
    })
    .addCase(switchCurrenciesV2, state => {
      return {
        ...state,
        // independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
        independentField: Field.INPUT,
        // typedValue: '',
        [Field.INPUT]: { currencyId: state[Field.OUTPUT].currencyId },
        [Field.OUTPUT]: { currencyId: state[Field.INPUT].currencyId },
      }
    })
    .addCase(typeInput, (state, { payload: { field, typedValue } }) => {
      return {
        ...state,
        independentField: field,
        typedValue,
      }
    })
    .addCase(setRecipient, (state, { payload: { recipient } }) => {
      state.recipient = recipient
    })
    .addCase(chooseToSaveGas, (state, { payload: { saveGas } }) => {
      state.saveGas = saveGas
    })
    .addCase(setFeeConfig, (state, { payload: { feeConfig } }) => {
      state.feeConfig = feeConfig
    }),
)
