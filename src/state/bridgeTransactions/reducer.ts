import { createReducer } from '@reduxjs/toolkit'
import {
  addBridgeTxn,
  updateBridgeTxnStatus,
  //   updateBridgeTxnBlockNumber,
  updateBridgeTxnResolvedTimestamp,
  updateBridgeTxnReceipt,
  updateBridgeTxnL2Hash
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

      const { from, txHash } = txn

      if (state[from]?.[txHash]) {
        throw Error('Attempted to add existing bridge transaction.')
      }
      const transactions = state[from] ?? {}

      transactions[txHash] = {
        ...txn,
        timestampCreated: now()
      }

      state[from] = transactions
    })
    .addCase(updateBridgeTxnStatus, (state, { payload: { chainId, txHash, status } }) => {
      if (!state[chainId]?.[txHash]) {
        throw Error('Transaction not found' + txHash)
      }

      state[chainId][txHash].status = status
    })
    .addCase(updateBridgeTxnResolvedTimestamp, (state, { payload: { chainId, txHash, timestamp } }) => {
      if (!state[chainId]?.[txHash]) {
        throw Error('Transaction not found' + txHash)
      }

      state[chainId][txHash].timestampResolved = timestamp
    })
    .addCase(updateBridgeTxnReceipt, (state, { payload: { chainId, layer, receipt, txHash } }) => {
      if (!state[chainId]?.[txHash]) {
        throw Error('Transaction not found' + txHash)
      }
      const txn = state[chainId][txHash]
      const resolvedLayer = `l${layer}Receipt` as 'l1Receipt' | 'l2Receipt'

      txn[resolvedLayer] = receipt
      txn.status = layer === 1 ? 'l1-confirmed' : 'l2-confirmed'

      state[chainId][txHash] = txn
    })
    .addCase(updateBridgeTxnL2Hash, (state, { payload: { chainId, txHash, l2Hash } }) => {
      if (!state[chainId]?.[txHash]) {
        throw Error('Transaction not found' + txHash)
      }

      const txn = state[chainId][txHash]

      txn.l2TxHash = l2Hash
      txn.status = 'l2-pending'

      state[chainId][txHash] = txn
    })
)
