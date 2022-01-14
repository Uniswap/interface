import { createSlice, PayloadAction } from '@reduxjs/toolkit'
import { ChainId } from 'src/constants/chains'
import {
  ChainIdToHashToDetails,
  SerializableTxReceipt,
  TransactionInfo,
} from 'src/features/transactions/types'
import { assert } from 'src/utils/validation'

export interface TransactionState {
  byChainId: ChainIdToHashToDetails
}

export const initialState: TransactionState = {
  byChainId: {},
}

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
      assert(
        !state.byChainId[chainId]?.[hash],
        `AddTransaction: Attempted to overwrite tx with hash ${hash}`
      )
      state.byChainId[chainId] ??= {}
      state.byChainId[chainId]![hash] = {
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
      const tx = state.byChainId[chainId]?.[hash]
      if (!tx) return
      state.byChainId[chainId]![hash].lastCheckedBlockNumber = Math.max(
        blockNumber,
        tx.lastCheckedBlockNumber ?? -1
      )
    },
    finalizeTransaction: (
      state,
      {
        payload: { chainId, hash, receipt },
      }: PayloadAction<{ chainId: ChainId; hash: string; receipt: SerializableTxReceipt }>
    ) => {
      if (!state.byChainId[chainId]?.[hash]) return
      state.byChainId[chainId]![hash].receipt = receipt
      state.byChainId[chainId]![hash].confirmedTime = Date.now()
    },
    resetTransactions: () => initialState,
  },
})

export const { addTransaction, checkTransaction, finalizeTransaction, resetTransactions } =
  slice.actions
export const { reducer: transactionReducer, actions: transactionActions } = slice
