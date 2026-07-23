import type { Currency } from '@uniswap/sdk-core'
import { Percent as SdkPercent, Price } from '@uniswap/sdk-core'
import type { ChainedQuoteResponse } from '@universe/api'
import { TradingApi } from '@universe/api'
import { getEarnLaunchAssetCurrency } from 'uniswap/src/features/earn/launchAssets'
import { getPlanCompoundSlippageTolerance } from 'uniswap/src/features/transactions/swap/plan/slippage'
import { type BaseTradeAmounts, createCurrencyAmount } from 'uniswap/src/features/transactions/swap/types/base'
import type { ChainedActionEarnIntent } from 'uniswap/src/features/transactions/swap/types/chained'
import { areEvmAddressesEqual } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'

const SLIPPAGE_PERCENT_PRECISION = 1_000_000

export function createEarnChainedActionDisplayAmounts({
  quote,
  currencyIn,
  currencyOut,
  earnIntent,
}: {
  quote: ChainedQuoteResponse
  currencyIn: Currency
  currencyOut: Currency
  earnIntent: ChainedActionEarnIntent
}): BaseTradeAmounts | null {
  const hasEarnPreview = quote.quote.earnPreview !== undefined
  const input = getEarnChainedActionDisplayInput({
    quote,
    currencyIn,
  })
  // Earn quote output is not always the amount users see: deposits output vault shares,
  // while withdraw previews expose the underlying assets users receive.
  const output = getEarnChainedActionDisplayOutput({
    quote,
    currencyOut,
    earnIntent,
  })
  const inputAmount = createCurrencyAmount(input.currency, input.amount)
  const outputAmount = createCurrencyAmount(output.currency, output.amount)

  if (!inputAmount || !outputAmount) {
    return null
  }

  const slippageTolerance =
    getPlanCompoundSlippageTolerance(quote.quote.steps) ?? quote.quote.slippage ?? quote.quote.slippageTolerance ?? 0
  const { maxAmountIn, minAmountOut } = getEarnChainedActionSlippageAmounts({
    quote,
    currencyIn,
    inputAmount,
    outputAmount,
    slippageTolerance,
    useQuoteAmountBounds: !hasEarnPreview,
  })

  return {
    inputAmount,
    outputAmount,
    maxAmountIn,
    minAmountOut,
    executionPrice: new Price(currencyIn, output.currency, inputAmount.quotient, outputAmount.quotient),
  }
}

function getEarnChainedActionSlippageAmounts({
  inputAmount,
  outputAmount,
  slippageTolerance,
  quote,
  currencyIn,
  useQuoteAmountBounds,
}: {
  inputAmount: BaseTradeAmounts['inputAmount']
  outputAmount: BaseTradeAmounts['outputAmount']
  slippageTolerance: number
  quote: ChainedQuoteResponse
  currencyIn: Currency
  useQuoteAmountBounds: boolean
}): Pick<BaseTradeAmounts, 'maxAmountIn' | 'minAmountOut'> {
  const earnPreview = quote.quote.earnPreview
  const quoteInput = quote.quote.input
  const quoteOutput = quote.quote.output
  const quoteMaxAmountIn = createCurrencyAmount(currencyIn, quoteInput.maximumAmount)
  const quoteMinAmountOut = createCurrencyAmount(outputAmount.currency, quoteOutput.minimumAmount)

  if (useQuoteAmountBounds) {
    return {
      maxAmountIn: quoteMaxAmountIn ?? inputAmount,
      minAmountOut: quoteMinAmountOut ?? outputAmount,
    }
  }

  if (slippageTolerance <= 0 || !earnPreview) {
    return {
      maxAmountIn: inputAmount,
      minAmountOut: outputAmount,
    }
  }

  const slippagePercent = new SdkPercent(
    Math.ceil(slippageTolerance * SLIPPAGE_PERCENT_PRECISION),
    100 * SLIPPAGE_PERCENT_PRECISION,
  )

  if (earnPreview.type === 'EXACT_ASSETS_WITHDRAW') {
    return {
      maxAmountIn: inputAmount.add(inputAmount.multiply(slippagePercent)),
      minAmountOut: outputAmount,
    }
  }

  return {
    maxAmountIn: inputAmount,
    minAmountOut: outputAmount.subtract(outputAmount.multiply(slippagePercent)),
  }
}

