import { createReducer } from '@reduxjs/toolkit'
import { addTransaction, clearAllTransactions, finalizeTransaction, SerializableTransactionReceipt } from './actions'

const now = () => new Date().getTime()

export interface TransactionDetails {
  hash: string
  approval?: { tokenAddress: string; spender: string }
  summary?: string
  receipt?: SerializableTransactionReceipt
  addedTime: number
  confirmedTime?: number
  from: string

  // set to true when we receive a transaction count that exceeds the nonce of this transaction
  unknownStatus?: boolean
}

export interface TransactionState {
  [chainId: number]: {
    [txHash: string]: TransactionDetails
  }
}

const initialState: TransactionState = {}

export default createReducer(initialState, builder =>
  builder
    .addCase(addTransaction, (state, { payload: { chainId, from, hash, approval, summary } }) => {
      if (state[chainId]?.[hash]) {
        throw Error('Attempted to add existing transaction.')
      }
      state[chainId] = state[chainId] ?? {}
      state[chainId][hash] = { hash, approval, summary, from, addedTime: now() }
    })
    .addCase(clearAllTransactions, (state, { payload: { chainId } }) => {
      if (!state[chainId]) return
      state[chainId] = {}
    })
    .addCase(finalizeTransaction, (state, { payload: { hash, chainId, receipt } }) => {
      if (!state[chainId]?.[hash]) {
        throw Error('Attempted to finalize non-existent transaction.')
      }
      state[chainId] = state[chainId] ?? {}
      state[chainId][hash].receipt = receipt
      state[chainId][hash].unknownStatus = false
      state[chainId][hash].confirmedTime = now()
    })
)
