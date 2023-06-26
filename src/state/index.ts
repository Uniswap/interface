import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query/react'
import { persistStore } from 'redux-persist'

import { sentryEnhancer } from './logging'
import reducer from './reducer'
import { routingApi } from './routing/slice'
import { routingApiV2 } from './routing/v2Slice'

export function createDefaultStore() {
  return configureStore({
    reducer,
    enhancers: (defaultEnhancers) => defaultEnhancers.concat(sentryEnhancer),
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        thunk: true,
        serializableCheck: {
          // meta.arg and meta.baseQueryMeta are defaults. payload.trade is a nonserializable return value, but that's ok
          // because we are not adding it into any persisted store that requires serialization (e.g. localStorage)
          ignoredActionPaths: ['meta.arg', 'meta.baseQueryMeta', 'payload.trade'],
          ignoredPaths: [routingApi.reducerPath, routingApiV2.reducerPath],
          ignoredActions: [
            // ignore the redux-persist actions
            'persist/PERSIST',
            'persist/REHYDRATE',
          ],
        },
      })
        .concat(routingApi.middleware)
        .concat(routingApiV2.middleware),
  })
}

const store = createDefaultStore()

setupListeners(store.dispatch)

persistStore(store)

export default store
