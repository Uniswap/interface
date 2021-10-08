import { createReducer } from '@reduxjs/toolkit'

import {
  resetSettings,
  setExpertMode,
  setGasPrice,
  setMaxSlippage,
  setMultiHop,
  setTransactionDeadline,
  toggleShowDetails,
} from './actions'

export enum GasPrices {
  FAST = '155',
  TRADER = '175',
}

export type GasPrice = GasPrices | number

export enum MaxSlippages {
  P01 = '0.1',
  P05 = '0.5',
}

export type MaxSlippage = MaxSlippages | number

export interface Settings {
  gasPrice: GasPrice | number
  maxSlippage: MaxSlippage | number
  transactionDeadline: number
  expertMode: boolean
  multiHop: boolean
}

export interface SwapState extends Settings {
  showDetails: boolean
}

const initialSettings: Settings = {
  gasPrice: GasPrices.TRADER,
  maxSlippage: MaxSlippages.P05,
  transactionDeadline: 40,
  expertMode: false,
  multiHop: true,
}

export const initialState: SwapState = {
  showDetails: false,
  ...initialSettings,
}

export default createReducer<SwapState>(initialState, (builder) =>
  builder
    .addCase(toggleShowDetails, (state) => ({ ...state, showDetails: !state.showDetails }))
    .addCase(resetSettings, (state) => ({ ...state, ...initialSettings }))
    .addCase(setGasPrice, (state, { payload: gasPrice }) => ({ ...state, gasPrice }))
    .addCase(setMaxSlippage, (state, { payload: maxSlippage }) => ({ ...state, maxSlippage }))
    .addCase(setTransactionDeadline, (state, { payload: transactionDeadline }) => ({ ...state, transactionDeadline }))
    .addCase(setExpertMode, (state, { payload: expertMode }) => ({ ...state, expertMode }))
    .addCase(setMultiHop, (state, { payload: multiHop }) => ({ ...state, multiHop }))
)
