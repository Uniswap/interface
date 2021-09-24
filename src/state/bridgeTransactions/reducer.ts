import { createReducer } from '@reduxjs/toolkit'
import {
  addBridgeTxn,
  updateBridgeTxnStatus,
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
        status: 'pending',
        timestampCreated: now()
      }

      state[chainId] = transactions
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
    .addCase(updateBridgeTxnReceipt, (state, { payload: { chainId, receipt, txHash } }) => {
      if (!state[chainId]?.[txHash]) {
        throw Error('Transaction not found' + txHash)
      }
      const txn = state[chainId][txHash]

      txn.receipt = receipt

      switch (receipt.status) {
        case 0: {
          txn.status = 'failure'
          break
        }
        case 1: {
          txn.status = 'confirmed'
          break
        }
        default:
          console.warn('*** Status not included in transaction receipt *** ')
          break
      }

      txn.timestampResolved = now()
      state[chainId][txHash] = txn
    })
    .addCase(updateBridgeTxnPartnerHash, (state, { payload: { chainId, txHash, partnerTxHash } }) => {
      if (!state[chainId]?.[txHash]) {
        throw Error('Transaction not found' + txHash)
      }

      state[chainId][txHash].partnerTxHash = partnerTxHash
    })
)
