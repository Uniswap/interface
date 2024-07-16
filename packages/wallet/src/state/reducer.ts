import { combineReducers } from 'redux'
import { fiatOnRampAggregatorApi } from 'uniswap/src/features/fiatOnRamp/api'
import { appearanceSettingsReducer } from 'wallet/src/features/appearance/slice'
import { behaviorHistoryReducer } from 'wallet/src/features/behaviorHistory/slice'
import { favoritesReducer } from 'wallet/src/features/favorites/slice'
import { fiatCurrencySettingsReducer } from 'wallet/src/features/fiatCurrency/slice'
import { languageSettingsReducer } from 'wallet/src/features/language/slice'
import { notificationReducer } from 'wallet/src/features/notifications/slice'
import { searchHistoryReducer } from 'wallet/src/features/search/searchHistorySlice'
import { telemetryReducer } from 'wallet/src/features/telemetry/slice'
import { timingReducer } from 'wallet/src/features/timing/slice'
import { tokensReducer } from 'wallet/src/features/tokens/tokensSlice'
import { transactionReducer } from 'wallet/src/features/transactions/slice'
import { walletReducer } from 'wallet/src/features/wallet/slice'

export const sharedReducers = {
  [fiatOnRampAggregatorApi.reducerPath]: fiatOnRampAggregatorApi.reducer,
  appearanceSettings: appearanceSettingsReducer,
  behaviorHistory: behaviorHistoryReducer,
  favorites: favoritesReducer,
  fiatCurrencySettings: fiatCurrencySettingsReducer,
  languageSettings: languageSettingsReducer,
  notifications: notificationReducer,
  searchHistory: searchHistoryReducer,
  telemetry: telemetryReducer,
  timing: timingReducer,
  tokens: tokensReducer,
  transactions: transactionReducer,
  wallet: walletReducer,
} as const

// used to type RootState
export const sharedRootReducer = combineReducers(sharedReducers)

export const sharedPersistedStateWhitelist: Array<RootReducerNames> = [
  'appearanceSettings',
  'behaviorHistory',
  'favorites',
  'notifications',
  'searchHistory',
  'telemetry',
  'tokens',
  'transactions',
  'wallet',
  'languageSettings',
  'fiatCurrencySettings',
]

export type SharedState = ReturnType<typeof sharedRootReducer>
export type RootReducerNames = keyof typeof sharedReducers
