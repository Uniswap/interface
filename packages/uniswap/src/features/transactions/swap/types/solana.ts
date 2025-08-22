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
  minimumAmountOut(slippageTolerance: Percent): CurrencyAmount<Currency>
  maximumAmountIn(slippageTolerance: Percent): CurrencyAmount<Currency>
  get quoteOutputAmount(): CurrencyAmount<Currency>
  get quoteOutputAmountUserWillReceive(): CurrencyAmount<Currency>
  worstExecutionPrice(threshold: Percent): Price<Currency, Currency>
}


export function createSolanaTrade({ quote, inputToken, outputToken }: { quote: JupiterOrderResponse, inputToken: Currency, outputToken: Currency }): SolanaTrade {
  const inputAmount = CurrencyAmount.fromRawAmount(inputToken, quote.inAmount)
  const outputAmount = CurrencyAmount.fromRawAmount(outputToken, quote.outAmount)

  const executionPrice = new Price(
    inputToken,
    outputToken,
    inputAmount.quotient,
    outputAmount.quotient
  )

  return {
    inputAmount,
    outputAmount,
    executionPrice,
    quote: { routing: Routing.JUPITER, quote, requestId: quote.requestId, permitData: null },
    tradeType: quote.swapMode === 'ExactIn' ? TradeType.EXACT_INPUT : TradeType.EXACT_OUTPUT,
    routing: Routing.JUPITER,
    indicative: false,
    swapFee: {
      recipient: '',
      percent: new Percent(quote.platformFee?.feeBps ?? 0, BIPS_BASE),
      amount: quote.platformFee?.amount ?? '0',
    },
    inputTax: ZERO_PERCENT,
    outputTax: ZERO_PERCENT,
    slippageTolerance: quote.slippageBps / 10000,
    priceImpact: undefined,
    deadline: undefined,
    minimumAmountOut: (_slippageTolerance: Percent): CurrencyAmount<Currency> => {
      return inputAmount
    },
    maximumAmountIn: (_slippageTolerance: Percent): CurrencyAmount<Currency> => {
      return outputAmount
    },
    worstExecutionPrice: (_threshold: Percent): Price<Currency, Currency> => {
      // TODO(SWAP-155): Implement worstExecutionPrice
      return executionPrice
    },
    get quoteOutputAmount(): CurrencyAmount<Currency> {
      // TODO(SWAP-156): Determine logic for quoteOutputAmount vs quoteOutputAmountUserWillReceive, if any
      return outputAmount
    },
    get quoteOutputAmountUserWillReceive(): CurrencyAmount<Currency> {
      return outputAmount
    },
  }
}
