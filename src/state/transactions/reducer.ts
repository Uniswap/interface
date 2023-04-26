import { createSlice } from '@reduxjs/toolkit'
import { SupportedChainId } from 'constants/chains'

import { updateVersion } from '../global/actions'
import { TransactionDetails, TransactionInfo } from './types'

const now = () => new Date().getTime()

export interface TransactionState {
  [chainId: number]: {
    [txHash: string]: TransactionDetails
  }
}

interface AddTransactionPayload {
  chainId: SupportedChainId
  from: string
  hash: string
  info: TransactionInfo
  nonce: number
}

export const initialState: TransactionState = {}

const transactionSlice = createSlice({
  name: 'transactions',
  initialState,
  reducers: {
    addTransaction(
      transactions,
      { payload: { chainId, from, hash, info, nonce } }: { payload: AddTransactionPayload }
    ) {
      if (transactions[chainId]?.[hash]) {
        throw Error('Attempted to add existing transaction.')
      }
      const txs = transactions[chainId] ?? {}
      txs[hash] = { hash, info, from, addedTime: now(), nonce }
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
      tx.confirmedTime = now()
    },
  },
  extraReducers: (builder) => {
    builder.addCase(updateVersion, (transactions) => {
      // in case there are any transactions in the store with the old format, remove them
      Object.keys(transactions).forEach((chainId) => {
        const chainTransactions = transactions[chainId as unknown as number]
        Object.keys(chainTransactions).forEach((hash) => {
          if (!('info' in chainTransactions[hash])) {
            // clear old transactions that don't have the right format
            delete chainTransactions[hash]
          }
        })
      })
    })
  },
})

export const { addTransaction, clearAllTransactions, checkedTransaction, finalizeTransaction, removeTransaction } =
  transactionSlice.actions
export default transactionSlice.reducer
