import type { Middleware, PreloadedState, StoreEnhancer } from '@reduxjs/toolkit'
import { isRNDev, isUnitTestEnv } from '@universe/environment'
import { createMMKV } from 'react-native-mmkv'
import { persistReducer, persistStore, Storage } from 'redux-persist'
import { MOBILE_STATE_VERSION, migrations } from 'src/app/migrations'
import { MobileState, mobilePersistedStateList, mobileReducer } from 'src/app/mobileReducer'
import { rootMobileSaga } from 'src/app/saga'
import { delegationListenerMiddleware } from 'uniswap/src/features/smartWallet/delegation/slice'
import { createStore } from 'wallet/src/state'
import { createMigrate } from 'wallet/src/state/createMigrate'
import { setReduxPersistor } from 'wallet/src/state/persistor'

const storage = createMMKV()

const reduxStorage: Storage = {
  setItem: (key, value) => {
    storage.set(key, value)
    return Promise.resolve(true)
  },
  getItem: (key) => {
    const value = storage.getString(key)
    return Promise.resolve(value)
  },
  removeItem: (key) => {
    storage.remove(key)
    return Promise.resolve()
  },
}

export const persistConfig = {
  key: 'root',
  storage: reduxStorage,
  whitelist: mobilePersistedStateList,
  version: MOBILE_STATE_VERSION,
  migrate: createMigrate(migrations),
}

export const persistedReducer = persistReducer(persistConfig, mobileReducer)

const enhancers: StoreEnhancer[] = []

if (!isUnitTestEnv() && isRNDev()) {
  // oxlint-disable-next-line typescript/no-var-requires
  const reactotron = require('src/../ReactotronConfig').default
  enhancers.push(reactotron.createEnhancer())
}

const middlewares: Middleware[] = [delegationListenerMiddleware.middleware]

const setupStore = (preloadedState?: PreloadedState<MobileState>) => {
  return createStore({
    reducer: persistedReducer,
    preloadedState,
    additionalSagas: [rootMobileSaga],
    middlewareAfter: [...middlewares],
    enhancers,
  })
}

export const store = setupStore()
setReduxPersistor(persistStore(store))
