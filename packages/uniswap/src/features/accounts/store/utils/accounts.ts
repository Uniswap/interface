import type { AccountsState } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { useStoreWithShallow } from 'uniswap/src/features/accounts/store/utils/createUseAccountsStore'
import { StoreApi, UseBoundStore } from 'zustand'

/**
 * Factory function that creates a useActiveAccount hook for a specific accounts store context.
 * Returns the currently active account for the specified platform.
 */
export function createUseActiveAccount<TAccountsState extends AccountsState>(
  useAccountsStoreCtx: () => UseBoundStore<StoreApi<TAccountsState>>,
): TAccountsState['getActiveAccount'] {
  return (platform) => {
    return useStoreWithShallow(useAccountsStoreCtx, ({ getActiveAccount }) => getActiveAccount(platform))
  }
}
