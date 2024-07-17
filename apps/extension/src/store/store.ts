import { createReduxEnhancer } from '@sentry/react'
import { TypedUseSelectorHook, useDispatch, useSelector } from 'react-redux'
import { PreloadedState } from 'redux'
import { persistReducer, persistStore } from 'redux-persist'
import { localStorage } from 'redux-persist-webextension-storage'
import { webRootSaga } from 'src/app/saga'
import { loggerMiddleware } from 'src/background/utils/loggerMiddleware'
import { PERSIST_KEY } from 'src/store/constants'
import { enhancePersistReducer } from 'src/store/enhancePersistReducer'
import { EXTENSION_STATE_VERSION, migrations } from 'src/store/migrations'
import {
  deleteDeprecatedReduxedChromeStorage,
  readDeprecatedReduxedChromeStorage,
} from 'src/store/reduxedChromeStorageToReduxPersistMigration'
import { ReducerNames, WebState, webReducer } from 'src/store/webReducer'
import { SagaGenerator, select } from 'typed-redux-saga'
import { createStore } from 'wallet/src/state'
import { createMigrate } from 'wallet/src/state/createMigrate'
import { RootReducerNames, sharedPersistedStateWhitelist } from 'wallet/src/state/reducer'

// Only include here things that need to be persisted and shared between different instances of the sidebar.
// Only one sidebar can write to the storage at a time, so we need to be careful about what we persist.
// Things that only belong to a single instance of the sidebar (for example, dapp requests) should not be whitelisted.
const whitelist: Array<ReducerNames | RootReducerNames> = [...sharedPersistedStateWhitelist, 'dappRequests', 'alerts']

const persistConfig = {
  key: PERSIST_KEY,
  storage: localStorage,
  whitelist,
  version: EXTENSION_STATE_VERSION,
  migrate: createMigrate(migrations),
}

const persistedReducer = enhancePersistReducer(persistReducer(persistConfig, webReducer))

const sentryReduxEnhancer = createReduxEnhancer({
  // TODO(EXT-1022): uncomment this once we add an analytics opt-out setting.
  // stateTransformer: (state: WebState): Maybe<WebState> => {
  // Do not log the state if a user has opted out of analytics.
  // if (state.telemetry.allowAnalytics) {
  //   return state
  // } else {
  //   return null
  // }
  // },
})

const setupStore = (preloadedState?: PreloadedState<WebState>): ReturnType<typeof createStore> => {
  return createStore({
    reducer: persistedReducer,
    preloadedState,
    additionalSagas: [webRootSaga],
    middlewareBefore: __DEV__ ? [loggerMiddleware] : [],
    enhancers: [sentryReduxEnhancer],
  })
}

let store: ReturnType<typeof setupStore> | undefined
let persistor: ReturnType<typeof persistStore> | undefined

export async function initializeReduxStore(): Promise<{
  store: ReturnType<typeof setupStore>
  persistor: ReturnType<typeof persistStore>
}> {
  // Migrate the old `reduxed-chrome-storage` persisted state to `redux-persist`.
  // TODO(EXT-985): we might need to pass the old store through `createMigrations` when we implement migrations.
  const oldStore = await readDeprecatedReduxedChromeStorage()

  store = setupStore(oldStore)
  persistor = persistStore(store)

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

// TODO(EXT-1021): consider removing this helper in favor of using `useDispatch` directly.
export const useAppDispatch: () => AppDispatch = useDispatch
export const useAppSelector: TypedUseSelectorHook<WebState> = useSelector

// Use in sagas for better typing when selecting from redux state
export function* appSelect<T>(fn: (state: WebState) => T): SagaGenerator<T> {
  const state = yield* select(fn)
  return state
}

export type AppDispatch = ReturnType<typeof setupStore>['dispatch']
export type AppStore = ReturnType<typeof setupStore>
export type AppSelector<T> = (state: WebState) => T
