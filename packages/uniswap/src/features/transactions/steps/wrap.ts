import type { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { TradingApi } from '@universe/api'
import {
  OnChainTransactionFields,
  OnChainTransactionFieldsWalletCall,
  TransactionStepType,
} from 'uniswap/src/features/transactions/steps/types'
import type { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/types/transactionRequests'

export interface WrapTransactionStep extends OnChainTransactionFields {
  type: TransactionStepType.WrapTransaction
  amount: CurrencyAmount<Currency>
}

export interface WrapTransactionStepWalletCall extends OnChainTransactionFieldsWalletCall {
  type: TransactionStepType.WrapTransactionWalletCall
  amount: CurrencyAmount<Currency>
}

export function createWrapTransactionStep(
  txRequest: ValidatedTransactionRequest | undefined,
  inputAmount: CurrencyAmount<Currency> | undefined,
): WrapTransactionStep | undefined {
  return txRequest && inputAmount
    ? { txRequest, type: TransactionStepType.WrapTransaction, amount: inputAmount }
    : undefined
}

export function createWrapTransactionStepWalletCall({
  txRequests,
  inputAmount,
  paymasterService,
}: {
  txRequests: ValidatedTransactionRequest[]
  inputAmount: CurrencyAmount<Currency>
  paymasterService?: Partial<TradingApi.PaymasterServiceCapability>
}): WrapTransactionStepWalletCall {
  return {
    type: TransactionStepType.WrapTransactionWalletCall,
    walletCallTxRequests: txRequests,
    amount: inputAmount,
    paymasterService: paymasterService?.url ? (paymasterService as TradingApi.PaymasterServiceCapability) : undefined,
  }
}
