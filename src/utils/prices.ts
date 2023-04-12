import { Pair, Trade } from '@kyberswap/ks-sdk-classic'
import { ChainId, Currency, CurrencyAmount, Fraction, Percent, TradeType } from '@kyberswap/ks-sdk-core'
import JSBI from 'jsbi'

import {
  ALLOWED_PRICE_IMPACT_HIGH,
  ALLOWED_PRICE_IMPACT_LOW,
  ALLOWED_PRICE_IMPACT_MEDIUM,
  BLOCKED_PRICE_IMPACT_NON_DEGEN,
} from 'constants/index'
import { Field } from 'state/swap/actions'

import { Aggregator } from './aggregator'
import { basisPointsToPercent } from './index'

function computeFee(pairs?: Array<Pair>): Fraction {
  let realizedLPFee: Fraction = new Fraction(JSBI.BigInt(0))

  // for each hop in our trade, take away the x*y=k price impact from 0.3% fees
  // e.g. for 3 tokens/2 hops: 1 - ((1 - .03) * (1-.03))
  if (pairs) {
    for (let i = 0; i < pairs.length; i++) {
      const fee = pairs[i].fee
      if (fee) {
        realizedLPFee = realizedLPFee.add(new Percent(JSBI.BigInt(fee), JSBI.BigInt('1000000000000000000')))
      }
    }
  }

  return realizedLPFee
}

type AnyTrade = Trade<Currency, Currency, TradeType>
// computes the minimum amount out and maximum amount in for a trade given a user specified allowed slippage in bips
export function computeSlippageAdjustedAmounts(
  trade: AnyTrade | Aggregator | undefined,
  allowedSlippage: number,
): { [field in Field]?: CurrencyAmount<Currency> } {
  const pct = basisPointsToPercent(allowedSlippage)
  return {
    [Field.INPUT]: trade?.maximumAmountIn(pct),
    [Field.OUTPUT]: trade?.minimumAmountOut(pct),
  }
}

export function warningSeverity(priceImpact: Percent | undefined): 0 | 1 | 2 | 3 | 4 {
  if (!priceImpact) return 0
  if (!priceImpact?.lessThan(BLOCKED_PRICE_IMPACT_NON_DEGEN)) return 4
  if (!priceImpact?.lessThan(ALLOWED_PRICE_IMPACT_HIGH)) return 3
  if (!priceImpact?.lessThan(ALLOWED_PRICE_IMPACT_MEDIUM)) return 2
  if (!priceImpact?.lessThan(ALLOWED_PRICE_IMPACT_LOW)) return 1
  return 0
}

export function formatExecutionPrice(trade?: AnyTrade | Aggregator, inverted?: boolean, chainId?: ChainId): string {
  if (!trade) {
    return ''
  }
  const nativeInput = trade.inputAmount.currency

  const nativeOutput = trade.outputAmount.currency

  return inverted
    ? `1 ${nativeOutput?.symbol} = ${trade.executionPrice.invert().toSignificant(6)} ${nativeInput?.symbol}`
    : `1 ${nativeInput?.symbol} = ${trade.executionPrice.toSignificant(6)} ${nativeOutput.symbol}`
}

export function computePriceImpactWithoutFee(pairs: Pair[], priceImpact?: Percent): Percent | undefined {
  const realizedLPFee: Fraction = computeFee(pairs)

  // remove lp fees from price impact
  const priceImpactWithoutFeeFraction = priceImpact ? priceImpact.subtract(realizedLPFee) : undefined

  // the x*y=k impact
  const priceImpactWithoutFeePercent = priceImpactWithoutFeeFraction
    ? new Percent(priceImpactWithoutFeeFraction?.numerator, priceImpactWithoutFeeFraction?.denominator)
    : undefined

  return priceImpactWithoutFeePercent
}

// priceImpact is invalid if it's not finite (NaN, Infinity)
// priceImpact is undefined or null means it's not provided
export const checkPriceImpact = (
  priceImpact: number | undefined | null,
): {
  isInvalid: boolean
  isHigh: boolean
  isVeryHigh: boolean
} => {
  return {
    isInvalid: typeof priceImpact === 'number' && !Number.isFinite(priceImpact),
    isHigh: !!priceImpact && priceImpact > 2,
    isVeryHigh: !!priceImpact && priceImpact > 10,
  }
}

// price impact can still be negative, it's only invalid if it's -1
export const formatPriceImpact = (pi: number, withPercent = true) => {
  let text = ''
  const pi100 = Math.floor(pi * 100)

  if (pi < 0.01) {
    text = '< 0.01'
  } else if (pi100 % 100 === 0) {
    text = String(pi100 / 100)
  } else if (pi100 % 10 === 0) {
    text = (pi100 / 100).toFixed(1)
  } else {
    text = (pi100 / 100).toFixed(2)
  }

  if (withPercent) {
    text += '%'
  }

  return text
}
