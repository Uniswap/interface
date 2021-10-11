import { createReducer } from '@reduxjs/toolkit'

import {
  resetSettings,
  setExpertMode,
  setGasPrice,
  setMaxSlippage,
  setMultihop,
  setTransactionDeadline,
  toggleShowDetails,
} from './actions'

export enum GasPrice {
  CUSTOM = 0,
  FAST = 155,
  TRADER = 175,
  DEFAULT = 175,
}

export enum MaxSlippage {
  CUSTOM = 0,
  P01 = 0.1,
  P05 = 0.5,
  DEFAULT = 0.5,
}

export interface Settings {
  gasPrice: GasPrice
  customGasPrice?: number
  maxSlippage: MaxSlippage
  customMaxSlippage?: number
  transactionDeadline: number
  expertMode: boolean
  multihop: boolean
}

export interface SwapState extends Settings {
  showDetails: boolean
}

const initialSettings: Settings = {
  gasPrice: GasPrice.TRADER,
  customGasPrice: undefined,
  maxSlippage: MaxSlippage.P05,
  customMaxSlippage: undefined,
  transactionDeadline: 40,
  expertMode: false,
  multihop: true,
}

export const initialState: SwapState = {
  showDetails: false,
  ...initialSettings,
}

export default createReducer<SwapState>(initialState, (builder) =>
  builder
    .addCase(toggleShowDetails, (state) => ({ ...state, showDetails: !state.showDetails }))
    .addCase(resetSettings, (state) => ({ ...state, ...initialSettings }))
    .addCase(setGasPrice, (state, { payload: { gasPrice, customGasPrice } }) => ({
      ...state,
      gasPrice,
      customGasPrice: customGasPrice ?? state.customGasPrice,
    }))
    .addCase(setMaxSlippage, (state, { payload: { maxSlippage, customMaxSlippage } }) => ({
      ...state,
      maxSlippage,
      customMaxSlippage: customMaxSlippage ?? state.customMaxSlippage,
    }))
    .addCase(setTransactionDeadline, (state, { payload: transactionDeadline }) => ({ ...state, transactionDeadline }))
    .addCase(setExpertMode, (state, { payload: expertMode }) => ({ ...state, expertMode }))
    .addCase(setMultihop, (state, { payload: multihop }) => ({ ...state, multihop }))
)
