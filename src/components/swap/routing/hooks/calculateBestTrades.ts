import { Pair, Token, TokenAmount, BestTradeOptions, Trade, Percent, currencyEquals } from '@ubeswap/sdk'
import { ONE_HUNDRED_PERCENT, ZERO_PERCENT } from 'constants/index'
import { getMoolaDual } from '../moola/useMoola'
import { UbeswapTrade } from '../trade'
import { MoolaRouterTrade } from './useTrade'

// returns whether tradeB is better than tradeA by at least a threshold percentage amount
// does not check currency matching
export function isDualTradeBetter(
  tradeA: UbeswapTrade | undefined | null,
  tradeB: UbeswapTrade | undefined | null,
  minimumDelta: Percent = ZERO_PERCENT
): boolean | undefined {
  if (tradeA && !tradeB) return false
  if (tradeB && !tradeA) return true

  if (!tradeA || !tradeB) return undefined

  const inTokenA = tradeA.inputAmount.token
  const inTokenB = tradeB.inputAmount.token

  const outTokenA = tradeA.outputAmount.token
  const outTokenB = tradeB.outputAmount.token

  if (
    tradeA.tradeType !== tradeB.tradeType ||
    !currencyEquals(inTokenA, inTokenB) ||
    !currencyEquals(outTokenA, outTokenB)
  ) {
    throw new Error('Trades are not comparable')
  }

  if (minimumDelta.equalTo(ZERO_PERCENT)) {
    return tradeA.executionPrice.lessThan(tradeB.executionPrice)
  } else {
    return tradeA.executionPrice.raw.multiply(minimumDelta.add(ONE_HUNDRED_PERCENT)).lessThan(tradeB.executionPrice)
  }
}

interface BestUbeswapTradeOptions extends BestTradeOptions {
  minimumDelta?: Percent
}

export const bestTradeExactOut = (
  pairs: readonly Pair[],
  tokenIn: Token,
  tokenAmountOut: TokenAmount,
  directTrade: UbeswapTrade | null,
  options?: BestUbeswapTradeOptions
): UbeswapTrade | null => {
  const inDual = tokenIn && getMoolaDual(tokenIn)
  const outDual = tokenAmountOut && getMoolaDual(tokenAmountOut.token)

  const inDualTrades = inDual
    ? Trade.bestTradeExactOut(pairs.slice(), inDual, tokenAmountOut, options).map(
        (trade) => new MoolaRouterTrade(tokenIn, null, trade)
      )
    : []
  const outDualTrades = outDual
    ? Trade.bestTradeExactOut(pairs.slice(), tokenIn, new TokenAmount(outDual, tokenAmountOut.raw), options).map(
        (trade) => new MoolaRouterTrade(null, tokenAmountOut.token, trade)
      )
    : []
  const inAndOutDualTrades =
    inDual && outDual
      ? Trade.bestTradeExactOut(pairs.slice(), inDual, new TokenAmount(outDual, tokenAmountOut.raw), options).map(
          (trade) => new MoolaRouterTrade(tokenIn, tokenAmountOut.token, trade)
        )
      : []

  return (
    [directTrade, inDualTrades[0], outDualTrades[0], inAndOutDualTrades[0]]
      .filter((x) => !!x)
      .reduce(
        (best: UbeswapTrade | null, trade) => (isDualTradeBetter(best, trade, options?.minimumDelta) ? trade : best),
        null
      ) ?? null
  )
}

export const bestTradeExactIn = (
  pairs: readonly Pair[],
  tokenAmountIn: TokenAmount,
  tokenOut: Token,
  directTrade: UbeswapTrade | null,
  options?: BestUbeswapTradeOptions
): UbeswapTrade | null => {
  const inDual = tokenAmountIn && getMoolaDual(tokenAmountIn.token)
  const outDual = tokenOut && getMoolaDual(tokenOut)

  const inDualTrades = inDual
    ? Trade.bestTradeExactIn(pairs.slice(), new TokenAmount(inDual, tokenAmountIn.raw), tokenOut, options).map(
        (trade) => new MoolaRouterTrade(tokenAmountIn.token, null, trade)
      )
    : []
  const outDualTrades = outDual
    ? Trade.bestTradeExactIn(pairs.slice(), tokenAmountIn, outDual, options).map(
        (trade) => new MoolaRouterTrade(null, tokenOut, trade)
      )
    : []
  const inAndOutDualTrades =
    inDual && outDual
      ? Trade.bestTradeExactIn(pairs.slice(), new TokenAmount(inDual, tokenAmountIn.raw), outDual, options).map(
          (trade) => new MoolaRouterTrade(tokenAmountIn.token, tokenOut, trade)
        )
      : []

  return (
    [directTrade, inDualTrades[0], outDualTrades[0], inAndOutDualTrades[0]]
      .filter((x) => !!x)
      .reduce((best: UbeswapTrade | null, trade) =>
        best === null || isDualTradeBetter(best, trade, options?.minimumDelta) ? trade : best
      ) ?? null
  )
}
