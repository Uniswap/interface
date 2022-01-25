import { TransactionReceipt, TransactionResponse } from '@ethersproject/abstract-provider'
import { TradeType } from '@uniswap/sdk-core'
import { atomWithImmer } from 'jotai/immer'

export enum TransactionType {
  APPROVAL,
  SWAP,
}

interface BaseTransactionInfo {
  type: TransactionType
  response: TransactionResponse
}

export interface ApprovalTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.APPROVAL
  tokenAddress: string
  spenderAddress: string
}

export interface SwapTransactionInfo extends BaseTransactionInfo {
  type: TransactionType.SWAP
  tradeType: TradeType
  inputCurrencyAddress: string
  outputCurrencyAddress: string
}

export interface InputSwapTransactionInfo extends SwapTransactionInfo {
  tradeType: TradeType.EXACT_INPUT
  inputCurrencyAmount: string
  expectedOutputCurrencyAmount: string
  minimumOutputCurrencyAmount: string
}

export interface OutputSwapTransactionInfo extends SwapTransactionInfo {
  tradeType: TradeType.EXACT_OUTPUT
  outputCurrencyAmount: string
  expectedInputCurrencyAmount: string
  maximumInputCurrencyAmount: string
}

export type TransactionInfo = ApprovalTransactionInfo | SwapTransactionInfo

export interface Transaction<T extends TransactionInfo = TransactionInfo> {
  addedTime: number
  lastCheckedBlockNumber?: number
  receipt?: TransactionReceipt
  info: T
}

export const transactionsAtom = atomWithImmer<{
  [chainId: string]: { [hash: string]: Transaction }
}>({})
