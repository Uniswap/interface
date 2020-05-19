import { createAction } from '@reduxjs/toolkit'

export interface SerializableTransactionReceipt {
  to: string
  from: string
  contractAddress: string
  transactionIndex: number
  blockHash: string
  transactionHash: string
  blockNumber: number
  status?: number
}

export const addTransaction = createAction<{
  chainId: number
  hash: string
  from: string
  approvalOfToken?: string
  summary?: string
}>('addTransaction')
export const clearAllTransactions = createAction<{ chainId: number }>('clearAllTransactions')
export const finalizeTransaction = createAction<{
  chainId: number
  hash: string
  receipt: SerializableTransactionReceipt
}>('finalizeTransaction')
