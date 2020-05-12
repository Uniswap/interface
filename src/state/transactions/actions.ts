import { TransactionReceipt } from '@ethersproject/providers'
import { createAction } from '@reduxjs/toolkit'

export const addTransaction = createAction<{
  chainId: number
  hash: string
  approvalOfToken?: string
  summary?: string
}>('addTransaction')
export const checkTransaction = createAction<{ chainId: number; hash: string; blockNumber: number }>('checkTransaction')
export const finalizeTransaction = createAction<{ chainId: number; hash: string; receipt: TransactionReceipt }>(
  'finalizeTransaction'
)
