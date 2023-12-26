import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query/react'
import { persistStore } from 'redux-persist'

import { updateVersion } from './global/actions'
import { sentryEnhancer } from './logging'
import reducer from './reducer'
import { quickRouteApi } from './routing/quickRouteSlice'
import { routingApi } from './routing/slice'

export function createDefaultStore() {
  return configureStore({
    reducer,
    enhancers: (defaultEnhancers) => defaultEnhancers.concat(sentryEnhancer),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: true,
        immutableCheck: {
          ignoredPaths: [routingApi.reducerPath, 'logs', 'lists'],
        },
        serializableCheck: {
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
        .concat(quickRouteApi.middleware),
  })
}

const store = createDefaultStore()
export const persistor = persistStore(store)

setupListeners(store.dispatch)

store.dispatch(updateVersion())

export default store
