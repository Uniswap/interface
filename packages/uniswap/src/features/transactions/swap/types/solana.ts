import { ZERO_PERCENT } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Percent, Price, TradeType } from '@uniswap/sdk-core'
import { JupiterOrderResponse, TradingApi } from '@universe/api'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import { BlockingTradeError } from 'uniswap/src/features/transactions/swap/types/BlockingTradeError'
import { SwapFee } from 'uniswap/src/features/transactions/swap/types/trade'
import { CurrencyField } from 'uniswap/src/types/currency'

export interface SolanaTrade {
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
  executionPrice: Price<Currency, Currency>
  quote: { routing: TradingApi.Routing.JUPITER; quote: JupiterOrderResponse; requestId: string; permitData: null }
  tradeType: TradeType
  routing: TradingApi.Routing.JUPITER
  readonly indicative: boolean
  readonly swapFee?: SwapFee
  readonly inputTax: typeof ZERO_PERCENT
  readonly outputTax: typeof ZERO_PERCENT
  readonly slippageTolerance: number
  readonly priceImpact?: Percent
  readonly deadline: undefined
  readonly minAmountOut: CurrencyAmount<Currency>
  readonly maxAmountIn: CurrencyAmount<Currency>
  get quoteOutputAmount(): CurrencyAmount<Currency>
  get quoteOutputAmountUserWillReceive(): CurrencyAmount<Currency>
  readonly blockingError?: BlockingTradeError
}

function calculateFeeAmounts({
  quote,
  inputToken,
  outputToken,
}: {
  quote: JupiterOrderResponse
  inputToken: Currency
  outputToken: Currency
}): {
  feeAmount: CurrencyAmount<Currency>
  feeAmountRaw: string
  feeField: CurrencyField
  feePercent: Percent
  isFeeOnOutput: boolean
} {
  const { platformFee, feeMint } = quote
  const feeBps = platformFee?.feeBps ?? 0

  const isFeeOnOutput = feeMint === quote.outputMint

  const { feeCurrency, correspondingTradeAmount } = isFeeOnOutput
    ? { feeCurrency: outputToken, correspondingTradeAmount: quote.outAmount }
    : { feeCurrency: inputToken, correspondingTradeAmount: quote.inAmount }

  const feeAmountRaw = Math.round(Number(correspondingTradeAmount) * (feeBps / BIPS_BASE)).toString()
  const feeAmount = CurrencyAmount.fromRawAmount(feeCurrency, feeAmountRaw)

  const feePercent = new Percent(feeBps, BIPS_BASE)
  const feeField = isFeeOnOutput ? CurrencyField.OUTPUT : CurrencyField.INPUT

  return { feeAmount, feeAmountRaw, feeField, feePercent, isFeeOnOutput }
}

function getQuoteCurrencyAmounts(params: {
  quote: JupiterOrderResponse
  inputToken: Currency
  outputToken: Currency
}): {
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
  minAmountOut: CurrencyAmount<Currency>
  maxAmountIn: CurrencyAmount<Currency>
  swapFee: SwapFee | undefined
} {
  const { quote, inputToken, outputToken } = params

  const inputAmount = CurrencyAmount.fromRawAmount(inputToken, quote.inAmount)
  let outputAmount = CurrencyAmount.fromRawAmount(outputToken, quote.outAmount)

  // Default max/min amounts -- one is overridden below based on exact field
  let maxAmountIn = inputAmount
  let minAmountOut = outputAmount

  if (quote.swapMode === 'ExactIn') {
    minAmountOut = CurrencyAmount.fromRawAmount(outputToken, quote.otherAmountThreshold)
  } else {
    maxAmountIn = CurrencyAmount.fromRawAmount(inputToken, quote.otherAmountThreshold)
  }

  const { feeAmount, feeAmountRaw, feeField, feePercent, isFeeOnOutput } = calculateFeeAmounts(params)

  // Adjust output amounts based if fee is taken from output. For feeOnInput, input amounts already include fee.
  if (isFeeOnOutput) {
    outputAmount = outputAmount.subtract(feeAmount)
    minAmountOut = minAmountOut.subtract(feeAmount)
  }

  const swapFee = quote.feeBps ? { percent: feePercent, amount: feeAmountRaw, feeField } : undefined

  return { inputAmount, outputAmount, minAmountOut, maxAmountIn, swapFee }
}

// Relatively arbitrary; higher number is more precise
const JUP_PRICE_IMPACT_MULTIPLICATION_BASE = 1000000

function getPriceImpactPercent(quote: JupiterOrderResponse): Percent | undefined {
  if (!quote.priceImpactPct) {
    return undefined
  }

  return new Percent(
    Math.round(parseFloat(quote.priceImpactPct) * -JUP_PRICE_IMPACT_MULTIPLICATION_BASE),
    JUP_PRICE_IMPACT_MULTIPLICATION_BASE,
  )
}

function getBlockingError(quote: JupiterOrderResponse): Error | undefined {
  const txMissing = !quote.transaction || quote.transaction === ''
  const txExpectedAndMissing = quote.taker && txMissing

  const message = quote.errorMessage ?? (txExpectedAndMissing ? 'Transaction missing' : undefined)

  if (message?.includes('Insufficient funds')) {
    // UI Gracefully handles insufficient funds errors; do not return blocking error
    return undefined
  }

  if (txExpectedAndMissing) {
    return new BlockingTradeError({ message, code: quote.errorCode ?? undefined })
  }
  return undefined
}

export function createSolanaTrade({
  quote,
  inputToken,
  outputToken,
}: {
  quote: JupiterOrderResponse
  inputToken: Currency
  outputToken: Currency
}): SolanaTrade {
  const { inputAmount, outputAmount, minAmountOut, maxAmountIn, swapFee } = getQuoteCurrencyAmounts({
    quote,
    inputToken,
    outputToken,
  })

  const executionPrice = new Price(inputToken, outputToken, inputAmount.quotient, outputAmount.quotient)

  const isExactIn = quote.swapMode === 'ExactIn'

  return {
    inputAmount,
    outputAmount,
    executionPrice,
    quote: { routing: TradingApi.Routing.JUPITER, quote, requestId: quote.requestId, permitData: null },
    tradeType: isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
    routing: TradingApi.Routing.JUPITER,
    indicative: false,
    swapFee,
    inputTax: ZERO_PERCENT,
    outputTax: ZERO_PERCENT,
    slippageTolerance: quote.slippageBps / 100,
    priceImpact: getPriceImpactPercent(quote),
    deadline: undefined,
    minAmountOut,
    maxAmountIn,
    get quoteOutputAmount(): CurrencyAmount<Currency> {
      // TODO(SWAP-156): Determine logic for quoteOutputAmount vs quoteOutputAmountUserWillReceive, if any
      return outputAmount
    },
    get quoteOutputAmountUserWillReceive(): CurrencyAmount<Currency> {
      return outputAmount
    },
    blockingError: getBlockingError(quote),
  }
}
