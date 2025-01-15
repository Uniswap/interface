import { combineReducers } from 'redux'
import { uniswapBehaviorHistoryReducer } from 'uniswap/src/features/behaviorHistory/slice'
import { favoritesReducer } from 'uniswap/src/features/favorites/slice'
import { getFiatOnRampAggregatorApi } from 'uniswap/src/features/fiatOnRamp/api'
import { notificationReducer } from 'uniswap/src/features/notifications/slice'
import { portfolioReducer } from 'uniswap/src/features/portfolio/slice/slice'
import { searchHistoryReducer } from 'uniswap/src/features/search/searchHistorySlice'
import { userSettingsReducer } from 'uniswap/src/features/settings/slice'
import { timingReducer } from 'uniswap/src/features/timing/slice'
import { tokensReducer } from 'uniswap/src/features/tokens/slice/slice'
import { transactionSettingsReducer } from 'uniswap/src/features/transactions/settings/slice'
import { transactionReducer } from 'uniswap/src/features/transactions/slice'

export const uniswapReducers = {
  [getFiatOnRampAggregatorApi().reducerPath]: getFiatOnRampAggregatorApi().reducer,
  favorites: favoritesReducer,
  notifications: notificationReducer,
  portfolio: portfolioReducer,
  searchHistory: searchHistoryReducer,
  timing: timingReducer,
  tokens: tokensReducer,
  transactions: transactionReducer,
  transactionSettings: transactionSettingsReducer,
  uniswapBehaviorHistory: uniswapBehaviorHistoryReducer,
  userSettings: userSettingsReducer,
} as const

// used to type RootState
export const uniswapReducer = combineReducers(uniswapReducers)

export const uniswapPersistedStateList: Array<keyof typeof uniswapReducers> = [
  'favorites',
  'portfolio',
  'searchHistory',
  'tokens',
  'transactions',
  'uniswapBehaviorHistory',
  'userSettings',
]

export type UniswapState = ReturnType<typeof uniswapReducer>
