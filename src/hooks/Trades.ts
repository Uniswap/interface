import { Pair, Token, TokenAmount, Trade } from '@ubeswap/sdk'
import { MoolaTrade } from 'components/swap/routing/moola/MoolaTrade'
import { useMoolaRoute } from 'components/swap/routing/moola/useMoolaRoute'
import flatMap from 'lodash.flatmap'
import { useMemo } from 'react'
import { useUserSingleHopOnly } from 'state/user/hooks'
import { isTradeBetter } from 'utils/trades'
import { BASES_TO_CHECK_TRADES_AGAINST, BETTER_TRADE_LESS_HOPS_THRESHOLD } from '../constants'
import { PairState, usePairs } from '../data/Reserves'
import { useActiveWeb3React } from './index'
import { useUnsupportedTokens } from './Tokens'

function useAllCommonPairs(currencyA?: Token, currencyB?: Token): Pair[] {
  const { chainId } = useActiveWeb3React()

  const bases: Token[] = useMemo(() => (chainId ? BASES_TO_CHECK_TRADES_AGAINST[chainId] : []), [chainId])
  const [tokenA, tokenB] = [currencyA, currencyB]

  const basePairs: [Token, Token][] = useMemo(
    () =>
      flatMap(bases, (base): [Token, Token][] => bases.map((otherBase) => [base, otherBase])).filter(
        ([t0, t1]) => t0.address !== t1.address
      ),
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
export function useTradeExactIn(currencyAmountIn?: TokenAmount, currencyOut?: Token): Trade | null {
  const allowedPairs = useAllCommonPairs(currencyAmountIn?.currency, currencyOut)

  const [singleHopOnly] = useUserSingleHopOnly()
  const moolaRoute = useMoolaRoute(currencyAmountIn?.currency, currencyOut)

  return useMemo(() => {
    if (moolaRoute && currencyAmountIn) {
      return MoolaTrade.fromIn(moolaRoute, currencyAmountIn)
    }

    if (currencyAmountIn && currencyOut && allowedPairs.length > 0) {
      if (singleHopOnly) {
        return (
          Trade.bestTradeExactIn(allowedPairs, currencyAmountIn, currencyOut, { maxHops: 1, maxNumResults: 1 })[0] ??
          null
        )
      }
      // search through trades with varying hops, find best trade out of them
      let bestTradeSoFar: Trade | null = null
      for (let i = 1; i <= MAX_HOPS; i++) {
        const currentTrade: Trade | null =
          Trade.bestTradeExactIn(allowedPairs, currencyAmountIn, currencyOut, { maxHops: i, maxNumResults: 1 })[0] ??
          null
        // if current trade is best yet, save it
        if (isTradeBetter(bestTradeSoFar, currentTrade, BETTER_TRADE_LESS_HOPS_THRESHOLD)) {
          bestTradeSoFar = currentTrade
        }
      }
      return bestTradeSoFar
    }

    return null
  }, [allowedPairs, currencyAmountIn, currencyOut, singleHopOnly, moolaRoute])
}

/**
 * Returns the best trade for the token in to the exact amount of token out
 */
export function useTradeExactOut(currencyIn?: Token, currencyAmountOut?: TokenAmount): Trade | null {
  const allowedPairs = useAllCommonPairs(currencyIn, currencyAmountOut?.currency)

  const [singleHopOnly] = useUserSingleHopOnly()
  const moolaRoute = useMoolaRoute(currencyIn, currencyAmountOut?.currency)

  return useMemo(() => {
    if (moolaRoute && currencyAmountOut) {
      return MoolaTrade.fromOut(moolaRoute, currencyAmountOut)
    }

    if (currencyIn && currencyAmountOut && allowedPairs.length > 0) {
      if (singleHopOnly) {
        return (
          Trade.bestTradeExactOut(allowedPairs, currencyIn, currencyAmountOut, { maxHops: 1, maxNumResults: 1 })[0] ??
          null
        )
      }
      // search through trades with varying hops, find best trade out of them
      let bestTradeSoFar: Trade | null = null
      for (let i = 1; i <= MAX_HOPS; i++) {
        const currentTrade =
          Trade.bestTradeExactOut(allowedPairs, currencyIn, currencyAmountOut, { maxHops: i, maxNumResults: 1 })[0] ??
          null
        if (isTradeBetter(bestTradeSoFar, currentTrade, BETTER_TRADE_LESS_HOPS_THRESHOLD)) {
          bestTradeSoFar = currentTrade
        }
      }
      return bestTradeSoFar
    }
    return null
  }, [currencyIn, currencyAmountOut, allowedPairs, singleHopOnly, moolaRoute])
}

export function useIsTransactionUnsupported(currencyIn?: Token, currencyOut?: Token): boolean {
  const unsupportedToken: { [address: string]: Token } = useUnsupportedTokens()

  const tokenIn = currencyIn
  const tokenOut = currencyOut

  // if unsupported list loaded & either token on list, mark as unsupported
  if (unsupportedToken) {
    if (tokenIn && Object.keys(unsupportedToken).includes(tokenIn.address)) {
      return true
    }
    if (tokenOut && Object.keys(unsupportedToken).includes(tokenOut.address)) {
      return true
    }
  }

  return false
}
