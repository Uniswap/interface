import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query/react'
import { persistStore } from 'redux-persist'

import { updateVersion } from './global/actions'
import { sentryEnhancer } from './logging'
import reducer from './reducer'
import { routingApiV2 } from './routing/slice'

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
          ignoredPaths: [routingApiV2.reducerPath],
          ignoredActions: [
            // ignore the redux-persist actions
            'persist/PERSIST',
            'persist/REHYDRATE',
          ],
        },
      }).concat(routingApiV2.middleware),
  })
}

const store = createDefaultStore()

store.dispatch(updateVersion())

setupListeners(store.dispatch)

persistStore(store)

export default store
