import { Token, ChainId, Currency, CurrencyAmount, TokenAmount } from '@uniswap/sdk-core'
import { Route } from '@uniswap/v3-sdk'
import { Pool } from '@uniswap/v3-sdk/dist/'
import { useMemo } from 'react'
import { useSingleContractMultipleData } from '../state/multicall/hooks'
import { wrappedCurrency } from '../utils/wrappedCurrency'
import { useActiveWeb3React } from './index'
import { useAllV3Routes } from './useAllV3Routes'
import { useV3Quoter } from './useContract'
import { BigNumber, utils } from 'ethers'

/**
 * Converts a route to a path
 * @param route the v3 path to convert to an encoded path
 * @param chainId the current chain ID, used to wrap the route's input currency
 */
function routeToPath(route: Route, chainId: ChainId): string {
  const firstInputToken = wrappedCurrency(route.input, chainId)

  if (!firstInputToken) throw new Error('Could not wrap input currency')

  return route.pools.reduce(
    (
      { inputToken, path }: { inputToken: Token; path: string },
      pool: Pool,
      index
    ): { inputToken: Token; path: string } => {
      const outputToken: Token = pool.token0.equals(inputToken) ? pool.token1 : pool.token0
      if (index === 0) {
        return {
          inputToken: outputToken,
          path: utils.solidityPack(
            ['address', 'uint24', 'address'],
            [inputToken.address, pool.fee, outputToken.address]
          ),
        }
      } else {
        return {
          inputToken: outputToken,
          path: `${path}${utils.solidityPack(['uint24', 'address'], [pool.fee, outputToken.address]).slice(2)}`,
        }
      }
    },
    { inputToken: firstInputToken, path: '' }
  ).path
}

export function useBestV3RouteExactIn(
  amountIn?: CurrencyAmount,
  currencyOut?: Currency
): { route: Route; amountOut: CurrencyAmount } | null {
  const { chainId } = useActiveWeb3React()
  const quoter = useV3Quoter()
  const routes = useAllV3Routes(amountIn?.currency, currencyOut)
  const paths = useMemo(() => {
    if (!chainId) return []
    return routes.map((route) => routeToPath(route, chainId))
  }, [chainId, routes])

  const quoteInputs = useMemo(() => {
    return paths.map((path) => [path, amountIn ? `0x${amountIn.raw.toString(16)}` : undefined])
  }, [amountIn, paths])

  const quotesResults = useSingleContractMultipleData(quoter, 'quoteExactInput', quoteInputs)

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
