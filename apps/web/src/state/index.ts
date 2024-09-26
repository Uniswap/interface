import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query/react'
import localForage from 'localforage'
import { PersistConfig, persistReducer, persistStore } from 'redux-persist'
import createSagaMiddleware from 'redux-saga'
import { updateVersion } from 'state/global/actions'
import { sentryEnhancer } from 'state/logging'
import { INDEXED_DB_REDUX_TABLE_NAME, PERSIST_VERSION, customCreateMigrate, migrations } from 'state/migrations'
import { quickRouteApi } from 'state/routing/quickRouteSlice'
import { routingApi } from 'state/routing/slice'
import { InterfaceState, interfacePersistedStateList, interfaceReducer } from 'state/webReducer'
import { fiatOnRampAggregatorApi } from 'uniswap/src/features/fiatOnRamp/api'
import { isDevEnv, isTestEnv } from 'utilities/src/environment/env'

const persistConfig: PersistConfig<InterfaceState> = {
  key: 'interface',
  version: PERSIST_VERSION,
  storage: localForage.createInstance({
    name: INDEXED_DB_REDUX_TABLE_NAME,
    driver: localForage.LOCALSTORAGE,
  }),
  migrate: customCreateMigrate(migrations, { debug: false }),
  whitelist: interfacePersistedStateList,
  throttle: 1000, // ms
  serialize: false,
  // The typescript definitions are wrong - we need this to be false for unserialized storage to work.
  // We need unserialized storage for inspectable db entries for debugging.
  // @ts-ignore
  deserialize: false,
  debug: isDevEnv(),
}

const persistedReducer = persistReducer(persistConfig, interfaceReducer)

export function createDefaultStore() {
  return configureStore({
    reducer: persistedReducer,
    enhancers: (defaultEnhancers) => defaultEnhancers.concat(sentryEnhancer),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: true,
        immutableCheck: isTestEnv()
          ? false
          : {
              ignoredPaths: [routingApi.reducerPath, 'logs', 'lists'],
            },
        serializableCheck: isTestEnv()
          ? false
          : {
              warnAfter: 128,
              // meta.arg and meta.baseQueryMeta are defaults. payload.trade is a nonserializable return value, but that's ok
              // because we are not adding it into any persisted store that requires serialization (e.g. localStorage)
              ignoredActionPaths: ['meta.arg', 'meta.baseQueryMeta', 'payload.trade'],
              ignoredPaths: [routingApi.reducerPath, quickRouteApi.reducerPath],
              ignoredActions: [
                // ignore the redux-persist actions
                'persist/PERSIST',
                'persist/REHYDRATE',
                'persist/PURGE',
                'persist/FLUSH',
              ],
            },
      })
        .concat(routingApi.middleware)
        .concat(quickRouteApi.middleware)
        .concat(fiatOnRampAggregatorApi.middleware)
        .concat(createSagaMiddleware()),
  })
}

const store = createDefaultStore()
export const persistor = persistStore(store)

setupListeners(store.dispatch)

store.dispatch(updateVersion())

export default store
