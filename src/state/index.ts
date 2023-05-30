import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query/react'
import { load, save } from 'redux-localstorage-simple'
import { isTestEnv } from 'utils/env'

import { updateVersion } from './global/actions'
import { sentryEnhancer } from './logging'
import reducer from './reducer'
import { routingApi } from './routing/slice'

const PERSISTED_KEYS: string[] = ['user', 'transactions', 'signatures', 'lists']

const store = configureStore({
  reducer,
  enhancers: (defaultEnhancers) => defaultEnhancers.concat(sentryEnhancer),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({
      thunk: true,
      serializableCheck: {
        // meta.arg and meta.baseQueryMeta are defaults. payload.trade is a nonserializable return value, but that's ok
        // because we are not adding it into any persisted store that requires serialization (e.g. localStorage)
        ignoredActionPaths: ['meta.arg', 'meta.baseQueryMeta', 'payload.trade'],
        ignoredPaths: [routingApi.reducerPath],
      },
    })
      .concat(routingApi.middleware)
      .concat(save({ states: PERSISTED_KEYS, debounce: 1000 })),
  preloadedState: load({ states: PERSISTED_KEYS, disableWarnings: isTestEnv() }),
})

store.dispatch(updateVersion())

setupListeners(store.dispatch)

export default store
