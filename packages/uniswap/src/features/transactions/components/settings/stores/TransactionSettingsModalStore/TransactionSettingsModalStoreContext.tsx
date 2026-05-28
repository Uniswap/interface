import { createContext } from 'react'
import type {
  TransactionSettingsModalId,
  TransactionSettingsModalState,
} from 'uniswap/src/features/transactions/components/settings/stores/TransactionSettingsModalStore/createTransactionSettingsModalStore'
import type { StoreApi } from 'zustand/vanilla'

export const TransactionSettingsModalStoreContext = createContext<StoreApi<
  TransactionSettingsModalState<TransactionSettingsModalId>
> | null>(null)
