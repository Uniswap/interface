import { combineReducers } from 'redux'
import { chainsReducer } from 'wallet/src/features/chains/slice'

export const sharedReducers = {
  chains: chainsReducer,
} as const

// used to type RootState
export const sharedRootReducer = combineReducers(sharedReducers)
export type RootReducerNames = keyof typeof sharedReducers
