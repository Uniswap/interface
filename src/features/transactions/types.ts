import { TradeType } from '@uniswap/sdk-core'
import { providers } from 'ethers'
import { ChainId, ChainIdTo } from 'src/constants/chains'

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
  // we start tracking txs before their actually sent
  hash: string
  receipt?: TransactionReceipt
}

export enum TransactionStatus {
  Cancelled = 'cancelled',
  Cancelling = 'cancelling',
  Failed = 'failed',
  Pending = 'pending',
  Replacing = 'replacing',
  Success = 'success',
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

export interface SendTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Send
  currencyAmountRaw: string
}

export interface ReceiveTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.Receive
  currencyAmountRaw: string
}

export type TransactionTypeInfo =
  | ApproveTransactionInfo
  | ExactOutputSwapTransactionInfo
  | ExactInputSwapTransactionInfo
  | WrapTransactionInfo
  | SendTransactionInfo
  | ReceiveTransactionInfo
