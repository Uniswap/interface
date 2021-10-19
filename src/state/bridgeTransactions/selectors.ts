import { OutgoingMessageState } from 'arb-ts'
import { createSelector } from '@reduxjs/toolkit'

import { AppState } from '..'
import { BridgeTxsFilter } from '../bridge/reducer'
import { chainIdSelector, accountSelector } from '../application/selectors'
import { bridgeTxsFilterSelector, bridgeTxsLoadingSelector } from '../bridge/selectors'

import { getBridgeTxStatus, PendingReasons, txnTypeToOrigin } from '../../utils/arbitrum'
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

type CreateBridgeLogProps = Pick<BridgeTransactionSummary, 'fromChainId' | 'toChainId'> & {
  transactions: BridgeTxn[]
}

const createBridgeLog = ({ transactions, fromChainId, toChainId }: CreateBridgeLogProps): BridgeTransactionLog[] => {
  return transactions.map(tx => ({
    txHash: tx.txHash,
    chainId: tx.chainId,
    toChainId,
    fromChainId,
    type: tx.type,
    status: getBridgeTxStatus(tx.receipt?.status)
  }))
}

// Reduce transactions into deposit/withdrawal summaries so user can see the result of entire process rather than its parts
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

      // Pair transactions and decide about their status
      const l1Summaries = Object.values(l1Txs ?? {}).reduce<BridgeTransactionSummary[]>((total, tx) => {
        const from = txnTypeToOrigin(tx.type) === 1 ? l1ChainId : l2ChainId
        const to = from === l1ChainId ? l2ChainId : l1ChainId

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

        // DEPOSIT L1
        if (!tx.partnerTxHash || !l2Txs[tx.partnerTxHash]) {
          if (tx.type === 'deposit-l1' && tx.receipt?.status !== 0) {
            summary.status = 'pending' // deposits on l1 should never show confirmed on UI
            summary.pendingReason = PendingReasons.TX_UNCONFIRMED
          }

          summary.log = createBridgeLog({ transactions: [tx], fromChainId: from, toChainId: to })
          processedTxsMap[l1ChainId][tx.txHash] = tx.txHash

          total.push(summary)
          return total
        }

        // WITHDRAWAL L1 + L2
        // from/to are inverted for better UX
        if (tx.type === 'outbox') {
          const status = tx.receipt?.status

          summary.fromChainId = to
          summary.toChainId = from
          summary.status = status === 1 ? 'claimed' : getBridgeTxStatus(status)
          summary.pendingReason = status ? undefined : PendingReasons.TX_UNCONFIRMED
          summary.log = createBridgeLog({
            transactions: [l2Txs[tx.partnerTxHash], tx],
            fromChainId: to,
            toChainId: from
          })

          processedTxsMap[l1ChainId][tx.txHash] = tx.txHash
          processedTxsMap[l2ChainId][tx.partnerTxHash] = tx.partnerTxHash // skip partner tx in l2Summaries

          total.push(summary)
          return total
        }

        // DEPOSIT L1 + L2
        if (tx.type === 'deposit-l1' && tx.receipt) {
          const statusL2 = l2Txs[tx.partnerTxHash].receipt?.status
          if (tx.receipt?.status === 0 || statusL2 === 0) {
            summary.status = 'failed'
          } else {
            summary.status = getBridgeTxStatus(statusL2)
            summary.pendingReason = statusL2 ? undefined : PendingReasons.DESPOSIT
            summary.timestampResolved = l2Txs[tx.partnerTxHash].timestampResolved
          }

          summary.log = createBridgeLog({
            transactions: [tx, l2Txs[tx.partnerTxHash]],
            fromChainId: from,
            toChainId: to
          })

          processedTxsMap[l1ChainId][tx.txHash] = tx.txHash
          processedTxsMap[l2ChainId][tx.partnerTxHash] = tx.partnerTxHash // skip partner tx in l2Summaries

          total.push(summary)
          return total
        }

        return total
      }, [])

      const l2Summaries = Object.values(l2Txs ?? {}).reduce<BridgeTransactionSummary[]>((total, tx) => {
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

        // WITHDRAWAL L2
        if (!tx.partnerTxHash || !l1Txs[tx.partnerTxHash]) {
          if (tx.type === 'withdraw') {
            if (!isLoading) {
              if (tx.receipt?.status !== 0) {
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
                summary.status = 'failed'
              }
            } else {
              summary.status = 'loading'
              summary.timestampResolved = undefined
            }
          }
          summary.log = createBridgeLog({ transactions: [tx], fromChainId: from, toChainId: to })

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
