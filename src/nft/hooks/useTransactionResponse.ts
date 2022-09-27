import { TxResponse } from 'nft/types'
import create from 'zustand'
import { devtools } from 'zustand/middleware'

type TransactionResponseValue = TxResponse | undefined

type TransactionResponseState = {
  transactionResponse: TransactionResponseValue
  setTransactionResponse: (txResponse: TransactionResponseValue) => void
}

export const useTransactionResponse = create<TransactionResponseState>()(
  devtools(
    (set) => ({
      transactionResponse: undefined,
      setTransactionResponse: (txResponse) =>
        set(() => ({
          transactionResponse: txResponse,
        })),
    }),
    { name: 'useTransactionResponse' }
  )
)
