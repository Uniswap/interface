import { Trade } from '@uniswap/router-sdk'
import { Currency, CurrencyAmount, Fraction, Percent, TradeType } from '@uniswap/sdk-core'
import { Pair } from '@uniswap/v2-sdk'
import { FeeAmount } from '@uniswap/v3-sdk'
import { DefaultTheme } from 'styled-components'

import {
  ALLOWED_PRICE_IMPACT_HIGH,
  ALLOWED_PRICE_IMPACT_LOW,
  ALLOWED_PRICE_IMPACT_MEDIUM,
  BIPS_BASE,
  BLOCKED_PRICE_IMPACT_NON_EXPERT,
  ONE_HUNDRED_PERCENT,
  ZERO_PERCENT,
} from '../constants/misc'

const THIRTY_BIPS_FEE = new Percent(30, BIPS_BASE)
const INPUT_FRACTION_AFTER_FEE = ONE_HUNDRED_PERCENT.subtract(THIRTY_BIPS_FEE)

export function computeRealizedPriceImpact(trade: Trade<Currency, Currency, TradeType>): Percent {
  const realizedLpFeePercent = computeRealizedLPFeePercent(trade)
  return trade.priceImpact.subtract(realizedLpFeePercent)
}

// computes realized lp fee as a percent
function computeRealizedLPFeePercent(trade: Trade<Currency, Currency, TradeType>): Percent {
  let percent: Percent

  // Since routes are either all v2 or all v3 right now, calculate separately
  if (trade.swaps[0].route.pools instanceof Pair) {
    // for each hop in our trade, take away the x*y=k price impact from 0.3% fees
    // e.g. for 3 tokens/2 hops: 1 - ((1 - .03) * (1-.03))
    percent = ONE_HUNDRED_PERCENT.subtract(
      trade.swaps.reduce<Percent>(
        (currentFee: Percent): Percent => currentFee.multiply(INPUT_FRACTION_AFTER_FEE),
        ONE_HUNDRED_PERCENT
      )
    )
  } else {
    percent = ZERO_PERCENT
    for (const swap of trade.swaps) {
      const { numerator, denominator } = swap.inputAmount.divide(trade.inputAmount)
      const overallPercent = new Percent(numerator, denominator)

      const routeRealizedLPFeePercent = overallPercent.multiply(
        ONE_HUNDRED_PERCENT.subtract(
          swap.route.pools.reduce<Percent>((currentFee: Percent, pool): Percent => {
            const fee =
              pool instanceof Pair
                ? // not currently possible given protocol check above, but not fatal
                  FeeAmount.MEDIUM
                : pool.fee
            return currentFee.multiply(ONE_HUNDRED_PERCENT.subtract(new Fraction(fee, 1_000_000)))
          }, ONE_HUNDRED_PERCENT)
        )
      )

      percent = percent.add(routeRealizedLPFeePercent)
    }
  }

  return new Percent(percent.numerator, percent.denominator)
}

// computes price breakdown for the trade
export function computeRealizedLPFeeAmount(
  trade?: Trade<Currency, Currency, TradeType> | null
): CurrencyAmount<Currency> | undefined {
  if (trade) {
    const realizedLPFee = computeRealizedLPFeePercent(trade)

    // the amount of the input that accrues to LPs
    return CurrencyAmount.fromRawAmount(trade.inputAmount.currency, trade.inputAmount.multiply(realizedLPFee).quotient)
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
  if (!priceImpact) return 0
  // This function is used to calculate the Severity level for % changes in USD value and Price Impact.
  // Price Impact is always an absolute value (conceptually always negative, but represented in code with a positive value)
  // The USD value change can be positive or negative, and it follows the same standard as Price Impact (positive value is the typical case of a loss due to slippage).
  // We don't want to return a warning level for a favorable/profitable change, so when the USD value change is negative we return 0.
  // TODO (WEB-1833): Disambiguate Price Impact and USD value change, and flip the sign of USD Value change.
  if (priceImpact.lessThan(0)) return 0
  let impact: WarningSeverity = IMPACT_TIERS.length as WarningSeverity
  for (const impactLevel of IMPACT_TIERS) {
    if (impactLevel.lessThan(priceImpact)) return impact
    impact--
  }
  return 0
}

export function getPriceImpactWarning(priceImpact: Percent): 'warning' | 'error' | undefined {
  if (priceImpact.greaterThan(ALLOWED_PRICE_IMPACT_HIGH)) return 'error'
  if (priceImpact.greaterThan(ALLOWED_PRICE_IMPACT_MEDIUM)) return 'warning'
  return
}

export function getPriceImpactColor(priceImpact: Percent): keyof DefaultTheme | undefined {
  switch (getPriceImpactWarning(priceImpact)) {
    case 'error':
      return 'critical'
    case 'warning':
      return 'deprecated_accentWarning'
    default:
      return undefined
  }
}
