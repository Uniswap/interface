import { combineReducers } from 'redux'
import { persistReducer } from 'redux-persist'
import { monitoredSagaReducers } from 'wallet/src/state/saga'
import { providersReducer } from '../features/providers'
import { walletReducer } from '../features/wallet/slice'
import { PersistedStorage } from '../utils/persistedStorage'

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
export const sharedRootReducer = persistReducer(
  persistConfig,
  combineReducers(sharedReducers)
)
