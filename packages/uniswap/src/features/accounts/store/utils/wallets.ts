import { useRef } from 'react'
import type { AccountsState } from 'uniswap/src/features/accounts/store/types/AccountsState'
import { Wallet } from 'uniswap/src/features/accounts/store/types/Wallet'
import { StoreApi, UseBoundStore, useStore } from 'zustand'
import { shallow } from 'zustand/shallow'

/**
 * Handles nested comparison of Wallet.addresses fields to avoid unnecessary re-renders.
 * Performs deep comparison on the addresses array while using shallow comparison for other fields.
 *
 * Returns true if prev and next are considered equivalent, false otherwise.
 */
function shallowWalletComparison<U extends Wallet | undefined>(prev: U, next: U): boolean {
  // Identical pointer: no comparison needed.
  if (prev === next) {
    return true
  }

  if (!prev || !next) {
    return false
  }

  // `Wallet.addresses` fields are nested (array) objects; shallow(prev, next) will fail if they are defined with
  // the same values. To account for this, we separately compare the addresses from other wallet fields.
  const { addresses: prevAddresses, ...prevRest } = prev
  const { addresses: nextAddresses, ...nextRest } = next

  if (Object.keys(prevAddresses).length !== Object.keys(nextAddresses).length) {
    // Different number of addresses: not equivalent.
    return false
  }

  const addressesAreEquivalent = Object.entries(prevAddresses).every(([index, curr]) =>
    shallow(curr, nextAddresses[Number(index)]),
  )

  return addressesAreEquivalent && shallow(prevRest, nextRest)
}

/**
 * Custom shallow comparison hook for Wallet types that handles nested address comparisons.
 * Based on Zustand's useShallow implementation but optimized for Wallet.addresses array structure.
 */
export function useShallowWalletComparison<S, U extends Wallet | undefined>(
  selector: (state: S) => U,
): (state: S) => U {
  const prev = useRef<U>(undefined)

  return (state) => {
    const next = selector(state)
    return shallowWalletComparison(prev.current, next) ? (prev.current as U) : (prev.current = next)
  }
}

/**
 * Factory function that creates a useActiveWallet hook for a specific accounts store context.
 * Returns the currently active wallet for the specified platform with optimized re-render handling.
 */
export function createUseActiveWallet<TAccountsState extends AccountsState>(
  useAccountsStoreCtx: () => UseBoundStore<StoreApi<TAccountsState>>,
): TAccountsState['getActiveWallet'] {
  return (platform) => {
    const store = useAccountsStoreCtx()
    return useStore(
      store,
      useShallowWalletComparison(({ getActiveWallet }) => getActiveWallet(platform)),
    )
  }
}

/**
 * Factory function that creates a useWalletWithId hook for a specific accounts store context.
 * Returns the wallet with the specified ID with optimized re-render handling.
 */
export function createUseWalletWithId<TWalletType extends Wallet>(
  useAccountsStoreCtx: () => UseBoundStore<StoreApi<{ wallets: Record<string, TWalletType> }>>,
): (id: string) => TWalletType | undefined {
  return (id: string) => {
    const store = useAccountsStoreCtx()
    return useStore(
      store,
      useShallowWalletComparison(({ wallets }) => wallets[id]),
    )
  }
}
