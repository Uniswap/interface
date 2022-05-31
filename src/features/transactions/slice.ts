import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { providers } from 'ethers'
import {
  ChainIdToTxIdToDetails,
  FinalizedTransactionDetails,
  TransactionDetails,
  TransactionId,
  TransactionStatus,
} from 'src/features/transactions/types'
import { assert } from 'src/utils/validation'

export interface TransactionState {
  [address: Address]: ChainIdToTxIdToDetails
}

export const initialState: TransactionState = {}

const slice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    addTransaction: (state, { payload: transaction }: PayloadAction<TransactionDetails>) => {
      const { chainId, id, from } = transaction
      assert(
        !state?.[from]?.[chainId]?.[id],
        `addTransaction: Attempted to overwrite tx with id ${id}`
      )
      state[from] ??= {}
      state[from][chainId] ??= {}
      state[from][chainId]![id] = transaction
    },
    updateTransaction: (state, { payload: transaction }: PayloadAction<TransactionDetails>) => {
      const { chainId, id, from } = transaction
      assert(
        state?.[from]?.[chainId]?.[id],
        `updateTransaction: Attempted to update a missing tx with id ${id}`
      )
      state[from][chainId]![id] = transaction
    },
    finalizeTransaction: (
      state,
      { payload: transaction }: PayloadAction<FinalizedTransactionDetails>
    ) => {
      const { chainId, id, status, receipt, from } = transaction
      assert(
        state?.[from]?.[chainId]?.[id],
        `finalizeTransaction: Attempted to finalize a missing tx with id ${id}`
      )
      state[from][chainId]![id].status = status
      if (receipt) state[from][chainId]![id].receipt = receipt
    },
    cancelTransaction: (
      state,
      { payload: { chainId, id, address } }: PayloadAction<TransactionId & { address: string }>
    ) => {
      assert(
        state?.[address]?.[chainId]?.[id],
        `cancelTransaction: Attempted to cancel a tx that doesnt exist with id ${id}`
      )
      state[address][chainId]![id].status = TransactionStatus.Cancelling
    },
    replaceTransaction: (
      state,
      {
        payload: { chainId, id, address },
      }: PayloadAction<
        TransactionId & {
          newTxParams: providers.TransactionRequest
        } & { address: string }
      >
    ) => {
      assert(
        state?.[address]?.[chainId]?.[id],
        `replaceTransaction: Attempted to replace a tx that doesnt exist with id ${id}`
      )
      state[address][chainId]![id].status = TransactionStatus.Replacing
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
