import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { shallowEqual } from 'react-redux'
import { TradeableAsset } from 'src/entities/assets'

export enum CurrencyField {
  INPUT,
  OUTPUT,
}

export interface TransactionState {
  [CurrencyField.INPUT]: TradeableAsset | null
  [CurrencyField.OUTPUT]: TradeableAsset | null
  exactCurrencyField: CurrencyField
  exactAmount: string
  recipient?: string
}

export const initialState: Readonly<TransactionState> = {
  [CurrencyField.INPUT]: null,
  [CurrencyField.OUTPUT]: null,
  exactCurrencyField: CurrencyField.INPUT,
  exactAmount: '',
}

// using `createSlice` for convenience -- slice is not added to root reducer
const slice = createSlice({
  name: 'TransactionState',
  initialState,
  reducers: {
    /**
     * Sets currency at `field` to the given currency
     * If input/output currencies would be the same, it swaps the order
     * If network would change, unsets the dependent field
     */
    selectCurrency: (
      state,
      action: PayloadAction<{ field: CurrencyField; tradeableAsset: TradeableAsset }>
    ) => {
      const { field, tradeableAsset } = action.payload

      const nonExactField =
        field === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT

      // swap order if tokens are the same
      if (shallowEqual(tradeableAsset, state[nonExactField])) {
        state.exactCurrencyField = field
        state[nonExactField] = state[field]
      }

      // change independent field if network changed
      if (tradeableAsset.chainId !== state[nonExactField]?.chainId) {
        state.exactCurrencyField = field
        state[nonExactField] = null
      }

      state[field] = tradeableAsset
    },
    /** Switches input and output currencies */
    switchCurrencySides: (state) => {
      state.exactCurrencyField =
        state.exactCurrencyField === CurrencyField.INPUT
          ? CurrencyField.OUTPUT
          : CurrencyField.INPUT
      ;[state[CurrencyField.INPUT], state[CurrencyField.OUTPUT]] = [
        state[CurrencyField.OUTPUT],
        state[CurrencyField.INPUT],
      ]
    },
    /** Processes a new typed value for the given `field` */
    enterExactAmount: (
      state,
      action: PayloadAction<{ field: CurrencyField; exactAmount: string }>
    ) => {
      const { field, exactAmount } = action.payload
      state.exactCurrencyField = field
      state.exactAmount = exactAmount
    },
    /** Changes the recipient */
    selectRecipient: (state, action: PayloadAction<{ recipient: Address }>) => {
      const { recipient } = action.payload
      state.recipient = recipient
    },
  },
})

export const { selectCurrency, switchCurrencySides, enterExactAmount, selectRecipient } =
  slice.actions
export const { reducer: transactionStateReducer, actions: transactionStateActions } = slice
