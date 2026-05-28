import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
export type WalletCallTransaction = {
  chainId: UniverseChainId
  requestId: string
} & ({ txHashes: string[]; userOpHash?: never } | { userOpHash: string; txHashes?: never })

type WalletCallTransactionsState = Record<string, WalletCallTransaction>

export const initialWalletCallTransactionsState: WalletCallTransactionsState = {}

const slice = createSlice({
  name: 'batchedTransactions',
  initialState: initialWalletCallTransactionsState,
  reducers: {
    addWalletCallTransaction: (
      state,
      action: PayloadAction<
        {
          batchId: string
          requestId: string
          chainId: UniverseChainId
        } & ({ txHashes: string[]; userOpHash?: never } | { userOpHash: string; txHashes?: never })
      >,
    ) => {
      const { userOpHash, txHashes, batchId, requestId, chainId } = action.payload
      state[batchId] = userOpHash !== undefined ? { userOpHash, requestId, chainId } : { txHashes, requestId, chainId }
    },
    removeBatchedTransaction: (state, action: PayloadAction<string>) => {
      const batchId = action.payload
      delete state[batchId]
    },
    clearBatchedTransactions: () => initialWalletCallTransactionsState,
  },
})

export const { addWalletCallTransaction, removeBatchedTransaction, clearBatchedTransactions } = slice.actions

export const walletCallTransactionsReducer = slice.reducer
