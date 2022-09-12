import { createReducer } from '@reduxjs/toolkit'
import { parse } from 'qs'

import { FeeConfig } from 'hooks/useSwapV2Callback'
import { Aggregator } from 'utils/aggregator'

import {
  Field,
  chooseToSaveGas,
  replaceSwapState,
  resetSelectCurrency,
  selectCurrency,
  setFeeConfig,
  setRecipient,
  setTrade,
  setTrendingSoonShowed,
  switchCurrencies,
  switchCurrenciesV2,
  typeInput,
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
  readonly trendingSoonShowed?: boolean
  readonly trade?: Aggregator
}

const { search } = window.location
const { inputCurrency, outputCurrency } = parse(search.indexOf('?') === 0 ? search.substring(1) : search)

const initialState: SwapState = {
  independentField: Field.INPUT,
  typedValue: '',
  [Field.INPUT]: {
    currencyId: inputCurrency?.toString() || '',
  },
  [Field.OUTPUT]: {
    currencyId: outputCurrency?.toString() || '',
  },
  recipient: null,
  saveGas: false,
  feeConfig: undefined,
  // Flag to only show animation of trending soon banner 1 time
  trendingSoonShowed: false,
  trade: undefined,
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
          typedValue: typedValue || state.typedValue || '1',
          recipient,
          saveGas: state.saveGas,
          feeConfig,
          trendingSoonShowed: state.trendingSoonShowed,
          trade: state.trade,
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
    })
    .addCase(setTrendingSoonShowed, state => {
      state.trendingSoonShowed = true
    })
    .addCase(setTrade, (state, { payload: { trade } }) => {
      state.trade = trade
    }),
)
