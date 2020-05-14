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
export const checkTransaction = createAction<{ chainId: number; hash: string; blockNumber: number }>('checkTransaction')
export const finalizeTransaction = createAction<{
  chainId: number
  hash: string
  receipt: SerializableTransactionReceipt
}>('finalizeTransaction')

export const updateTransactionCount = createAction<{ address: string; transactionCount: number; chainId: number }>(
  'updateTransactionCount'
)
