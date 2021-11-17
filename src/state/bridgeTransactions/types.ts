import { ChainId } from '@swapr/sdk'
import { OutgoingMessageState } from 'arb-ts'
import { TransactionReceipt } from '@ethersproject/abstract-provider'

export type BridgeTxnType =
  | 'deposit'
  | 'deposit-l1'
  | 'deposit-l2'
  | 'withdraw'
  | 'outbox'
  | 'approve'
  | 'connext-deposit'
  | 'connext-withdraw'
  | 'deposit-l2-auto-redeem'

export enum BridgeAssetType {
  ETH = 'ETH',
  ERC20 = 'ERC20'
  //ERC721
}

export type BridgeTxnsState = {
  [chainId: number]: {
    [txHash: string]: BridgeTxn
  }
}

export type BridgeTxn = {
  type: BridgeTxnType
  chainId: ChainId
  sender: string
  assetName: string
  assetType: BridgeAssetType
  assetAddress?: string
  value: string
  txHash: string
  blockNumber?: number
  timestampResolved?: number
  timestampCreated: number
  receipt?: TransactionReceipt
  seqNum?: number
  partnerTxHash?: string
  batchIndex?: string
  batchNumber?: string
  outgoingMessageState?: OutgoingMessageState
}

export type BridgeTransactionStatus = 'failed' | 'confirmed' | 'pending' | 'redeem' | 'claimed' | 'loading'

export type BridgeTransactionSummary = Pick<
  BridgeTxn,
  'txHash' | 'assetName' | 'value' | 'batchIndex' | 'batchNumber' | 'timestampResolved' | 'assetAddress'
> & {
  fromChainId: ChainId
  toChainId: ChainId
  log: BridgeTransactionLog[]
  status: BridgeTransactionStatus
  pendingReason?: string
}

export type BridgeTransactionLog = Pick<BridgeTxn, 'txHash' | 'type' | 'chainId'> &
  Pick<BridgeTransactionSummary, 'fromChainId' | 'toChainId'> & {
    status: BridgeTransactionStatus
  }
