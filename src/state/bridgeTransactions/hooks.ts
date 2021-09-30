import { OutgoingMessageState } from 'arb-ts'
import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { AppState } from '..'
import { NETWORK_DETAIL } from '../../constants'
import { useBridge } from '../../hooks/useArbBridge'
import { BridgeTxn, BridgeTxnsState, BridgeTxnType } from './types'

export type BridgeTransactionStatus = 'failed' | 'confirmed' | 'pending' | 'redeem'

export type BridgeTransactionSummary = Pick<BridgeTxn, 'assetName' | 'value' | 'batchIndex' | 'batchNumber'> & {
  fromName: string
  toName: string
  log: BridgeTransactionLog[]
  status: BridgeTransactionStatus
}

export type BridgeTransactionLog = Pick<BridgeTxn, 'timestampCreated' | 'timestampResolved' | 'txHash'> & {
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
    timestampCreated: tx.timestampCreated,
    timestampResolved: tx.timestampResolved,
    txHash: tx.txHash,
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
        tx =>
          tx.type === 'withdraw' &&
          tx.outgoingMessageState !== OutgoingMessageState.CONFIRMED &&
          tx.outgoingMessageState !== OutgoingMessageState.EXECUTED
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
          fromName: NETWORK_DETAIL[from].chainName,
          toName: NETWORK_DETAIL[to].chainName,
          status: getBridgeTxStatus(tx.receipt?.status),
          value: tx.value,
          batchIndex: tx.batchIndex,
          batchNumber: tx.batchNumber,
          log: []
        }

        if (!tx.partnerTxHash || !l2Txs[tx.partnerTxHash]) {
          summary.log = createBridgeLog([tx])

          // deposits on l1 should never show confirmed on UI
          if (tx.type === 'deposit-l1' && tx.receipt?.status !== 0) {
            summary.status = 'pending'
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
          batchNumber: tx.batchNumber,
          batchIndex: tx.batchIndex,
          fromName: NETWORK_DETAIL[from].chainName,
          toName: NETWORK_DETAIL[to].chainName,
          status: getBridgeTxStatus(tx.receipt?.status),
          log: []
        }

        if (!tx.partnerTxHash || !l1Txs[tx.partnerTxHash]) {
          // display state of outgoing message state when withdrawal
          if (tx.type === 'withdraw') {
            switch (tx.outgoingMessageState) {
              case OutgoingMessageState.CONFIRMED:
                summary.status = 'redeem'
                break
              case OutgoingMessageState.EXECUTED:
                summary.status = 'failed'
                break
              default:
                summary.status = 'pending'
            }
          }
          summary.log = createBridgeLog([tx])
          txMap[l2ChainId][tx.txHash] = tx.txHash
          total.push(summary)
          return total
        }

        return total
      }, [])

      return [...l1Summaries, ...l2Summaries]
    }

    return []
  }, [l1ChainId, l2ChainId, state])
}
