import { type ReactNode, useEffect, useMemo, useState } from 'react'
import { createTransactionSettingsAutoSlippageToleranceStore } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/createTransactionSettingsAutoSlippageToleranceStore'
import {
  createTransactionSettingsStore,
  type TransactionSettingsStoreState,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/createTransactionSettingsStore'
import { TransactionSettingsStoreContext } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/TransactionSettingsStoreContext'
import type { StoreApi } from 'zustand/vanilla'

// Create the provider component
export function TransactionSettingsStoreContextProvider({
  children,
  store, // Optional store instance to share
  autoSlippageTolerance, // Optional initial auto slippage tolerance
}: {
  children: ReactNode
  store?: { store: StoreApi<TransactionSettingsStoreState>; cleanup: () => void }
  autoSlippageTolerance?: number
}): JSX.Element {
  // If a store is provided, use it. Otherwise create a new one
  const [{ store: settingsStore, cleanup: settingsStoreCleanup }] = useState(
    () => store || createTransactionSettingsStore(),
  )

  const [autoSlippageStore] = useState(() => createTransactionSettingsAutoSlippageToleranceStore(autoSlippageTolerance))

  // Cleanup store subscriptions on unmount
  useEffect(
    () => () => {
      settingsStoreCleanup()
    },
    [settingsStoreCleanup],
  )

  // Update the auto slippage tolerance store when the auto slippage tolerance changes
  useEffect(() => {
    const { setAutoSlippageTolerance } = autoSlippageStore.getState().actions
    setAutoSlippageTolerance(autoSlippageTolerance)
  }, [autoSlippageTolerance, autoSlippageStore])

  const contextValue = useMemo(
    () => ({ transactionSettingsStore: settingsStore, autoSlippageStore }),
    [settingsStore, autoSlippageStore],
  )

  return (
    <TransactionSettingsStoreContext.Provider value={contextValue}>{children}</TransactionSettingsStoreContext.Provider>
  )
}
