import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query/react'
import localForage from 'localforage'
import { PersistConfig, persistReducer, persistStore } from 'redux-persist'
import createSagaMiddleware from 'redux-saga'
import { updateVersion } from 'state/global/actions'
import { customCreateMigrate, INDEXED_DB_REDUX_TABLE_NAME, migrations, PERSIST_VERSION } from 'state/migrations'
import { routingApi } from 'state/routing/slice'
import { rootWebSaga } from 'state/sagas/root'
import { walletCapabilitiesListenerMiddleware } from 'state/walletCapabilities/reducer'
import { InterfaceState, interfacePersistedStateList, interfaceReducer } from 'state/webReducer'
import { fiatOnRampAggregatorApi } from 'uniswap/src/features/fiatOnRamp/api'
import { delegationListenerMiddleware } from 'uniswap/src/features/smartWallet/delegation/slice'
import { isDevEnv, isTestEnv } from 'utilities/src/environment/env'
import { createDatadogReduxEnhancer } from 'utilities/src/logger/datadog/Datadog'
import { ALLOW_ANALYTICS_ATOM_KEY } from 'utilities/src/telemetry/analytics/constants'

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

const sagaMiddleware = createSagaMiddleware()

const dataDogReduxEnhancer = createDatadogReduxEnhancer({
  shouldLogReduxState: (): boolean => {
    const allowAnalytics = window.localStorage.getItem(ALLOW_ANALYTICS_ATOM_KEY) !== 'false'
    // Do not log the state if a user has opted out of analytics.
    return !!allowAnalytics
  },
})

export function createDefaultStore() {
  const store = configureStore({
    reducer: persistedReducer,
    enhancers: (defaultEnhancers) => defaultEnhancers.concat(dataDogReduxEnhancer),
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
              ignoredPaths: [routingApi.reducerPath],
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
        .concat(fiatOnRampAggregatorApi.middleware)
        .concat(sagaMiddleware)
        .concat(walletCapabilitiesListenerMiddleware.middleware)
        .concat(delegationListenerMiddleware.middleware),
  })
  sagaMiddleware.run(rootWebSaga)

  return store
}

const store = createDefaultStore()
export const persistor = persistStore(store)

setupListeners(store.dispatch)

store.dispatch(updateVersion())

export default store
