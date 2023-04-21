import { monitoredSagaReducers } from 'wallet/src/state/saga'
import { combineReducers } from 'redux'
import { persistReducer, persistStore } from 'redux-persist'
import { chainsReducer } from '../features/chains/slice'
import { dappRequestReducer } from '../features/dappRequests/slice'
import { providersReducer } from '../features/providers'
import { walletReducer } from '../features/wallet/slice'
import { PersistedStorage } from '../utils/persistedStorage'

const reducers = {
  chains: chainsReducer,
  providers: providersReducer,
  saga: monitoredSagaReducers,
  dappRequests: dappRequestReducer,
  wallet: walletReducer,
} as const

const whitelist: Array<keyof typeof reducers> = [
  'chains',
  'providers',
  'wallet',
]

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
