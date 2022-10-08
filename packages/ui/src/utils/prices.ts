import { CurrencyAmount, Fraction, JSBI, Percent, TokenAmount, Trade } from '@teleswap/sdk'
import { V2RouteWithValidQuote } from '@teleswap/smart-order-router'

import { BLOCKED_PRICE_IMPACT_NON_EXPERT } from '../constants'
import { ALLOWED_PRICE_IMPACT_HIGH, ALLOWED_PRICE_IMPACT_LOW, ALLOWED_PRICE_IMPACT_MEDIUM } from '../constants'
import { Field } from '../state/swap/actions'
import { basisPointsToPercent } from './index'

const BASE_FEE_VOLATILE = new Percent(JSBI.BigInt(30), JSBI.BigInt(10000))
const BASE_FEE_STABLE = new Percent(JSBI.BigInt(1), JSBI.BigInt(10000))
const ONE_HUNDRED_PERCENT = new Percent(JSBI.BigInt(10000), JSBI.BigInt(10000))
const INPUT_FRACTION_AFTER_VOLATILE_FEE = ONE_HUNDRED_PERCENT.subtract(BASE_FEE_VOLATILE)
const INPUT_FRACTION_AFTER_STABLE_FEE = ONE_HUNDRED_PERCENT.subtract(BASE_FEE_STABLE)

function computePriceImpact(midPrice: Fraction, inputAmount: JSBI, outputAmount: JSBI): Percent {
  const exactQuote = midPrice.multiply(inputAmount)
  // calculate slippage := (exactQuote - outputAmount) / exactQuote
  const slippage = exactQuote.subtract(outputAmount).divide(exactQuote)
  return new Percent(slippage.numerator, slippage.denominator)
}

export function computeTradePriceBreakdownByRoute(route: V2RouteWithValidQuote): {
  priceImpactWithoutFee: Percent
  realizedLPFee: JSBI
} {
  const realizedLPFee = ONE_HUNDRED_PERCENT.subtract(
    route.route.pairs.reduce<Fraction>(
      (currentFee: Fraction, pair): Fraction =>
        pair.stable
          ? currentFee.multiply(INPUT_FRACTION_AFTER_STABLE_FEE)
          : currentFee.multiply(INPUT_FRACTION_AFTER_VOLATILE_FEE),
      ONE_HUNDRED_PERCENT
    )
  )

  // remove lp fees from price impact
  const priceImpactWithoutFeeFraction = computePriceImpact(
    new Fraction(route.route.midPrice.numerator, route.route.midPrice.denominator),
    route.amount.numerator,
    route.quote.numerator
  ).subtract(realizedLPFee)

  // the amount of the input that accrues to LPs
  const realizedLPFeeAmount = route.amount.multiply(realizedLPFee.numerator).quotient

  return {
    priceImpactWithoutFee: new Percent(
      priceImpactWithoutFeeFraction.numerator,
      priceImpactWithoutFeeFraction.denominator
    ),
    realizedLPFee: realizedLPFeeAmount
  }
}

// computes price breakdown for the trade
export function computeTradePriceBreakdown(trade?: Trade | null): {
  priceImpactWithoutFee: Percent | undefined
  realizedLPFee: CurrencyAmount | undefined | null
} {
  // for each hop in our trade, take away the x*y=k price impact from 0.3% fees
  // e.g. for 3 tokens/2 hops: 1 - ((1 - .03) * (1-.03))
  const realizedLPFee = !trade
    ? undefined
    : ONE_HUNDRED_PERCENT.subtract(
        trade.route.pairs.reduce<Fraction>(
          (currentFee: Fraction): Fraction => currentFee.multiply(INPUT_FRACTION_AFTER_VOLATILE_FEE),
          ONE_HUNDRED_PERCENT
        )
      )

  // remove lp fees from price impact
  const priceImpactWithoutFeeFraction = trade && realizedLPFee ? trade.priceImpact.subtract(realizedLPFee) : undefined

  // the x*y=k impact
  const priceImpactWithoutFeePercent = priceImpactWithoutFeeFraction
    ? new Percent(priceImpactWithoutFeeFraction?.numerator, priceImpactWithoutFeeFraction?.denominator)
    : undefined

  // the amount of the input that accrues to LPs
  const realizedLPFeeAmount =
    realizedLPFee &&
    trade &&
    (trade.inputAmount instanceof TokenAmount
      ? new TokenAmount(trade.inputAmount.token, realizedLPFee.multiply(trade.inputAmount.raw).quotient)
      : CurrencyAmount.ether(realizedLPFee.multiply(trade.inputAmount.raw).quotient))

  return { priceImpactWithoutFee: priceImpactWithoutFeePercent, realizedLPFee: realizedLPFeeAmount }
}

export function computeSlippageAdjustedAmountsByRoute(
  route: V2RouteWithValidQuote,
  allowedSlippage: number
): { [field in Field]?: CurrencyAmount } {
  const pct = basisPointsToPercent(allowedSlippage)
  return {
    [Field.INPUT]: route.maximumAmountIn(pct),
    [Field.OUTPUT]: route.minimumAmountOut(pct)
  }
}

// computes the minimum amount out and maximum amount in for a trade given a user specified allowed slippage in bips
export function computeSlippageAdjustedAmounts(
  trade: Trade | undefined,
  allowedSlippage: number
): { [field in Field]?: CurrencyAmount } {
  const pct = basisPointsToPercent(allowedSlippage)
  return {
    [Field.INPUT]: trade?.maximumAmountIn(pct),
    [Field.OUTPUT]: trade?.minimumAmountOut(pct)
  }
}

export function warningSeverity(priceImpact: Percent | undefined): 0 | 1 | 2 | 3 | 4 {
  if (!priceImpact?.lessThan(BLOCKED_PRICE_IMPACT_NON_EXPERT)) return 4
  if (!priceImpact?.lessThan(ALLOWED_PRICE_IMPACT_HIGH)) return 3
  if (!priceImpact?.lessThan(ALLOWED_PRICE_IMPACT_MEDIUM)) return 2
  if (!priceImpact?.lessThan(ALLOWED_PRICE_IMPACT_LOW)) return 1
  return 0
}

export function formatExecutionPrice(trade?: Trade, inverted?: boolean): string {
  if (!trade) {
    return ''
  }
  return inverted
    ? `${trade.executionPrice.invert().toSignificant(6)} ${trade.inputAmount.currency.symbol} / ${
        trade.outputAmount.currency.symbol
      }`
    : `${trade.executionPrice.toSignificant(6)} ${trade.outputAmount.currency.symbol} / ${
        trade.inputAmount.currency.symbol
      }`
}
