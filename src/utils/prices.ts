import { BLOCKED_PRICE_IMPACT_NON_EXPERT } from '../constants'
import {
  CurrencyAmount,
  Fraction,
  JSBI,
  Percent,
  TokenAmount,
  Trade,
  Pair,
  Price,
  Currency,
  _10000,
  _100
} from '@swapr/sdk'
import { ALLOWED_PRICE_IMPACT_HIGH, ALLOWED_PRICE_IMPACT_LOW, ALLOWED_PRICE_IMPACT_MEDIUM } from '../constants'
import { Field } from '../state/swap/actions'
import { basisPointsToPercent } from './index'
import Decimal from 'decimal.js-light'
import { parseUnits } from 'ethers/lib/utils'

const ONE_HUNDRED_PERCENT = new Percent(_10000, _10000)

// computes price breakdown for the trade
export function computeTradePriceBreakdown(
  trade?: Trade
): { priceImpactWithoutFee?: Percent; realizedLPFee?: Percent; realizedLPFeeAmount?: CurrencyAmount } {
  // for each hop in our trade, take away the x*y=k price impact from 0.3% fees
  // e.g. for 3 tokens/2 hops: 1 - ((1 - .03) * (1-.03))
  const realizedLPFee = !trade
    ? undefined
    : ONE_HUNDRED_PERCENT.subtract(
        trade.route.pairs.reduce<Fraction>((currentFee: Fraction, currentIndex: Pair): Fraction => {
          return currentFee.multiply(
            ONE_HUNDRED_PERCENT.subtract(new Percent(JSBI.BigInt(currentIndex.swapFee.toString()), _10000))
          )
        }, ONE_HUNDRED_PERCENT)
      )

  // remove lp fees from price impact
  const priceImpactWithoutFeeFraction = trade && realizedLPFee ? trade.priceImpact.subtract(realizedLPFee) : undefined

  // the x*y=k impact
  const priceImpactWithoutFeePercent = priceImpactWithoutFeeFraction
    ? new Percent(priceImpactWithoutFeeFraction?.numerator, priceImpactWithoutFeeFraction?.denominator)
    : undefined

  // the amount of the input that accrues to LPs
  const realizedLPFeeAmount = !trade
    ? undefined
    : realizedLPFee &&
      (trade.inputAmount instanceof TokenAmount
        ? new TokenAmount(trade.inputAmount.token, realizedLPFee.multiply(trade.inputAmount.raw).quotient)
        : CurrencyAmount.nativeCurrency(realizedLPFee.multiply(trade.inputAmount.raw).quotient, trade.chainId))
  return {
    priceImpactWithoutFee: priceImpactWithoutFeePercent,
    realizedLPFee: realizedLPFee ? new Percent(realizedLPFee.numerator, realizedLPFee.denominator) : undefined,
    realizedLPFeeAmount
  }
}

// calculates teh protocol fee for a pair and amount
export function calculateProtocolFee(
  pair: Pair | null | undefined,
  amount?: CurrencyAmount,
  chainId?: number
): { protocolFee?: Fraction; protocolFeeAmount?: CurrencyAmount } {
  const protocolFee = pair ? new Percent(pair.swapFee, _100).divide(pair.protocolFeeDenominator) : undefined

  // the amount of the input that accrues to LPs
  const protocolFeeAmount =
    protocolFee && amount && chainId
      ? amount instanceof TokenAmount
        ? new TokenAmount(amount.token, protocolFee.multiply(amount.raw).divide(_10000).quotient)
        : CurrencyAmount.nativeCurrency(protocolFee.multiply(amount.raw).divide(_10000).quotient, chainId)
      : undefined

  return { protocolFee, protocolFeeAmount }
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

export function sortTradesByExecutionPrice(trades: (Trade | undefined)[]): (Trade | undefined)[] {
  return trades.sort((a, b) => {
    if (a === undefined || a === null) {
      return 1
    }
    if (b === undefined || b === null) {
      return -1
    }

    if (a.executionPrice.lessThan(b.executionPrice)) {
      return 1
    } else if (a.executionPrice.equalTo(b.executionPrice)) {
      return 0
    } else {
      return -1
    }
  })
}

export function getLpTokenPrice(
  pair: Pair,
  nativeCurrency: Currency,
  totalSupply: string,
  reserveNativeCurrency: string
): Price {
  const decimalTotalSupply = new Decimal(totalSupply)
  // the following check avoids division by zero when total supply is zero
  // (case in which a pair has been created but liquidity has never been proviided)
  const priceDenominator = decimalTotalSupply.isZero()
    ? '1'
    : parseUnits(
        new Decimal(totalSupply).toFixed(pair.liquidityToken.decimals),
        pair.liquidityToken.decimals
      ).toString()
  return new Price(
    pair.liquidityToken,
    nativeCurrency,
    priceDenominator,
    parseUnits(new Decimal(reserveNativeCurrency).toFixed(nativeCurrency.decimals), nativeCurrency.decimals).toString()
  )
}
