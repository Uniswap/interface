import { useContext } from 'react'
import type {
  ModalId,
  TransactionSettingsModalId,
} from 'uniswap/src/features/transactions/components/settings/stores/TransactionSettingsModalStore/createTransactionSettingsModalStore'
import { TransactionSettingsModalStoreContext } from 'uniswap/src/features/transactions/components/settings/stores/TransactionSettingsModalStore/TransactionSettingsModalStoreContext'
import { useStore } from 'zustand'
import { useShallow } from 'zustand/shallow'

export function useModalVisibility<T extends TransactionSettingsModalId>(modalId: ModalId<T>): boolean {
  const context = useContext(TransactionSettingsModalStoreContext)
  if (!context) {
    throw new Error('useModalVisibility must be used within TransactionSettingsModalStoreContextProvider')
  }
  return useStore(
    context,
    useShallow((state) => {
      const modal = state.modals[modalId]
      return modal.isVisible
    }),
  )
}

export function useModalShow<T extends TransactionSettingsModalId>(modalId: ModalId<T>): () => void {
  const context = useContext(TransactionSettingsModalStoreContext)
  if (!context) {
    throw new Error('useModalShow must be used within TransactionSettingsModalStoreContextProvider')
  }
  return useStore(
    context,
    useShallow((state) => {
      const modal = state.modals[modalId]
      return modal.show
    }),
  )
}

export function useModalHide<T extends TransactionSettingsModalId>(modalId: ModalId<T>): () => void {
  const context = useContext(TransactionSettingsModalStoreContext)
  if (!context) {
    throw new Error('useModalHide must be used within TransactionSettingsModalStoreContextProvider')
  }
  return useStore(
    context,
    useShallow((state) => {
      const modal = state.modals[modalId]
      return modal.hide
    }),
  )
}
