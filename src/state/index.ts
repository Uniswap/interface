import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import application from './application/reducer'
import { updateVersion } from './user/actions'
import user from './user/reducer'
import wallet from './wallet/reducer'
import swap from './swap/reducer'
import transactions from './transactions/reducer'
import { save, load } from 'redux-localstorage-simple'

const PERSISTED_KEYS: string[] = ['user', 'transactions']

const store = configureStore({
  reducer: {
    application,
    user,
    transactions,
    wallet,
    swap
  },
  middleware: [...getDefaultMiddleware(), save({ states: PERSISTED_KEYS })],
  preloadedState: load({ states: PERSISTED_KEYS })
})

store.dispatch(updateVersion())

export default store

export type AppState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
