import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import { save, load } from 'redux-localstorage-simple'

import application from './application/reducer'
import user from './user/reducer'
import transactions from './transactions/reducer'
import wallet from './wallet/reducer'
import swap from './swap/reducer'
import mint from './mint/reducer'

import { updateVersion } from './user/actions'

const PERSISTED_KEYS: string[] = ['user', 'transactions']

const store = configureStore({
  reducer: {
    application,
    user,
    transactions,
    wallet,
    swap,
    mint
  },
  middleware: [...getDefaultMiddleware(), save({ states: PERSISTED_KEYS })],
  preloadedState: load({ states: PERSISTED_KEYS })
})

store.dispatch(updateVersion())

export default store

export type AppState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
