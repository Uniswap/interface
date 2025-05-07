import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export interface BatchedTransaction {
  txHashes: string[]
  chainId: UniverseChainId
  requestId: string
}

export type BatchedTransactionsState = Record<string, BatchedTransaction>

export const initialBatchedTransactionsState: BatchedTransactionsState = {}

const slice = createSlice({
  name: 'batchedTransactions',
  initialState: initialBatchedTransactionsState,
  reducers: {
    addBatchedTransaction: (
      state,
      action: PayloadAction<{ batchId: string; txHashes: string[]; requestId: string; chainId: UniverseChainId }>,
    ) => {
      const { batchId, txHashes, requestId, chainId } = action.payload
      state[batchId] = { txHashes, requestId, chainId }
    },
    removeBatchedTransaction: (state, action: PayloadAction<string>) => {
      const batchId = action.payload
      delete state[batchId]
    },
    clearBatchedTransactions: () => initialBatchedTransactionsState,
  },
})

export const { addBatchedTransaction, removeBatchedTransaction, clearBatchedTransactions } = slice.actions

export const batchedTransactionsReducer = slice.reducer
