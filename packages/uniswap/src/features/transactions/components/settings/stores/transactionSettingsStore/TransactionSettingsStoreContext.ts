import { createContext, useContext } from 'react'
import { type TransactionSettingsAutoSlippageToleranceState } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/createTransactionSettingsAutoSlippageToleranceStore'
import { type TransactionSettingsStoreState } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/createTransactionSettingsStore'
import type { StoreApi } from 'zustand/vanilla'

export interface TransactionSettingsStoreContextValue {
  transactionSettingsStore: StoreApi<TransactionSettingsStoreState>
  autoSlippageStore: StoreApi<TransactionSettingsAutoSlippageToleranceState>
}

export const TransactionSettingsStoreContext = createContext<TransactionSettingsStoreContextValue | null>(null)

/**
 * This hook is used to forward the context value to native modal components.
 */
export function useGetTransactionSettingsContextValue(): TransactionSettingsStoreContextValue {
  const context = useContext(TransactionSettingsStoreContext)
  if (!context) {
    throw new Error('useGetTransactionSettingsContextValue must be used within TransactionSettingsStoreContextProvider')
  }
  return context
}
