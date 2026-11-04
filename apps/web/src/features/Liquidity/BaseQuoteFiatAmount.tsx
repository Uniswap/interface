import { Currency, Price } from '@uniswap/sdk-core'
import { Text, type TextCompatProps as TextProps } from '@universe/mycelium'
import { useCurrentLocale } from 'uniswap/src/features/language/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { formatPositionPrice } from 'uniswap/src/features/positions/formatPositionPrice'
import { priceToQuoteAmount } from 'uniswap/src/features/positions/priceToQuoteAmount'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { NumberType } from 'utilities/src/format/types'

export function BaseQuoteFiatAmount({
  price,
  base,
  quote,
  variant,
  condenseConversion = false,
}: {
  price?: Price<Currency, Currency>
  base: Maybe<Currency>
  quote: Maybe<Currency>
  variant?: TextProps['variant']
  condenseConversion?: boolean
}) {
  const { formatNumberOrString, convertFiatAmountFormatted } = useLocalizationContext()
  const locale = useCurrentLocale()
  const quoteCurrencyAmount = priceToQuoteAmount(price)
  const usdPrice = useUSDCValue(quoteCurrencyAmount)

  if (!price || !base || !quote) {
    return null
  }

  const formattedPrice = formatPositionPrice({ value: price.toSignificant(), locale, formatNumberOrString })

  return (
    <Text>
      <Text variant={variant ?? 'body3'} color="$neutral1">
        {condenseConversion
          ? `${formattedPrice} ${quote.symbol}/${base.symbol}`
          : `${formattedPrice} ${quote.symbol} = 1 ${base.symbol}`}
      </Text>{' '}
      <Text variant={variant ?? 'body3'} color="$neutral2">
        {/* toExact() floors to the stablecoin's 6 decimals, which would render a sub-$0.000001 token price as $0 */}(
        {convertFiatAmountFormatted(usdPrice?.toSignificant(18), NumberType.FiatTokenPrice)})
      </Text>
    </Text>
  )
}
