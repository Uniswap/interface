import { ChainId } from '@swapr/sdk'
import { SerializableTransactionReceipt } from '../transactions/actions'

export type BridgeTxnStatus =
  | 'l1-pending'
  | 'l1-confirmed'
  | 'l1-failed'
  | 'l2-pending'
  | 'l2-confirmed'
  | 'l2-failed'
  | 'success'

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
  ETH = 'ETH'
  //ERC20, ERC721
}

export type BridgeTxnsState = {
  [chainId: number]: {
    [txHash: string]: BridgeTxn
  }
}

export type BridgeTxn = {
  type: BridgeTxnType
  from: ChainId
  to: ChainId
  status: BridgeTxnStatus
  value: string | null
  txHash?: string
  l2TxHash?: string
  assetName: string
  assetType: BridgeAssetType
  sender: string
  blockNumber?: number
  timestampResolved?: number
  timestampCreated?: number
  l1Receipt?: SerializableTransactionReceipt
  l2Receipt?: SerializableTransactionReceipt
}
