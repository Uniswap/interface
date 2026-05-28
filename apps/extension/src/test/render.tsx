import type { EnhancedStore, PreloadedState } from '@reduxjs/toolkit'
import { configureStore } from '@reduxjs/toolkit'
import {
  render as ReactRender,
  renderHook as ReactRenderHook,
  RenderHookOptions,
  RenderHookResult,
  RenderOptions,
  RenderResult,
} from '@testing-library/react'
import { GraphQLApi } from '@universe/api'
import React, { PropsWithChildren } from 'react'
import { ExtensionState, extensionReducer } from 'src/store/extensionReducer'
import { AppStore } from 'src/store/store'
import { UniswapProvider } from 'uniswap/src/contexts/UniswapContext'
import { AutoMockedApolloProvider } from 'uniswap/src/test/mocks'
import { mockUniswapContext } from 'uniswap/src/test/render'
import { SharedWalletProvider } from 'wallet/src/providers/SharedWalletProvider'

// This type extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
type ExtendedRenderOptions = RenderOptions & {
  resolvers?: GraphQLApi.Resolvers
  preloadedState?: PreloadedState<ExtensionState>
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
      reducer: extensionReducer,
      preloadedState,
      middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
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
          <SharedWalletProvider reduxStore={store}>{children}</SharedWalletProvider>
        </AutoMockedApolloProvider>
      </UniswapProvider>
    )
  }

  // Return an object with the store and all of RTL's query functions
  return { store, ...ReactRender(ui, { wrapper: Wrapper, ...renderOptions }) }
}

// This type extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
type ExtendedRenderHookOptions<P> = RenderHookOptions<P> & {
  resolvers?: GraphQLApi.Resolvers
  preloadedState?: PreloadedState<ExtensionState>
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
      reducer: extensionReducer,
      preloadedState,
      middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
    }),
    ...renderOptions
  } = (hookOptions ?? {}) as ExtendedRenderHookOptions<P>

  function Wrapper({ children }: PropsWithChildren<unknown>): JSX.Element {
    return (
      <UniswapProvider {...mockUniswapContext}>
        <AutoMockedApolloProvider resolvers={resolvers}>
          <SharedWalletProvider reduxStore={store}>{children}</SharedWalletProvider>
        </AutoMockedApolloProvider>
      </UniswapProvider>
    )
  }

  const options: RenderHookOptions<P> = {
    wrapper: Wrapper,
    ...(renderOptions as RenderHookOptions<P>),
  }

  const { ...rest } = ReactRenderHook<R, P>((args: P) => hook(args), options)

  // Return an object with the store and all of RTL's query functions
  return {
    store,
    ...rest,
  }
}
