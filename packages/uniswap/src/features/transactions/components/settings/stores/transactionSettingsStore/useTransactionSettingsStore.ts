import { useContext, useMemo } from 'react'
import type { TransactionSettingsAutoSlippageToleranceState } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/createTransactionSettingsAutoSlippageToleranceStore'
import type { TransactionSettingsStoreState } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/createTransactionSettingsStore'
import { TransactionSettingsStoreContext } from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/TransactionSettingsStoreContext'
import type { TransactionSettingsState } from 'uniswap/src/features/transactions/components/settings/types'
import { useEvent } from 'utilities/src/react/hooks'
import type { StoreApi } from 'zustand'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/shallow'

export type TransactionSettings = TransactionSettingsState & { autoSlippageTolerance?: number }

// Create a hook to use the transaction settings store
const useTransactionSettingsStoreBase = (): StoreApi<TransactionSettingsStoreState> => {
  const context = useContext(TransactionSettingsStoreContext)

  if (!context) {
    throw new Error('useTransactionSettingsStore must be used within TransactionSettingsStoreContextProvider')
  }
  return context.transactionSettingsStore
}

// Create a hook to use the store's state
export function useTransactionSettingsStore<T>(
  selector: (state: Omit<TransactionSettingsStoreState, 'actions'>) => T,
): T {
  return useStore(useTransactionSettingsStoreBase(), useShallow(selector))
}

// Create a hook to use the store's actions
export function useTransactionSettingsActions(): TransactionSettingsStoreState['actions'] {
  return useStore(
    useTransactionSettingsStoreBase(),
    useShallow((s) => s.actions),
  )
}

const useTransactionSettingsAutoSlippageToleranceStoreBase =
  (): StoreApi<TransactionSettingsAutoSlippageToleranceState> => {
    const context = useContext(TransactionSettingsStoreContext)

    if (!context) {
      throw new Error('useAutoSlippageToleranceStore must be used within TransactionSettingsStoreContextProvider')
    }
    return context.autoSlippageStore
  }

export function useTransactionSettingsAutoSlippageToleranceStore<T>(
  selector: (state: Omit<TransactionSettingsAutoSlippageToleranceState, 'actions'>) => T,
): T {
  return useStore(useTransactionSettingsAutoSlippageToleranceStoreBase(), useShallow(selector))
}

// Create a hook to use the store's actions
export function useSetTransactionSettingsAutoSlippageTolerance(): TransactionSettingsAutoSlippageToleranceState['actions']['setAutoSlippageTolerance'] {
  const selectSetAutoSlippageTolerance = useEvent(
    (s: TransactionSettingsAutoSlippageToleranceState) => s.actions.setAutoSlippageTolerance,
  )
  return useStore(useTransactionSettingsAutoSlippageToleranceStoreBase(), useShallow(selectSetAutoSlippageTolerance))
}

/**
 * Returns all transaction settings, including the auto slippage tolerance.
 *
 * @warning Only used in logging and when submitting a transaction. For individual values, use selectors.
 * @returns All transaction settings, including the auto slippage tolerance.
 */
export const useAllTransactionSettings = (): TransactionSettings => {
  const settings: TransactionSettingsState = useTransactionSettingsStore((s) => ({
    customSlippageTolerance: s.customSlippageTolerance,
    customDeadline: s.customDeadline,
    selectedProtocols: s.selectedProtocols,
    slippageWarningModalSeen: s.slippageWarningModalSeen,
    isV4HookPoolsEnabled: s.isV4HookPoolsEnabled,
  }))
  const autoSlippageTolerance = useTransactionSettingsAutoSlippageToleranceStore((state) => state.autoSlippageTolerance)
  return useMemo(() => ({ ...settings, autoSlippageTolerance }), [settings, autoSlippageTolerance])
}
