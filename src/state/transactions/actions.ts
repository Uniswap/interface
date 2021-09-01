import { createAction } from '@reduxjs/toolkit'
import { BundleResApi } from '@alchemist-coin/mistx-connect'
export interface PrivateTransactionDetails extends BundleResApi {
  updatedAt: number
}
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

export const addTransaction =
  createAction<{
    chainId: number
    hash: string
    from: string
    approval?: { tokenAddress: string; spender: string }
    claim?: { recipient: string }
    summary?: string
    privateTransaction?: boolean
  }>('transactions/addTransaction')
export const clearAllTransactions = createAction<{ chainId: number }>('transactions/clearAllTransactions')
export const finalizeTransaction = createAction<{
  chainId: number
  hash: string
  receipt: SerializableTransactionReceipt
}>('transactions/finalizeTransaction')
export const checkedTransaction = createAction<{
  chainId: number
  hash: string
  blockNumber: number
}>('transactions/checkedTransaction')
export const updatePrivateTransaction = createAction<{
  chainId: number
  hash: string
  privateTransactionDetails: PrivateTransactionDetails
}>('transactions/updatePrivateTransaction')
export const removePrivateTransaction = createAction<{
  chainId: number
  hash: string
}>('transactions/removePrivateTransaction')
