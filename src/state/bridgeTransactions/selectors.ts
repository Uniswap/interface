import { createSelector } from '@reduxjs/toolkit'
import { OutgoingMessageState } from 'arb-ts'
import { AppState } from '..'
import { getBridgeTxStatus, PendingReasons, txnTypeToOrigin } from '../../utils/arbitrum'
import { chainIdSelector, accountSelector } from '../application/selectors'
import { BridgeTxsFilter } from '../bridge/reducer'
import { bridgeTxsFilterSelector, bridgeTxsLoadingSelector } from '../bridge/selectors'
import { BridgeTransactionLog, BridgeTransactionSummary, BridgeTxn, BridgeTxnsState } from './types'

export const bridgeTxsSelector = (state: AppState) => state.bridgeTransactions

export const bridgeOwnedTxsSelector = createSelector(
  chainIdSelector,
  accountSelector,
  bridgeTxsSelector,
  ({ l1ChainId, l2ChainId }, account, txs) => {
    const transactions: BridgeTxnsState = {}

    if (l1ChainId && l2ChainId && account && txs) {
      const chains = [l1ChainId, l2ChainId]

      chains.forEach(chainId => {
        const txPerChain: { [hash: string]: BridgeTxn } = {}

        Object.values(txs[chainId] ?? {}).forEach(tx => {
          if (tx.sender !== account) return
          txPerChain[tx.txHash] = tx
        })

        transactions[chainId] = txPerChain
      })
    }

    return transactions
  }
)

export const bridgePendingTxsSelector = createSelector(
  chainIdSelector,
  bridgeOwnedTxsSelector,
  ({ l1ChainId, l2ChainId }, txs) => {
    let transactions: BridgeTxn[] = []

    if (l1ChainId && l2ChainId) {
      transactions = [
        ...Object.values(txs[l1ChainId] ?? {}).filter(tx => !tx?.receipt),
        ...Object.values(txs[l2ChainId] ?? {}).filter(tx => !tx?.receipt)
      ]
    }

    return transactions
  }
)

export const bridgeL1DepositsSelector = createSelector(
  chainIdSelector,
  bridgeOwnedTxsSelector,
  ({ l1ChainId, l2ChainId }, txs) => {
    let transactions: BridgeTxn[] = []

    if (l1ChainId && l2ChainId) {
      transactions = [
        ...Object.values(txs[l1ChainId] ?? {}).filter(tx => {
          return (tx.type === 'deposit' || tx.type === 'deposit-l1') && tx?.receipt?.status === 1
        })
      ]
    }

    return transactions
  }
)

export const bridgePendingWithdrawalsSelector = createSelector(
  chainIdSelector,
  bridgeOwnedTxsSelector,
  ({ l2ChainId }, txs) => {
    let transactions: BridgeTxn[] = []

    if (l2ChainId && txs[l2ChainId]) {
      const l2Txs = txs[l2ChainId]

      transactions = Object.values(l2Txs ?? {}).filter(
        tx => tx.type === 'withdraw' && tx.outgoingMessageState !== OutgoingMessageState.EXECUTED
      )
    }

    return transactions
  }
)

export const createBridgeLog = (transactions: BridgeTxn[]): BridgeTransactionLog[] => {
  return transactions.map(tx => ({
    txHash: tx.txHash,
    chainId: tx.chainId,
    type: tx.type,
    status: getBridgeTxStatus(tx.receipt?.status)
  }))
}

