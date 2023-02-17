import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { shallowEqual } from 'react-redux'
import { NATIVE_ADDRESS } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { AssetType, TradeableAsset } from 'src/entities/assets'

export enum CurrencyField {
  INPUT = 'input',
  OUTPUT = 'output',
}

export interface TransactionState {
  txId?: string
  [CurrencyField.INPUT]: TradeableAsset | null
  [CurrencyField.OUTPUT]: TradeableAsset | null
  exactCurrencyField: CurrencyField
  exactAmountToken: string
  exactAmountUSD?: string
  focusOnCurrencyField?: CurrencyField | null
  recipient?: string
  isUSDInput?: boolean
  selectingCurrencyField?: CurrencyField
  showRecipientSelector?: boolean
}

const ETH_TRADEABLE_ASSET: TradeableAsset = {
  address: NATIVE_ADDRESS,
  chainId: ChainId.Mainnet,
  type: AssetType.Currency,
}

// TODO: [MOB-3907] use native token for chain with highest total USD balance
// instead of defaulting to mainnet eth
export const initialState: Readonly<TransactionState> = {
  [CurrencyField.INPUT]: ETH_TRADEABLE_ASSET,
  [CurrencyField.OUTPUT]: null,
  exactCurrencyField: CurrencyField.INPUT,
  focusOnCurrencyField: CurrencyField.INPUT,
  exactAmountToken: '',
  exactAmountUSD: '',
  isUSDInput: false,
  selectingCurrencyField: undefined,
  showRecipientSelector: true,
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
      state.focusOnCurrencyField = state.exactCurrencyField
      ;[state[CurrencyField.INPUT], state[CurrencyField.OUTPUT]] = [
        state[CurrencyField.OUTPUT],
        state[CurrencyField.INPUT],
      ]
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
    clearRecipient: (state) => {
      state.recipient = undefined
    },
    onFocus: (state, action: PayloadAction<CurrencyField | null>) => {
      state.focusOnCurrencyField = action.payload
    },
    toggleUSDInput: (state, action: PayloadAction<boolean>) => {
      state.isUSDInput = action.payload
    },
    setTxId: (state, action: PayloadAction<string>) => {
      state.txId = action.payload
    },
    showTokenSelector: (state, action: PayloadAction<CurrencyField | undefined>) => {
      state.selectingCurrencyField = action.payload
    },
    toggleShowRecipientSelector: (state) => {
      state.showRecipientSelector = !state.showRecipientSelector
    },
  },
})

export const {
  selectCurrency,
  switchCurrencySides,
  updateExactAmountToken,
  updateExactAmountUSD,
  selectRecipient,
  clearRecipient,
  toggleUSDInput,
  setTxId,
  showTokenSelector,
  toggleShowRecipientSelector,
} = slice.actions
export const { reducer: transactionStateReducer, actions: transactionStateActions } = slice
