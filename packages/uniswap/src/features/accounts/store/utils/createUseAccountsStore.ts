import type { AccountsState } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { StoreApi, UseBoundStore, useStore } from 'zustand'
import { useShallow } from 'zustand/react/shallow'

/**
 * Hook that subscribes to a Zustand store with shallow comparison for performance optimization.
 * Prevents unnecessary re-renders when nested object properties haven't changed.
 */
export function useStoreWithShallow<TState, U>(
  useStoreCtx: () => UseBoundStore<StoreApi<TState>>,
  selector: (state: TState) => U,
): U {
  const store = useStoreCtx()
  return useStore(store, useShallow(selector))
}

/**
 * Factory function that creates a generic useAccountsStore hook for a specific accounts store context.
 * Returns a selector-based hook for accessing store state with shallow comparison.
 */
export function createUseAccountsStore<TState extends AccountsState>(
  useAccountsStoreCtx: () => UseBoundStore<StoreApi<TState>>,
): <U>(selector: (state: TState) => U) => U {
  return (selector) => useStoreWithShallow(useAccountsStoreCtx, selector)
}
