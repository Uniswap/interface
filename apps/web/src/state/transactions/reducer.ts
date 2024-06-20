import { createSlice } from '@reduxjs/toolkit'
import { ChainId } from '@uniswap/sdk-core'
import { PendingTransactionDetails, TransactionDetails, TransactionInfo } from 'state/transactions/types'
import { TransactionStatus } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'

// TODO(WEB-2053): update this to be a map of account -> chainId -> txHash -> TransactionDetails
// to simplify usage, once we're able to invalidate localstorage
export interface TransactionState {
  [chainId: number]: {
    [txHash: string]: TransactionDetails
  }
}

export const initialState: TransactionState = {}

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    addTransaction(
      transactions,
      {
        payload: { chainId, hash, ...details },
      }: { payload: { chainId: ChainId } & Omit<PendingTransactionDetails, 'status' | 'addedTime'> }
    ) {
      if (transactions[chainId]?.[hash]) {
        throw Error('Attempted to add existing transaction.')
      }
      const txs = transactions[chainId] ?? {}
      txs[hash] = {
        status: TransactionStatus.Pending,
        hash,
        addedTime: Date.now(),
        ...details,
      }
      transactions[chainId] = txs
    },
    clearAllTransactions(transactions, { payload: { chainId } }: { payload: { chainId: ChainId } }) {
      if (!transactions[chainId]) {
        return
      }
      transactions[chainId] = {}
    },
    removeTransaction(transactions, { payload: { chainId, hash } }: { payload: { chainId: ChainId; hash: string } }) {
      if (transactions[chainId][hash]) {
        delete transactions[chainId][hash]
      }
    },
    checkedTransaction(
      transactions,
      { payload: { chainId, hash, blockNumber } }: { payload: { chainId: ChainId; hash: string; blockNumber: number } }
    ) {
      const tx = transactions[chainId]?.[hash]
      if (!tx || tx.status !== TransactionStatus.Pending) {
        return
      }
      if (!tx.lastCheckedBlockNumber) {
        tx.lastCheckedBlockNumber = blockNumber
      } else {
        tx.lastCheckedBlockNumber = Math.max(blockNumber, tx.lastCheckedBlockNumber)
      }
    },
    finalizeTransaction(
      transactions,
      {
        payload: { chainId, hash, status, info },
      }: {
        payload: {
          chainId: ChainId
          hash: string
          status: TransactionStatus
          info?: TransactionInfo
        }
      }
    ) {
      const tx = transactions[chainId]?.[hash]
      if (!tx) {
        return
      }
      transactions[chainId][hash] = {
        ...tx,
        status,
        confirmedTime: Date.now(),
        info: info ?? tx.info,
      }
    },
    cancelTransaction(
      transactions,
      { payload: { chainId, hash, cancelHash } }: { payload: { chainId: ChainId; hash: string; cancelHash: string } }
    ) {
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
