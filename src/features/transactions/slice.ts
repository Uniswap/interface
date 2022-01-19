import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ChainId } from 'src/constants/chains'
import {
  ChainIdToHashToDetails,
  TransactionOptions,
  TransactionReceipt,
  TransactionStatus,
  TransactionTypeInfo,
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
    addTransaction: (
      state,
      {
        payload: { chainId, hash, from, options, typeInfo },
      }: PayloadAction<{
        chainId: ChainId
        hash: string
        from: string
        options: TransactionOptions
        typeInfo: TransactionTypeInfo
      }>
    ) => {
      assert(
        !state.byChainId[chainId]?.[hash],
        `AddTransaction: Attempted to overwrite tx with hash ${hash}`
      )
      state.byChainId[chainId] ??= {}
      state.byChainId[chainId]![hash] = {
        chainId,
        hash,
        from,
        options,
        typeInfo,
        addedTime: Date.now(),
        status: TransactionStatus.Pending,
      }
    },
    checkTransaction: (
      state,
      {
        payload: { chainId, hash, blockNumber },
      }: PayloadAction<{
        chainId: ChainId
        hash: string
        blockNumber: number
      }>
    ) => {
      const tx = state.byChainId[chainId]?.[hash]
      if (!tx || !blockNumber) return
      state.byChainId[chainId]![hash].lastChecked = {
        blockNumber: Math.max(blockNumber, tx.lastChecked?.blockNumber ?? -1),
        time: Date.now(),
      }
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
    resetTransactions: () => initialState,
  },
})

export const { addTransaction, checkTransaction, finalizeTransaction, resetTransactions } =
  slice.actions
export const { reducer: transactionReducer, actions: transactionActions } = slice
