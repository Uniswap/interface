import { useContractKit } from '@celo-tools/use-contractkit'
import { currencyEquals, Pair, Percent, Price, Token, TokenAmount, Trade, TradeType } from '@ubeswap/sdk'
import {
  BASES_TO_CHECK_TRADES_AGAINST,
  BETTER_TRADE_LESS_HOPS_THRESHOLD,
  UBESWAP_MOOLA_ROUTER_ADDRESS,
} from 'constants/index'
import { PairState, usePairs } from 'data/Reserves'
import flatMap from 'lodash.flatmap'
import { useMemo } from 'react'
import { useUserDisableSmartRouting, useUserSingleHopOnly } from 'state/user/hooks'
import { isTradeBetter } from 'utils/trades'

import { MoolaDirectTrade } from '../moola/MoolaDirectTrade'
import { getMoolaDual } from '../moola/useMoola'
import { useMoolaDirectRoute } from '../moola/useMoolaDirectRoute'
import { TradeRouter, UbeswapTrade } from '../trade'
import { bestTradeExactIn, bestTradeExactOut } from './calculateBestTrades'
import { useDirectTradeExactIn, useDirectTradeExactOut } from './directTrades'

/**
 * Uses all common pairs between the two tokens, plus searches the moola duals
 * @param tokenA
 * @param tokenB
 * @returns
 */
export function useAllCommonPairsWithMoolaDuals(tokenA?: Token, tokenB?: Token): readonly Pair[] {
  const { network } = useContractKit()
  const chainId = network.chainId

  const bases: readonly Token[] = useMemo(() => (chainId ? BASES_TO_CHECK_TRADES_AGAINST[chainId] : []), [chainId])

  const basePairs: readonly (readonly [Token, Token])[] = useMemo(
    () =>
      flatMap(bases, (base): [Token, Token][] => bases.map((otherBase) => [base, otherBase])).filter(
        ([t0, t1]) =>
          t0.address !== t1.address &&
          // ensure we don't fetch duals
          t0.address !== getMoolaDual(t1)?.address &&
          t1.address !== getMoolaDual(t0)?.address
      ),
    [bases]
  )

  const tokenADual = tokenA && getMoolaDual(tokenA)
  const tokenBDual = tokenB && getMoolaDual(tokenB)

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
            // handle duals
            // direct pair
            ...(tokenADual ? [[tokenADual, tokenB]] : []),
            ...(tokenBDual ? [[tokenA, tokenBDual]] : []),
            ...(tokenADual && tokenBDual ? [[tokenADual, tokenBDual]] : []),
            // token A against all bases
            ...bases.map((base): [Token, Token] => [tokenA, base]),
            ...(tokenADual ? bases.map((base): [Token, Token] => [tokenADual, base]) : []),
            // token B against all bases
            ...bases.map((base): [Token, Token] => [tokenB, base]),
            ...(tokenBDual ? bases.map((base): [Token, Token] => [tokenBDual, base]) : []),
          ]
            .filter((tokens): tokens is [Token, Token] => Boolean(tokens[0] && tokens[1]))
            .filter(([t0, t1]) => t0.address !== t1.address)
        : [],
    [tokenA, tokenB, bases, basePairs, tokenADual, tokenBDual]
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

const moolaRouter: TradeRouter = {
  routerAddress: UBESWAP_MOOLA_ROUTER_ADDRESS,
}

export class MoolaRouterTrade extends UbeswapTrade {
  inputAmount: TokenAmount
  outputAmount: TokenAmount
  executionPrice: Price
  /**
   *
   * @param originalTokenIn If null, the original token is the path token
   * @param originalTokenOut If null, the original token is the path token
   * @param innerTrade
   */
  constructor(
    public readonly originalTokenIn: Token | null,
    public readonly originalTokenOut: Token | null,
    public readonly innerTrade: Trade
  ) {
    super(
      innerTrade.route,
      innerTrade.tradeType === TradeType.EXACT_INPUT ? innerTrade.inputAmount : innerTrade.outputAmount,
      innerTrade.tradeType,
      moolaRouter,
      [
        ...(originalTokenIn ? [originalTokenIn] : []),
        ...innerTrade.route.path,
        ...(originalTokenOut ? [originalTokenOut] : []),
      ]
    )
    this.inputAmount = new TokenAmount(originalTokenIn ?? innerTrade.inputAmount.token, innerTrade.inputAmount.raw)
    this.outputAmount = new TokenAmount(originalTokenOut ?? innerTrade.outputAmount.token, innerTrade.outputAmount.raw)
    const baseIsInput = currencyEquals(innerTrade.executionPrice.baseCurrency, innerTrade.inputAmount.token)
    this.executionPrice = new Price(
      baseIsInput ? this.inputAmount.token : this.outputAmount.token,
      !baseIsInput ? this.inputAmount.token : this.outputAmount.token,
      innerTrade.executionPrice.denominator,
      innerTrade.executionPrice.numerator
    )
  }

  /**
   * Get the minimum amount that must be received from this trade for the given slippage tolerance
   * @param slippageTolerance tolerance of unfavorable slippage from the execution price of this trade
   */
  minimumAmountOut(slippageTolerance: Percent): TokenAmount {
    const amt = this.innerTrade.minimumAmountOut(slippageTolerance)
    return new TokenAmount(this.originalTokenOut ?? amt.token, amt.raw)
  }
  /**
   * Get the maximum amount in that can be spent via this trade for the given slippage tolerance
   * @param slippageTolerance tolerance of unfavorable slippage from the execution price of this trade
   */
  maximumAmountIn(slippageTolerance: Percent): TokenAmount {
    const amt = this.innerTrade.maximumAmountIn(slippageTolerance)
    return new TokenAmount(this.originalTokenIn ?? amt.token, amt.raw)
  }
}

