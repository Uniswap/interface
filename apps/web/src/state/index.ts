import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query/react'
import { persistStore } from 'redux-persist'
import { updateVersion } from 'state/global/actions'
import { sentryEnhancer } from 'state/logging'
import reducer from 'state/reducer'
import { quickRouteApi } from 'state/routing/quickRouteSlice'
import { routingApi } from 'state/routing/slice'
import { fiatOnRampAggregatorApi } from 'uniswap/src/features/fiatOnRamp/api'
import { isTestEnv } from 'utilities/src/environment'

export function createDefaultStore() {
  return configureStore({
    reducer,
    enhancers: (defaultEnhancers) => defaultEnhancers.concat(sentryEnhancer),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: true,
        immutableCheck: isTestEnv()
          ? false
          : {
              ignoredPaths: [routingApi.reducerPath, 'logs', 'lists'],
            },
        serializableCheck: isTestEnv()
          ? false
          : {
              warnAfter: 128,
              // meta.arg and meta.baseQueryMeta are defaults. payload.trade is a nonserializable return value, but that's ok
              // because we are not adding it into any persisted store that requires serialization (e.g. localStorage)
              ignoredActionPaths: ['meta.arg', 'meta.baseQueryMeta', 'payload.trade'],
              ignoredPaths: [routingApi.reducerPath, quickRouteApi.reducerPath],
              ignoredActions: [
                // ignore the redux-persist actions
                'persist/PERSIST',
                'persist/REHYDRATE',
                'persist/PURGE',
                'persist/FLUSH',
              ],
            },
      })
        .concat(routingApi.middleware)
        .concat(quickRouteApi.middleware)
        .concat(fiatOnRampAggregatorApi.middleware),
  })
}

const store = createDefaultStore()
export const persistor = persistStore(store)

setupListeners(store.dispatch)

store.dispatch(updateVersion())

export default store
