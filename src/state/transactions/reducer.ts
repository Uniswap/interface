import { TransactionReceipt } from '@ethersproject/providers'
import { createReducer } from '@reduxjs/toolkit'
import { addTransaction, checkTransaction, CustomData, finalizeTransaction } from './actions'

export interface TransactionData {
  customData: CustomData
  blockNumberChecked?: number
  summary?: string
  receipt?: TransactionReceipt
  from: string
  hash: string
}

export interface TransactionState {
  [chainId: number]: {
    [txHash: string]: TransactionData
  }
}

const initialState: TransactionState = {}

export default createReducer(initialState, builder =>
  builder
    .addCase(addTransaction, (state, { payload: { networkId, hash, from, customData } }) => {
      if (state[networkId]?.[hash]) {
        throw Error('Attempted to add existing transaction.')
      }
      state[networkId] = state[networkId] ?? {}
      state[networkId][hash] = { customData, from, hash }
    })
    .addCase(checkTransaction, (state, { payload: { networkId, blockNumber, hash } }) => {
      if (!state[networkId]?.[hash]) {
        throw Error('Attempted to check non-existent transaction.')
      }

      state[networkId][hash].blockNumberChecked = blockNumber
    })
    .addCase(finalizeTransaction, (state, { payload: { hash, networkId, receipt } }) => {
      if (!state[networkId]?.[hash]) {
        throw Error('Attempted to finalize non-existent transaction.')
      }
      state[networkId] = state[networkId] ?? {}
      state[networkId][hash].receipt = receipt
    })
)
