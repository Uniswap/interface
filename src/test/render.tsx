import { ApolloLink } from '@apollo/client'
import { MockedProvider, MockedResponse, MockLink } from '@apollo/client/testing'
import { NavigationContainer } from '@react-navigation/native'
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
import {} from 'src/data/hooks'
import { setupCache, setupErrorLink } from 'src/data/utils'
import { theme } from 'src/styles/theme'

// This type interface extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
interface ExtendedRenderOptions extends Omit<RenderOptions, 'queries'> {
  mocks?: ReadonlyArray<MockedResponse>
  preloadedState?: PreloadedState<RootState>
  store?: AppStore
}

/**
 *
 * @param ui Component to render
 * @param mocks Mocks to pass to Apollo MockedProvider
 * @param preloadedState and store
 * @returns `ui` wrapped with providers
 */
export function renderWithProviders(
  ui: React.ReactElement,
  {
    mocks = [],
    preloadedState = {},
    // Automatically create a store instance if no store was passed in
    store = configureStore({ reducer: persistedReducer, preloadedState }),
    ...renderOptions
  }: ExtendedRenderOptions = {}
) {
  function Wrapper({ children }: PropsWithChildren<unknown>): JSX.Element {
    // Helps expose errors in MockedProvider
    const link = ApolloLink.from([setupErrorLink(1, 1), new MockLink(mocks)])

    return (
      <MockedProvider addTypename={false} cache={setupCache()} link={link} mocks={mocks}>
        <Provider store={store}>
          <NavigationContainer>
            <ThemeProvider theme={theme}>{children}</ThemeProvider>
          </NavigationContainer>
        </Provider>
      </MockedProvider>
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
