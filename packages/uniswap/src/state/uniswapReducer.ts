import { combineReducers } from 'redux'
import { uniswapBehaviorHistoryReducer } from 'uniswap/src/features/behaviorHistory/slice'
import { favoritesReducer } from 'uniswap/src/features/favorites/slice'
import { fiatOnRampAggregatorApi } from 'uniswap/src/features/fiatOnRamp/api'
import { notificationReducer } from 'uniswap/src/features/notifications/slice/slice'
import { portfolioReducer } from 'uniswap/src/features/portfolio/slice/slice'
import { searchHistoryReducer } from 'uniswap/src/features/search/searchHistorySlice'
import { userSettingsReducer } from 'uniswap/src/features/settings/slice'
import { delegationReducer } from 'uniswap/src/features/smartWallet/delegation/slice'
import { timingReducer } from 'uniswap/src/features/timing/slice'
import { tokensReducer } from 'uniswap/src/features/tokens/warnings/slice/slice'
import { transactionReducer } from 'uniswap/src/features/transactions/slice'
import { swapSettingsReducer } from 'uniswap/src/features/transactions/swap/state/slice'
import { visibilityReducer } from 'uniswap/src/features/visibility/slice'

export const uniswapReducers = {
  [fiatOnRampAggregatorApi.reducerPath]: fiatOnRampAggregatorApi.reducer,
  swapSettings: swapSettingsReducer,
  favorites: favoritesReducer,
  notifications: notificationReducer,
  portfolio: portfolioReducer,
  searchHistory: searchHistoryReducer,
  timing: timingReducer,
  tokens: tokensReducer,
  transactions: transactionReducer,
  uniswapBehaviorHistory: uniswapBehaviorHistoryReducer,
  userSettings: userSettingsReducer,
  visibility: visibilityReducer,
  delegation: delegationReducer,
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
  'visibility',
]

export type UniswapState = ReturnType<typeof uniswapReducer>
