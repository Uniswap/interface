import { configureStore } from '@reduxjs/toolkit'
import application from './application/reducer'

const store = configureStore({
  reducer: {
    application
  }
})

export default store

export type State = ReturnType<typeof store.getState>
export type Dispatch = typeof store.dispatch
