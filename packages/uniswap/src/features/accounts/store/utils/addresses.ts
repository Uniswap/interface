import type { AccountsState } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { useStoreWithShallow } from 'uniswap/src/features/accounts/store/utils/createUseAccountsStore'
import { StoreApi, UseBoundStore } from 'zustand'

/**
 * Factory function that creates a useActiveAddress hook for a specific accounts store context.
 * Returns the address of the currently active account for the specified platform.
 */
export function createUseActiveAddress<TAccountsState extends AccountsState>(
  useAccountsStoreCtx: () => UseBoundStore<StoreApi<TAccountsState>>,
): TAccountsState['getActiveAddress'] {
  return (platform) => {
    return useStoreWithShallow(useAccountsStoreCtx, ({ getActiveAddress }) => getActiveAddress(platform))
  }
}

/**
 * Factory function that creates a useActiveAddresses hook for a specific accounts store context.
 * Returns all addresses for the currently active account across all platforms.
 */
export function createUseActiveAddresses<TAccountsState extends AccountsState>(
  useAccountsStoreCtx: () => UseBoundStore<StoreApi<TAccountsState>>,
): TAccountsState['getActiveAddresses'] {
  return () => {
    return useStoreWithShallow(useAccountsStoreCtx, ({ getActiveAddresses }) => getActiveAddresses())
  }
}
