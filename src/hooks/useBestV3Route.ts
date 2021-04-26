import { Token, Currency, CurrencyAmount, TokenAmount } from '@uniswap/sdk-core'
import { encodeRouteToPath, Route } from '@uniswap/v3-sdk'
import { useMemo } from 'react'
import { useSingleContractMultipleData } from '../state/multicall/hooks'
import { useActiveWeb3React } from './index'
import { useAllV3Routes } from './useAllV3Routes'
import { useV3Quoter } from './useContract'
import { BigNumber } from 'ethers'

/**
 * Returns the best route for a given exact input swap, and the amount received for it
 * @param amountIn the amount to swap in
 * @param currencyOut the desired output currency
 */
export function useBestV3RouteExactIn(
  amountIn?: CurrencyAmount,
  currencyOut?: Currency
): { route: Route; amountOut: CurrencyAmount } | null {
  const { chainId } = useActiveWeb3React()
  const quoter = useV3Quoter()
  const routes = useAllV3Routes(amountIn?.currency, currencyOut)
  const paths = useMemo(() => {
    if (!chainId) return []
    return routes.map((route) => encodeRouteToPath(route, false))
  }, [chainId, routes])

  const quoteExactInInputs = useMemo(() => {
    return paths.map((path) => [path, amountIn ? `0x${amountIn.raw.toString(16)}` : undefined])
  }, [amountIn, paths])

  const quotesResults = useSingleContractMultipleData(quoter, 'quoteExactInput', quoteExactInInputs)

  return useMemo(() => {
    const { bestRoute, amountOut } = quotesResults.reduce(
      (best: { bestRoute: Route | null; amountOut: BigNumber | null }, { valid, loading, result }, i) => {
        if (loading || !valid || !result) return best

        if (best.amountOut === null) {
          return {
            bestRoute: routes[i],
            amountOut: result.amountOut,
          }
        } else if (best.amountOut.lt(result.amountOut)) {
          return {
            bestRoute: routes[i],
            amountOut: result.amountOut,
          }
        }

        return best
      },
      {
        bestRoute: null,
        amountOut: null,
      }
    )
    if (!bestRoute || !amountOut) return null
    return {
      route: bestRoute,
      amountOut:
        currencyOut instanceof Token
          ? new TokenAmount(currencyOut, amountOut.toString())
          : CurrencyAmount.ether(amountOut.toString()),
    }
  }, [currencyOut, quotesResults, routes])
}

/**
 * Returns the best route for a given exact output swap, and the amount required for it
 * @param currencyIn the current to swap in
 * @param amountOut the desired amount out
 */
export function useBestV3RouteExactOut(
  currencyIn?: Currency,
  amountOut?: CurrencyAmount
): { route: Route; amountIn: CurrencyAmount } | null {
  const { chainId } = useActiveWeb3React()
  const quoter = useV3Quoter()
  const routes = useAllV3Routes(currencyIn, amountOut?.currency)

  const paths = useMemo(() => {
    if (!chainId) return []
    return routes.map((route) => encodeRouteToPath(route, true))
  }, [chainId, routes])

  const quoteExactOutInputs = useMemo(() => {
    const amountOutEncoded = amountOut ? `0x${amountOut.raw.toString(16)}` : undefined
    return paths.map((path) => [path, amountOutEncoded])
  }, [amountOut, paths])

  const quotesResults = useSingleContractMultipleData(quoter, 'quoteExactInput', quoteExactOutInputs)

  return useMemo(() => {
    const { bestRoute, amountIn } = quotesResults.reduce(
      (best: { bestRoute: Route | null; amountIn: BigNumber | null }, { valid, loading, result }, i) => {
        if (loading || !valid || !result) return best

        if (best.amountIn === null) {
          return {
            bestRoute: routes[i],
            amountIn: result.amountIn,
          }
        } else if (best.amountIn.gt(result.amountIn)) {
          return {
            bestRoute: routes[i],
            amountIn: result.amountIn,
          }
        }

        return best
      },
      {
        bestRoute: null,
        amountIn: null,
      }
    )
    if (!bestRoute || !amountIn) return null
    return {
      route: bestRoute,
      amountIn:
        currencyIn instanceof Token
          ? new TokenAmount(currencyIn, amountIn.toString())
          : CurrencyAmount.ether(amountIn.toString()),
    }
  }, [currencyIn, quotesResults, routes])
}
