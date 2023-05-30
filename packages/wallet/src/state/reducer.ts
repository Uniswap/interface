import { combineReducers } from 'redux'
import { persistReducer } from 'redux-persist'
import { chainsReducer } from 'wallet/src/features/chains/slice'
import { walletReducer } from 'wallet/src/features/wallet/slice'
import { PersistedStorage } from 'wallet/src/utils/persistedStorage'
import { monitoredSagaReducers } from './saga'

export const sharedReducers = {
  chains: chainsReducer,
  saga: monitoredSagaReducers,
  wallet: walletReducer,
} as const

const whitelist: Array<keyof typeof sharedReducers> = ['wallet']

export const persistConfig = {
  key: 'root',
  storage: new PersistedStorage(),
  whitelist,
  version: 1,
  // TODO: migrate script
  // migrate: () => {}
}

// used to type RootState
export const sharedRootReducer = persistReducer(persistConfig, combineReducers(sharedReducers))
