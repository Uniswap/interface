import { Currency, Price } from '@uniswap/sdk-core'
import { Text, TextProps } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPriceWrapper'
import { NumberType } from 'utilities/src/format/types'
import tryParseCurrencyAmount from '~/lib/utils/tryParseCurrencyAmount'

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
  const quoteCurrencyAmount = tryParseCurrencyAmount(price?.toFixed(), price?.quoteCurrency)
  const usdPrice = useUSDCValue(quoteCurrencyAmount)

  if (!price || !base || !quote) {
    return null
  }

  return (
    <Text>
      <Text variant={variant ?? 'body3'} color="$neutral1">
        {condenseConversion
          ? `${formatNumberOrString({ value: price.toSignificant(), type: NumberType.TokenTx })} ${quote.symbol}/${base.symbol}`
          : `${formatNumberOrString({ value: price.toSignificant(), type: NumberType.TokenTx })} ${quote.symbol} = 1 ${base.symbol}`}
      </Text>{' '}
      <Text variant={variant ?? 'body3'} color="$neutral2">
        ({convertFiatAmountFormatted(usdPrice?.toExact(), NumberType.FiatTokenPrice)})
      </Text>
    </Text>
  )
}
