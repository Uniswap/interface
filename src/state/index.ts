import { configureStore } from '@reduxjs/toolkit'
import { setupListeners } from '@reduxjs/toolkit/query/react'
import { load, save } from 'redux-localstorage-simple'
import { isTestEnv } from 'utils/env'

import { updateVersion } from './global/actions'
import { sentryEnhancer } from './logging'
import reducer from './reducer'
import { routingApi } from './routing/slice'

const PERSISTED_KEYS: string[] = ['user', 'transactions', 'lists']

const store = configureStore({
  reducer,
  enhancers: (defaultEnhancers) => defaultEnhancers.concat(sentryEnhancer),
  middleware: (getDefaultMiddleware) =>
    getDefaultMiddleware({ thunk: true })
      .concat(routingApi.middleware)
      .concat(save({ states: PERSISTED_KEYS, debounce: 1000 })),
  preloadedState: load({ states: PERSISTED_KEYS, disableWarnings: isTestEnv() }),
})

store.dispatch(updateVersion())

setupListeners(store.dispatch)

export default store
