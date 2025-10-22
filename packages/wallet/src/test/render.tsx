/* biome-ignore-all lint/suspicious/noExplicitAny: Test utilities need flexible typing for generic render functions */
import { InMemoryCache } from '@apollo/client'
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
import { UniswapProvider } from 'uniswap/src/contexts/UniswapContext'
import { AutoMockedApolloProvider } from 'uniswap/src/test/mocks'
import { mockUniswapContext } from 'uniswap/src/test/render'
import { WalletNavigationContextState, WalletNavigationProvider } from 'wallet/src/contexts/WalletNavigationContext'
import { NativeWalletProvider } from 'wallet/src/features/wallet/providers/NativeWalletProvider'
import { SharedWalletProvider } from 'wallet/src/providers/SharedWalletProvider'
import { WalletStateReducersOnly, walletRootReducer } from 'wallet/src/state/walletReducer'

// This type extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
type ExtendedRenderOptions = RenderOptions & {
  cache?: InMemoryCache
  resolvers?: GraphQLApi.Resolvers
  preloadedState?: PreloadedState<WalletStateReducersOnly>
  store?: EnhancedStore<WalletStateReducersOnly>
}

const mockNavigationFunctions: WalletNavigationContextState = {
  navigateToAccountActivityList: jest.fn(),
  navigateToAccountTokenList: jest.fn(),
  navigateToBuyOrReceiveWithEmptyWallet: jest.fn(),
  navigateToExternalProfile: jest.fn(),
  navigateToFiatOnRamp: jest.fn(),
  navigateToNftDetails: jest.fn(),
  navigateToNftCollection: jest.fn(),
  navigateToSwapFlow: jest.fn(),
  navigateToTokenDetails: jest.fn(),
  navigateToReceive: jest.fn(),
  navigateToSend: jest.fn(),
  handleShareToken: jest.fn(),
  navigateToPoolDetails: jest.fn(),
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
      reducer: walletRootReducer,
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
      <AutoMockedApolloProvider cache={cache} resolvers={resolvers}>
        <SharedWalletProvider reduxStore={store}>
          <NativeWalletProvider>
            <UniswapProvider {...mockUniswapContext}>
              <WalletNavigationProvider {...mockNavigationFunctions}>{children}</WalletNavigationProvider>
            </UniswapProvider>
          </NativeWalletProvider>
        </SharedWalletProvider>
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
  resolvers?: GraphQLApi.Resolvers
  preloadedState?: PreloadedState<WalletStateReducersOnly>
  store?: EnhancedStore<WalletStateReducersOnly>
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
  hookOptions?: ExtendedRenderHookOptions<undefined>,
): RenderHookWithProvidersResult<R>

// Require hookOptions if hook takes arguments
export function renderHookWithProviders<R, P extends any[]>(
  hook: (...args: P) => R,
  hookOptions: ExtendedRenderHookOptions<P>,
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
  hookOptions?: ExtendedRenderHookOptions<P>,
): RenderHookWithProvidersResult<R, P> {
  const {
    cache,
    resolvers,
    preloadedState = {},
    // Automatically create a store instance if no store was passed in
    store = configureStore({
      reducer: walletRootReducer,
      preloadedState,
      middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
    }),
    ...renderOptions
  } = (hookOptions ?? {}) as ExtendedRenderHookOptions<P>

  function Wrapper({ children }: PropsWithChildren<unknown>): JSX.Element {
    return (
      <AutoMockedApolloProvider cache={cache} resolvers={resolvers}>
        <SharedWalletProvider reduxStore={store}>
          <NativeWalletProvider>{children}</NativeWalletProvider>
        </SharedWalletProvider>
      </AutoMockedApolloProvider>
    )
  }

  const options: RenderHookOptions<P> = {
    wrapper: Wrapper,
    ...(renderOptions as RenderHookOptions<P>),
  }

  // eslint-disable-next-line @typescript-eslint/no-unnecessary-condition
  const { rerender, ...rest } = RNRenderHook<R, P>((args: P) => hook(...(args ?? [])), options)

  // Return an object with the store and all of RTL's query functions
  return {
    store,
    rerender: rerender as P extends any[] ? (args: P) => void : () => void,
    ...rest,
  }
}