/**
 * Converts the trade to a Moola Router trade, if the original tokens are lost
 * @param originalTokenIn
 * @param originalTokenOut
 * @param trade
 * @returns
 */
const convertToMoolaRouterTradeIfApplicable = (
  originalTokenIn: Token,
  originalTokenOut: Token,
  trade: UbeswapTrade
): UbeswapTrade => {
  const inUnchanged = trade.inputAmount.token.address === originalTokenIn.address
  const outUnchanged = trade.outputAmount.token.address === originalTokenOut.address
  if (inUnchanged && outUnchanged) {
    return trade
  }
  return new MoolaRouterTrade(inUnchanged ? originalTokenIn : null, outUnchanged ? originalTokenOut : null, trade)
}

/**
 * Returns the best trade for the exact amount of tokens in to the given token out
 */
export function useUbeswapTradeExactIn(tokenAmountIn?: TokenAmount, tokenOut?: Token): UbeswapTrade | null {
  const [disableSmartRouting] = useUserDisableSmartRouting()
  const directTrade = useDirectTradeExactIn(tokenAmountIn, tokenOut)
  const allowedPairs = useAllCommonPairsWithMoolaDuals(tokenAmountIn?.token, tokenOut)
  const [singleHopOnly] = useUserSingleHopOnly()
  const moolaRoute = useMoolaDirectRoute(tokenAmountIn?.token, tokenOut)

  return useMemo(() => {
    const bestTrade = (() => {
      if (disableSmartRouting) {
        return directTrade
      }

      if (tokenAmountIn && tokenOut && allowedPairs.length > 0) {
        if (singleHopOnly) {
          const singleHopTrade = bestTradeExactIn(allowedPairs.slice(), tokenAmountIn, tokenOut, directTrade, {
            maxHops: 1,
            maxNumResults: 1,
            minimumDelta: BETTER_TRADE_LESS_HOPS_THRESHOLD,
          })
          return singleHopTrade
            ? convertToMoolaRouterTradeIfApplicable(tokenAmountIn.token, tokenOut, singleHopTrade)
            : null
        }
        // search through trades with varying hops, find best trade out of them
        let bestTradeSoFar: UbeswapTrade | null = null
        for (let i = 1; i <= MAX_HOPS; i++) {
          const currentTrade: UbeswapTrade | null = bestTradeExactIn(
            allowedPairs.slice(),
            tokenAmountIn,
            tokenOut,
            directTrade,
            {
              maxHops: i,
              maxNumResults: 1,
              minimumDelta: BETTER_TRADE_LESS_HOPS_THRESHOLD,
            }
          )
          // if current trade is best yet, save it
          if (isTradeBetter(bestTradeSoFar, currentTrade, BETTER_TRADE_LESS_HOPS_THRESHOLD)) {
            bestTradeSoFar = currentTrade
          }
        }
        return bestTradeSoFar
      }

      return null
    })()

    if (moolaRoute && tokenAmountIn) {
      const moolaTrade = MoolaDirectTrade.fromIn(moolaRoute, tokenAmountIn)
      if (isTradeBetter(bestTrade, moolaTrade, new Percent('0'))) {
        return moolaTrade
      }
    }
    return bestTrade
  }, [allowedPairs, tokenAmountIn, tokenOut, singleHopOnly, directTrade, disableSmartRouting, moolaRoute])
}

/**
 * Returns the best trade for the token in to the exact amount of token out
 */
export function useUbeswapTradeExactOut(tokenIn?: Token, tokenAmountOut?: TokenAmount): UbeswapTrade | null {
  const [disableSmartRouting] = useUserDisableSmartRouting()
  const directTrade = useDirectTradeExactOut(tokenIn, tokenAmountOut)
  const allowedPairs = useAllCommonPairsWithMoolaDuals(tokenIn, tokenAmountOut?.token)
  const [singleHopOnly] = useUserSingleHopOnly()
  const moolaRoute = useMoolaDirectRoute(tokenIn, tokenAmountOut?.token)

  return useMemo(() => {
    const bestTrade = (() => {
      if (disableSmartRouting) {
        return directTrade
      }

      if (tokenIn && tokenAmountOut && allowedPairs.length > 0) {
        if (singleHopOnly) {
          const singleHopTrade = bestTradeExactOut(allowedPairs.slice(), tokenIn, tokenAmountOut, directTrade, {
            maxHops: 1,
            maxNumResults: 1,
          })
          return singleHopTrade
            ? convertToMoolaRouterTradeIfApplicable(tokenIn, tokenAmountOut.token, singleHopTrade)
            : null
        }
        // search through trades with varying hops, find best trade out of them
        let bestTradeSoFar: UbeswapTrade | null = null
        for (let i = 1; i <= MAX_HOPS; i++) {
          const currentTrade = bestTradeExactOut(allowedPairs.slice(), tokenIn, tokenAmountOut, directTrade, {
            maxHops: i,
            maxNumResults: 1,
          })
          if (isTradeBetter(bestTradeSoFar, currentTrade, BETTER_TRADE_LESS_HOPS_THRESHOLD)) {
            bestTradeSoFar = currentTrade
          }
        }
        return bestTradeSoFar
      }
      return null
    })()

    if (moolaRoute && tokenAmountOut) {
      const moolaTrade = MoolaDirectTrade.fromOut(moolaRoute, tokenAmountOut)
      if (isTradeBetter(bestTrade, moolaTrade, new Percent('0'))) {
        return moolaTrade
      }
    }
    return bestTrade
  }, [tokenIn, tokenAmountOut, allowedPairs, singleHopOnly, directTrade, disableSmartRouting, moolaRoute])
}
