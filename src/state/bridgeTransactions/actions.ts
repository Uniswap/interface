import { createAction } from '@reduxjs/toolkit'
import { ChainId } from '@swapr/sdk'
import { BridgeTxn } from './types'
import { TransactionReceipt } from '@ethersproject/abstract-provider'
import { OutgoingMessageState } from 'arb-ts'

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
  receipt: TransactionReceipt
  seqNum?: number
}>(PREFIX + 'updateReceipt')
export const updateBridgeTxnPartnerHash = createAction<{
  chainId: ChainId
  txHash: string
  partnerChainId: ChainId
  partnerTxHash: string
}>(PREFIX + 'updatePartnerTxHash')

export const updateBridgeTxnWithdrawalInfo = createAction<{
  chainId: ChainId
  txHash: string
  batchIndex?: string
  batchNumber?: string
  outgoingMessageState: OutgoingMessageState
}>(PREFIX + 'updateWithdrawalInfo')
