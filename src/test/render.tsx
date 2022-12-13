import type { PreloadedState } from '@reduxjs/toolkit'
import { configureStore } from '@reduxjs/toolkit'
import { ThemeProvider } from '@shopify/restyle'
import type { RenderOptions } from '@testing-library/react-native'
import { render, render as RNRender } from '@testing-library/react-native'
import React, { PropsWithChildren, ReactElement } from 'react'
import { Provider } from 'react-redux'
import type { RootState } from 'src/app/rootReducer'
import type { AppStore } from 'src/app/store'
import { persistedReducer } from 'src/app/store'
import { theme } from 'src/styles/theme'

// This type interface extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  preloadedState?: PreloadedState<RootState>
  store?: AppStore
}

export function renderWithProviders(
  ui: React.ReactElement,
  {
    preloadedState = {},
    // Automatically create a store instance if no store was passed in
    store = configureStore({ reducer: persistedReducer, preloadedState }),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: PropsWithChildren<unknown>): JSX.Element {
    return (
      <Provider store={store}>
        <ThemeProvider theme={theme}>{children}</ThemeProvider>
      </Provider>
    )
  }

  // Return an object with the store and all of RTL's query functions
  return { store, ...render(ui, { wrapper: Wrapper, ...renderOptions }) }
}

export const WithTheme = ({ component }: { component: ReactElement }) => {
  return <ThemeProvider theme={theme}>{component}</ThemeProvider>
}

export const renderWithTheme = (element: ReactElement) =>
  RNRender(<WithTheme component={element} />).toJSON()
