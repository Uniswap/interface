import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { providers } from 'ethers'
import {
  ChainIdToTxIdToDetails,
  TransactionDetails,
  TransactionId,
  TransactionReceipt,
  TransactionStatus,
} from 'src/features/transactions/types'
import { assert } from 'src/utils/validation'

export interface TransactionState {
  byChainId: ChainIdToTxIdToDetails
}

export const initialState: TransactionState = {
  byChainId: {},
}

const slice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    addTransaction: (state, { payload: transaction }: PayloadAction<TransactionDetails>) => {
      const { chainId, id } = transaction
      assert(
        !state.byChainId[chainId]?.[id],
        `addTransaction: Attempted to overwrite tx with id ${id}`
      )
      state.byChainId[chainId] ??= {}
      state.byChainId[chainId]![id] = transaction
    },
    updateTransaction: (state, { payload: transaction }: PayloadAction<TransactionDetails>) => {
      const { chainId, id } = transaction
      assert(
        state.byChainId[chainId]?.[id],
        `updateTransaction: Attempted to update missing tx with id ${id}`
      )
      state.byChainId[chainId]![id] = transaction
    },
    finalizeTransaction: (
      state,
      {
        payload: { chainId, id, status, receipt },
      }: PayloadAction<
        TransactionId & {
          status: TransactionStatus.Success | TransactionStatus.Failed | TransactionStatus.Cancelled
          receipt: TransactionReceipt | null
        }
      >
    ) => {
      if (!state.byChainId[chainId]?.[id]) return
      state.byChainId[chainId]![id].status = status
      if (receipt) state.byChainId[chainId]![id].receipt = receipt
    },
    cancelTransaction: (state, { payload: { chainId, id } }: PayloadAction<TransactionId>) => {
      if (!state.byChainId[chainId]?.[id]) return
      state.byChainId[chainId]![id].status = TransactionStatus.Cancelling
    },
    replaceTransaction: (
      state,
      {
        payload: { chainId, id },
      }: PayloadAction<
        TransactionId & {
          newTxParams: providers.TransactionRequest
        }
      >
    ) => {
      if (!state.byChainId[chainId]?.[id]) return
      state.byChainId[chainId]![id].status = TransactionStatus.Replacing
    },
    resetTransactions: () => initialState,
  },
})

export const {
  addTransaction,
  updateTransaction,
  finalizeTransaction,
  cancelTransaction,
  replaceTransaction,
  resetTransactions,
} = slice.actions
export const { reducer: transactionReducer, actions: transactionActions } = slice
