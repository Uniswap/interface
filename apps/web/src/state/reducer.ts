import { combineReducers } from '@reduxjs/toolkit'
import multicall from 'lib/state/multicall'
import localForage from 'localforage'
import { PersistConfig, persistReducer } from 'redux-persist'
import application from 'state/application/reducer'
import burn from 'state/burn/reducer'
import burnV3 from 'state/burn/v3/reducer'
import lists from 'state/lists/reducer'
import logs from 'state/logs/slice'
import { INDEXED_DB_REDUX_TABLE_NAME, customCreateMigrate, migrations } from 'state/migrations'
import mint from 'state/mint/reducer'
import mintV3 from 'state/mint/v3/reducer'
import { quickRouteApi } from 'state/routing/quickRouteSlice'
import { routingApi } from 'state/routing/slice'
import signatures from 'state/signatures/reducer'
import transactions from 'state/transactions/reducer'
import user from 'state/user/reducer'
import wallets from 'state/wallets/reducer'
import { isDevEnv } from 'uniswap/src/utils/env'

const persistedReducers = {
  user,
  transactions,
  signatures,
  lists,
}

const appReducer = combineReducers({
  application,
  wallets,
  mint,
  mintV3,
  burn,
  burnV3,
  multicall: multicall.reducer,
  logs,
  [routingApi.reducerPath]: routingApi.reducer,
  [quickRouteApi.reducerPath]: quickRouteApi.reducer,
  ...persistedReducers,
})

export type AppState = ReturnType<typeof appReducer>

const persistConfig: PersistConfig<AppState> = {
  key: 'interface',
  version: 9, // see migrations.ts for more details about this version
  storage: localForage.createInstance({
    name: INDEXED_DB_REDUX_TABLE_NAME,
    driver: localForage.LOCALSTORAGE,
  }),
  migrate: customCreateMigrate(migrations, { debug: false }),
  whitelist: Object.keys(persistedReducers),
  throttle: 1000, // ms
  serialize: false,
  // The typescript definitions are wrong - we need this to be false for unserialized storage to work.
  // We need unserialized storage for inspectable db entries for debugging.
  // @ts-ignore
  deserialize: false,
  debug: isDevEnv(),
}

const persistedReducer = persistReducer(persistConfig, appReducer)

export default persistedReducer
