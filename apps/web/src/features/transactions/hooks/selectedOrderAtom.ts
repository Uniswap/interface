import { atom } from 'jotai'
import { UniswapXOrderDetails } from 'uniswap/src/features/transactions/types/transactionDetails'

type SelectedOrderInfo = {
  modalOpen?: boolean
  order?: UniswapXOrderDetails
}

export const selectedOrderAtom = atom<SelectedOrderInfo | undefined>(undefined)
