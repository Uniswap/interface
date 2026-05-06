import { TransactionDetails } from 'uniswap/src/features/transactions/types/transactionDetails'
import { create } from 'zustand'

export type SelectedTransactionInfo = {
  transaction: TransactionDetails
  isExternalProfile?: boolean
}

interface TransactionDetailsModalStore {
  selected: SelectedTransactionInfo | undefined
  open: (transaction: TransactionDetails, options?: { isExternalProfile?: boolean }) => void
  close: () => void
}

export const useTransactionDetailsModalStore = create<TransactionDetailsModalStore>((set) => ({
  selected: undefined,
  open: (transaction, options) => set({ selected: { transaction, isExternalProfile: options?.isExternalProfile } }),
  close: () => set({ selected: undefined }),
}))

export function useOpenTransactionDetailsModal(): (
  transaction: TransactionDetails,
  options?: { isExternalProfile?: boolean },
) => void {
  return useTransactionDetailsModalStore((s) => s.open)
}
