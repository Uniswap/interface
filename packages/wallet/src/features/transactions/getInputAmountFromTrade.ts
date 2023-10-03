import { TradeType } from '@uniswap/sdk-core'
import {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
} from 'wallet/src/features/transactions/types'

export function getInputAmountFromTrade(
  typeInfo: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo
): string {
  return typeInfo.tradeType === TradeType.EXACT_INPUT
    ? typeInfo.inputCurrencyAmountRaw
    : typeInfo.expectedInputCurrencyAmountRaw
}
