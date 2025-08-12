import { ZERO_PERCENT } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Percent, Price, TradeType } from '@uniswap/sdk-core'
import { BIPS_BASE } from 'uniswap/src/constants/misc'
import { JupiterOrderResponse } from 'uniswap/src/data/apiClients/jupiterApi/order/types'
import { Routing } from 'uniswap/src/data/tradingApi/__generated__/models/Routing'
import { SwapFee } from 'uniswap/src/features/transactions/swap/types/trade'

export interface SolanaTrade {
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
  executionPrice: Price<Currency, Currency>
  quote: { routing: Routing.JUPITER, quote: JupiterOrderResponse, requestId: string, permitData: null }
  tradeType: TradeType
  routing: Routing.JUPITER
  readonly indicative: boolean
  readonly swapFee?: SwapFee
  readonly inputTax: typeof ZERO_PERCENT
  readonly outputTax: typeof ZERO_PERCENT
  readonly slippageTolerance: number
  readonly priceImpact: undefined
  readonly deadline: undefined
  readonly minAmountOut: CurrencyAmount<Currency>
  readonly maxAmountIn: CurrencyAmount<Currency>
  get quoteOutputAmount(): CurrencyAmount<Currency>
  get quoteOutputAmountUserWillReceive(): CurrencyAmount<Currency>
}

function getQuoteCurrencyAmounts({ quote, inputToken, outputToken }: { quote: JupiterOrderResponse, inputToken: Currency, outputToken: Currency }): {
  inputAmount: CurrencyAmount<Currency>
  outputAmount: CurrencyAmount<Currency>
  minAmountOut: CurrencyAmount<Currency>
  maxAmountIn: CurrencyAmount<Currency>
} {
  const inputAmount = CurrencyAmount.fromRawAmount(inputToken, quote.inAmount)
  const outputAmount = CurrencyAmount.fromRawAmount(outputToken, quote.outAmount)

  if (quote.swapMode === 'ExactIn') {
    const maxAmountIn = inputAmount
    const minAmountOut = CurrencyAmount.fromRawAmount(outputToken, quote.otherAmountThreshold)

    return { inputAmount, outputAmount, minAmountOut, maxAmountIn }
  } else {
    const maxAmountIn = CurrencyAmount.fromRawAmount(inputToken, quote.otherAmountThreshold)
    const minAmountOut = outputAmount

    return { inputAmount, outputAmount, minAmountOut, maxAmountIn }
  }
}


export function createSolanaTrade({ quote, inputToken, outputToken }: { quote: JupiterOrderResponse, inputToken: Currency, outputToken: Currency }): SolanaTrade {
  const { inputAmount, outputAmount, minAmountOut, maxAmountIn } = getQuoteCurrencyAmounts({ quote, inputToken, outputToken })

  const executionPrice = new Price(inputToken, outputToken, inputAmount.quotient, outputAmount.quotient)

  const isExactIn = quote.swapMode === 'ExactIn'

  return {
    inputAmount,
    outputAmount,
    executionPrice,
    quote: { routing: Routing.JUPITER, quote, requestId: quote.requestId, permitData: null },
    tradeType: isExactIn ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
    routing: Routing.JUPITER,
    indicative: false,
    swapFee: {
      recipient: '',
      percent: new Percent(quote.platformFee?.feeBps ?? 0, BIPS_BASE),
      amount: quote.platformFee?.amount ?? '0',
    },
    inputTax: ZERO_PERCENT,
    outputTax: ZERO_PERCENT,
    slippageTolerance: quote.slippageBps / 100,
    priceImpact: undefined,
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
  }
}
