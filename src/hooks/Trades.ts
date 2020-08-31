import { Currency, CurrencyAmount, Pair, Token, Trade, ChainId } from '@uniswap/sdk'
import flatMap from 'lodash.flatmap'
import { useMemo } from 'react'

import { BASES_TO_CHECK_TRADES_AGAINST, CUSTOM_BASES } from '../constants'
import { PairState, usePairs } from '../data/Reserves'
import { wrappedCurrency } from '../utils/wrappedCurrency'

import { useActiveWeb3React } from './index'

export function generateAllRoutePairs(tokenA?: Token, tokenB?: Token, chainId?: ChainId): [Token, Token][] {
  const bases: Token[] = chainId ? BASES_TO_CHECK_TRADES_AGAINST[chainId] : []
  const customBases = chainId !== undefined ? CUSTOM_BASES[chainId] : undefined
  const customBasesA = customBases && tokenA ? customBases[tokenA.address] ?? [] : []
  const customBasesB = customBases && tokenB ? customBases[tokenB.address] ?? [] : []

  const allBases = [...bases, ...customBasesA, ...customBasesB].filter(
    (base, i, allBases) => allBases.findIndex(allBases => allBases.equals(base)) === i
  )

  const basePairs: [Token, Token][] = flatMap(allBases, (base): [Token, Token][] =>
    allBases.map(otherBase => [base, otherBase])
  ).filter(([t0, t1]) => t0.address !== t1.address)

  return [
    // the direct pair
    [tokenA, tokenB],
    // token A against all bases
    ...allBases.map((base): [Token | undefined, Token] => [tokenA, base]),
    // token B against all bases
    ...allBases.map((base): [Token | undefined, Token] => [tokenB, base]),
    // each base against all bases
    ...basePairs
  ]
    .filter((tokens): tokens is [Token, Token] => Boolean(tokens[0] && tokens[1]))
    .filter(([t0, t1]) => t0.address !== t1.address)
    .filter(([tokenA, tokenB]) => {
      if (!chainId) return true
      const restrictedBases = CUSTOM_BASES[chainId]
      if (!restrictedBases) return true

      const restrictedBasesA: Token[] | undefined = restrictedBases[tokenA.address]
      const restrictedBasesB: Token[] | undefined = restrictedBases[tokenB.address]

      if (!restrictedBasesA && !restrictedBasesB) return true

      if (restrictedBasesA && restrictedBasesA.find(base => tokenB.equals(base))) return false
      if (restrictedBasesB && restrictedBasesB.find(base => tokenA.equals(base))) return false

      return true
    })
}

function useAllCommonPairs(currencyA?: Currency, currencyB?: Currency): Pair[] {
  const { chainId } = useActiveWeb3React()

  const [tokenA, tokenB] = chainId
    ? [wrappedCurrency(currencyA, chainId), wrappedCurrency(currencyB, chainId)]
    : [undefined, undefined]

  const allPairCombinations: [Token, Token][] = useMemo(() => generateAllRoutePairs(tokenA, tokenB, chainId), [
    tokenA,
    tokenB,
    chainId
  ])

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
