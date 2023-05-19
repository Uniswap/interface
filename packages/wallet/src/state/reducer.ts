import { combineReducers } from 'redux'
import { persistReducer } from 'redux-persist'
import { providersReducer } from 'wallet/src/features/providers'
import { walletReducer } from 'wallet/src/features/wallet/slice'
import { PersistedStorage } from 'wallet/src/utils/persistedStorage'
import { monitoredSagaReducers } from './saga'

export const sharedReducers = {
  providers: providersReducer,
  saga: monitoredSagaReducers,
  wallet: walletReducer,
} as const

const whitelist: Array<keyof typeof sharedReducers> = ['providers', 'wallet']

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
