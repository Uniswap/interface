import { createReducer } from '@reduxjs/toolkit'
import {
  addBridgeTxn,
  updateBridgeTxnResolvedTimestamp,
  updateBridgeTxnReceipt,
  updateBridgeTxnPartnerHash
} from './actions'
import { BridgeTxnsState, BridgeTxnType } from './types'

export const txnTypeToLayer = (txnType: BridgeTxnType): 1 | 2 => {
  switch (txnType) {
    case 'deposit':
    case 'deposit-l1':
    case 'outbox':
    case 'approve':
    case 'connext-deposit':
      return 1
    case 'deposit-l2':
    case 'withdraw':
    case 'connext-withdraw':
    case 'deposit-l2-auto-redeem':
      return 2
  }
}

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
)
