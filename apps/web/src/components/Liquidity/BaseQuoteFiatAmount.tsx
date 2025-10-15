import { Currency, Price } from '@uniswap/sdk-core'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { Text, TextProps } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPrice'
import { NumberType } from 'utilities/src/format/types'

export function BaseQuoteFiatAmount({
  price,
  base,
  quote,
  variant,
}: {
  price?: Price<Currency, Currency>
  base: Maybe<Currency>
  quote: Maybe<Currency>
  variant?: TextProps['variant']
}) {
  const { formatNumberOrString, convertFiatAmountFormatted } = useLocalizationContext()
  const quoteCurrencyAmount = tryParseCurrencyAmount(price?.toFixed(), price?.quoteCurrency)
  const usdPrice = useUSDCValue(quoteCurrencyAmount)

  if (!price || !base || !quote) {
    return null
  }

  return (
    <>
      <Text variant={variant ?? 'body3'} color="$neutral1">
        {formatNumberOrString({ value: price.toSignificant(), type: NumberType.TokenTx })} {quote.symbol} = 1{' '}
        {base.symbol}
      </Text>{' '}
      <Text variant={variant ?? 'body3'} color="$neutral2">
        ({convertFiatAmountFormatted(usdPrice?.toExact(), NumberType.FiatTokenPrice)})
      </Text>
    </>
  )
}
