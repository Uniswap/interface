import { TradeType } from '@uniswap/sdk-core'
import {
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
} from 'wallet/src/features/transactions/types'

export function getOutputAmountFromTrade(
  typeInfo: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo
): string {
  return typeInfo.tradeType === TradeType.EXACT_OUTPUT
    ? typeInfo.outputCurrencyAmountRaw
    : typeInfo.expectedOutputCurrencyAmountRaw
}
