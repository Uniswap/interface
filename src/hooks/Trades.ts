import { Currency, CurrencyAmount, Pair, Token, Trade } from '@uniswap/sdk'
import flatMap from 'lodash.flatmap'
import { useMemo } from 'react'

import { BASES_TO_CHECK_TRADES_AGAINST } from '../constants'
import { PairState, usePairs } from '../data/Reserves'
import { wrappedCurrency } from '../utils/wrappedCurrency'

import { useActiveWeb3React } from './index'

function useAllCommonPairs(currencyA?: Currency, currencyB?: Currency): Pair[] {
  const { chainId } = useActiveWeb3React()

  const bases: Token[] = chainId ? BASES_TO_CHECK_TRADES_AGAINST[chainId] : []

  const [tokenA, tokenB] = chainId
    ? [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]
    : [undefined, undefined]

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
          .filter((result): result is [PairState.EXISTS, Pair] => Boolean(result[0] === PairState.EXISTS && result[1]))
          // filter out duplicated pairs
          .reduce<{ [pairAddress: string]: Pair }>((memo, [, curr]) => {
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
export function useTradeExactIn(currencyAmountIn?: CurrencyAmount, currencyOut?: Currency): Trade | null {
  const allowedPairs = useAllCommonPairs(currencyAmountIn?.currency, currencyOut)

  return useMemo(() => {
    if (currencyAmountIn && currencyOut && allowedPairs.length > 0) {
      return (
        Trade.bestTradeExactIn(allowedPairs, currencyAmountIn, currencyOut, { maxHops: 3, maxNumResults: 1 })[0] ?? null
      )
    }
    return null
  }, [allowedPairs, currencyAmountIn, currencyOut])
}

/**
 * Returns the best trade for the token in to the exact amount of token out
 */
export function useTradeExactOut(currencyIn?: Currency, currencyAmountOut?: CurrencyAmount): Trade | null {
  const allowedPairs = useAllCommonPairs(currencyIn, currencyAmountOut?.currency)

  return useMemo(() => {
    if (currencyIn && currencyAmountOut && allowedPairs.length > 0) {
      return (
        Trade.bestTradeExactOut(allowedPairs, currencyIn, currencyAmountOut, { maxHops: 3, maxNumResults: 1 })[0] ??
        null
      )
    }
    return null
  }, [allowedPairs, currencyIn, currencyAmountOut])
}
