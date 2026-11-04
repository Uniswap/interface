import { Currency, CurrencyAmount, Price } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { Bound, useIsTickAtLimit } from 'uniswap/src/features/positions/hooks/useIsTickAtLimit'
import { priceToQuoteAmount } from 'uniswap/src/features/positions/priceToQuoteAmount'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { NumberType } from 'utilities/src/format/types'

const FULL_RANGE_MIN_PRICE = '0'
const FULL_RANGE_MAX_PRICE = '∞'

interface UsePriceRangeUsdParams {
  priceLower?: Price<Currency, Currency>
  priceUpper?: Price<Currency, Currency>
  token0Price?: Price<Currency, Currency>
  token1Price?: Price<Currency, Currency>
  priceInverted: boolean
  tickSpacing?: number
  tickLower?: number
  tickUpper?: number
}

/**
 * Min/Max/Market prices formatted as USD (e.g. "$0.99"). Each price is converted via the same path
 * web uses (price magnitude -> quote-currency amount -> useUSDCValue). Full-range bounds render as
 * "0" / "∞" since they have no meaningful dollar value.
 */
export function usePriceRangeUsd({
  priceLower,
  priceUpper,
  token0Price,
  token1Price,
  priceInverted,
  tickSpacing,
  tickLower,
  tickUpper,
}: UsePriceRangeUsdParams): { minPrice: string; maxPrice: string; marketPrice: string } {
  const { convertFiatAmountFormatted } = useLocalizationContext()
  const isTickAtLimit = useIsTickAtLimit({ tickSpacing, tickLower, tickUpper })

  const lowerAmount = useMemo(
    () => priceToQuoteAmount(priceInverted ? priceUpper?.invert() : priceLower),
    [priceInverted, priceLower, priceUpper],
  )
  const upperAmount = useMemo(
    () => priceToQuoteAmount(priceInverted ? priceLower?.invert() : priceUpper),
    [priceInverted, priceLower, priceUpper],
  )
  const marketAmount = useMemo(
    () => priceToQuoteAmount(priceInverted ? token1Price : token0Price),
    [priceInverted, token0Price, token1Price],
  )

  const lowerUsd = useUSDCValue(lowerAmount)
  const upperUsd = useUSDCValue(upperAmount)
  const marketUsd = useUSDCValue(marketAmount)

  // toExact() floors to the stablecoin's 6 decimals, which would render a sub-$0.000001 token price as $0
  const formatUsd = (value: CurrencyAmount<Currency> | null): string =>
    value ? convertFiatAmountFormatted(value.toSignificant(18), NumberType.FiatTokenPrice) : '-'

  return {
    minPrice: isTickAtLimit[Bound.LOWER] ? FULL_RANGE_MIN_PRICE : formatUsd(lowerUsd),
    maxPrice: isTickAtLimit[Bound.UPPER] ? FULL_RANGE_MAX_PRICE : formatUsd(upperUsd),
    marketPrice: formatUsd(marketUsd),
  }
}
