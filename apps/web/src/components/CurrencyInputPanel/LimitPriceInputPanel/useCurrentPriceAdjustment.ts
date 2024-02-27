import { Currency, CurrencyAmount, Fraction, Price } from '@uniswap/sdk-core'
import { parseUnits } from 'ethers/lib/utils'
import JSBI from 'jsbi'
import { useMemo } from 'react'

type CurrentPriceAdjustmentResult =
  | { currentPriceAdjustment: number; priceError: boolean }
  | { currentPriceAdjustment: undefined; priceError: false }

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
      return { currentPriceAdjustment: undefined, priceError: false }
    }
    const oneUnitOfBaseCurrency = CurrencyAmount.fromRawAmount(
      baseCurrency,
      JSBI.BigInt(parseUnits('1', baseCurrency?.decimals))
    )
    const marketQuote = marketPrice.quote(oneUnitOfBaseCurrency).quotient
    const parsedPriceQuote = parsedLimitPrice.quote(oneUnitOfBaseCurrency).quotient
    const difference = JSBI.subtract(parsedPriceQuote, marketQuote)
    const percentageChange = new Fraction(difference, marketQuote)
    const currentPriceAdjustment = Math.floor(Number(percentageChange.multiply(100).toFixed(2)))
    return {
      currentPriceAdjustment,
      priceError: limitPriceInverted ? (currentPriceAdjustment ?? 0) > 0 : (currentPriceAdjustment ?? 0) < 0,
    }
  }, [parsedLimitPrice, marketPrice, baseCurrency, quoteCurrency, limitPriceInverted])
}
