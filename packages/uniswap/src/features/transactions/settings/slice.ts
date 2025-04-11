import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import {
  DEFAULT_PROTOCOL_OPTIONS,
  FrontendSupportedProtocol,
} from 'uniswap/src/features/transactions/swap/utils/protocols'

// The settingKey is used to identify the settings slice in the redux store
// TransactionSettings components are shared between swap and lp, but we want
// to keep the custom settings themselves separate.
export enum TransactionSettingKey {
  Swap = 'swap',
  LP = 'lp',
}

export interface TransactionSettingsState {
  autoSlippageTolerance?: number
  customSlippageTolerance?: number
  customDeadline?: number
  selectedProtocols: FrontendSupportedProtocol[]
  slippageWarningModalSeen: boolean
}

export const initialTransactionSettingsState: TransactionSettingsState = {
  selectedProtocols: DEFAULT_PROTOCOL_OPTIONS,
  slippageWarningModalSeen: false,
}

const slice = createSlice({
  name: 'transactionSettings',
  initialState: {
    [TransactionSettingKey.Swap]: initialTransactionSettingsState,
    [TransactionSettingKey.LP]: initialTransactionSettingsState,
  },
  reducers: {
    setTransactionSettings: (
      state,
      { payload }: PayloadAction<Partial<TransactionSettingsState> & { settingKey: TransactionSettingKey }>,
    ) => {
      if (!payload.settingKey) {
        throw new Error('TransactionSettingsState settingKey not provided')
      }

      const { settingKey, ...settings } = payload
      Object.assign(state[settingKey], settings)
    },
  },
})

export const { setTransactionSettings } = slice.actions

export const transactionSettingsReducer = slice.reducer
