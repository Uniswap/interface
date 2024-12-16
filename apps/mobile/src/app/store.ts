import type { Middleware, PreloadedState } from '@reduxjs/toolkit'
import { MMKV } from 'react-native-mmkv'
import { Storage, persistReducer, persistStore } from 'redux-persist'
import { MOBILE_STATE_VERSION, migrations } from 'src/app/migrations'
import { MobileState, mobilePersistedStateList, mobileReducer } from 'src/app/mobileReducer'
import { rootMobileSaga } from 'src/app/saga'
import { getFiatOnRampAggregatorApi } from 'uniswap/src/features/fiatOnRamp/api'
import { isNonJestDev } from 'utilities/src/environment/constants'
import { createDatadogReduxEnhancer } from 'utilities/src/logger/Datadog'
import { createStore } from 'wallet/src/state'
import { createMigrate } from 'wallet/src/state/createMigrate'

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

export const persistConfig = {
  key: 'root',
  storage: reduxStorage,
  whitelist: mobilePersistedStateList,
  version: MOBILE_STATE_VERSION,
  migrate: createMigrate(migrations),
}

export const persistedReducer = persistReducer(persistConfig, mobileReducer)

const dataDogReduxEnhancer = createDatadogReduxEnhancer({
  shouldLogReduxState: (state: MobileState): boolean => {
    // Do not log the state if a user has opted out of analytics.
    return !!state.telemetry.allowAnalytics
  },
})

const middlewares: Middleware[] = [getFiatOnRampAggregatorApi().middleware]
if (isNonJestDev) {
  const createDebugger = require('redux-flipper').default
  middlewares.push(createDebugger())
}

export const setupStore = (
  preloadedState?: PreloadedState<MobileState>,
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => {
  return createStore({
    reducer: persistedReducer,
    preloadedState,
    additionalSagas: [rootMobileSaga],
    middlewareAfter: [...middlewares],
    enhancers: [dataDogReduxEnhancer],
  })
}
export const store = setupStore()

export const persistor = persistStore(store)
