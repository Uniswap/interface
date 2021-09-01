import { Currency, CurrencyAmount, Ether, Token } from '@uniswap/sdk-core'
import { FeeAmount, Pool, Route } from '@uniswap/v3-sdk'
import { useMemo } from 'react'
import { GetQuoteResult } from 'state/routing/slice'

export function useRoutes(
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
  return useMemo(() => {
    if (!quoteResult || !quoteResult.route) return undefined

    if (quoteResult.route.length === 0) return []

    const parsedCurrencyIn = currencyIn?.isNative
      ? Ether.onChain(currencyIn.chainId)
      : parseToken(quoteResult.route[0][0].tokenIn)

    const parsedCurrencyOut = currencyOut?.isNative
      ? Ether.onChain(currencyOut.chainId)
      : parseToken(quoteResult.route[0][quoteResult.route[0].length - 1].tokenOut)

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
  }, [currencyIn, currencyOut, quoteResult])
}

const parseToken = ({ address, chainId, decimals, symbol }: GetQuoteResult['route'][0][0]['tokenIn']): Currency => {
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
    parseToken(tokenIn).wrapped,
    parseToken(tokenOut).wrapped,
    parseInt(fee) as FeeAmount,
    sqrtRatioX96,
    liquidity,
    parseInt(tickCurrent)
  )
