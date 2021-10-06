import { ChainId } from '@swapr/sdk'
import { OutgoingMessageState } from 'arb-ts'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { AppState } from '..'
import { useBridge } from '../../hooks/useArbBridge'
import { BridgeTxn, BridgeTxnsState, BridgeTxnType } from './types'

export const PendingReasons = {
  TX_UNCONFIRMED: 'Transaction has not been confirmed yet',
  DESPOSIT: 'Waiting for deposit to be processed on L2 (~10 minutes)',
  WITHDRAWAL: 'Waiting for confirmation (~7 days of dispute period)'
}

export type BridgeTransactionStatus = 'failed' | 'confirmed' | 'pending' | 'redeem' | 'claimed'

export type BridgeTransactionSummary = Pick<
  BridgeTxn,
  'txHash' | 'assetName' | 'value' | 'batchIndex' | 'batchNumber' | 'timestampResolved'
> & {
  fromChainId: ChainId
  toChainId: ChainId
  log: BridgeTransactionLog[]
  status: BridgeTransactionStatus
  pendingReason?: string
}

export type BridgeTransactionLog = Pick<BridgeTxn, 'txHash' | 'chainId' | 'type'> & {
  status: BridgeTransactionStatus
}

export const getBridgeTxStatus = (txStatus: number | undefined): BridgeTransactionStatus => {
  switch (txStatus) {
    case 0:
      return 'failed'
    case 1:
      return 'confirmed'
    default:
      return 'pending'
  }
}

export const createBridgeLog = (transactions: BridgeTxn[]): BridgeTransactionLog[] => {
  return transactions.map(tx => ({
    txHash: tx.txHash,
    chainId: tx.chainId,
    type: tx.type,
    status: getBridgeTxStatus(tx.receipt?.status)
  }))
}

export const txnTypeToOrigin = (txnType: BridgeTxnType): 1 | 2 => {
  switch (txnType) {
    case 'deposit':
    case 'deposit-l1':
    case 'deposit-l2':
    case 'outbox':
    case 'approve':
    case 'connext-deposit':
      return 1
    case 'withdraw':
    case 'connext-withdraw':
    case 'deposit-l2-auto-redeem':
      return 2
  }
}

export const useBridgeTransactions = () => {
  const {
    chainIdPair: { l1ChainId, l2ChainId }
  } = useBridge()
  const state = useSelector<AppState, AppState['bridgeTransactions']>(state => state.bridgeTransactions)
  return useMemo(() => {
    const transactions: BridgeTxnsState = {}

    if (l1ChainId && l2ChainId) {
      transactions[l1ChainId] = state[l1ChainId]
      transactions[l2ChainId] = state[l2ChainId]
    }

    return transactions
  }, [l1ChainId, l2ChainId, state])
}

export const useBridgePendingTransactions = () => {
  const {
    chainIdPair: { l1ChainId, l2ChainId }
  } = useBridge()
  const state = useSelector<AppState, AppState['bridgeTransactions']>(state => state.bridgeTransactions)
  return useMemo(() => {
    let transactions: BridgeTxn[] = []

    if (l1ChainId && l2ChainId) {
      transactions = [
        ...Object.values(state[l1ChainId] ?? {}).filter(tx => !tx?.receipt),
        ...Object.values(state[l2ChainId] ?? {}).filter(tx => !tx?.receipt)
      ]
    }

    return transactions
  }, [l1ChainId, l2ChainId, state])
}

export const useBridgeL1Deposits = () => {
  const {
    chainIdPair: { l1ChainId, l2ChainId }
  } = useBridge()

  const state = useSelector<AppState, AppState['bridgeTransactions']>(state => state.bridgeTransactions)
  return useMemo(() => {
    let transactions: BridgeTxn[] = []

    if (l1ChainId && l2ChainId) {
      transactions = [
        ...Object.values(state[l1ChainId] ?? {}).filter(tx => {
          return (tx.type === 'deposit' || tx.type === 'deposit-l1') && tx?.receipt?.status === 1
        })
      ]
    }

    return transactions
  }, [l1ChainId, l2ChainId, state])
}

export const useBridgePendingWithdrawals = () => {
  const {
    chainIdPair: { l2ChainId }
  } = useBridge()
  const state = useSelector<AppState, AppState['bridgeTransactions']>(state => state.bridgeTransactions)

  return useMemo(() => {
    let transactions: BridgeTxn[] = []

    if (l2ChainId && state[l2ChainId]) {
      const l2Txs = state[l2ChainId]

      transactions = Object.values(l2Txs).filter(
        tx => tx.type === 'withdraw' && tx.outgoingMessageState !== OutgoingMessageState.EXECUTED
      )
    }

    return transactions
  }, [l2ChainId, state])
}

export const useBridgeTransactionsSummary = () => {
  const {
    chainIdPair: { l1ChainId, l2ChainId }
  } = useBridge()
  const state = useSelector<AppState, AppState['bridgeTransactions']>(state => state.bridgeTransactions)

  return useMemo(() => {
    if (l1ChainId && l2ChainId && state[l1ChainId] && state[l2ChainId]) {
      const l1Txs = state[l1ChainId]
      const l2Txs = state[l2ChainId]

      const txMap: {
        [chainId: number]: {
          [txHash: string]: string
        }
      } = { [l1ChainId]: {}, [l2ChainId]: {} }

      const l1Summaries = Object.values(l1Txs).reduce<BridgeTransactionSummary[]>((total, tx) => {
        const from = txnTypeToOrigin(tx.type) === 1 ? l1ChainId : l2ChainId
        const to = from === l1ChainId ? l2ChainId : l1ChainId

        // No pair
        if (txMap[l1ChainId][tx.txHash]) return total

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
            summary.pendingReason = PendingReasons.DESPOSIT
          }
          txMap[l1ChainId][tx.txHash] = tx.txHash

          total.push(summary)
          return total
        }

        // Has pair & is deposit
        if (tx.receipt?.status === 1 && tx.type === 'deposit-l1') {
          const status = l2Txs[tx.partnerTxHash].receipt?.status
          summary.log = createBridgeLog([tx, l2Txs[tx.partnerTxHash]])
          summary.status = getBridgeTxStatus(status)
          summary.pendingReason = status ? undefined : PendingReasons.TX_UNCONFIRMED
          summary.timestampResolved = l2Txs[tx.partnerTxHash].timestampResolved

          txMap[l1ChainId][tx.txHash] = tx.txHash
          txMap[l2ChainId][tx.partnerTxHash] = tx.partnerTxHash
          total.push(summary)
          return total
        }

        return total
      }, [])

      const l2Summaries = Object.values(l2Txs).reduce<BridgeTransactionSummary[]>((total, tx) => {
        // No pair
        const from = txnTypeToOrigin(tx.type) === 1 ? l1ChainId : l2ChainId
        const to = from === l1ChainId ? l2ChainId : l1ChainId

        if (txMap[l2ChainId][tx.txHash]) return total

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
          }
          summary.log = createBridgeLog([tx])
          txMap[l2ChainId][tx.txHash] = tx.txHash
          total.push(summary)
          return total
        }

        return total
      }, [])

      const passed24h = new Date().getTime() - 1000 * 60 * 24

      return [...l1Summaries, ...l2Summaries].filter(summary => {
        if (!summary.timestampResolved) return true
        return summary.timestampResolved >= passed24h
      })
    }

    return []
  }, [l1ChainId, l2ChainId, state])
}
