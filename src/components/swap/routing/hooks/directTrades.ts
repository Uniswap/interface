import { Pair, Token, TokenAmount, Trade } from '@ubeswap/sdk'
import { useActiveWeb3React } from 'hooks'
import flatMap from 'lodash.flatmap'
import { useMemo } from 'react'
import { useUserSingleHopOnly } from 'state/user/hooks'
import { isTradeBetter } from 'utils/trades'

import { BASES_TO_CHECK_TRADES_AGAINST, BETTER_TRADE_LESS_HOPS_THRESHOLD } from '../../../../constants'
import { PairState, usePairs } from '../../../../data/Reserves'
import { UbeswapTrade } from '../trade'

function useAllCommonPairs(tokenA?: Token, tokenB?: Token): Pair[] {
  const { chainId } = useActiveWeb3React()

  const bases: Token[] = useMemo(() => {
    if (!chainId) return []
    const common = BASES_TO_CHECK_TRADES_AGAINST[chainId] ?? []
    return [...common]
  }, [chainId])

  const basePairs: [Token, Token][] = useMemo(
    () => flatMap(bases, (base): [Token, Token][] => bases.map((otherBase) => [base, otherBase])),
    [bases]
  )

  const allPairCombinations: [Token, Token][] = useMemo(
    () =>
      tokenA && tokenB
        ? [
            // the direct pair
            [tokenA, tokenB],
            // token A against all bases
            ...bases.map((base): [Token, Token] => [tokenA, base]),
            // token B against all bases
            ...bases.map((base): [Token, Token] => [tokenB, base]),
            // each base against all bases
            ...basePairs,
          ]
            .filter((tokens): tokens is [Token, Token] => Boolean(tokens[0] && tokens[1]))
            .filter(([t0, t1]) => t0.address !== t1.address)
        : [],
    [tokenA, tokenB, bases, basePairs]
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

const MAX_HOPS = 3

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
export function useDirectTradeExactIn(currencyAmountIn?: TokenAmount, currencyOut?: Token): UbeswapTrade | null {
  const allowedPairs = useAllCommonPairs(currencyAmountIn?.currency, currencyOut)

  const [singleHopOnly] = useUserSingleHopOnly()

  return useMemo(() => {
    if (currencyAmountIn && currencyOut && allowedPairs.length > 0) {
      if (singleHopOnly) {
        const bestTrade =
          Trade.bestTradeExactIn(allowedPairs, currencyAmountIn, currencyOut, { maxHops: 1, maxNumResults: 1 })[0] ??
          null
        return bestTrade ? UbeswapTrade.fromNormalTrade(bestTrade) : null
      }
      // search through trades with varying hops, find best trade out of them
      let bestTradeSoFar: UbeswapTrade | null = null
      for (let i = 1; i <= MAX_HOPS; i++) {
        const currentTradeRaw: Trade | null =
          Trade.bestTradeExactIn(allowedPairs, currencyAmountIn, currencyOut, { maxHops: i, maxNumResults: 1 })[0] ??
          null
        const currentTrade: UbeswapTrade | null = currentTradeRaw ? UbeswapTrade.fromNormalTrade(currentTradeRaw) : null
        // if current trade is best yet, save it
        if (isTradeBetter(bestTradeSoFar, currentTrade, BETTER_TRADE_LESS_HOPS_THRESHOLD)) {
          bestTradeSoFar = currentTrade
        }
      }
      return bestTradeSoFar
    }

    return null
  }, [allowedPairs, currencyAmountIn, currencyOut, singleHopOnly])
}

/**
 * Returns the best trade for the token in to the exact amount of token out
 */
export function useDirectTradeExactOut(currencyIn?: Token, currencyAmountOut?: TokenAmount): UbeswapTrade | null {
  const allowedPairs = useAllCommonPairs(currencyIn, currencyAmountOut?.currency)

  const [singleHopOnly] = useUserSingleHopOnly()

  return useMemo(() => {
    if (currencyIn && currencyAmountOut && allowedPairs.length > 0) {
      if (singleHopOnly) {
        const bestTrade =
          Trade.bestTradeExactOut(allowedPairs, currencyIn, currencyAmountOut, { maxHops: 1, maxNumResults: 1 })[0] ??
          null
        return bestTrade ? UbeswapTrade.fromNormalTrade(bestTrade) : null
      }
      // search through trades with varying hops, find best trade out of them
      let bestTradeSoFar: UbeswapTrade | null = null
      for (let i = 1; i <= MAX_HOPS; i++) {
        const currentTradeRaw =
          Trade.bestTradeExactOut(allowedPairs, currencyIn, currencyAmountOut, { maxHops: i, maxNumResults: 1 })[0] ??
          null
        const currentTrade = currentTradeRaw ? UbeswapTrade.fromNormalTrade(currentTradeRaw) : null
        if (isTradeBetter(bestTradeSoFar, currentTrade, BETTER_TRADE_LESS_HOPS_THRESHOLD)) {
          bestTradeSoFar = currentTrade
        }
      }
      return bestTradeSoFar
    }
    return null
  }, [currencyIn, currencyAmountOut, allowedPairs, singleHopOnly])
}
