import { BLOCKED_PRICE_IMPACT_NON_EXPERT } from '../constants'
import { Currency, CurrencyAmount, Fraction, Percent, TokenAmount, TradeType } from '@kyberswap/ks-sdk-core'
import { Pair, Trade } from '@kyberswap/ks-sdk-classic'
import JSBI from 'jsbi'
import { ChainId } from '@kyberswap/ks-sdk-core'
import { ALLOWED_PRICE_IMPACT_HIGH, ALLOWED_PRICE_IMPACT_LOW, ALLOWED_PRICE_IMPACT_MEDIUM } from '../constants'
import { Field } from '../state/swap/actions'
import { basisPointsToPercent } from './index'
import { Aggregator } from './aggregator'
import { AnyTrade } from 'hooks/useSwapCallback'

export function computeFee(pairs?: Array<Pair>): Fraction {
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

// computes price breakdown for the trade
export function computeTradePriceBreakdown(
  trade?: Trade<Currency, Currency, TradeType>
): { priceImpactWithoutFee?: Percent; realizedLPFee?: CurrencyAmount<Currency>; accruedFeePercent: Percent } {
  const pairs = trade ? trade.route.pairs : undefined
  const realizedLPFee: Fraction = computeFee(pairs)
  const accruedFeePercent: Percent = new Percent(realizedLPFee.numerator, JSBI.BigInt('1000000000000000000'))

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
    // TODO: Check again inputAmount.quotient
    // (trade.inputAmount.currency.isToken
    // ?
    TokenAmount.fromRawAmount(trade.inputAmount.currency, realizedLPFee.multiply(trade.inputAmount.quotient).quotient)
  // : CurrencyAmount.ether(realizedLPFee.multiply(trade.inputAmount.raw).quotient))

  return { priceImpactWithoutFee: priceImpactWithoutFeePercent, realizedLPFee: realizedLPFeeAmount, accruedFeePercent }
}

// computes the minimum amount out and maximum amount in for a trade given a user specified allowed slippage in bips
export function computeSlippageAdjustedAmounts(
  trade: AnyTrade | Aggregator | undefined,
  allowedSlippage: number
): { [field in Field]?: CurrencyAmount<Currency> } {
  const pct = basisPointsToPercent(allowedSlippage)
  return {
    [Field.INPUT]: trade?.maximumAmountIn(pct),
    [Field.OUTPUT]: trade?.minimumAmountOut(pct),
  }
}

export function warningSeverity(priceImpact: Percent | undefined): 0 | 1 | 2 | 3 | 4 {
  if (!priceImpact) return 0
  if (!priceImpact?.lessThan(BLOCKED_PRICE_IMPACT_NON_EXPERT)) return 4
  if (!priceImpact?.lessThan(ALLOWED_PRICE_IMPACT_HIGH)) return 3
  if (!priceImpact?.lessThan(ALLOWED_PRICE_IMPACT_MEDIUM)) return 2
  if (!priceImpact?.lessThan(ALLOWED_PRICE_IMPACT_LOW)) return 1
  return 0
}

export function formatExecutionPrice(trade?: AnyTrade | Aggregator, inverted?: boolean, chainId?: ChainId): string {
  if (!trade || !chainId) {
    return ''
  }
  const nativeInput = trade.inputAmount.currency

  const nativeOutput = trade.outputAmount.currency
  return inverted
    ? `${trade.executionPrice.invert().toSignificant(6)} ${nativeInput?.symbol} / ${nativeOutput?.symbol}`
    : `${trade.executionPrice.toSignificant(6)} ${nativeOutput?.symbol} / ${nativeInput.symbol}`
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
