import { createSlice } from '@reduxjs/toolkit'
import { ChainId } from '@uniswap/sdk-core'

import { SerializableTransactionReceipt, TransactionDetails, TransactionInfo } from './types'

// TODO(WEB-2053): update this to be a map of account -> chainId -> txHash -> TransactionDetails
// to simplify usage, once we're able to invalidate localstorage
export interface TransactionState {
  [chainId: number]: {
    [txHash: string]: TransactionDetails
  }
}

interface AddTransactionPayload {
  chainId: ChainId
  from: string
  hash: string
  info: TransactionInfo
  nonce?: number
  deadline?: number
  receipt?: SerializableTransactionReceipt
}

export const initialState: TransactionState = {}

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    addTransaction(
      transactions,
      { payload: { chainId, from, hash, info, nonce, deadline, receipt } }: { payload: AddTransactionPayload }
    ) {
      if (transactions[chainId]?.[hash]) {
        throw Error('Attempted to add existing transaction.')
      }
      const txs = transactions[chainId] ?? {}
      txs[hash] = { hash, info, from, addedTime: Date.now(), nonce, deadline, receipt }
      transactions[chainId] = txs
    },
    clearAllTransactions(transactions, { payload: { chainId } }) {
      if (!transactions[chainId]) return
      transactions[chainId] = {}
    },
    removeTransaction(transactions, { payload: { chainId, hash } }) {
      if (transactions[chainId][hash]) {
        delete transactions[chainId][hash]
      }
    },
    checkedTransaction(transactions, { payload: { chainId, hash, blockNumber } }) {
      const tx = transactions[chainId]?.[hash]
      if (!tx) {
        return
      }
      if (!tx.lastCheckedBlockNumber) {
        tx.lastCheckedBlockNumber = blockNumber
      } else {
        tx.lastCheckedBlockNumber = Math.max(blockNumber, tx.lastCheckedBlockNumber)
      }
    },
    finalizeTransaction(transactions, { payload: { hash, chainId, receipt } }) {
      const tx = transactions[chainId]?.[hash]
      if (!tx) {
        return
      }
      tx.receipt = receipt
      tx.confirmedTime = Date.now()
    },
    cancelTransaction(transactions, { payload: { hash, chainId, cancelHash } }) {
      const tx = transactions[chainId]?.[hash]

      if (tx) {
        delete transactions[chainId]?.[hash]
        transactions[chainId][cancelHash] = {
          ...tx,
          hash: cancelHash,
          cancelled: true,
        }
      }
    },
  },
})

export const {
  addTransaction,
  clearAllTransactions,
  checkedTransaction,
  finalizeTransaction,
  removeTransaction,
  cancelTransaction,
} = transactionSlice.actions
export default transactionSlice.reducer
