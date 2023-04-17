import { configureStore } from '@reduxjs/toolkit'
import React from 'react'
import { Provider } from 'react-redux'
import { persistedReducer } from '../src/app/store'
import { mockWalletPreloadedState } from '../src/test/fixtures'

const preloadedState = {
  ...mockWalletPreloadedState,
}

const store = configureStore({ reducer: persistedReducer, preloadedState })

export const ReduxDecorator = (Story) => {
  return (
    <Provider store={store}>
      <Story />
    </Provider>
  )
}
