import { type ReactNode, useState } from 'react'
import type {
  ModalId,
  TransactionSettingsModalId,
  TransactionSettingsModalState,
} from 'uniswap/src/features/transactions/components/settings/stores/TransactionSettingsModalStore/createTransactionSettingsModalStore'
import { createTransactionSettingsModalStore } from 'uniswap/src/features/transactions/components/settings/stores/TransactionSettingsModalStore/createTransactionSettingsModalStore'
import { TransactionSettingsModalStoreContext } from 'uniswap/src/features/transactions/components/settings/stores/TransactionSettingsModalStore/TransactionSettingsModalStoreContext'
import type { StoreApi } from 'zustand/vanilla'

// Create the provider component
export function TransactionSettingsModalStoreContextProvider<T extends TransactionSettingsModalId>({
  children,
  modalIds,
}: {
  children: ReactNode
  modalIds: ModalId<T>[]
}): JSX.Element {
  const [store] = useState(() => createTransactionSettingsModalStore(modalIds))

  return (
    <TransactionSettingsModalStoreContext.Provider
      value={store as StoreApi<TransactionSettingsModalState<TransactionSettingsModalId>>}
    >
      {children}
    </TransactionSettingsModalStoreContext.Provider>
  )
}
