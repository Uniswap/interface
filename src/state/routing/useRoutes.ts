import { Currency, CurrencyAmount, Token } from '@uniswap/sdk-core'
import { FeeAmount, Pool, Route } from '@uniswap/v3-sdk'
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

        const pools = route.map(parsePool)
        const [currencyIn, currencyOut] = [pools[0].token0, pools[pools.length - 1].token1]

        return {
          route: new Route(pools, currencyIn, currencyOut),
          inputAmount: CurrencyAmount.fromRawAmount(currencyIn, rawAmountIn),
          outputAmount: CurrencyAmount.fromRawAmount(currencyOut, rawAmountOut),
        }
      })
    )
  }, [quoteResult])
}

const parsePool = ({
  fee,
  sqrtRatioX96,
  liquidity,
  tickCurrent,
  tokenIn: { address: addressA, chainId: chainIdA, decimals: decimalsA, symbol: symbolA },
  tokenOut: { address: addressB, chainId: chainIdB, decimals: decimalsB, symbol: symbolB },
}: GetQuoteResult['route'][0][0]): Pool =>
  new Pool(
    new Token(chainIdA, addressA, parseInt(decimalsA.toString()), symbolA),
    new Token(chainIdB, addressB, parseInt(decimalsB.toString()), symbolB),
    parseInt(fee) as FeeAmount,
    sqrtRatioX96,
    liquidity,
    parseInt(tickCurrent)
  )
