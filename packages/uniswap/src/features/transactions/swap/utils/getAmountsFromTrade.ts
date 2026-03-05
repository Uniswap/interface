import { TradeType } from '@uniswap/sdk-core'
import {
  BridgeTransactionInfo,
  ConfirmedSwapTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
  PlanTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import {
  isBridgeTypeInfo,
  isConfirmedSwapTypeInfo,
  isPlanTransactionInfo,
} from 'uniswap/src/features/transactions/types/utils'

export function getAmountsFromTrade(
  typeInfo:
    | ExactInputSwapTransactionInfo
    | ExactOutputSwapTransactionInfo
    | ConfirmedSwapTransactionInfo
    | BridgeTransactionInfo
    | PlanTransactionInfo,
): { inputCurrencyAmountRaw: string; outputCurrencyAmountRaw: string } {
  if (isConfirmedSwapTypeInfo(typeInfo) || isBridgeTypeInfo(typeInfo) || isPlanTransactionInfo(typeInfo)) {
    const { inputCurrencyAmountRaw, outputCurrencyAmountRaw } = typeInfo
    return { inputCurrencyAmountRaw, outputCurrencyAmountRaw }
  }

  return typeInfo.tradeType === TradeType.EXACT_OUTPUT
    ? {
        inputCurrencyAmountRaw: typeInfo.expectedInputCurrencyAmountRaw,
        outputCurrencyAmountRaw: typeInfo.outputCurrencyAmountRaw,
      }
    : {
        inputCurrencyAmountRaw: typeInfo.inputCurrencyAmountRaw,
        outputCurrencyAmountRaw: typeInfo.expectedOutputCurrencyAmountRaw,
      }
}
