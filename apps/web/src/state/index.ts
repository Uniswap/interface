// oxlint-disable import/no-cycle -- sagas and redux store have many cycles, deep refactoring is needed
import { configureStore } from '@reduxjs/toolkit'
import { isDevEnv, isTestEnv } from '@universe/environment'
import localForage from 'localforage'
import { type PersistConfig, persistReducer, persistStore } from 'redux-persist'
import createSagaMiddleware from 'redux-saga'
import { delegationListenerMiddleware } from 'uniswap/src/features/smartWallet/delegation/slice'
import { persistedSinkTripwireMiddleware } from 'utilities/src/security/persistedSinkTripwireMiddleware'
import { updateVersion } from '~/state/global/actions'
import { customCreateMigrate, INDEXED_DB_REDUX_TABLE_NAME, migrations, PERSIST_VERSION } from '~/state/migrations'
import { rootWebSaga, sagaTriggerActions } from '~/state/sagas/root'
import { walletCapabilitiesListenerMiddleware } from '~/state/walletCapabilities/reducer'
import { type InterfaceState, interfacePersistedStateList, interfaceReducer } from '~/state/webReducer'

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

export function createDefaultStore() {
  const store = configureStore({
    reducer: persistedReducer,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: true,
        immutableCheck: isTestEnv()
          ? false
          : {
              ignoredPaths: ['logs', 'lists'],
            },
        serializableCheck: isTestEnv()
          ? false
          : {
              warnAfter: 128,
              // meta.arg and meta.baseQueryMeta are defaults. payload.trade is a nonserializable return value, but that's ok
              // because we are not adding it into any persisted store that requires serialization (e.g. localStorage)
              // payload.initialState / application.openModal.initialState: liquidity modals receive PositionInfo (SDK
              // Pool/Position/CurrencyAmount instances); fine since the application slice is never persisted.
              ignoredActionPaths: ['meta.arg', 'meta.baseQueryMeta', 'payload.trade', 'payload.initialState'],
              ignoredPaths: ['application.openModal.initialState'],
              ignoredActions: [
                // ignore saga trigger actions
                ...sagaTriggerActions,
                // ignore the redux-persist actions
                'persist/PERSIST',
                'persist/REHYDRATE',
                'persist/PURGE',
                'persist/FLUSH',
              ],
            },
      })
        .prepend(persistedSinkTripwireMiddleware)
        .concat(sagaMiddleware)
        .concat(walletCapabilitiesListenerMiddleware.middleware)
        .concat(delegationListenerMiddleware.middleware),
  })
  sagaMiddleware.run(rootWebSaga)

  return store
}

const store = createDefaultStore()
export const persistor = persistStore(store)

store.dispatch(updateVersion())

export default store
