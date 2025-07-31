import type { EnhancedStore, PreloadedState } from '@reduxjs/toolkit'
import { configureStore } from '@reduxjs/toolkit'
import { RenderHookOptions, RenderHookResult, renderHook } from '@testing-library/react'
import { PropsWithChildren } from 'react'
import { Provider } from 'react-redux'
import { uniswapReducer } from 'uniswap/src/state/uniswapReducer'

// Type for the uniswap state
type UniswapState = ReturnType<typeof uniswapReducer>

// This type extends the default options for renderHook from RTL, as well
// as allows the user to specify other things such as initialState, store.
type ExtendedRenderHookOptions<Props> = RenderHookOptions<Props> & {
  preloadedState?: PreloadedState<UniswapState>
  store?: EnhancedStore<UniswapState>
}

// Create a test store using the uniswap reducer
const createTestStore = (preloadedState?: PreloadedState<UniswapState>) => {
  return configureStore({
    reducer: uniswapReducer,
    preloadedState: {
      transactions: {},
      ...preloadedState,
    },
    middleware: (getDefaultMiddleware) =>
      getDefaultMiddleware({
        serializableCheck: false,
        immutableCheck: false,
      }),
  })
}

// Test store provider wrapper
const TestStoreProvider = ({
  children,
  store,
}: {
  children: React.ReactNode
  store: ReturnType<typeof createTestStore>
}) => {
  return <Provider store={store}>{children}</Provider>
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
 * Renders a hook with providers (Redux store)
 * @param hook Hook to render
 * @param options Options including preloadedState and store
 * @returns Hook result with store
 */
export function renderHookWithProviders<Props, Result>(
  hook: (props: Props) => Result,
  options?: ExtendedRenderHookOptions<Props>,
): RenderHookWithProvidersResult<Result, Props> {
  const {
    preloadedState = {},
    // Automatically create a store instance if no store was passed in
    store = createTestStore(preloadedState),
    ...renderOptions
  } = (options ?? {}) as ExtendedRenderHookOptions<Props>

  function Wrapper({ children }: PropsWithChildren<unknown>): JSX.Element {
    return <TestStoreProvider store={store}>{children}</TestStoreProvider>
  }

  const hookOptions: RenderHookOptions<Props> = {
    wrapper: Wrapper,
    ...renderOptions,
  }

  const { rerender, ...rest } = renderHook<Result, Props>(hook, hookOptions)

  // Return an object with the store and all of RTL's query functions
  return {
    store,
    rerender: rerender as (args?: Props) => void,
    ...rest,
  }
}
