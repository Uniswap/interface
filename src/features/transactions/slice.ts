import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ChainId } from 'src/constants/chains'
import {
  SerializableTransactionReceipt,
  TransactionInfo,
  TransactionState,
} from 'src/features/transactions/types'
import { assert } from 'src/utils/validation'

export const initialState: TransactionState = {}

// TODO: watcher saga or updater component to async watch tx
// inspired by https://github.com/Uniswap/interface/tree/main/src/state/transactions
const slice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    addTransaction: (
      state,
      {
        payload: { chainId, hash, from, info },
      }: PayloadAction<{ chainId: ChainId; hash: string; from: string; info: TransactionInfo }>
    ) => {
      assert(!state[chainId]?.[hash], `AddTransaction: Attempted to overwrite tx with hash ${hash}`)
      state[chainId] ??= {}
      state[chainId]![hash] = {
        chainId,
        hash,
        from,
        info,
        addedTime: Date.now(),
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
      const tx = state[chainId]?.[hash]
      if (!tx) return
      state[chainId]![hash].lastCheckedBlockNumber = Math.max(
        blockNumber,
        tx.lastCheckedBlockNumber ?? -1
      )
    },
    clearAllTransactions: () => {
      return initialState
    },
    finalizeTransaction: (
      state,
      {
        payload: { chainId, hash, receipt },
      }: PayloadAction<{ chainId: ChainId; hash: string; receipt: SerializableTransactionReceipt }>
    ) => {
      if (!state[chainId]?.[hash]) return
      state[chainId]![hash].receipt = receipt
      state[chainId]![hash].confirmedTime = Date.now()
    },
  },
})

export const { addTransaction, checkTransaction, clearAllTransactions, finalizeTransaction } =
  slice.actions
export const { reducer: transactionReducer, actions: transactionActions } = slice
