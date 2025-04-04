import { Currency, Price } from '@uniswap/sdk-core'
import tryParseCurrencyAmount from 'lib/utils/tryParseCurrencyAmount'
import { Text, TextProps } from 'ui/src'
import { useUSDCValue } from 'uniswap/src/features/transactions/swap/hooks/useUSDCPrice'
import { NumberType, useFormatter } from 'utils/formatNumbers'

export function BaseQuoteFiatAmount({
  price,
  base,
  quote,
  variant,
}: {
  price?: Price<Currency, Currency>
  base?: Currency
  quote?: Currency
  variant?: TextProps['variant']
}) {
  const { formatCurrencyAmount, formatPrice } = useFormatter()
  const quoteCurrencyAmount = tryParseCurrencyAmount(price?.toFixed(), price?.quoteCurrency)
  const usdPrice = useUSDCValue(quoteCurrencyAmount)

  if (!price || !base || !quote) {
    return null
  }

  return (
    <>
      <Text variant={variant ?? 'body3'} color="$neutral1">
        {formatPrice({ price, type: NumberType.TokenTx })} {quote?.symbol} = 1 {base?.symbol}
      </Text>{' '}
      <Text variant={variant ?? 'body3'} color="$neutral2">
        (
        {formatCurrencyAmount({
          amount: usdPrice,
          type: NumberType.FiatTokenPrice,
        })}
        )
      </Text>
    </>
  )
}
