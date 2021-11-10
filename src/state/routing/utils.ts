import { Currency, CurrencyAmount, Ether, Token } from '@uniswap/sdk-core'
import { FeeAmount, Pool, Route } from '@uniswap/v3-sdk'

import { GetQuoteResult } from './types'

/**
 * Transforms a Routing API quote into an array of routes that
 * can be used to create a V3 `Trade`.
 */
export function computeRoutes(
  currencyIn: Currency | undefined,
  currencyOut: Currency | undefined,
  quoteResult: Pick<GetQuoteResult, 'route'> | undefined
):
  | {
      route: Route<Currency, Currency>
      inputAmount: CurrencyAmount<Currency>
      outputAmount: CurrencyAmount<Currency>
    }[]
  | undefined {
  if (!quoteResult || !quoteResult.route || !currencyIn || !currencyOut) return undefined

  if (quoteResult.route.length === 0) return []

  const parsedCurrencyIn = currencyIn.isNative
    ? Ether.onChain(currencyIn.chainId)
    : parseToken(quoteResult.route[0][0].tokenIn)

  const parsedCurrencyOut = currencyOut.isNative
    ? Ether.onChain(currencyOut.chainId)
    : parseToken(quoteResult.route[0][quoteResult.route[0].length - 1].tokenOut)

  try {
    return quoteResult.route.map((route) => {
      const rawAmountIn = route[0].amountIn
      const rawAmountOut = route[route.length - 1].amountOut

      if (!rawAmountIn || !rawAmountOut) {
        throw new Error('Expected both amountIn and amountOut to be present')
      }

      return {
        route: new Route(route.map(parsePool), parsedCurrencyIn, parsedCurrencyOut),
        inputAmount: CurrencyAmount.fromRawAmount(parsedCurrencyIn, rawAmountIn),
        outputAmount: CurrencyAmount.fromRawAmount(parsedCurrencyOut, rawAmountOut),
      }
    })
  } catch (e) {
    // `Route` constructor may throw if inputs/outputs are temporarily out of sync
    // (RTK-Query always returns the latest data which may not be the right inputs/outputs)
    // This is not fatal and will fix itself in future render cycles
    return undefined
  }
}

const parseToken = ({ address, chainId, decimals, symbol }: GetQuoteResult['route'][0][0]['tokenIn']): Token => {
  return new Token(chainId, address, parseInt(decimals.toString()), symbol)
}

const parsePool = ({
  fee,
  sqrtRatioX96,
  liquidity,
  tickCurrent,
  tokenIn,
  tokenOut,
}: GetQuoteResult['route'][0][0]): Pool =>
  new Pool(
    parseToken(tokenIn),
    parseToken(tokenOut),
    parseInt(fee) as FeeAmount,
    sqrtRatioX96,
    liquidity,
    parseInt(tickCurrent)
  )
