import { PreloadedState } from 'redux'
import { persistReducer, persistStore } from 'redux-persist'
import { localStorage } from 'redux-persist-webextension-storage'
import { rootExtensionSaga } from 'src/app/saga'
import { loggerMiddleware } from 'src/background/utils/loggerMiddleware'
import { PERSIST_KEY } from 'src/store/constants'
import { enhancePersistReducer } from 'src/store/enhancePersistReducer'
import { ExtensionState, extensionPersistedStateList, extensionReducer } from 'src/store/extensionReducer'
import { EXTENSION_STATE_VERSION, migrations } from 'src/store/migrations'
import {
  deleteDeprecatedReduxedChromeStorage,
  readDeprecatedReduxedChromeStorage,
} from 'src/store/reduxedChromeStorageToReduxPersistMigration'
import { fiatOnRampAggregatorApi } from 'uniswap/src/features/fiatOnRamp/api'
import { createDatadogReduxEnhancer } from 'utilities/src/logger/datadog/Datadog'
import { createStore } from 'wallet/src/state'
import { createMigrate } from 'wallet/src/state/createMigrate'

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

const setupStore = (preloadedState?: PreloadedState<ExtensionState>): ReturnType<typeof createStore> => {
  return createStore({
    reducer: persistedReducer,
    preloadedState,
    additionalSagas: [rootExtensionSaga],
    middlewareBefore: __DEV__ ? [loggerMiddleware] : [],
    middlewareAfter: [fiatOnRampAggregatorApi.middleware],
    enhancers: [dataDogReduxEnhancer],
  })
}

let store: ReturnType<typeof setupStore> | undefined
let persistor: ReturnType<typeof persistStore> | undefined

export async function initializeReduxStore(args?: { readOnly?: boolean }): Promise<{
  store: ReturnType<typeof setupStore>
  persistor: ReturnType<typeof persistStore>
}> {
  // Migrate the old `reduxed-chrome-storage` persisted state to `redux-persist`.
  // TODO(EXT-985): we might need to pass the old store through `createMigrations` when we implement migrations.
  const oldStore = await readDeprecatedReduxedChromeStorage()

  store = setupStore(oldStore)
  persistor = persistStore(store)

  if (args?.readOnly) {
    // This means the store will be initialized with the persisted state from disk, but it won't persist any changes.
    // Only useful for use cases where we don't want to modify the state (for example, a popup window instead of the sidebar).
    persistor.pause()
  }

  // We wait a few seconds to make sure the store is fully initialized and persisted before deleting the old storage.
  // This is needed because otherwise the background script might think the user is not onboarded if it reads the storage while it's being migrated.
  if (oldStore) {
    setTimeout(deleteDeprecatedReduxedChromeStorage, 5000)
  }

  return { store, persistor }
}

export function getReduxStore(): ReturnType<typeof setupStore> {
  if (!store) {
    throw new Error('Invalid call to `getReduxStore` before store has been initialized')
  }
  return store
}

export function getReduxPersistor(): ReturnType<typeof persistStore> {
  if (!persistor) {
    throw new Error('Invalid call to `getReduxPersistor` before store has been initialized')
  }
  return persistor
}

export type AppStore = ReturnType<typeof setupStore>
