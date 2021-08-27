import { Currency, CurrencyAmount, Token, Ether } from '@uniswap/sdk-core'
import { FeeAmount, Pool, Route } from '@uniswap/v3-sdk'
import { SupportedChainId } from 'constants/chains'
import { useMemo } from 'react'
import { GetQuoteResult } from 'state/routing/slice'

export function useRoutes(quoteResult: Pick<GetQuoteResult, 'route'> | undefined):
  | {
      route: Route<Currency, Currency>
      inputAmount: CurrencyAmount<Currency>
      outputAmount: CurrencyAmount<Currency>
    }[]
  | undefined {
  return useMemo(() => {
    return (
      quoteResult &&
      quoteResult['route'].map((route) => {
        const rawAmountIn = route[0].amountIn
        const rawAmountOut = route[route.length - 1].amountOut

        if (!rawAmountIn || !rawAmountOut) {
          throw new Error('Expected both amountIn and amountOut to be present')
        }

        // extract currency[In|Out] from route[first|last]
        const [currencyIn, currencyOut] = [parseToken(route[0].tokenIn), parseToken(route[route.length - 1].tokenOut)]

        return {
          route: new Route(route.map(parsePool), currencyIn, currencyOut),
          inputAmount: CurrencyAmount.fromRawAmount(currencyIn, rawAmountIn),
          outputAmount: CurrencyAmount.fromRawAmount(currencyOut, rawAmountOut),
        }
      })
    )
  }, [quoteResult])
}

const parseToken = ({ address, chainId, decimals, symbol }: GetQuoteResult['route'][0][0]['tokenIn']): Currency => {
  // TODO(judo): fails when input/output is WETH
  // return address === Ether.onChain(chainId).wrapped.address
  //   ? Ether.onChain(SupportedChainId.MAINNET)
  //   :
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
