import { TradeType } from '@uniswap/sdk-core'
import { ChainId, ChainIdTo } from 'src/constants/chains'

// data structure optimized for index access
// TODO: hash is not sufficient
export type TransactionState = ChainIdTo<{ [txHash: string]: TransactionDetails }>

export interface TransactionDetails {
  chainId: ChainId
  hash: string
  info: TransactionInfo
  from: string
  addedTime: number

  confirmedTime?: number
  receipt?: SerializableTransactionReceipt

  lastCheckedBlockNumber?: number // updater periodically checks tx status
}

export interface SerializableTransactionReceipt {
  to: string
  from: string
  contractAddress: string
  transactionIndex: number
  blockHash: string
  transactionHash: string
  blockNumber: number
  status?: number
}

/**
 * Be careful adding to this enum, always assign a unique value (typescript will not prevent duplicate values).
 * These values is persisted in state and if you change the value it will cause errors
 */
export enum TransactionType {
  APPROVE = 0,
  SWAP = 1,
  WRAP = 2,
  SEND = 3,
  RECEIVED = 4,
}

export interface BaseTransactionInfo {
  type: TransactionType
}

export interface ApproveTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.APPROVE
  tokenAddress: string
  spender: string
}

interface BaseSwapTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.SWAP
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
  type: TransactionType.WRAP
  unwrapped: boolean
  currencyAmountRaw: string
}

export interface SendTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.SEND
  currencyAmountRaw: string
}

export interface ReceiveTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.RECEIVED
  currencyAmountRaw: string
}

export type TransactionInfo =
  | ApproveTransactionInfo
  | ExactOutputSwapTransactionInfo
  | ExactInputSwapTransactionInfo
  | WrapTransactionInfo
  | SendTransactionInfo
  | ReceiveTransactionInfo
