import { createAction } from '@reduxjs/toolkit'
import { ChainID } from '@harmony-js/utils';

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
  chainId: ChainID
  hash: string
  from: string
  approval?: { tokenAddress: string; spender: string }
  summary?: string
}>('transactions/addTransaction')
export const clearAllTransactions = createAction<{ chainId: ChainID }>('transactions/clearAllTransactions')
export const finalizeTransaction = createAction<{
  chainId: ChainID
  hash: string
  receipt: SerializableTransactionReceipt
}>('transactions/finalizeTransaction')
export const checkedTransaction = createAction<{
  chainId: ChainID
  hash: string
  blockNumber: number
}>('transactions/checkedTransaction')
