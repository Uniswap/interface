import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { shallowEqual } from 'react-redux'
import { NATIVE_ADDRESS } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { AssetType, TradeableAsset } from 'src/entities/assets'
import { TransactionType } from 'src/features/transactions/types'

export enum CurrencyField {
  INPUT,
  OUTPUT,
}

export type GasSpendEstimate = Partial<Record<TransactionType, string>>

export interface TransactionState {
  [CurrencyField.INPUT]: TradeableAsset | null
  [CurrencyField.OUTPUT]: TradeableAsset | null
  exactCurrencyField: CurrencyField
  exactAmountToken: string
  exactAmountUSD?: string
  recipient?: string
  isUSDInput?: boolean
  gasSpendEstimate?: GasSpendEstimate
  gasPrice?: string // gas price in native currency
  exactApproveRequired?: boolean // undefined except in rare instances when infinite approve is not supported by a token
}

const ETH_TRADEABLE_ASSET: TradeableAsset = {
  address: NATIVE_ADDRESS,
  chainId: ChainId.Mainnet,
  type: AssetType.Currency,
}

// TODO: use native token for chain with highest total USD balance
// instead of defaulting to mainnet eth
export const initialState: Readonly<TransactionState> = {
  [CurrencyField.INPUT]: ETH_TRADEABLE_ASSET,
  [CurrencyField.OUTPUT]: null,
  exactCurrencyField: CurrencyField.INPUT,
  exactAmountToken: '',
  exactAmountUSD: '',
  isUSDInput: false,
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

      // on selecting a new input currency, reset input amounts
      if (field === state.exactCurrencyField) {
        state.exactAmountToken = ''
        state.exactAmountUSD = ''
      }
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

      state.exactAmountToken = ''
      state.exactAmountUSD = ''
    },
    /** Processes a new typed value for the given `field` */
    updateExactAmountToken: (
      state,
      action: PayloadAction<{
        field?: CurrencyField
        amount: string
      }>
    ) => {
      const { field, amount } = action.payload
      if (field) {
        state.exactCurrencyField = field
      }
      state.exactAmountToken = amount
    },
    /** Processes a new typed value for the given `field` */
    updateExactAmountUSD: (
      state,
      action: PayloadAction<{
        field?: CurrencyField
        amount: string
      }>
    ) => {
      const { field, amount } = action.payload
      if (field) {
        state.exactCurrencyField = field
      }
      state.exactAmountUSD = amount
    },
    /** Changes the recipient */
    selectRecipient: (state, action: PayloadAction<{ recipient: Address }>) => {
      const { recipient } = action.payload
      state.recipient = recipient
    },

    toggleUSDInput: (state, action: PayloadAction<boolean>) => {
      state.isUSDInput = action.payload
    },
    updateGasEstimates: (
      state,
      action: PayloadAction<{
        gasEstimates?: GasSpendEstimate
        gasPrice?: string
      }>
    ) => {
      const { gasEstimates, gasPrice } = action.payload
      if (gasPrice) state.gasPrice = gasPrice

      state.gasSpendEstimate = {
        ...state.gasSpendEstimate,
        ...(gasEstimates ?? {}),
      }
    },
    setExactApproveRequired: (state, action: PayloadAction<boolean>) => {
      state.exactApproveRequired = action.payload
    },
    clearGasEstimates: (state) => {
      state.gasPrice = undefined
      state.gasSpendEstimate = undefined
    },
  },
})

export const {
  selectCurrency,
  switchCurrencySides,
  updateExactAmountToken,
  updateExactAmountUSD,
  selectRecipient,
  toggleUSDInput,
  updateGasEstimates,
  clearGasEstimates,
  setExactApproveRequired,
} = slice.actions
export const { reducer: transactionStateReducer, actions: transactionStateActions } = slice
