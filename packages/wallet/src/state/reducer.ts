import { combineReducers } from 'redux'
import { appearanceSettingsReducer } from 'wallet/src/features/appearance/slice'
import { favoritesReducer } from 'wallet/src/features/favorites/slice'
import { fiatCurrencySettingsReducer } from 'wallet/src/features/fiatCurrency/slice'
import { fiatOnRampAggregatorApi, fiatOnRampApi } from 'wallet/src/features/fiatOnRamp/api'
import { languageSettingsReducer } from 'wallet/src/features/language/slice'
import { notificationReducer } from 'wallet/src/features/notifications/slice'
import { transactionReducer } from 'wallet/src/features/transactions/slice'
import { walletReducer } from 'wallet/src/features/wallet/slice'

export const sharedReducers = {
  [fiatOnRampApi.reducerPath]: fiatOnRampApi.reducer,
  [fiatOnRampAggregatorApi.reducerPath]: fiatOnRampAggregatorApi.reducer,
  appearanceSettings: appearanceSettingsReducer,
  favorites: favoritesReducer,
  fiatCurrencySettings: fiatCurrencySettingsReducer,
  languageSettings: languageSettingsReducer,
  notifications: notificationReducer,
  transactions: transactionReducer,
  wallet: walletReducer,
} as const

// used to type RootState
export const sharedRootReducer = combineReducers(sharedReducers)
export type RootReducerNames = keyof typeof sharedReducers