function getEarnChainedActionDisplayInput({
  quote,
  currencyIn,
}: {
  quote: ChainedQuoteResponse
  currencyIn: Currency
}): { amount?: string; currency: Currency } {
  const earnPreview = quote.quote.earnPreview
  const quoteInput = quote.quote.input
  if (!earnPreview) {
    return { amount: quoteInput.amount, currency: currencyIn }
  }

  switch (earnPreview.type) {
    case 'DEPOSIT':
      return { amount: quoteInput.amount, currency: currencyIn }
    case 'EXACT_ASSETS_WITHDRAW':
      return { amount: earnPreview.estimatedSharesIn, currency: currencyIn }
    case 'MAX_SHARES_WITHDRAW':
      return { amount: earnPreview.maxRedeemableSharesIn, currency: currencyIn }
  }

  logger.error(new Error('Unsupported Earn preview type'), {
    tags: { file: 'chainedDisplayAmounts', function: 'getEarnChainedActionDisplayInput' },
    extra: { earnPreview },
  })
  return { amount: undefined, currency: currencyIn }
}

function getEarnChainedActionDisplayOutput({
  quote,
  currencyOut,
  earnIntent,
}: {
  quote: ChainedQuoteResponse
  currencyOut: Currency
  earnIntent: ChainedActionEarnIntent
}): { amount?: string; currency: Currency } {
  const earnPreview = quote.quote.earnPreview
  const quoteOutput = quote.quote.output
  if (!earnPreview) {
    if (earnIntent.action === TradingApi.EarnAction.DEPOSIT) {
      return { amount: undefined, currency: currencyOut }
    }
    return { amount: quoteOutput.amount, currency: currencyOut }
  }

  switch (earnPreview.type) {
    case 'DEPOSIT': {
      const depositAsset = earnPreview.depositAssets[0]
      const depositPreviewCurrency = depositAsset
        ? getEarnDepositPreviewCurrency({ depositAsset, currencyOut })
        : undefined
      if (!depositAsset || !depositPreviewCurrency) {
        return { amount: undefined, currency: currencyOut }
      }
      return {
        amount: depositAsset.amount,
        currency: depositPreviewCurrency,
      }
    }
    case 'EXACT_ASSETS_WITHDRAW':
      return {
        amount: earnPreview.requestedAssetsOut,
        currency: currencyOut,
      }
    case 'MAX_SHARES_WITHDRAW':
      return {
        amount: earnPreview.previewAssetsOut,
        currency: currencyOut,
      }
  }

  logger.error(new Error('Unsupported Earn preview type'), {
    tags: { file: 'chainedDisplayAmounts', function: 'getEarnChainedActionDisplayOutput' },
    extra: { earnPreview },
  })
  return { amount: undefined, currency: currencyOut }
}

function getEarnDepositPreviewCurrency({
  depositAsset,
  currencyOut,
}: {
  depositAsset: TradingApi.EarnPreviewDepositAsset
  currencyOut: Currency
}): Currency | undefined {
  const chainId = Number(depositAsset.chainId)
  if (!chainId || !depositAsset.token) {
    return undefined
  }

  if (
    currencyOut.isToken &&
    currencyOut.chainId === chainId &&
    areEvmAddressesEqual(currencyOut.address, depositAsset.token)
  ) {
    return currencyOut
  }

  return getEarnLaunchAssetCurrency({ chainId, tokenAddress: depositAsset.token })
}
