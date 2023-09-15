import { combineReducers } from 'redux'
import { appearanceSettingsReducer } from 'wallet/src/features/appearance/slice'
import { fiatOnRampApi } from 'wallet/src/features/fiatOnRamp/api'
import { notificationReducer } from 'wallet/src/features/notifications/slice'
import { transactionReducer } from 'wallet/src/features/transactions/slice'
import { walletReducer } from 'wallet/src/features/wallet/slice'

export const sharedReducers = {
  [fiatOnRampApi.reducerPath]: fiatOnRampApi.reducer,
  appearanceSettings: appearanceSettingsReducer,
  notifications: notificationReducer,
  transactions: transactionReducer,
  wallet: walletReducer,
} as const

// used to type RootState
export const sharedRootReducer = combineReducers(sharedReducers)
export type RootReducerNames = keyof typeof sharedReducers
