import type { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { OnChainTransactionFields, TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import type { ValidatedTransactionRequest } from 'uniswap/src/features/transactions/swap/utils/trade'

export interface WrapTransactionStep extends OnChainTransactionFields {
  type: TransactionStepType.WrapTransaction
  amount: CurrencyAmount<Currency>
  //ring wrap
  inputCurrencyId?: string
  outputCurrencyId?: string
}

export function createWrapTransactionStep(
  txRequest: ValidatedTransactionRequest | undefined,
  inputAmount: CurrencyAmount<Currency> | undefined,
  //ring wrap
  inputCurrencyId?: string,
  outputCurrencyId?: string,
): WrapTransactionStep | undefined {
  return txRequest && inputAmount
    ? { txRequest, type: TransactionStepType.WrapTransaction, amount: inputAmount, inputCurrencyId, outputCurrencyId }
    : undefined
}
