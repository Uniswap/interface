import { combineReducers } from 'redux'
import { chainsReducer } from 'wallet/src/features/chains/slice'
import { walletReducer } from 'wallet/src/features/wallet/slice'

export const sharedReducers = {
  chains: chainsReducer,
  wallet: walletReducer,
} as const

// used to type RootState
export const sharedRootReducer = combineReducers(sharedReducers)
export type RootReducerNames = keyof typeof sharedReducers
