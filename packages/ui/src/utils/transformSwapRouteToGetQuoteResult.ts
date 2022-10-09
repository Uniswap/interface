import { Protocol, ZERO } from '@teleswap/router-sdk'
import { Fraction, Percent } from '@teleswap/sdk'
import { routeAmountsToString, SwapOptions, SwapRoute, V2RouteWithValidQuote } from '@teleswap/smart-order-router'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import { Pool } from '@uniswap/v3-sdk'
import JSBI from 'jsbi'
import { GetQuoteResult, V2PoolInRoute, V3PoolInRoute } from 'state/routing/types'

import { Field } from '../state/swap/actions'
import { computeSlippageAdjustedAmountsByRoute, computeTradePriceBreakdownByRoute } from './prices'

// from routing-api (https://github.com/Uniswap/routing-api/blob/main/lib/handlers/quote/quote.ts#L243-L311)
export function transformSwapRouteToGetQuoteResult(
  type: 'exactIn' | 'exactOut',
  amount: CurrencyAmount<Currency>,
  {
    quote,
    quoteGasAdjusted,
    route,
    estimatedGasUsed,
    estimatedGasUsedQuoteToken,
    estimatedGasUsedUSD,
    gasPriceWei,
    methodParameters,
    blockNumber
  }: SwapRoute,
  swapConfig: SwapOptions
): GetQuoteResult {
  const routeResponse: Array<(V3PoolInRoute | V2PoolInRoute)[]> = []

  let _realizedLPFee = JSBI.BigInt(0)
  let _priceImpactWithoutFee: Percent = new Fraction(ZERO)

  const percents: number[] = []

  let maxInput = JSBI.BigInt(0)
  let minOut = JSBI.BigInt(0)

  for (const subRoute of route) {
    const { amount, quote, tokenPath, percent } = subRoute
    percents.push(percent)

    const slippageAdjustedAmounts = computeSlippageAdjustedAmountsByRoute(
      subRoute as V2RouteWithValidQuote,
      new Percent(swapConfig.slippageTolerance.numerator, JSBI.BigInt(10000))
    )

    maxInput = JSBI.add(maxInput, JSBI.BigInt(slippageAdjustedAmounts[Field.INPUT]))
    minOut = JSBI.add(minOut, JSBI.BigInt(slippageAdjustedAmounts[Field.OUTPUT]))

    // subRoute.percent, subRoute.tokenPath
    const { priceImpactWithoutFee, realizedLPFee } = computeTradePriceBreakdownByRoute(
      subRoute as V2RouteWithValidQuote
    )
    _priceImpactWithoutFee = _priceImpactWithoutFee.add(
      priceImpactWithoutFee.multiply(subRoute.percent.toString()).divide(JSBI.BigInt(100))
    )
    _realizedLPFee = JSBI.add(_realizedLPFee, realizedLPFee)
    const pools = subRoute.protocol === Protocol.V2 ? subRoute.route.pairs : subRoute.route.pools
    const curRoute: (V3PoolInRoute | V2PoolInRoute)[] = []
    for (let i = 0; i < pools.length; i++) {
      const nextPool = pools[i]
      const tokenIn = tokenPath[i]
      const tokenOut = tokenPath[i + 1]

      let edgeAmountIn = ''
      if (i === 0) {
        edgeAmountIn = type === 'exactIn' ? amount.quotient.toString() : quote.quotient.toString()
      }

      let edgeAmountOut = ''
      if (i === pools.length - 1) {
        edgeAmountOut = type === 'exactIn' ? quote.quotient.toString() : amount.quotient.toString()
      }

      if (nextPool instanceof Pool) {
        curRoute.push({
          type: 'v3-pool',
          tokenIn: {
            chainId: tokenIn.chainId,
            decimals: tokenIn.decimals,
            address: tokenIn.address,
            symbol: tokenIn.symbol
          },
          tokenOut: {
            chainId: tokenOut.chainId,
            decimals: tokenOut.decimals,
            address: tokenOut.address,
            symbol: tokenOut.symbol
          },
          fee: nextPool.fee.toString(),
          liquidity: nextPool.liquidity.toString(),
          sqrtRatioX96: nextPool.sqrtRatioX96.toString(),
          tickCurrent: nextPool.tickCurrent.toString(),
          amountIn: edgeAmountIn! ?? undefined,
          amountOut: edgeAmountOut! ?? undefined
        })
      } else {
        const reserve0 = nextPool.reserve0
        const reserve1 = nextPool.reserve1

        curRoute.push({
          type: 'v2-pool',
          tokenIn: {
            chainId: tokenIn.chainId,
            decimals: tokenIn.decimals,
            address: tokenIn.address,
            symbol: tokenIn.symbol
          },
          tokenOut: {
            chainId: tokenOut.chainId,
            decimals: tokenOut.decimals,
            address: tokenOut.address,
            symbol: tokenOut.symbol
          },
          reserve0: {
            token: {
              chainId: reserve0.currency.wrapped.chainId,
              decimals: reserve0.currency.wrapped.decimals,
              address: reserve0.currency.wrapped.address,
              symbol: reserve0.currency.wrapped.symbol
            },
            quotient: reserve0.quotient.toString()
          },
          reserve1: {
            token: {
              chainId: reserve1.currency.wrapped.chainId,
              decimals: reserve1.currency.wrapped.decimals,
              address: reserve1.currency.wrapped.address,
              symbol: reserve1.currency.wrapped.symbol
            },
            quotient: reserve1.quotient.toString()
          },
          amountIn: edgeAmountIn! ?? undefined,
          amountOut: edgeAmountOut! ?? undefined
        })
      }
    }

    routeResponse.push(curRoute)
  }

  const result: GetQuoteResult = {
    methodParameters,
    blockNumber: blockNumber.toString(),
    amount: amount.quotient.toString(),
    amountDecimals: amount.toExact(),
    quote: quote.quotient.toString(),
    quoteDecimals: quote.toExact(),
    quoteGasAdjusted: quoteGasAdjusted.quotient.toString(),
    quoteGasAdjustedDecimals: quoteGasAdjusted.toExact(),
    gasUseEstimateQuote: estimatedGasUsedQuoteToken.quotient.toString(),
    gasUseEstimateQuoteDecimals: estimatedGasUsedQuoteToken.toExact(),
    gasUseEstimate: estimatedGasUsed.toString(),
    gasUseEstimateUSD: estimatedGasUsedUSD.toExact(),
    gasPriceWei: gasPriceWei.toString(),
    route: routeResponse,
    routeString: routeAmountsToString(route),
    priceImpactWithoutFee: _priceImpactWithoutFee.toSignificant(4).toString(),
    realizedLPFee: _realizedLPFee.toString(),
    maxIn: new Fraction(maxInput, amount.denominator).toSignificant(4),
    minOut: new Fraction(minOut, quote.denominator).toSignificant(4),
    percents
  }

  return result
}
