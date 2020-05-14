import { createReducer } from '@reduxjs/toolkit'
import { isAddress } from '../../utils'
import {
  addTransaction,
  checkTransaction,
  finalizeTransaction,
  SerializableTransactionReceipt,
  updateTransactionCount
} from './actions'

const now = () => new Date().getTime()

export interface TransactionDetails {
  hash: string
  approvalOfToken?: string
  blockNumberChecked?: number
  summary?: string
  receipt?: SerializableTransactionReceipt
  addedTime: number
  confirmedTime?: number
  from: string
  nonce?: number // todo: find a way to populate this

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
    .addCase(addTransaction, (state, { payload: { chainId, from, hash, approvalOfToken, summary } }) => {
      if (state[chainId]?.[hash]) {
        throw Error('Attempted to add existing transaction.')
      }
      state[chainId] = state[chainId] ?? {}
      state[chainId][hash] = { hash, approvalOfToken, summary, from, addedTime: now() }
    })
    .addCase(checkTransaction, (state, { payload: { chainId, blockNumber, hash } }) => {
      if (!state[chainId]?.[hash]) {
        throw Error('Attempted to check non-existent transaction.')
      }

      state[chainId][hash].blockNumberChecked = Math.max(blockNumber ?? 0, state[chainId][hash].blockNumberChecked ?? 0)
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
    // marks every transaction with a nonce less than the transaction count unknown if it was pending
    // this can be overridden by a finalize that comes later
    .addCase(updateTransactionCount, (state, { payload: { transactionCount, address, chainId } }) => {
      // mark any transactions under the transaction count to be unknown status
      Object.values(state?.[chainId] ?? {})
        .filter(t => !t.receipt)
        .filter(t => t.from === isAddress(address))
        .filter(t => typeof t.nonce && t.nonce < transactionCount)
        .forEach(t => (t.unknownStatus = t.unknownStatus ?? true))
    })
)
