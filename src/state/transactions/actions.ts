import { TransactionReceipt } from '@ethersproject/providers'
import { createAction } from '@reduxjs/toolkit'

export interface CustomData {
  approval?: string
}

export const addTransaction = createAction<{
  networkId: number
  hash: string
  from: string
  customData: CustomData
  summary?: string
}>('addTransaction')
export const checkTransaction = createAction<{ networkId: number; hash: string; blockNumber: number }>(
  'checkTransaction'
)
export const finalizeTransaction = createAction<{ networkId: number; hash: string; receipt: TransactionReceipt }>(
  'finalizeTransaction'
)
