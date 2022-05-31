import { TradeType } from '@uniswap/sdk-core'
import { providers } from 'ethers'
import { ChainId, ChainIdTo } from 'src/constants/chains'
import { AssetType } from 'src/entities/assets'

export type ChainIdToTxIdToDetails = ChainIdTo<{ [txId: string]: TransactionDetails }>

// Basic identifying info for a transaction
export interface TransactionId {
  chainId: ChainId
  id: string
}

export interface TransactionDetails extends TransactionId {
  from: Address

  // Info for submitting the tx
  options: TransactionOptions

  // Specific info for the tx type
  typeInfo: TransactionTypeInfo

  // Info for status tracking
  status: TransactionStatus
  addedTime: number
  // Note: hash is mandatory for now but may be made optional if
  // we start tracking txs before they're actually sent
  hash: string
  receipt?: TransactionReceipt

  isFlashbots?: boolean
}

export interface FinalizedTransactionDetails extends TransactionDetails {
  status: TransactionStatus.Success | TransactionStatus.Failed | TransactionStatus.Cancelled
}

export enum TransactionStatus {
  Cancelled = 'cancelled',
  Cancelling = 'cancelling',
  Success = 'confirmed',
  Failed = 'failed',
  Pending = 'pending',
  Replacing = 'replacing',
  Unknown = 'unknown',
  // May want more granular options here later like InMemPool
}

export interface TransactionOptions {
  request: providers.TransactionRequest
  timeoutMs?: number
  fetchBalanceOnSuccess?: boolean
}

export interface TransactionReceipt {
  transactionIndex: number
  blockHash: string
  blockNumber: number
  confirmedTime: number
  confirmations: number
}

/**
 * Be careful adding to this enum, always assign a unique value (typescript will not prevent duplicate values).
 * These values is persisted in state and if you change the value it will cause errors
 */
export enum TransactionType {
  Approve = 'approve',
  Swap = 'swap',
  Wrap = 'wrap',
  Send = 'send',
  Receive = 'receive',
  Unknown = 'unknown',
}

export interface BaseTransactionInfo {
  type: TransactionType
}

export interface ApproveTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Approve
  tokenAddress: string
  spender: string
}

interface BaseSwapTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Swap
  tradeType: TradeType
  inputCurrencyId: string
  outputCurrencyId: string
}

export interface ExactInputSwapTransactionInfo extends BaseSwapTransactionInfo {
  tradeType: TradeType.EXACT_INPUT
  inputCurrencyAmountRaw: string
  expectedOutputCurrencyAmountRaw: string
  minimumOutputCurrencyAmountRaw: string
}

export interface ExactOutputSwapTransactionInfo extends BaseSwapTransactionInfo {
  tradeType: TradeType.EXACT_OUTPUT
  outputCurrencyAmountRaw: string
  expectedInputCurrencyAmountRaw: string
  maximumInputCurrencyAmountRaw: string
}

export interface WrapTransactionInfo {
  type: TransactionType.Wrap
  unwrapped: boolean
  currencyAmountRaw: string
}

export interface SendTokenTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Send
  assetType: AssetType
  currencyAmountRaw?: string
  recipient: string
  tokenAddress: string
  tokenId?: string // optional. NFT token id
}

export interface ReceiveTokenTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Receive
  assetType: AssetType
  currencyAmountRaw?: string
  sender: string
  tokenAddress: string
  tokenId?: string // optional. NFT token id
}

export interface UnknownTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Unknown
  tokenAddress?: string
}

export type TransactionTypeInfo =
  | ApproveTransactionInfo
  | ExactOutputSwapTransactionInfo
  | ExactInputSwapTransactionInfo
  | WrapTransactionInfo
  | SendTokenTransactionInfo
  | ReceiveTokenTransactionInfo
  | UnknownTransactionInfo
