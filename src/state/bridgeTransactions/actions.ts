import { createAction } from '@reduxjs/toolkit'
import { ChainId } from '@swapr/sdk'
import { SerializableTransactionReceipt } from '../transactions/actions'
import { BridgeTxn } from './types'

const PREFIX = 'bridgeTxn/'

export const addBridgeTxn = createAction<Omit<BridgeTxn, 'timestampCreated' | 'timestampResolved'>>(
  PREFIX + 'addTransaction'
)
export const updateBridgeTxnBlockNumber = createAction<{ chainId: ChainId; txHash: string; blockNumber: number }>(
  PREFIX + 'updateBlockNumber'
)
export const updateBridgeTxnResolvedTimestamp = createAction<{ chainId: ChainId; txHash: string; timestamp: number }>(
  PREFIX + 'updateResolvedTimestamp'
)
export const updateBridgeTxnReceipt = createAction<{
  chainId: ChainId
  txHash: string
  receipt: SerializableTransactionReceipt
  seqNum?: number
}>(PREFIX + 'updateReceipt')
export const updateBridgeTxnPartnerHash = createAction<{
  chainId: ChainId
  txHash: string
  partnerChainId: ChainId
  partnerTxHash: string
}>(PREFIX + 'updatePartnerTxHash')
