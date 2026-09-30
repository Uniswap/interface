import { TradeType } from '@uniswap/sdk-core'
import { fetchCurrency } from 'uniswap/src/features/tokens/fetchCurrencyInfo'
import type {
  ConfirmedSwapTransactionInfo,
  ExactInputSwapTransactionInfo,
  ExactOutputSwapTransactionInfo,
} from 'uniswap/src/features/transactions/types/transactionDetails'
import type { FormatNumberFunctionType } from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/types'
import { buildCurrencyDescriptor } from '~/components/AccountDrawer/MiniPortfolio/Activity/parseLocal/utils'
import type { Activity } from '~/components/AccountDrawer/MiniPortfolio/Activity/types'

export async function parseSwap({
  swap,
  formatNumber,
}: {
  swap: ExactInputSwapTransactionInfo | ExactOutputSwapTransactionInfo
  formatNumber: FormatNumberFunctionType
}): Promise<Partial<Activity>> {
  const [tokenIn, tokenOut] = await Promise.all([
    fetchCurrency(swap.inputCurrencyId),
    fetchCurrency(swap.outputCurrencyId),
  ])
  const [inputRaw, outputRaw] =
    swap.tradeType === TradeType.EXACT_INPUT
      ? [swap.inputCurrencyAmountRaw, swap.settledOutputCurrencyAmountRaw ?? swap.expectedOutputCurrencyAmountRaw]
      : [swap.expectedInputCurrencyAmountRaw, swap.outputCurrencyAmountRaw]

  return {
    descriptor: buildCurrencyDescriptor({
      currencyA: tokenIn,
      amtA: inputRaw,
      currencyB: tokenOut,
      amtB: outputRaw,
      formatNumber,
      isSwap: true,
    }),
    currencies: [tokenIn, tokenOut],
    ...(swap.isUniswapXOrder ? { isUniswapX: true } : {}),
  }
}

export async function parseConfirmedSwap({
  swap,
  formatNumber,
}: {
  swap: ConfirmedSwapTransactionInfo
  formatNumber: FormatNumberFunctionType
}): Promise<Partial<Activity>> {
  const [tokenIn, tokenOut] = await Promise.all([
    fetchCurrency(swap.inputCurrencyId),
    fetchCurrency(swap.outputCurrencyId),
  ])

  // For confirmed swaps, we use the actual settled amounts
  const inputRaw = swap.inputCurrencyAmountRaw
  const outputRaw = swap.outputCurrencyAmountRaw

  return {
    descriptor: buildCurrencyDescriptor({
      currencyA: tokenIn,
      amtA: inputRaw,
      currencyB: tokenOut,
      amtB: outputRaw,
      formatNumber,
      isSwap: true,
    }),
    currencies: [tokenIn, tokenOut],
    ...(swap.isUniswapXOrder ? { isUniswapX: true } : {}),
  }
}
