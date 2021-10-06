import { Currency, CurrencyAmount, TradeType } from '@uniswap/sdk-core'
import { IPoolProvider, routeAmountsToString, SwapRoute } from '@uniswap/smart-order-router'
import { GetQuoteResult, PoolInRoute } from 'state/routing/types'

// transforms a SwapRoute into a GetQuoteResult
export function processSwapRoute(
  type: 'exactIn' | 'exactOut',
  amount: CurrencyAmount<Currency>,
  poolProvider: IPoolProvider,
  {
    quote,
    quoteGasAdjusted,
    route,
    estimatedGasUsed,
    estimatedGasUsedQuoteToken,
    estimatedGasUsedUSD,
    gasPriceWei,
    methodParameters,
    blockNumber,
  }: SwapRoute<TradeType.EXACT_INPUT> | SwapRoute<TradeType.EXACT_OUTPUT>
): GetQuoteResult {
  const routeResponse: Array<PoolInRoute[]> = []

  for (const subRoute of route) {
    const {
      route: { tokenPath, pools },
      amount,
      quote,
    } = subRoute

    const curRoute: PoolInRoute[] = []
    for (let i = 0; i < pools.length; i++) {
      const nextPool = pools[i]
      const tokenIn = tokenPath[i]
      const tokenOut = tokenPath[i + 1]

      let edgeAmountIn = undefined
      if (i == 0) {
        edgeAmountIn = type === 'exactIn' ? amount.quotient.toString() : quote.quotient.toString()
      }

      let edgeAmountOut = undefined
      if (i == pools.length - 1) {
        edgeAmountOut = type === 'exactIn' ? quote.quotient.toString() : amount.quotient.toString()
      }

      curRoute.push({
        type: 'v3-pool',
        address: poolProvider.getPoolAddress(nextPool.token0, nextPool.token1, nextPool.fee).poolAddress,
        tokenIn: {
          chainId: tokenIn.chainId,
          decimals: tokenIn.decimals,
          address: tokenIn.address,
          symbol: tokenIn.symbol,
        },
        tokenOut: {
          chainId: tokenOut.chainId,
          decimals: tokenOut.decimals,
          address: tokenOut.address,
          symbol: tokenOut.symbol,
        },
        fee: nextPool.fee.toString(),
        liquidity: nextPool.liquidity.toString(),
        sqrtRatioX96: nextPool.sqrtRatioX96.toString(),
        tickCurrent: nextPool.tickCurrent.toString(),
        amountIn: edgeAmountIn,
        amountOut: edgeAmountOut,
      })
    }

    routeResponse.push(curRoute)
  }

  const result: GetQuoteResult = {
    methodParameters,
    amount: amount.quotient.toString(),
    amountDecimals: amount.toExact(),
    blockNumber: blockNumber.toString(),
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
  }

  return result
}
