/* eslint-disable @typescript-eslint/no-non-null-assertion */
/* helpful when dealing with deeply nested state objects */
import { createAction, createSlice, PayloadAction } from '@reduxjs/toolkit'
import { providers } from 'ethers/lib/ethers'
import { FORTransactionDetails } from 'uniswap/src/features/fiatOnRamp/types'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import {
  ChainIdToTxIdToDetails,
  FinalizedTransactionDetails,
  TransactionDetails,
  TransactionId,
  TransactionStatus,
  TransactionType,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import { assert } from 'utilities/src/errors'

export interface TransactionsState {
  [address: Address]: ChainIdToTxIdToDetails
}

export const initialTransactionsState: TransactionsState = {}

const slice = createSlice({
  name: 'transactions',
  initialState: initialTransactionsState,
  reducers: {
    addTransaction: (state, { payload: transaction }: PayloadAction<TransactionDetails>) => {
      const { chainId, id, from } = transaction
      assert(!state?.[from]?.[chainId]?.[id], `addTransaction: Attempted to overwrite tx with id ${id}`)
      state[from] ??= {}
      state[from]![chainId] ??= {}
      state[from]![chainId]![id] = transaction
    },
    updateTransaction: (state, { payload: transaction }: PayloadAction<TransactionDetails>) => {
      const { chainId, id, from } = transaction
      assert(state?.[from]?.[chainId]?.[id], `updateTransaction: Attempted to update a missing tx with id ${id}`)
      state[from]![chainId]![id] = transaction
    },
    updateTransactionWithoutWatch: (state, { payload: transaction }: PayloadAction<TransactionDetails>) => {
      const { chainId, id, from } = transaction
      assert(
        state?.[from]?.[chainId]?.[id],
        `updateTransactionWithoutWatch: Attempted to update a missing tx with id ${id}`,
      )
      state[from]![chainId]![id] = transaction
    },
    finalizeTransaction: (state, { payload: transaction }: PayloadAction<FinalizedTransactionDetails>) => {
      const { chainId, id, status, receipt, from, hash, networkFee } = transaction
      assert(state?.[from]?.[chainId]?.[id], `finalizeTransaction: Attempted to finalize a missing tx with id ${id}`)
      state[from]![chainId]![id]!.status = status
      if (receipt) {
        state[from]![chainId]![id]!.receipt = receipt
      }
      if (networkFee) {
        state[from]![chainId]![id]!.networkFee = networkFee
      }
      if (isUniswapX(transaction) && status === TransactionStatus.Success) {
        assert(hash, `finalizeTransaction: Attempted to finalize an order without providing the fill tx hash`)
        state[from]![chainId]![id]!.hash = hash
      }
    },
    deleteTransaction: (
      state,
      { payload: { chainId, id, address } }: PayloadAction<TransactionId & { address: string }>,
    ) => {
      assert(
        state?.[address]?.[chainId]?.[id],
        `deleteTransaction: Attempted to delete a tx that doesn't exist with id ${id}`,
      )
      delete state[address]![chainId]![id]
    },
    cancelTransaction: (
      state,
      {
        payload: { chainId, id, address, cancelRequest },
      }: PayloadAction<TransactionId & { address: string; cancelRequest: providers.TransactionRequest }>,
    ) => {
      assert(
        state?.[address]?.[chainId]?.[id],
        `cancelTransaction: Attempted to cancel a tx that doesn't exist with id ${id}`,
      )
      state[address]![chainId]![id]!.status = TransactionStatus.Cancelling
      state[address]![chainId]![id]!.cancelRequest = cancelRequest
    },
    replaceTransaction: (
      state,
      {
        payload: { chainId, id, address },
      }: PayloadAction<
        TransactionId & {
          newTxParams: providers.TransactionRequest
        } & { address: string }
      >,
    ) => {
      assert(
        state?.[address]?.[chainId]?.[id],
        `replaceTransaction: Attempted to replace a tx that doesn't exist with id ${id}`,
      )
      state[address]![chainId]![id]!.status = TransactionStatus.Replacing
    },
    resetTransactions: () => initialTransactionsState,
    // FOR transactions re-use this slice to store (off-chain) pending txs
    upsertFiatOnRampTransaction: (state, { payload: transaction }: PayloadAction<FORTransactionDetails>) => {
      const {
        chainId,
        id,
        from,
        typeInfo: { type },
      } = transaction

      assert(
        type === TransactionType.LocalOnRamp ||
          type === TransactionType.LocalOffRamp ||
          type === TransactionType.OnRampPurchase ||
          type === TransactionType.OnRampTransfer ||
          type === TransactionType.OffRampSale,
        `only FOR transactions can be upserted`,
      )

      state[from] ??= {}
      state[from]![chainId] ??= {}
      state[from]![chainId]![id] = {
        ...transaction,
        typeInfo: { ...transaction.typeInfo },
      }
    },
  },
})

// This action is fired, when user has come back from Moonpay flow using Return to Uniswap button
export const forceFetchFiatOnRampTransactions = createAction('transactions/forceFetchFiatOnRampTransactions')

export const {
  addTransaction,
  cancelTransaction,
  deleteTransaction,
  finalizeTransaction,
  replaceTransaction,
  resetTransactions,
  upsertFiatOnRampTransaction,
  updateTransaction,
  updateTransactionWithoutWatch,
} = slice.actions

export const { reducer: transactionReducer } = slice
export const transactionActions = { ...slice.actions, forceFetchFiatOnRampTransactions }
