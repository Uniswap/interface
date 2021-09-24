import { createAction } from '@reduxjs/toolkit'
import { ChainId } from '@swapr/sdk'
import { SerializableTransactionReceipt } from '../transactions/actions'
import { BridgeTxn, BridgeTxnStatus } from './types'

const PREFIX = 'bridgeTxn/'

export const addBridgeTxn = createAction<
  Omit<BridgeTxn, 'timestampCreated' | 'timestampResolved' | 'status' | 'withdrawalData'>
>(PREFIX + 'addTransaction')
export const updateBridgeTxnStatus = createAction<{ chainId: ChainId; txHash: string; status: BridgeTxnStatus }>(
  PREFIX + 'updateStatus'
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
}>(PREFIX + 'updateReceipt')
export const updateBridgeTxnPartnerHash = createAction<{ chainId: ChainId; txHash: string; partnerTxHash: string }>(
  PREFIX + 'updatePartnerHash'
)
