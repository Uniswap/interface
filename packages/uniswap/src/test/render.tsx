import 'uniswap/src/i18n'
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
import { SharedQueryClient } from '@universe/api'
import { PriceServiceProvider } from '@universe/prices'
import { ParsedQs } from 'qs'
import { PropsWithChildren, useEffect } from 'react'
import { Provider as ReduxProvider } from 'react-redux'
import { UniswapProvider } from 'uniswap/src/contexts/UniswapContext'
import { UrlContext } from 'uniswap/src/contexts/UrlContext'
import { SharedPersistQueryClientProvider } from 'uniswap/src/data/reactQuery/SharedPersistQueryClientProvider'
import { UniswapState, uniswapReducer } from 'uniswap/src/state/uniswapReducer'
import { createMockFn } from 'uniswap/src/test/mockFn'

export const mockUniswapContext = {
  navigateToBuyOrReceiveWithEmptyWallet: createMockFn(),
  navigateToFiatOnRamp: createMockFn(),
  navigateToSwapFlow: createMockFn(),
  navigateToSendFlow: createMockFn(),
  navigateToReceive: createMockFn(),
  navigateToTokenDetails: createMockFn(),
  navigateToCategoryDetails: createMockFn(),
  navigateToExternalProfile: createMockFn(),
  navigateToNftDetails: createMockFn(),
  navigateToPoolDetails: createMockFn(),
  handleShareToken: createMockFn(),
  navigateToAdvancedSettings: createMockFn(),
  onSwapChainsChanged: createMockFn(),
  isSwapTokenSelectorOpen: false,
  setSwapOutputChainId: createMockFn(),
  setIsSwapTokenSelectorOpen: createMockFn(),
  signer: undefined,
  useProviderHook: createMockFn(),
  useWalletDisplayName: createMockFn(),
  onConnectWallet: createMockFn(),
  useAccountsStoreContextHook: createMockFn(),
}

// This type extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
type ExtendedRenderOptions = RenderOptions & {
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
      <ReduxProvider store={store}>
        <SharedUniswapProvider>{children}</SharedUniswapProvider>
      </ReduxProvider>
    )
  }

  // Return an object with the store and all of RTL's query functions
  return { store, ...RNRender(ui, { wrapper: Wrapper, ...renderOptions }) }
}

// This type extends the default options for render from RTL, as well
// as allows the user to specify other things such as initialState, store.
type ExtendedRenderHookOptions<P> = RenderHookOptions<P> & {
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
      <ReduxProvider store={store}>
        <SharedUniswapProvider>{children}</SharedUniswapProvider>
      </ReduxProvider>
    )
  }

  const options: RenderHookOptions<P> = {
    wrapper: Wrapper,
    ...(renderOptions as RenderHookOptions<P>),
  }

  // oxlint-disable-next-line typescript/no-unnecessary-condition
  const { rerender, ...rest } = RNRenderHook<R, P>((args: P) => hook(...(args ?? [])), options)

  // Return an object with the store and all of RTL's query functions
  return {
    store,
    rerender: rerender as P extends any[] ? (args: P) => void : () => void,
    ...rest,
  }
}

// Ref-count concurrent dark-harness mounts so unmounting one tree doesn't strip the class from
// another that is still mounted.
let darkHarnessMounts = 0

function SharedUniswapProvider({ children }: PropsWithChildren): JSX.Element {
  // The ui/src theme hooks read the root `dark` class (the app providers keep it in lockstep with
  // the selected color scheme), so the harness pins it dark while mounted.
  // Set during render — children's initial render already reads it (idempotent, so
  // re-renders are safe) — and scoped to mounts of this harness: a module-scope set would leak
  // into other packages' suites, which import mockUniswapContext from this module but mount
  // light harnesses.
  if (typeof document !== 'undefined') {
    document.documentElement.classList.add('dark')
  }
  useEffect(() => {
    darkHarnessMounts += 1
    return () => {
      darkHarnessMounts -= 1
      if (darkHarnessMounts === 0 && typeof document !== 'undefined') {
        document.documentElement.classList.remove('dark')
      }
    }
  }, [])

  return (
    <UniswapProvider {...mockUniswapContext}>
      <UrlContext.Provider value={{ useParsedQueryString: () => ({}) as ParsedQs, usePathname: () => '' }}>
        <SharedPersistQueryClientProvider>
          <PriceServiceProvider queryClient={SharedQueryClient}>{children}</PriceServiceProvider>
        </SharedPersistQueryClientProvider>
      </UrlContext.Provider>
    </UniswapProvider>
  )
}
