import { Currency, Price } from '@uniswap/sdk-core'
import { PriceOrdering } from 'components/Liquidity/types'
import useIsTickAtLimit from 'hooks/useIsTickAtLimit'
import { Bound } from 'state/mint/v3/actions'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

function calculateInvertedValues({
  priceLower,
  priceUpper,
  quote,
  base,
  invert,
}: {
  priceLower?: Price<Currency, Currency>
  priceUpper?: Price<Currency, Currency>
  quote?: Currency
  base?: Currency
  invert?: boolean
}): {
  priceLower?: Price<Currency, Currency>
  priceUpper?: Price<Currency, Currency>
  quote?: Currency
  base?: Currency
} {
  return {
    priceUpper: invert ? priceLower?.invert() : priceUpper,
    priceLower: invert ? priceUpper?.invert() : priceLower,
    quote: invert ? base : quote,
    base: invert ? quote : base,
  }
}

function useFormatTickPrice({
  price,
  atLimit,
  direction,
}: {
  price?: Price<Currency, Currency>
  atLimit: { [bound in Bound]?: boolean | undefined }
  direction: Bound
}): string {
  const { formatNumberOrString } = useLocalizationContext()

  if (atLimit[direction]) {
    return direction === Bound.LOWER ? '0' : '∞'
  }

  if (!price) {
    return '-'
  }

  return formatNumberOrString({
    value: price.toSignificant(),
    type: NumberType.TokenTx,
  })
}

export function useGetRangeDisplay({
  priceOrdering,
  pricesInverted,
  tickSpacing,
  tickLower,
  tickUpper,
}: {
  priceOrdering: PriceOrdering
  tickSpacing?: number
  tickLower?: number
  tickUpper?: number
  pricesInverted: boolean
}): {
  minPrice: string
  maxPrice: string
  tokenASymbol?: string
  tokenBSymbol?: string
  isFullRange?: boolean
} {
  const { priceLower, priceUpper, base, quote } = calculateInvertedValues({
    ...priceOrdering,
    invert: pricesInverted,
  })

  const isTickAtLimit = useIsTickAtLimit({ tickSpacing, tickLower, tickUpper })

  const minPrice = useFormatTickPrice({
    price: priceLower,
    atLimit: isTickAtLimit,
    direction: Bound.LOWER,
  })
  const maxPrice = useFormatTickPrice({
    price: priceUpper,
    atLimit: isTickAtLimit,
    direction: Bound.UPPER,
  })
  const tokenASymbol = quote?.symbol
  const tokenBSymbol = base?.symbol

  return {
    minPrice,
    maxPrice,
    tokenASymbol,
    tokenBSymbol,
    isFullRange: isTickAtLimit[Bound.LOWER] && isTickAtLimit[Bound.UPPER],
  }
}
