import { NavigationContainer } from '@react-navigation/native'
import type { EnhancedStore, PreloadedState } from '@reduxjs/toolkit'
import { configureStore } from '@reduxjs/toolkit'
import {
  RenderHookOptions,
  RenderHookResult,
  RenderOptions,
  RenderResult,
  render as RNRender,
  renderHook as RNRenderHook,
} from '@testing-library/react-native'
import { GraphQLApi } from '@universe/api'
import React, { PropsWithChildren } from 'react'
import { MobileWalletNavigationProvider } from 'src/app/MobileWalletNavigationProvider'
import type { MobileState } from 'src/app/mobileReducer'
import { navigationRef } from 'src/app/navigation/navigationRef'
import { store as appStore, persistedReducer } from 'src/app/store'
import { UniswapProvider } from 'uniswap/src/contexts/UniswapContext'
import { BlankUrlProvider } from 'uniswap/src/contexts/UrlContext'
import { fiatOnRampAggregatorApi } from 'uniswap/src/features/fiatOnRamp/api'
import { AutoMockedApolloProvider } from 'uniswap/src/test/mocks'
import { mockUniswapContext } from 'uniswap/src/test/render'
import { SharedWalletProvider } from 'wallet/src/providers/SharedWalletProvider'

type AppStore = typeof appStore

// This type extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
type ExtendedRenderOptions = RenderOptions & {
  resolvers?: GraphQLApi.Resolvers
  preloadedState?: PreloadedState<MobileState>
  store?: AppStore
}

/**
 *
 * @param ui Component to render
 * @param resolvers Custom resolvers that override the default ones
 * @param preloadedState and store
 * @returns `ui` wrapped with providers
 */
export function renderWithProviders(
  ui: React.ReactElement,
  {
    resolvers,
    preloadedState = {},
    // Automatically create a store instance if no store was passed in
    store = configureStore({
      reducer: persistedReducer,
      preloadedState,
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(fiatOnRampAggregatorApi.middleware),
    }),
    ...renderOptions
  }: ExtendedRenderOptions = {},
): RenderResult & {
  store: EnhancedStore
} {
  function Wrapper({ children }: PropsWithChildren<unknown>): JSX.Element {
    return (
      <UniswapProvider {...mockUniswapContext}>
        <AutoMockedApolloProvider resolvers={resolvers}>
          <BlankUrlProvider>
            <SharedWalletProvider reduxStore={store}>
              <NavigationContainer ref={navigationRef}>
                <MobileWalletNavigationProvider>{children}</MobileWalletNavigationProvider>
              </NavigationContainer>
            </SharedWalletProvider>
          </BlankUrlProvider>
        </AutoMockedApolloProvider>
      </UniswapProvider>
    )
  }

  // Return an object with the store and all of RTL's query functions
  return { store, ...RNRender(ui, { wrapper: Wrapper, ...renderOptions }) }
}

// This type extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
type ExtendedRenderHookOptions<P> = RenderHookOptions<P> & {
  resolvers?: GraphQLApi.Resolvers
  preloadedState?: PreloadedState<MobileState>
  store?: AppStore
}

type RenderHookWithProvidersResult<R, P = undefined> = Omit<RenderHookResult<R, P>, 'rerender'> & {
  store: EnhancedStore
  rerender: (args?: P) => void
}

// Don't require hookOptions if hook doesn't take any arguments
export function renderHookWithProviders<R>(
  hook: () => R,
  hookOptions?: ExtendedRenderHookOptions<undefined>,
): RenderHookWithProvidersResult<R>

// Require hookOptions if hook takes arguments
export function renderHookWithProviders<R, P>(
  hook: (args: P) => R,
  hookOptions: ExtendedRenderHookOptions<P>,
): RenderHookWithProvidersResult<R, P>

/**
 *
 * @param hook Hook to render
 * @param resolvers Custom resolvers that override the default ones
 * @param preloadedState and store
 * @returns `hook` wrapped with providers
 */
export function renderHookWithProviders<P, R>(
  hook: (args: P) => R,
  hookOptions?: ExtendedRenderHookOptions<P>,
): RenderHookWithProvidersResult<R, P> {
  const {
    resolvers,
    preloadedState = {},
    // Automatically create a store instance if no store was passed in
    store = configureStore({
      reducer: persistedReducer,
      preloadedState,
      middleware: (getDefaultMiddleware) => getDefaultMiddleware().concat(fiatOnRampAggregatorApi.middleware),
    }),
    ...renderOptions
  } = (hookOptions ?? {}) as ExtendedRenderHookOptions<P>

  function Wrapper({ children }: PropsWithChildren<unknown>): JSX.Element {
    return (
      <UniswapProvider {...mockUniswapContext}>
        <AutoMockedApolloProvider resolvers={resolvers}>
          <BlankUrlProvider>
            <NavigationContainer ref={navigationRef}>
              <SharedWalletProvider reduxStore={store}>
                <MobileWalletNavigationProvider>{children}</MobileWalletNavigationProvider>
              </SharedWalletProvider>
            </NavigationContainer>
          </BlankUrlProvider>
        </AutoMockedApolloProvider>
      </UniswapProvider>
    )
  }

  const options: RenderHookOptions<P> = {
    wrapper: Wrapper,
    ...(renderOptions as RenderHookOptions<P>),
  }

  const { rerender, ...rest } = RNRenderHook<R, P>((args: P) => hook(args), options)

  // Return an object with the store and all of RTL's query functions
  return {
    store,
    rerender: rerender as (args?: P) => void,
    ...rest,
  }
}
