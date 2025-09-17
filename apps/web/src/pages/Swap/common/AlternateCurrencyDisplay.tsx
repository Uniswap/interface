import { Currency } from '@juiceswapxyz/sdk-core'
import { ReversedArrowsIcon } from 'nft/components/iconExports'

import { ClickableTamaguiStyle } from 'theme/components/styles'
import { Flex, Text, useSporeColors } from 'ui/src'
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
  const colors = useSporeColors()

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
      <ReversedArrowsIcon color={colors.neutral2.val} size="16px" />
    </Flex>
  )
}
