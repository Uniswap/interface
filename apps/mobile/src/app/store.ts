import type { Middleware, PayloadAction, PreloadedState } from '@reduxjs/toolkit'
import { isRejectedWithValue } from '@reduxjs/toolkit'
import * as Sentry from '@sentry/react'
import { MMKV } from 'react-native-mmkv'
import { persistReducer, persistStore, Storage } from 'redux-persist'
import createMigrate from 'src/app/createMigrate'
import { migrations } from 'src/app/migrations'
import { fiatOnRampApi } from 'src/features/fiatOnRamp/api'
import { importAccountSagaName } from 'src/features/import/importAccountSaga'
import { routingApi } from 'src/features/routing/routingApi'
import { trmApi } from 'src/features/trm/api'
import { ensApi } from 'wallet/src/features/ens/api'
import { logger } from 'wallet/src/features/logger/logger'
import { createStore } from 'wallet/src/state'
import { RootReducerNames } from 'wallet/src/state/reducer'
import { isNonJestDev } from 'wallet/src/utils/environment'
import { mobileReducer, MobileState, ReducerNames } from './reducer'
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

// list of apis to ignore when logging errors, i.e. logging is handled by api
const rtkQueryErrorLoggerIgnorelist: Array<ReducerNames> = [
  ensApi.reducerPath, // verbose
  routingApi.reducerPath, // verbose, handled in routing hook
]
const rtkQueryErrorLogger: Middleware = () => (next) => (action: PayloadAction<unknown>) => {
  if (!isRejectedWithValue(action)) {
    return next(action)
  }

  const shouldSkipErrorLogging = rtkQueryErrorLoggerIgnorelist.some((reducerName) =>
    action.type.startsWith(reducerName)
  )
  if (shouldSkipErrorLogging) {
    // still log in debug to ensure those errors are surfaced, but avoids polutting sentry
    logger.debug('store', 'rtkQueryErrorLogger', JSON.stringify(action))
  } else {
    logger.error(
      'store',
      'rtkQueryErrorLogger',
      // extract specific properties to avoid PII
      JSON.stringify({
        type: action.type,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        endpointName: (action.meta as any)?.arg?.endpointName,
        // eslint-disable-next-line @typescript-eslint/no-explicit-any
        status: (action.payload as any)?.status,
        error: action.error,
      })
    )
  }

  return next(action)
}

const whitelist: Array<ReducerNames | RootReducerNames> = [
  'appearanceSettings',
  'biometricSettings',
  'chains',
  'favorites',
  'notifications',
  'passwordLockout',
  'searchHistory',
  'telemetry',
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
  version: 45,
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
})

const middlewares: Middleware[] = []
if (isNonJestDev()) {
  const createDebugger = require('redux-flipper').default
  middlewares.push(createDebugger())
}

// eslint-disable-next-line prettier/prettier, @typescript-eslint/explicit-function-return-type
export const setupStore = (
  preloadedState?: PreloadedState<MobileState>
) => {
  return createStore({
    reducer: persistedReducer,
    preloadedState,
    additionalSagas: [mobileSaga],
    middlewareAfter: [
      ensApi.middleware,
      fiatOnRampApi.middleware,
      routingApi.middleware,
      rtkQueryErrorLogger,
      trmApi.middleware,
      ...middlewares,
    ],
    enhancers: [sentryReduxEnhancer],
  })
}
export const store = setupStore()

export const persistor = persistStore(store)

export type AppDispatch = typeof store.dispatch
export type AppStore = typeof store
