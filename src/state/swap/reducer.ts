import { createReducer } from '@reduxjs/toolkit'

import { APP_PATHS } from 'constants/index'
import { FeeConfig } from 'hooks/useSwapV2Callback'
import { Aggregator } from 'utils/aggregator'
import { queryStringToObject } from 'utils/string'

import {
  Field,
  chooseToSaveGas,
  encodedSolana,
  replaceSwapState,
  resetSelectCurrency,
  selectCurrency,
  setRecipient,
  setTrade,
  setTrendingSoonShowed,
  switchCurrencies,
  switchCurrenciesV2,
  typeInput,
} from './actions'
import { SolanaEncode } from './types'

export interface SwapState {
  readonly independentField: Field // TODO: remove since unused anymore
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
  readonly encodeSolana?: SolanaEncode

  readonly showConfirm: boolean
  readonly tradeToConfirm: Aggregator | undefined
  readonly attemptingTxn: boolean
  readonly swapErrorMessage: string | undefined
  readonly txHash: string | undefined

  readonly isSelectTokenManually: boolean
}

const { search, pathname } = window.location
const { inputCurrency = '', outputCurrency = '' } = pathname.startsWith(APP_PATHS.SWAP)
  ? queryStringToObject(search)
  : {}

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
  encodeSolana: undefined,

  showConfirm: false,
  tradeToConfirm: undefined,
  attemptingTxn: false,
  swapErrorMessage: undefined,
  txHash: undefined,

  isSelectTokenManually: false,
}

export default createReducer<SwapState>(initialState, builder =>
  builder
    .addCase(
      replaceSwapState,
      (state, { payload: { typedValue, recipient, field, inputCurrencyId, outputCurrencyId, feeConfig } }) => {
        return {
          ...state,
          [Field.INPUT]: {
            currencyId: inputCurrencyId,
          },
          [Field.OUTPUT]: {
            currencyId: outputCurrencyId,
          },
          independentField: field,
          typedValue: typedValue || state.typedValue || '1',
          recipient,
          feeConfig,
        }
      },
    )
    .addCase(encodedSolana, (state, { payload: { encodeSolana } }) => {
      return {
        ...state,
        encodeSolana,
      }
    })
    .addCase(selectCurrency, (state, { payload: { currencyId, field } }) => {
      const otherField = field === Field.INPUT ? Field.OUTPUT : Field.INPUT
      if (currencyId === state[otherField].currencyId) {
        // the case where we have to swap the order
        return {
          ...state,
          isSelectTokenManually: true,
          typedValue: '',
          independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
          [field]: { currencyId },
          [otherField]: { currencyId: state[field].currencyId },
        }
      } else {
        // the normal case
        return {
          ...state,
          isSelectTokenManually: true,
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
        isSelectTokenManually: true,
        independentField: state.independentField === Field.INPUT ? Field.OUTPUT : Field.INPUT,
        [Field.INPUT]: { currencyId: state[Field.OUTPUT].currencyId },
        [Field.OUTPUT]: { currencyId: state[Field.INPUT].currencyId },
      }
    })
    .addCase(switchCurrenciesV2, state => {
      return {
        ...state,
        independentField: Field.INPUT,
        isSelectTokenManually: true,
        [Field.INPUT]: { currencyId: state[Field.OUTPUT].currencyId },
        [Field.OUTPUT]: { currencyId: state[Field.INPUT].currencyId },
      }
    })
    .addCase(typeInput, (state, { payload: { field, typedValue } }) => {
      state.independentField = field
      state.typedValue = typedValue
    })
    .addCase(setRecipient, (state, { payload: { recipient } }) => {
      state.recipient = recipient
    })
    .addCase(chooseToSaveGas, (state, { payload: { saveGas } }) => {
      state.saveGas = saveGas
    })
    .addCase(setTrendingSoonShowed, state => {
      state.trendingSoonShowed = true
    })
    .addCase(setTrade, (state, { payload: { trade } }) => {
      state.trade = trade
      state.encodeSolana = undefined
    }),
)
