import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { MethodParameters } from '@uniswap/v3-sdk'
import { shallowEqual } from 'react-redux'
import { WarningModalType } from 'src/components/warnings/types'
import { NATIVE_ADDRESS } from 'src/constants/addresses'
import { ChainId } from 'src/constants/chains'
import { AssetType, TradeableAsset } from 'src/entities/assets'
import { FeeInfo } from 'src/features/gas/types'
import { TransactionType } from 'src/features/transactions/types'

export enum CurrencyField {
  INPUT = 'input',
  OUTPUT = 'output',
}
export interface GasFeeByTransactionType {
  [TransactionType.Approve]?: FeeInfo | null // null means approve tx not needed (e.g., allowance is sufficient)
  [TransactionType.Swap]?: FeeInfo
  [TransactionType.Send]?: FeeInfo
}

// the string is gasFee (gasPrice * gasLimit) denoted in wei
export type OptimismL1FeeEstimate = Partial<Record<TransactionType, string>>

export interface TransactionState {
  txId?: string
  [CurrencyField.INPUT]: TradeableAsset | null
  [CurrencyField.OUTPUT]: TradeableAsset | null
  exactCurrencyField: CurrencyField
  exactAmountToken: string
  exactAmountUSD?: string
  recipient?: string
  isUSDInput?: boolean
  gasFeeEstimate?: GasFeeByTransactionType
  optimismL1Fee?: OptimismL1FeeEstimate // Optimism txs have a L1 fee. Not relevant for submitting txs but needs to be accounted for in SwapDetails
  exactApproveRequired?: boolean // undefined except in rare instances when infinite approve is not supported by a token
  showNewAddressWarning?: boolean
  showNoBalancesWarning?: boolean
  swapMethodParameters?: MethodParameters
  warningModalType?: WarningModalType
  selectingCurrencyField?: CurrencyField
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
  warningModalType: WarningModalType.NONE,
  selectingCurrencyField: undefined,
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
      // prettier enforces this ; here https://github.com/prettier/prettier/issues/4193
      // eslint-disable-next-line no-extra-semi
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
    /* Changes the input field */
    updateExactCurrencyField: (
      state,
      action: PayloadAction<{ currencyField: CurrencyField; newExactAmount: string }>
    ) => {
      const { currencyField, newExactAmount } = action.payload
      if (state.exactCurrencyField === currencyField) return

      state.exactCurrencyField = currencyField
      if (state.isUSDInput) {
        state.exactAmountUSD = newExactAmount
      } else {
        state.exactAmountToken = newExactAmount
      }
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
    toggleUSDInput: (state, action: PayloadAction<boolean>) => {
      state.isUSDInput = action.payload
    },
    updateGasEstimates: (
      state,
      action: PayloadAction<{ gasEstimates: GasFeeByTransactionType }>
    ) => {
      state.gasFeeEstimate = {
        ...state.gasFeeEstimate,
        ...action.payload.gasEstimates,
      }
    },
    updateOptimismL1Fee: (
      state,
      action: PayloadAction<{ optimismL1Fee?: OptimismL1FeeEstimate }>
    ) => {
      const { optimismL1Fee } = action.payload
      state.optimismL1Fee = {
        ...state.optimismL1Fee,
        ...(optimismL1Fee ?? {}),
      }
    },
    updateSwapMethodParamaters: (state, action: PayloadAction<MethodParameters | undefined>) => {
      state.swapMethodParameters = action.payload
    },
    setExactApproveRequired: (state, action: PayloadAction<boolean>) => {
      state.exactApproveRequired = action.payload
    },
    clearGasSwapData: (state) => {
      state.gasFeeEstimate = undefined
      state.exactApproveRequired = undefined
      state.swapMethodParameters = undefined
    },
    showWarningModal: (state, action: PayloadAction<WarningModalType>) => {
      state.warningModalType = action.payload
    },
    closeWarningModal: (state) => {
      state.warningModalType = WarningModalType.NONE
    },
    showNewAddressWarningModal: (state) => {
      state.showNewAddressWarning = true
    },
    closeNewAddressWarningModal: (state) => {
      state.showNewAddressWarning = false
    },
    showNoBalancesWarningModal: (state) => {
      state.showNoBalancesWarning = true
    },
    closeNoBalancesWarningModal: (state) => {
      state.showNoBalancesWarning = false
    },
    setTxId: (state, action: PayloadAction<string>) => {
      state.txId = action.payload
    },
    showCurrencySelector: (state, action: PayloadAction<CurrencyField | undefined>) => {
      state.selectingCurrencyField = action.payload
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
  updateGasEstimates,
  updateOptimismL1Fee,
  updateSwapMethodParamaters,
  clearGasSwapData,
  setExactApproveRequired,
  showWarningModal,
  closeWarningModal,
  showNewAddressWarningModal,
  closeNewAddressWarningModal,
  showNoBalancesWarningModal,
  closeNoBalancesWarningModal,
  setTxId,
  showCurrencySelector,
} = slice.actions
export const { reducer: transactionStateReducer, actions: transactionStateActions } = slice
