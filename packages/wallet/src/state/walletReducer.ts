import { combineReducers } from 'redux'
import { PersistState } from 'redux-persist'
import { timingReducer } from 'uniswap/src/features/timing/slice'
import { uniswapPersistedStateList, uniswapReducers } from 'uniswap/src/state/uniswapReducer'
import { appearanceSettingsReducer } from 'wallet/src/features/appearance/slice'
import { behaviorHistoryReducer } from 'wallet/src/features/behaviorHistory/slice'
import { favoritesReducer } from 'wallet/src/features/favorites/slice'
import { fiatCurrencySettingsReducer } from 'wallet/src/features/fiatCurrency/slice'
import { languageSettingsReducer } from 'wallet/src/features/language/slice'
import { notificationReducer } from 'wallet/src/features/notifications/slice'
import { searchHistoryReducer } from 'wallet/src/features/search/searchHistorySlice'
import { telemetryReducer } from 'wallet/src/features/telemetry/slice'
import { tokensReducer } from 'wallet/src/features/tokens/tokensSlice'
import { transactionReducer } from 'wallet/src/features/transactions/slice'
import { walletReducer } from 'wallet/src/features/wallet/slice'
import { SagaState } from 'wallet/src/utils/saga'

export const walletReducers = {
  ...uniswapReducers,
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
export const walletRootReducer = combineReducers(walletReducers)

export const walletPersistedStateList: Array<keyof typeof walletReducers> = [
  ...uniswapPersistedStateList,
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

export type WalletStateReducersOnly = ReturnType<typeof walletRootReducer>
export type WalletState = WalletStateReducersOnly & {
  saga: Record<string, SagaState>
} & { _persist?: PersistState }
