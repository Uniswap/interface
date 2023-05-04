import { combineReducers } from 'redux'
import { persistReducer, persistStore } from 'redux-persist'
import { dappReducer } from 'wallet/src/features/dapp/slice'
import { monitoredSagaReducers } from 'wallet/src/state/saga'
import { dappRequestReducer } from '../features/dappRequests/slice'
import { providersReducer } from '../features/providers'
import { walletReducer } from '../features/wallet/slice'
import { PersistedStorage } from '../utils/persistedStorage'

const reducers = {
  dapp: dappReducer,
  dappRequests: dappRequestReducer,
  providers: providersReducer,
  saga: monitoredSagaReducers,
  wallet: walletReducer,
} as const

const whitelist: Array<keyof typeof reducers> = ['providers', 'wallet', 'dapp']

const persistConfig = {
  key: 'root',
  storage: new PersistedStorage(),
  whitelist,
  version: 1,
  // TODO: migrate script
  // migrate: () => {}
}

export const rootReducer = persistReducer(
  persistConfig,
  combineReducers(reducers)
)

// re-export for convenience
export { persistStore }
