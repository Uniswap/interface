import { createReducer } from '@reduxjs/toolkit'
import { OutgoingMessageState } from 'arb-ts'

import {
  addBridgeTxn,
  updateBridgeTxnReceipt,
  updateBridgeTxnPartnerHash,
  updateBridgeTxnWithdrawalInfo,
  updateBridgeTxnResolvedTimestamp
} from './actions'

import { BridgeTxnsState } from './types'

const now = () => new Date().getTime()

export const initialState: BridgeTxnsState = {}

export default createReducer<BridgeTxnsState>(initialState, builder =>
  builder
    .addCase(addBridgeTxn, (state, { payload: txn }) => {
      if (!txn.txHash) return

      const { txHash, chainId } = txn

      if (state[chainId]?.[txHash]) {
        throw Error('Attempted to add existing bridge transaction.')
      }
      const transactions = state[chainId] ?? {}

      transactions[txHash] = {
        ...txn,
        timestampCreated: now()
      }

      state[chainId] = transactions
    })
    .addCase(updateBridgeTxnResolvedTimestamp, (state, { payload: { chainId, txHash, timestamp } }) => {
      if (!state[chainId]?.[txHash]) {
        throw Error('Transaction not found' + txHash)
      }

      state[chainId][txHash].timestampResolved = timestamp
    })
    .addCase(updateBridgeTxnReceipt, (state, { payload: { chainId, receipt, txHash, seqNum } }) => {
      if (!state[chainId]?.[txHash]) {
        throw Error('Transaction not found' + txHash)
      }
      const txn = state[chainId][txHash]
      if (txn.receipt) return
      txn.receipt = receipt

      if (seqNum) {
        txn.seqNum = seqNum
      }

      txn.timestampResolved = now()
      state[chainId][txHash] = txn
    })
    .addCase(updateBridgeTxnPartnerHash, (state, { payload: { chainId, txHash, partnerChainId, partnerTxHash } }) => {
      const tx = state[chainId][txHash]
      tx.partnerTxHash = partnerTxHash

      const partnerTx = state[partnerChainId][partnerTxHash]
      partnerTx.partnerTxHash = txHash

      state[chainId][txHash] = tx
      state[partnerChainId][partnerTxHash] = partnerTx
    })
    .addCase(
      updateBridgeTxnWithdrawalInfo,
      (state, { payload: { chainId, outgoingMessageState, txHash, batchIndex, batchNumber } }) => {
        const tx = state[chainId][txHash]
        tx.outgoingMessageState = outgoingMessageState
        if (outgoingMessageState === OutgoingMessageState.EXECUTED) {
          tx.timestampResolved = now()
        }
        if (batchIndex && batchNumber) {
          tx.batchNumber = batchNumber
          tx.batchIndex = batchIndex
        }
        state[chainId][txHash] = tx
      }
    )
)
