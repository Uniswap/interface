import type { Middleware, PreloadedState } from '@reduxjs/toolkit'
import { configureStore, isRejectedWithValue } from '@reduxjs/toolkit'
import { MMKV } from 'react-native-mmkv'
import { persistReducer, persistStore, Storage } from 'redux-persist'
import createSagaMiddleware from 'redux-saga'
import createMigrate from 'src/app/createMigrate'
import { migrations } from 'src/app/migrations'
import { ReducerNames, rootReducer, RootState } from 'src/app/rootReducer'
import { rootSaga } from 'src/app/rootSaga'
import { walletContextValue } from 'src/app/walletContext'
import { config } from 'src/config'
import { onChainBalanceApi } from 'src/features/balances/api'
import { ensApi } from 'src/features/ens/api'
import { fiatOnRampApi } from 'src/features/fiatOnRamp/api'
import { gasApi } from 'src/features/gas/api'
import { routingApi } from 'src/features/routing/routingApi'
import { trmApi } from 'src/features/trm/api'
import { isNonJestDev } from 'src/utils/environment'
import { logger } from 'src/utils/logger'

const storage = new MMKV()

export const reduxStorage: Storage = {
  setItem: (key, value) => {
    storage.set(key, value)
    return Promise.resolve(true)
  },
  getItem: (key) => {
    const value = storage.getString(key)
    return Promise.resolve(value)
  },
  removeItem: (key) => {
    storage.delete(key)
    return Promise.resolve()
  },
}

const sagaMiddleware = createSagaMiddleware({
  context: {
    signers: walletContextValue.signers,
    providers: walletContextValue.providers,
    contracts: walletContextValue.contracts,
  },
})

const rtkQueryErrorLogger: Middleware = () => (next) => (action) => {
  if (isRejectedWithValue(action)) {
    logger.error('store', 'rtkQueryErrorLogger', JSON.stringify(action.payload ?? action.error))
  }

  return next(action)
}

const whitelist: Array<ReducerNames> = [
  'biometricSettings',
  'chains',
  'experiments',
  'favorites',
  'notifications',
  'passwordLockout',
  'searchHistory',
  'tokens',
  'transactions',
  'wallet',
  ensApi.reducerPath,
  trmApi.reducerPath,
]

export const persistConfig = {
  key: 'root',
  storage: reduxStorage,
  whitelist,
  version: 33,
  migrate: createMigrate(migrations),
}

export const persistedReducer = persistReducer(persistConfig, rootReducer)

const middlewares: Middleware[] = []
if (isNonJestDev()) {
  const createDebugger = require('redux-flipper').default
  middlewares.push(createDebugger())
}

// eslint-disable-next-line prettier/prettier, @typescript-eslint/explicit-function-return-type
export const setupStore = (
  preloadedState?: PreloadedState<RootState>
) => {
  return configureStore({
    reducer: persistedReducer,
    preloadedState,
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        // required for rtk-query
        thunk: true,
        // turn off since it slows down for dev and also doesn't run in prod
        // TODO: [MOB-681] figure out why this is slow
        serializableCheck: false,
        invariantCheck: {
          warnAfter: 256,
        },
        // slows down dev build considerably
        immutableCheck: false,
      }).concat(
        ensApi.middleware,
        fiatOnRampApi.middleware,
        gasApi.middleware,
        onChainBalanceApi.middleware,
        routingApi.middleware,
        rtkQueryErrorLogger,
        sagaMiddleware,
        trmApi.middleware,
        ...middlewares
      ),
    devTools: config.debug,
  })
}
export const store = setupStore()

export const persistor = persistStore(store)
sagaMiddleware.run(rootSaga)

export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
