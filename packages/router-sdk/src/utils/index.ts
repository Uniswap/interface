import { Currency, Token } from '@ubeswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { Pool } from '@uniswap/v3-sdk'
import { MixedRouteSDK } from '../entities/mixedRoute/route'

/**
 * Utility function to return each consecutive section of Pools or Pairs in a MixedRoute
 * @param route
 * @returns a nested array of Pools or Pairs in the order of the route
 */
export const partitionMixedRouteByProtocol = (route: MixedRouteSDK<Currency, Currency>): (Pool | Pair)[][] => {
  const acc: any[] = []

  let left = 0
  let right = 0
  while (right < route.pools.length) {
    if (
      (route.pools[left] instanceof Pool && route.pools[right] instanceof Pair) ||
      (route.pools[left] instanceof Pair && route.pools[right] instanceof Pool)
    ) {
      acc.push(route.pools.slice(left, right))
      left = right
    }
    // seek forward with right pointer
    right++
    if (right === route.pools.length) {
      /// we reached the end, take the rest
      acc.push(route.pools.slice(left, right))
    }
  }
  return acc
}

/**
 * Simple utility function to get the output of an array of Pools or Pairs
 * @param pools
 * @param firstInputToken
 * @returns the output token of the last pool in the array
 */
export const getOutputOfPools = (pools: (Pool | Pair)[], firstInputToken: Token): Token => {
  const { inputToken: outputToken } = pools.reduce(
    ({ inputToken }, pool: Pool | Pair): { inputToken: Token } => {
      if (!pool.involvesToken(inputToken)) throw new Error('PATH')
      const outputToken: Token = pool.token0.equals(inputToken) ? pool.token1 : pool.token0
      return {
        inputToken: outputToken,
      }
    },
    { inputToken: firstInputToken }
  )
  return outputToken
}
