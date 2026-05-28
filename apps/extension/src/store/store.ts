import { persistReducer, persistStore } from 'redux-persist'
import { localStorage } from 'redux-persist-webextension-storage'
import { rootExtensionSaga } from 'src/app/saga'
import { loggerMiddleware } from 'src/background/utils/loggerMiddleware'
import { PERSIST_KEY } from 'src/store/constants'
import { enhancePersistReducer } from 'src/store/enhancePersistReducer'
import { ExtensionState, extensionPersistedStateList, extensionReducer } from 'src/store/extensionReducer'
import { EXTENSION_STATE_VERSION, migrations } from 'src/store/migrations'
import { fiatOnRampAggregatorApi } from 'uniswap/src/features/fiatOnRamp/api'
import { delegationListenerMiddleware } from 'uniswap/src/features/smartWallet/delegation/slice'
import { createDatadogReduxEnhancer } from 'utilities/src/logger/datadog/Datadog'
import { logger } from 'utilities/src/logger/logger'
import { createStore } from 'wallet/src/state'
import { createMigrate } from 'wallet/src/state/createMigrate'
import { setReduxPersistor } from 'wallet/src/state/persistor'

const persistConfig = {
  key: PERSIST_KEY,
  storage: localStorage,
  whitelist: extensionPersistedStateList,
  version: EXTENSION_STATE_VERSION,
  migrate: createMigrate(migrations),
}

const persistedReducer = enhancePersistReducer(persistReducer(persistConfig, extensionReducer))

const dataDogReduxEnhancer = createDatadogReduxEnhancer({
  shouldLogReduxState: (state: ExtensionState): boolean => {
    // Do not log the state if a user has opted out of analytics.
    return !!state.telemetry.allowAnalytics
  },
})

const setupStore = (): ReturnType<typeof createStore> => {
  return createStore({
    reducer: persistedReducer,
    additionalSagas: [rootExtensionSaga],
    middlewareBefore: __DEV__ ? [loggerMiddleware] : [],
    middlewareAfter: [fiatOnRampAggregatorApi.middleware, delegationListenerMiddleware.middleware],
    enhancers: [dataDogReduxEnhancer],
  })
}

let store: ReturnType<typeof setupStore> | undefined

export function initializeReduxStore(args?: { readOnly?: boolean }): void {
  if (store) {
    // This should never happen. It's only here to alert us if a bug is introduced in the future.
    logger.error(new Error('`initializeReduxStore` called when already initialized'), {
      tags: {
        file: 'store.ts',
        function: 'initializeReduxStore',
      },
    })

    return
  }

  store = setupStore()
  const persistor = persistStore(store)
  setReduxPersistor(persistor)

  if (args?.readOnly) {
    // This means the store will be initialized with the persisted state from disk, but it won't persist any changes.
    // Only useful for use cases where we don't want to modify the state (for example, a popup window instead of the sidebar).
    persistor.pause()
  }
}

export function getReduxStore(): ReturnType<typeof setupStore> {
  if (!store) {
    throw new Error('Invalid call to `getReduxStore` before store has been initialized')
  }
  return store
}

export type AppStore = ReturnType<typeof setupStore>
