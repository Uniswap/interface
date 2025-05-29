import { Currency } from '@uniswap/sdk-core'

import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Flex, Text } from 'ui/src'
import { ArrowUpDown } from 'ui/src/components/icons/ArrowUpDown'
import { useAppFiatCurrencyInfo } from 'uniswap/src/features/fiatCurrency/hooks'
import { useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { NumberType } from 'utilities/src/format/types'

export const AlternateCurrencyDisplay = ({
  inputCurrency,
  inputInFiat,
  exactAmountOut,
  disabled,
  onToggle,
}: {
  inputCurrency?: Currency
  inputInFiat: boolean
  exactAmountOut?: string
  disabled?: boolean
  onToggle: () => void
}) => {
  const { formatNumberOrString, addFiatSymbolToNumber } = useLocalizationContext()
  const activeCurrency = useAppFiatCurrencyInfo()

  const formattedAlternateCurrency = inputInFiat
    ? `${formatNumberOrString({
        value: exactAmountOut || '0',
        type: NumberType.TokenNonTx,
      })} ${inputCurrency?.symbol}`
    : addFiatSymbolToNumber({
        value: exactAmountOut || '0',
        currencyCode: activeCurrency.code,
        currencySymbol: activeCurrency.symbol,
      })

  if (!inputCurrency) {
    return null
  }

  return (
    <Flex
      row
      alignItems="center"
      justifyContent="center"
      gap="$gap4"
      onPress={disabled ? undefined : onToggle}
      {...(!disabled ? ClickableTamaguiStyle : {})}
    >
      <Text variant="body2" color="neutral3">
        {formattedAlternateCurrency}
      </Text>
      <ArrowUpDown color="$neutral3" size="$icon.16" />
    </Flex>
  )
}
