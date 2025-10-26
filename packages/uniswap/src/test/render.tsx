/* biome-ignore-all lint/suspicious/noExplicitAny: legacy code needs review */
import { InMemoryCache, Resolvers } from '@apollo/client'
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
import { ParsedQs } from 'qs'
import { PropsWithChildren } from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import { TamaguiProvider as OGTamaguiProvider, TamaguiProviderProps } from 'ui/src'
import { config } from 'ui/src/tamagui.config'
import { UniswapProvider } from 'uniswap/src/contexts/UniswapContext'
import { UrlContext } from 'uniswap/src/contexts/UrlContext'
import { SharedPersistQueryClientProvider } from 'uniswap/src/data/apiClients/SharedPersistQueryClientProvider'
import 'uniswap/src/i18n'
import { UniswapState, uniswapReducer } from 'uniswap/src/state/uniswapReducer'
import { AutoMockedApolloProvider } from 'uniswap/src/test/mocks'

export const mockUniswapContext = {
  navigateToBuyOrReceiveWithEmptyWallet: jest.fn(),
  navigateToFiatOnRamp: jest.fn(),
  navigateToSwapFlow: jest.fn(),
  navigateToSendFlow: jest.fn(),
  navigateToReceive: jest.fn(),
  navigateToTokenDetails: jest.fn(),
  navigateToExternalProfile: jest.fn(),
  navigateToNftDetails: jest.fn(),
  navigateToNftCollection: jest.fn(),
  navigateToPoolDetails: jest.fn(),
  handleShareToken: jest.fn(),
  onSwapChainsChanged: jest.fn(),
  isSwapTokenSelectorOpen: false,
  setSwapOutputChainId: jest.fn(),
  setIsSwapTokenSelectorOpen: jest.fn(),
  signer: undefined,
  useProviderHook: jest.fn(),
  useWalletDisplayName: jest.fn(),
  onConnectWallet: jest.fn(),
  useAccountsStoreContextHook: jest.fn(),
}

// This type extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
type ExtendedRenderOptions = RenderOptions & {
  cache?: InMemoryCache
  resolvers?: Resolvers
  preloadedState?: PreloadedState<UniswapState>
  store?: EnhancedStore<UniswapState>
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
      reducer: uniswapReducer,
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
        <ReduxProvider store={store}>
          <SharedUniswapProvider>{children}</SharedUniswapProvider>
        </ReduxProvider>
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
  preloadedState?: PreloadedState<UniswapState>
  store?: EnhancedStore<UniswapState>
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
      reducer: uniswapReducer,
      preloadedState,
      middleware: (getDefaultMiddleware) => getDefaultMiddleware(),
    }),
    ...renderOptions
  } = (hookOptions ?? {}) as ExtendedRenderHookOptions<P>

  function Wrapper({ children }: PropsWithChildren<unknown>): JSX.Element {
    return (
      <AutoMockedApolloProvider cache={cache} resolvers={resolvers}>
        <ReduxProvider store={store}>
          <SharedUniswapProvider>{children}</SharedUniswapProvider>
        </ReduxProvider>
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

function SharedUniswapProvider({ children }: Pick<TamaguiProviderProps, 'children'>): JSX.Element {
  return (
    <UniswapProvider {...mockUniswapContext}>
      <UrlContext.Provider value={{ useParsedQueryString: () => ({}) as ParsedQs, usePathname: () => '' }}>
        <SharedPersistQueryClientProvider>
          <OGTamaguiProvider config={config} defaultTheme="dark">
            {children}
          </OGTamaguiProvider>
        </SharedPersistQueryClientProvider>
      </UrlContext.Provider>
    </UniswapProvider>
  )
}
