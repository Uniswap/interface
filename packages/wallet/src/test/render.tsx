/* eslint-disable @typescript-eslint/no-explicit-any */
import { InMemoryCache } from '@apollo/client'
import type { EnhancedStore, PreloadedState } from '@reduxjs/toolkit'
import { configureStore } from '@reduxjs/toolkit'
import {
  render as RNRender,
  renderHook as RNRenderHook,
  RenderHookOptions,
  RenderHookResult,
  RenderOptions,
  RenderResult,
} from '@testing-library/react-native'
import React, { PropsWithChildren } from 'react'
import { Resolvers } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UnitagUpdaterContextProvider } from 'uniswap/src/features/unitags/context'
import { SharedProvider } from 'wallet/src/provider'
import { sharedRootReducer, type SharedState } from 'wallet/src/state/reducer'
import { AutoMockedApolloProvider } from 'wallet/src/test/mocks'

// This type extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
type ExtendedRenderOptions = RenderOptions & {
  cache?: InMemoryCache
  resolvers?: Resolvers
  preloadedState?: PreloadedState<SharedState>
  store?: EnhancedStore<SharedState>
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
    cache,
    resolvers,
    preloadedState = {},
    // Automatically create a store instance if no store was passed in
    store = configureStore({
      reducer: sharedRootReducer,
      preloadedState,
      middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
    }),
    ...renderOptions
  }: ExtendedRenderOptions = {}
): RenderResult & {
  store: EnhancedStore
} {
  function Wrapper({ children }: PropsWithChildren<unknown>): JSX.Element {
    return (
      <AutoMockedApolloProvider cache={cache} resolvers={resolvers}>
        <SharedProvider reduxStore={store}>
          <UnitagUpdaterContextProvider>{children}</UnitagUpdaterContextProvider>
        </SharedProvider>
      </AutoMockedApolloProvider>
    )
  }

  // Return an object with the store and all of RTL's query functions
  return { store, ...RNRender(ui, { wrapper: Wrapper, ...renderOptions }) }
}

// This type extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
type ExtendedRenderHookOptions<P> = RenderHookOptions<P> & {
  cache?: InMemoryCache
  resolvers?: Resolvers
  preloadedState?: PreloadedState<SharedState>
  store?: EnhancedStore<SharedState>
}

type RenderHookWithProvidersResult<R, P extends any[] | undefined = undefined> = Omit<
  RenderHookResult<R, P>,
  'rerender'
> & {
  store: EnhancedStore
  rerender: P extends any[] ? (args: P) => void : () => void
}

// Don't require hookOptions if hook doesn't take any arguments
export function renderHookWithProviders<R>(
  hook: () => R,
  hookOptions?: ExtendedRenderHookOptions<undefined>
): RenderHookWithProvidersResult<R>

// Require hookOptions if hook takes arguments
export function renderHookWithProviders<R, P extends any[]>(
  hook: (...args: P) => R,
  hookOptions: ExtendedRenderHookOptions<P>
): RenderHookWithProvidersResult<R, P>

/**
 *
 * @param hook Hook to render
 * @param resolvers Custom resolvers that override the default ones
 * @param preloadedState and store
 * @returns `hook` wrapped with providers
 */
export function renderHookWithProviders<P extends any[], R>(
  hook: (...args: P) => R,
  hookOptions?: ExtendedRenderHookOptions<P>
): RenderHookWithProvidersResult<R, P> {
  const {
    cache,
    resolvers,
    preloadedState = {},
    // Automatically create a store instance if no store was passed in
    store = configureStore({
      reducer: sharedRootReducer,
      preloadedState,
      middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
    }),
    ...renderOptions
  } = (hookOptions ?? {}) as ExtendedRenderHookOptions<P>

  function Wrapper({ children }: PropsWithChildren<unknown>): JSX.Element {
    return (
      <AutoMockedApolloProvider cache={cache} resolvers={resolvers}>
        <SharedProvider reduxStore={store}>{children}</SharedProvider>
      </AutoMockedApolloProvider>
    )
  }

  const options: RenderHookOptions<P> = {
    wrapper: Wrapper,
    ...(renderOptions as RenderHookOptions<P>),
  }

  const { rerender, ...rest } = RNRenderHook<R, P>((args: P) => hook(...(args ?? [])), options)

  // Return an object with the store and all of RTL's query functions
  return {
    store,
    rerender: rerender as P extends any[] ? (args: P) => void : () => void,
    ...rest,
  }
}
