import { useMemo } from 'react'
import { Token, TokenAmount, Trade, Pair } from '@uniswap/sdk'
import flatMap from 'lodash.flatmap'

import { useActiveWeb3React } from './index'
import { usePairs } from '../data/Reserves'

import { BASES_TO_CHECK_TRADES_AGAINST } from '../constants'

function useAllCommonPairs(tokenA?: Token, tokenB?: Token): Pair[] {
  const { chainId } = useActiveWeb3React()

  const bases: Token[] = chainId ? BASES_TO_CHECK_TRADES_AGAINST[chainId] : []

  const allPairCombinations: [Token | undefined, Token | undefined][] = useMemo(
    () => [
      // the direct pair
      [tokenA, tokenB],
      // token A against all bases
      ...bases.map((base): [Token | undefined, Token | undefined] => [tokenA, base]),
      // token B against all bases
      ...bases.map((base): [Token | undefined, Token | undefined] => [tokenB, base]),
      // each base against all bases
      ...flatMap(bases, (base): [Token, Token][] => bases.map(otherBase => [base, otherBase]))
    ],
    [tokenA, tokenB, bases]
  )

  const allPairs = usePairs(allPairCombinations)

  // only pass along valid pairs, non-duplicated pairs
  return useMemo(
    () =>
      Object.values(
        allPairs
          // filter out invalid pairs
          .filter((p): p is Pair => !!p)
          // filter out duplicated pairs
          .reduce<{ [pairAddress: string]: Pair }>((memo, curr) => {
            memo[curr.liquidityToken.address] = memo[curr.liquidityToken.address] ?? curr
            return memo
          }, {})
      ),
    [allPairs]
  )
}

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
export function useTradeExactIn(amountIn?: TokenAmount, tokenOut?: Token): Trade | null {
  const inputToken = amountIn?.token
  const outputToken = tokenOut

  const allowedPairs = useAllCommonPairs(inputToken, outputToken)

  return useMemo(() => {
    if (amountIn && tokenOut && allowedPairs.length > 0) {
      return Trade.bestTradeExactIn(allowedPairs, amountIn, tokenOut, { maxHops: 2, maxNumResults: 1 })[0] ?? null
    }
    return null
  }, [allowedPairs, amountIn, tokenOut])
}

/**
 * Returns the best trade for the token in to the exact amount of token out
 */
export function useTradeExactOut(tokenIn?: Token, amountOut?: TokenAmount): Trade | null {
  const inputToken = tokenIn
  const outputToken = amountOut?.token

  const allowedPairs = useAllCommonPairs(inputToken, outputToken)

  return useMemo(() => {
    if (tokenIn && amountOut && allowedPairs.length > 0) {
      return Trade.bestTradeExactOut(allowedPairs, tokenIn, amountOut, { maxHops: 2, maxNumResults: 1 })[0] ?? null
    }
    return null
  }, [allowedPairs, tokenIn, amountOut])
}
