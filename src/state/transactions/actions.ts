import { ChainId } from '@kyberswap/ks-sdk-core'
import { createAction } from '@reduxjs/toolkit'

import { SerializableTransactionReceipt, TransactionExtraInfo, TransactionPayload } from './type'

export const addTransaction = createAction<TransactionPayload>('transactions/addTransaction')

export const clearAllTransactions = createAction<{ chainId: ChainId }>('transactions/clearAllTransactions')

export const finalizeTransaction = createAction<{
  chainId: ChainId
  hash: string
  receipt: SerializableTransactionReceipt
  needCheckSubgraph?: boolean
}>('transactions/finalizeTransaction')

export const checkedTransaction = createAction<{
  chainId: ChainId
  hash: string
  blockNumber: number
}>('transactions/checkedTransaction')

export const modifyTransaction = createAction<{
  chainId: ChainId
  hash: string
  needCheckSubgraph?: boolean
  extraInfo?: TransactionExtraInfo
}>('transactions/modifyTransaction')

export const replaceTx = createAction<{
  chainId: ChainId
  oldHash: string
  newHash: string
}>('transactions/replaceTx')
export const removeTx = createAction<{ chainId: ChainId; hash: string }>('transactions/removeTx')
