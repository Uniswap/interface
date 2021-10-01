import { ChainId } from '@swapr/sdk'
import { NETWORK_DETAIL } from '../constants'
import { BridgeTransactionStatus, BridgeTxnType } from '../state/bridgeTransactions/types'

export type ChainIdPair = {
  l1ChainId: ChainId | undefined
  l2ChainId: ChainId | undefined
  chainId: ChainId | undefined
}

export const getChainPair = (chainId?: ChainId): ChainIdPair => {
  if (!chainId) {
    return {
      l1ChainId: chainId,
      l2ChainId: undefined,
      chainId
    }
  }

  const networkDetails = NETWORK_DETAIL[chainId]
  const l1 = !networkDetails.isArbitrum ? networkDetails.chainId : networkDetails.partnerChainId
  const l2 = networkDetails.isArbitrum ? networkDetails.chainId : networkDetails.partnerChainId

  if (l1 && l2) {
    return {
      l1ChainId: Number(l1) as ChainId,
      l2ChainId: Number(l2) as ChainId,
      chainId
    }
  }

  return {
    l1ChainId: chainId,
    l2ChainId: undefined,
    chainId
  }
}

export const PendingReasons = {
  TX_UNCONFIRMED: 'Transaction has not been confirmed yet',
  DESPOSIT: 'Waiting for deposit to be processed on L2 (~10 minutes)',
  WITHDRAWAL: 'Waiting for confirmation (~7 days of dispute period)'
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
