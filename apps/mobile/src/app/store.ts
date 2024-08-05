import type { Middleware, PreloadedState } from '@reduxjs/toolkit'
import * as Sentry from '@sentry/react'
import { MMKV } from 'react-native-mmkv'
import { Storage, persistReducer, persistStore } from 'redux-persist'
import { MOBILE_STATE_VERSION, migrations } from 'src/app/migrations'
import { MobileState, ReducerNames, mobileReducer } from 'src/app/reducer'
import { mobileSaga } from 'src/app/saga'
import { fiatOnRampAggregatorApi } from 'uniswap/src/features/fiatOnRamp/api'
import { isNonJestDev } from 'utilities/src/environment/constants'
import { createStore } from 'wallet/src/state'
import { createMigrate } from 'wallet/src/state/createMigrate'
import { RootReducerNames, sharedPersistedStateWhitelist } from 'wallet/src/state/reducer'

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

const whitelist: Array<ReducerNames | RootReducerNames> = [
  ...sharedPersistedStateWhitelist,
  'biometricSettings',
  'passwordLockout',
  'tweaks',
  'cloudBackup',
]

export const persistConfig = {
  key: 'root',
  storage: reduxStorage,
  whitelist,
  version: MOBILE_STATE_VERSION,
  migrate: createMigrate(migrations),
}

export const persistedReducer = persistReducer(persistConfig, mobileReducer)

const sentryReduxEnhancer = Sentry.createReduxEnhancer({
  stateTransformer: (state: MobileState): Maybe<MobileState> => {
    // Do not log the state if a user has opted out of analytics.
    if (state.telemetry.allowAnalytics) {
      return state
    } else {
      return null
    }
  },
})

const middlewares: Middleware[] = [fiatOnRampAggregatorApi.middleware]
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
    additionalSagas: [mobileSaga],
    middlewareAfter: [...middlewares],
    enhancers: [sentryReduxEnhancer],
  })
}
export const store = setupStore()

export const persistor = persistStore(store)
