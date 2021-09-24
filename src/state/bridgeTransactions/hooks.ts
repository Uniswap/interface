import { useMemo } from 'react'
import { useSelector } from 'react-redux'
import { AppState } from '..'
import { NETWORK_DETAIL } from '../../constants'
import { useActiveWeb3React } from '../../hooks'
import { useBridge } from '../../hooks/useArbBridge'
import { BridgeTxnStatus, BridgeTxnType } from './types'

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

export type CombinedBridgeTxn = {
  assetName: string
  value: string
  fromName: string
  toName: string
  status: BridgeTxnStatus
  timestampCreated: number
  txHash: string
  partnerTxHash?: string
}

export const useBridgeTransactionsStatuses = () => {
  const { chainId } = useActiveWeb3React()
  const {
    chainIdPair: { l1ChainId, l2ChainId }
  } = useBridge()
  const state = useSelector<AppState, AppState['bridgeTransactions']>(state => state.bridgeTransactions)

  return useMemo(() => {
    if (state && chainId && state[chainId] && l1ChainId && l2ChainId) {
      return Object.values(state[chainId]).map(tx => {
        const { assetName, type, value, partnerTxHash, timestampCreated, txHash, status } = tx
        const from = txnTypeToOrigin(type) === 1 ? l1ChainId : l2ChainId
        const to = from === l1ChainId ? l2ChainId : l1ChainId

        // Prevents glitch when originTx has been confirmed and partnerTxHash haven't made it to the store yet
        let combinedStatus: BridgeTxnStatus = status === 'confirmed' ? 'pending' : status

        // If partnerTxHash is present then origin tx has been confirmed and process has been taken to partner chain
        if (partnerTxHash && state[to] && state[to][partnerTxHash]) {
          combinedStatus = state[to][partnerTxHash].status
        }

        return {
          assetName,
          value,
          fromName: NETWORK_DETAIL[from].chainName,
          toName: NETWORK_DETAIL[to].chainName,
          status: combinedStatus,
          txHash,
          partnerTxHash,
          timestampCreated
        }
      })
    }
    return []
  }, [chainId, l1ChainId, l2ChainId, state])
}
