import { configureStore, getDefaultMiddleware } from '@reduxjs/toolkit'
import application from './application/reducer'
import user from './user/reducer'
import { save, load } from 'redux-localstorage-simple'

const PERSISTED_KEYS: string[] = ['user']

const store = configureStore({
  reducer: {
    application,
    user
  },
  middleware: [...getDefaultMiddleware(), save({ states: PERSISTED_KEYS })],
  preloadedState: load({ states: PERSISTED_KEYS })
})

export default store

export type AppState = ReturnType<typeof store.getState>
export type AppDispatch = typeof store.dispatch