export const bridgeTxsSummarySelector = createSelector(
  chainIdSelector,
  bridgeOwnedTxsSelector,
  bridgeTxsFilterSelector,
  bridgeTxsLoadingSelector,
  ({ l1ChainId, l2ChainId }, txs, txsFilter, isLoading) => {
    if (l1ChainId && l2ChainId) {
      const l1Txs = txs[l1ChainId]
      const l2Txs = txs[l2ChainId]

      const processedTxsMap: {
        [chainId: number]: {
          [txHash: string]: string
        }
      } = { [l1ChainId]: {}, [l2ChainId]: {} }

      const l1Summaries = Object.values(l1Txs ?? {}).reduce<BridgeTransactionSummary[]>((total, tx) => {
        const from = txnTypeToOrigin(tx.type) === 1 ? l1ChainId : l2ChainId
        const to = from === l1ChainId ? l2ChainId : l1ChainId

        // No pair
        if (processedTxsMap[l1ChainId][tx.txHash]) return total

        const summary: BridgeTransactionSummary = {
          assetName: tx.assetName,
          fromChainId: from,
          toChainId: to,
          status: getBridgeTxStatus(tx.receipt?.status),
          value: tx.value,
          txHash: tx.txHash,
          batchIndex: tx.batchIndex,
          batchNumber: tx.batchNumber,
          pendingReason: tx.receipt?.status ? undefined : PendingReasons.TX_UNCONFIRMED,
          timestampResolved: tx.timestampResolved,
          log: []
        }

        if (!tx.partnerTxHash || !l2Txs[tx.partnerTxHash]) {
          summary.log = createBridgeLog([tx])

          // deposits on l1 should never show confirmed on UI
          if (tx.type === 'deposit-l1' && tx.receipt?.status !== 0) {
            summary.status = 'pending'
            summary.pendingReason = PendingReasons.TX_UNCONFIRMED
          }
          processedTxsMap[l1ChainId][tx.txHash] = tx.txHash

          total.push(summary)
          return total
        }

        // l2 to l1 withdrawal
        if (tx.type === 'outbox') {
          const status = tx.receipt?.status
          summary.log = createBridgeLog([tx, l2Txs[tx.partnerTxHash]])
          summary.status = getBridgeTxStatus(status)
          summary.pendingReason = status ? undefined : PendingReasons.TX_UNCONFIRMED

          processedTxsMap[l1ChainId][tx.txHash] = tx.txHash
          processedTxsMap[l2ChainId][tx.partnerTxHash] = tx.partnerTxHash
          total.push(summary)
          return total
        }

        // Has pair & is deposit
        if (tx.receipt?.status === 1 && tx.type === 'deposit-l1') {
          const status = l2Txs[tx.partnerTxHash].receipt?.status
          summary.log = createBridgeLog([tx, l2Txs[tx.partnerTxHash]])
          summary.status = getBridgeTxStatus(status)
          summary.pendingReason = status ? undefined : PendingReasons.DESPOSIT
          summary.timestampResolved = l2Txs[tx.partnerTxHash].timestampResolved

          processedTxsMap[l1ChainId][tx.txHash] = tx.txHash
          processedTxsMap[l2ChainId][tx.partnerTxHash] = tx.partnerTxHash
          total.push(summary)
          return total
        }

        return total
      }, [])

      const l2Summaries = Object.values(l2Txs ?? {}).reduce<BridgeTransactionSummary[]>((total, tx) => {
        // No pair
        const from = txnTypeToOrigin(tx.type) === 1 ? l1ChainId : l2ChainId
        const to = from === l1ChainId ? l2ChainId : l1ChainId

        if (processedTxsMap[l2ChainId][tx.txHash]) return total

        const summary: BridgeTransactionSummary = {
          assetName: tx.assetName,
          value: tx.value,
          txHash: tx.txHash,
          batchNumber: tx.batchNumber,
          batchIndex: tx.batchIndex,
          fromChainId: from,
          toChainId: to,
          status: getBridgeTxStatus(tx.receipt?.status),
          timestampResolved: tx.timestampResolved,
          log: []
        }

        if (!tx.partnerTxHash || !l1Txs[tx.partnerTxHash]) {
          // display state of outgoing message state when withdrawal
          if (tx.type === 'withdraw') {
            if (!isLoading) {
              switch (tx.outgoingMessageState) {
                case OutgoingMessageState.CONFIRMED:
                  summary.status = 'redeem'
                  summary.timestampResolved = undefined
                  break
                case OutgoingMessageState.EXECUTED:
                  summary.status = 'claimed'
                  break
                default:
                  summary.status = 'pending'
                  summary.pendingReason = PendingReasons.WITHDRAWAL
                  summary.timestampResolved = undefined
              }
            } else {
              summary.status = 'loading'
              summary.timestampResolved = undefined
            }
          }
          summary.log = createBridgeLog([tx])
          processedTxsMap[l2ChainId][tx.txHash] = tx.txHash
          total.push(summary)
          return total
        }

        return total
      }, [])

      // Filtering and sorting
      const retVal = [...l1Summaries, ...l2Summaries].reverse()

      switch (txsFilter) {
        case BridgeTxsFilter.COLLECTABLE:
          return retVal.filter(summary => summary.status === 'redeem')
        case BridgeTxsFilter.RECENT:
          const passed24h = new Date().getTime() - 1000 * 60 * 60 * 24

          return retVal.filter(summary => {
            if (!summary.timestampResolved) return true
            return summary.timestampResolved >= passed24h
          })
        default:
          return retVal
      }
    }

    return []
  }
)
