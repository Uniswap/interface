import { createReducer } from '@reduxjs/toolkit'
import { addTransaction, checkTransaction, finalizeTransaction, SerializableTransactionReceipt } from './actions'

const now = () => new Date().getTime()

export interface TransactionDetails {
  hash: string
  approvalOfToken?: string
  blockNumberChecked?: number
  summary?: string
  receipt?: SerializableTransactionReceipt
  addedTime: number
  confirmedTime?: number
}

export interface TransactionState {
  [chainId: number]: {
    [txHash: string]: TransactionDetails
  }
}

const initialState: TransactionState = {}

export default createReducer(initialState, builder =>
  builder
    .addCase(addTransaction, (state, { payload: { chainId, hash, approvalOfToken, summary } }) => {
      if (state[chainId]?.[hash]) {
        throw Error('Attempted to add existing transaction.')
      }
      state[chainId] = state[chainId] ?? {}
      state[chainId][hash] = { hash, approvalOfToken, summary, addedTime: now() }
    })
    .addCase(checkTransaction, (state, { payload: { chainId, blockNumber, hash } }) => {
      if (!state[chainId]?.[hash]) {
        throw Error('Attempted to check non-existent transaction.')
      }

      state[chainId][hash].blockNumberChecked = blockNumber
    })
    .addCase(finalizeTransaction, (state, { payload: { hash, chainId, receipt } }) => {
      if (!state[chainId]?.[hash]) {
        throw Error('Attempted to finalize non-existent transaction.')
      }
      state[chainId] = state[chainId] ?? {}
      state[chainId][hash].receipt = receipt
      state[chainId][hash].confirmedTime = now()
    })
)
