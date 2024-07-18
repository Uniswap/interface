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
import React, { PropsWithChildren } from 'react'
import { AppStore } from 'src/store/store'
import { WebState, webReducer } from 'src/store/webReducer'
import { Resolvers } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { UnitagUpdaterContextProvider } from 'uniswap/src/features/unitags/context'
import { SharedProvider } from 'wallet/src/provider'
import { AutoMockedApolloProvider } from 'wallet/src/test/mocks'

// This type extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
type ExtendedRenderOptions = RenderOptions & {
  resolvers?: Resolvers
  preloadedState?: PreloadedState<WebState>
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
      reducer: webReducer,
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
      <AutoMockedApolloProvider resolvers={resolvers}>
        <SharedProvider reduxStore={store}>
          <UnitagUpdaterContextProvider>{children}</UnitagUpdaterContextProvider>
        </SharedProvider>
      </AutoMockedApolloProvider>
    )
  }

  // Return an object with the store and all of RTL's query functions
  return { store, ...ReactRender(ui, { wrapper: Wrapper, ...renderOptions }) }
}

// This type extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
type ExtendedRenderHookOptions<P> = RenderHookOptions<P> & {
  resolvers?: Resolvers
  preloadedState?: PreloadedState<WebState>
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
      reducer: webReducer,
      preloadedState,
      middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
    }),
    ...renderOptions
  } = (hookOptions ?? {}) as ExtendedRenderHookOptions<P>

  function Wrapper({ children }: PropsWithChildren<unknown>): JSX.Element {
    return (
      <AutoMockedApolloProvider resolvers={resolvers}>
        <SharedProvider reduxStore={store}>{children}</SharedProvider>
      </AutoMockedApolloProvider>
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
