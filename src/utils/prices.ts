import JSBI from 'jsbi'
import { CurrencyAmount, Fraction, Percent, TokenAmount } from '@uniswap/sdk-core'
import { Trade as V2Trade } from '@uniswap/v2-sdk'
import { Trade as V3Trade } from '@uniswap/v3-sdk'
import {
  ALLOWED_PRICE_IMPACT_HIGH,
  ALLOWED_PRICE_IMPACT_LOW,
  ALLOWED_PRICE_IMPACT_MEDIUM,
  BLOCKED_PRICE_IMPACT_NON_EXPERT,
} from '../constants'

const THIRTY_BIPS_FEE = new Percent(JSBI.BigInt(30), JSBI.BigInt(10000))
const ONE_HUNDRED_PERCENT = new Percent(JSBI.BigInt(10000), JSBI.BigInt(10000))
const INPUT_FRACTION_AFTER_FEE = ONE_HUNDRED_PERCENT.subtract(THIRTY_BIPS_FEE)

// computes price breakdown for the trade
export function computeRealizedLPFeeAmount(trade?: V2Trade | V3Trade | null): CurrencyAmount | undefined {
  if (trade instanceof V2Trade) {
    // for each hop in our trade, take away the x*y=k price impact from 0.3% fees
    // e.g. for 3 tokens/2 hops: 1 - ((1 - .03) * (1-.03))
    const realizedLPFee = !trade
      ? undefined
      : ONE_HUNDRED_PERCENT.subtract(
          trade.route.pairs.reduce<Fraction>(
            (currentFee: Fraction): Fraction => currentFee.multiply(INPUT_FRACTION_AFTER_FEE),
            ONE_HUNDRED_PERCENT
          )
        )

    // the amount of the input that accrues to LPs
    return (
      realizedLPFee &&
      trade &&
      (trade.inputAmount instanceof TokenAmount
        ? new TokenAmount(trade.inputAmount.token, realizedLPFee.multiply(trade.inputAmount.raw).quotient)
        : CurrencyAmount.ether(realizedLPFee.multiply(trade.inputAmount.raw).quotient))
    )
  } else if (trade instanceof V3Trade) {
    const realizedLPFee = !trade
      ? undefined
      : ONE_HUNDRED_PERCENT.subtract(
          trade.route.pools.reduce<Fraction>(
            (currentFee: Fraction, pool): Fraction =>
              currentFee.multiply(ONE_HUNDRED_PERCENT.subtract(new Fraction(pool.fee, 1_000_000))),
            ONE_HUNDRED_PERCENT
          )
        )
    return (
      realizedLPFee &&
      trade &&
      (trade.inputAmount instanceof TokenAmount
        ? new TokenAmount(trade.inputAmount.token, realizedLPFee.multiply(trade.inputAmount.raw).quotient)
        : CurrencyAmount.ether(realizedLPFee.multiply(trade.inputAmount.raw).quotient))
    )
  }
  return undefined
}

const IMPACT_TIERS = [
  BLOCKED_PRICE_IMPACT_NON_EXPERT,
  ALLOWED_PRICE_IMPACT_HIGH,
  ALLOWED_PRICE_IMPACT_MEDIUM,
  ALLOWED_PRICE_IMPACT_LOW,
]

type WarningSeverity = 0 | 1 | 2 | 3 | 4
export function warningSeverity(priceImpact: Percent | undefined): WarningSeverity {
  if (!priceImpact) return 4
  let impact: WarningSeverity = IMPACT_TIERS.length as WarningSeverity
  for (const impactLevel of IMPACT_TIERS) {
    if (impactLevel.lessThan(priceImpact)) return impact
    impact--
  }
  return 0
}
