import { Currency, Price } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { Text, TouchableArea } from 'ui/src'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { useUSDCValue } from 'uniswap/src/features/transactions/hooks/useUSDCPriceWrapper'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { NumberType } from 'utilities/src/format/types'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import tryParseCurrencyAmount from '~/lib/utils/tryParseCurrencyAmount'

interface TradePriceProps {
  price: Price<Currency, Currency>
}

export default function TradePrice({ price }: TradePriceProps) {
  const { formatNumberOrString, convertFiatAmountFormatted } = useLocalizationContext()

  const { value: showInverted, toggle } = useBooleanState(false)

  const { baseCurrency, quoteCurrency } = price
  const currencyForUsdPrice = showInverted ? baseCurrency : quoteCurrency
  const currencyAmount = useMemo(() => tryParseCurrencyAmount('1', currencyForUsdPrice), [currencyForUsdPrice])
  const usdValue = useUSDCValue(currencyAmount)

  const formattedPrice = useMemo(() => {
    try {
      return formatNumberOrString({
        value: (showInverted ? price : price.invert()).toSignificant(),
        type: NumberType.TokenTx,
      })
    } catch {
      return '0'
    }
  }, [formatNumberOrString, price, showInverted])

  const label = showInverted ? `${price.quoteCurrency.symbol}` : `${price.baseCurrency.symbol} `
  const labelInverted = showInverted ? `${price.baseCurrency.symbol} ` : `${price.quoteCurrency.symbol}`
  const text = `${'1 ' + labelInverted + ' = ' + formattedPrice} ${label}`

  return (
    <TouchableArea
      testID={TestID.TradePriceToggle}
      row
      variant="unstyled"
      alignItems="center"
      justifyContent="flex-start"
      flexWrap="wrap"
      cursor="pointer"
      userSelect="text"
      maxWidth="100%"
      gap="$gap4"
      onPress={toggle}
      accessibilityLabel={text}
      shouldAutomaticallyInjectColors={false}
      shouldStopPropagation
    >
      <Text variant="body3" color="$neutral1" textAlign="left">
        {text}
      </Text>
      {usdValue && (
        <Text variant="body3" color="$neutral2" textAlign="left">
          ({convertFiatAmountFormatted(usdValue.toExact(), NumberType.FiatTokenPrice)})
        </Text>
      )}
    </TouchableArea>
  )
}
