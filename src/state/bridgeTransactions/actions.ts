import { createAction } from '@reduxjs/toolkit'
import { ChainId } from '@swapr/sdk'
import { SerializableTransactionReceipt } from '../transactions/actions'
import { BridgeTxn, BridgeTxnStatus } from './types'

const PREFIX = 'bridgeTxn/'

export const addBridgeTxn = createAction<Omit<BridgeTxn, 'timestampCreated' | 'timestampResolved'>>(
  PREFIX + 'addTransaction'
)
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
  layer: 1 | 2
  receipt: SerializableTransactionReceipt
}>(PREFIX + 'updateReceipt')
export const updateBridgeTxnL2Hash = createAction<{ chainId: ChainId; txHash: string; l2Hash: string }>(
  PREFIX + 'updateL2Hash'
)
