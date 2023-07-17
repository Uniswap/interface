import { combineReducers } from '@reduxjs/toolkit'
import multicall from 'lib/state/multicall'
import { persistReducer } from 'redux-persist'
import storage from 'redux-persist/lib/storage'

import application from './application/reducer'
import burn from './burn/reducer'
import burnV3 from './burn/v3/reducer'
import lists from './lists/reducer'
import logs from './logs/slice'
import { customCreateMigrate, migrations } from './migrations'
import mint from './mint/reducer'
import mintV3 from './mint/v3/reducer'
import { routingApi } from './routing/slice'
import signatures from './signatures/reducer'
import transactions from './transactions/reducer'
import user from './user/reducer'
import wallets from './wallets/reducer'

const persistedReducers = {
  user,
  transactions,
  signatures,
  lists,
}

const appReducer = combineReducers({
  ...persistedReducers,
  application,
  wallets,
  mint,
  mintV3,
  burn,
  burnV3,
  multicall: multicall.reducer,
  logs,
  [routingApi.reducerPath]: routingApi.reducer,
})

export type AppState = ReturnType<typeof appReducer>

const persistConfig = {
  key: 'root',
  version: 0, // see migrations.ts for more details about this version
  storage,
  migrate: customCreateMigrate(migrations, { debug: false }),
  whitelist: Object.keys(persistedReducers),
  throttle: 1000, // ms
}

const persistedReducer = persistReducer(persistConfig, appReducer)

export default persistedReducer
