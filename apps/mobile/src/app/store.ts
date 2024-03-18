import type { Middleware, PayloadAction, PreloadedState } from '@reduxjs/toolkit'
import { isRejectedWithValue } from '@reduxjs/toolkit'
import * as Sentry from '@sentry/react'
import { MMKV } from 'react-native-mmkv'
import { Storage, persistReducer, persistStore } from 'redux-persist'
import createMigrate from 'src/app/createMigrate'
import { migrations } from 'src/app/migrations'
import { isNonJestDev } from 'utilities/src/environment'
import { logger } from 'utilities/src/logger/logger'
import { fiatOnRampAggregatorApi, fiatOnRampApi } from 'wallet/src/features/fiatOnRamp/api'
import { importAccountSagaName } from 'wallet/src/features/wallet/import/importAccountSaga'
import { createStore } from 'wallet/src/state'
import { RootReducerNames } from 'wallet/src/state/reducer'
import { MobileState, ReducerNames, mobileReducer } from './reducer'
import { mobileSaga } from './saga'

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

const rtkQueryErrorLogger: Middleware = () => (next) => (action: PayloadAction<unknown>) => {
  if (!isRejectedWithValue(action)) {
    return next(action)
  }

  logger.error(action.error, {
    tags: {
      file: 'store',
      function: 'rtkQueryErrorLogger',
    },
    extra: {
      type: action.type,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      endpointName: (action.meta as any)?.arg?.endpointName,
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      status: (action.payload as any)?.status,
    },
  })

  return next(action)
}

const whitelist: Array<ReducerNames | RootReducerNames> = [
  'appearanceSettings',
  'behaviorHistory',
  'biometricSettings',
  'favorites',
  'notifications',
  'passwordLockout',
  'searchHistory',
  'telemetry',
  'tokens',
  'transactions',
  'tweaks',
  'wallet',
  'cloudBackup',
  'languageSettings',
  'fiatCurrencySettings',
]

export const persistConfig = {
  key: 'root',
  storage: reduxStorage,
  whitelist,
  version: 60,
  migrate: createMigrate(migrations),
}

export const persistedReducer = persistReducer(persistConfig, mobileReducer)

const sentryReduxEnhancer = Sentry.createReduxEnhancer({
  // Add any restrictions here for when the enhancer should not be used
  actionTransformer: (action) => {
    if (action.type === `${importAccountSagaName}/trigger`) {
      // Return null in the case of importing an account, as the payload could contain the mnemonic
      return null
    }

    return action
  },
  stateTransformer: (state: MobileState): Maybe<MobileState> => {
    // Do not log the state if a user has opted out of analytics.
    if (state.telemetry.allowAnalytics) {
      return state
    } else {
      return null
    }
  },
})

const middlewares: Middleware[] = [fiatOnRampApi.middleware, fiatOnRampAggregatorApi.middleware]
if (isNonJestDev) {
  const createDebugger = require('redux-flipper').default
  middlewares.push(createDebugger())
}

export const setupStore = (
  preloadedState?: PreloadedState<MobileState>
  // eslint-disable-next-line @typescript-eslint/explicit-function-return-type
) => {
  return createStore({
    reducer: persistedReducer,
    preloadedState,
    additionalSagas: [mobileSaga],
    middlewareAfter: [rtkQueryErrorLogger, ...middlewares],
    enhancers: [sentryReduxEnhancer],
  })
}
export const store = setupStore()

export const persistor = persistStore(store)

export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
