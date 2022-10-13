import { configureStore, Middleware } from '@reduxjs/toolkit'
import { persistReducer, persistStore, Storage } from 'redux-persist'
import createSagaMiddleware from 'redux-saga'
import createMigrate from 'src/app/createMigrate'
import { migrations } from 'src/app/migrations'
import { rootReducer } from 'src/app/rootReducer'
import { rootSaga } from 'src/app/rootSaga'
import { walletContextValue } from 'src/app/walletContext'
import { config } from 'src/config'
import { ensApi } from 'src/features/ens/api'
import { forceUpgradeApi } from 'src/features/forceUpgrade/forceUpgradeApi'
import { gasApi } from 'src/features/gas/api'
import { nftApi } from 'src/features/nfts/api'
import { routingApi } from 'src/features/routing/routingApi'

import { MMKV } from 'react-native-mmkv'

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

export const persistConfig = {
  key: 'root',
  storage: reduxStorage,
  whitelist: [
    'wallet',
    'biometricSettings',
    'chains',
    'favorites',
    'searchHistory',
    'transactions',
    'tokenLists',
    'tokens',
    'notifications',
    'experiments',
    ensApi.reducerPath,
    nftApi.reducerPath,
  ],
  version: 22,
  migrate: createMigrate(migrations),
}

const persistedReducer = persistReducer(persistConfig, rootReducer)

const middlewares: Middleware[] = []
if (__DEV__) {
  // eslint-disable-next-line @typescript-eslint/no-require-imports
  const createDebugger = require('redux-flipper').default
  middlewares.push(createDebugger())
}

export const store = configureStore({
  reducer: persistedReducer,
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      // required for rtk-query
      thunk: true,
      // turn off since it slows down for dev and also doesn't run in prod
      // TODO: figure out why this is slow: MOB-681
      serializableCheck: false,
      invariantCheck: {
        warnAfter: 256,
      },
      // slows down dev build considerably
      immutableCheck: false,
    }).concat(
      ensApi.middleware,
      forceUpgradeApi.middleware,
      gasApi.middleware,
      nftApi.middleware,
      routingApi.middleware,
      sagaMiddleware,
      ...middlewares
    ),
  devTools: config.debug,
})

export const persistor = persistStore(store)
sagaMiddleware.run(rootSaga)

export type AppDispatch = typeof store.dispatch
