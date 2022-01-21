import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ChainId } from 'src/constants/chains'
import {
  ChainIdToHashToDetails,
  TransactionDetails,
  TransactionReceipt,
  TransactionStatus,
} from 'src/features/transactions/types'
import { assert } from 'src/utils/validation'

export interface TransactionState {
  byChainId: ChainIdToHashToDetails
}

export const initialState: TransactionState = {
  byChainId: {},
}

const slice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    addTransaction: (state, { payload: transaction }: PayloadAction<TransactionDetails>) => {
      const { chainId, hash } = transaction
      assert(
        !state.byChainId[chainId]?.[hash],
        `AddTransaction: Attempted to overwrite tx with hash ${hash}`
      )
      state.byChainId[chainId] ??= {}
      state.byChainId[chainId]![hash] = transaction
    },
    finalizeTransaction: (
      state,
      {
        payload: { chainId, hash, status, receipt },
      }: PayloadAction<{
        chainId: ChainId
        hash: string
        status: TransactionStatus
        receipt: TransactionReceipt
      }>
    ) => {
      if (!state.byChainId[chainId]?.[hash]) return
      state.byChainId[chainId]![hash].status = status
      state.byChainId[chainId]![hash].receipt = receipt
    },
    cancelTransaction: (
      state,
      {
        payload: { chainId, hash },
      }: PayloadAction<{
        chainId: ChainId
        hash: string
      }>
    ) => {
      if (!state.byChainId[chainId]?.[hash]) return
      state.byChainId[chainId]![hash].status = TransactionStatus.Cancelling
    },
    replaceTransaction: (
      state,
      {
        payload: { chainId, hash },
      }: PayloadAction<{
        chainId: ChainId
        hash: string
      }>
    ) => {
      if (!state.byChainId[chainId]?.[hash]) return
      state.byChainId[chainId]![hash].status = TransactionStatus.Replacing
    },
    resetTransactions: () => initialState,
  },
})

export const {
  addTransaction,
  finalizeTransaction,
  cancelTransaction,
  replaceTransaction,
  resetTransactions,
} = slice.actions
export const { reducer: transactionReducer, actions: transactionActions } = slice
