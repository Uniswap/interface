import { Currency } from '@uniswap/sdk-core'
import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Flex, Text } from 'ui/src'
import { ArrowDownArrowUp } from 'ui/src/components/icons/ArrowDownArrowUp'
import { useAppFiatCurrency } from 'uniswap/src/features/fiatCurrency/hooks'
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
  const { formatNumberOrString } = useLocalizationContext()
  const activeCurrency = useAppFiatCurrency()

  const formattedAlternateCurrency = inputInFiat
    ? `${formatNumberOrString({
        value: exactAmountOut || '0',
        type: NumberType.TokenNonTx,
      })} ${inputCurrency?.symbol}`
    : formatNumberOrString({
        value: exactAmountOut || '0',
        type: NumberType.PortfolioBalance,
        currencyCode: activeCurrency,
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
      <Text variant="body2" color="$neutral2">
        {formattedAlternateCurrency}
      </Text>
      <ArrowDownArrowUp color="$neutral2" size="$icon.16" />
    </Flex>
  )
}
