import { Currency, CurrencyAmount, Fraction, Price } from '@uniswap/sdk-core'
import { parseUnits } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { useMemo } from 'react'

export enum LimitPriceErrorType {
  CALCULATION_ERROR = 'CALCULATION_ERROR',
  BELOW_MARKET = 'BELOW_MARKET',
}

type CurrentPriceAdjustmentResult =
  | { currentPriceAdjustment: number; priceError?: LimitPriceErrorType.BELOW_MARKET }
  | { currentPriceAdjustment: undefined; priceError: LimitPriceErrorType.CALCULATION_ERROR }

export function useCurrentPriceAdjustment({
  parsedLimitPrice,
  marketPrice,
  baseCurrency,
  quoteCurrency,
  limitPriceInverted,
}: {
  parsedLimitPrice?: Price<Currency, Currency>
  marketPrice?: Price<Currency, Currency>
  baseCurrency?: Currency
  quoteCurrency?: Currency
  limitPriceInverted: boolean
}): CurrentPriceAdjustmentResult {
  return useMemo(() => {
    if (
      !parsedLimitPrice ||
      !marketPrice ||
      !baseCurrency ||
      !quoteCurrency ||
      !parsedLimitPrice.baseCurrency.equals(baseCurrency)
    ) {
      return { currentPriceAdjustment: undefined, priceError: LimitPriceErrorType.CALCULATION_ERROR }
    }
    const oneUnitOfBaseCurrency = CurrencyAmount.fromRawAmount(
      baseCurrency,
      JSBI.BigInt(parseUnits('1', baseCurrency.decimals)),
    )

    const marketQuote = marketPrice.quote(oneUnitOfBaseCurrency)
    const parsedPriceQuote = parsedLimitPrice.quote(oneUnitOfBaseCurrency)
    const decimalsScalar = JSBI.exponentiate(JSBI.BigInt(10), JSBI.BigInt(18))

    const scaledMarketQuote = JSBI.BigInt(marketQuote.multiply(decimalsScalar).toFixed(0))
    const scaledPriceQuote = JSBI.BigInt(parsedPriceQuote.multiply(decimalsScalar).toFixed(0))

    const difference = JSBI.subtract(scaledPriceQuote, scaledMarketQuote)
    const percentageChange = new Fraction(difference, scaledMarketQuote)

    const currentPriceAdjustment = Math.round(Number(percentageChange.multiply(100).toFixed(2)))

    const priceBelowMarket = limitPriceInverted ? currentPriceAdjustment > 0 : currentPriceAdjustment < 0

    return {
      currentPriceAdjustment,
      priceError: priceBelowMarket ? LimitPriceErrorType.BELOW_MARKET : undefined,
    }
  }, [parsedLimitPrice, marketPrice, baseCurrency, quoteCurrency, limitPriceInverted])
}
