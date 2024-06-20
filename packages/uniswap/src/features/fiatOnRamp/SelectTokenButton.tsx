import { Flex, SpinningLoader, Text, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes, spacing } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { ElementName } from 'uniswap/src/features/telemetry/constants'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'

interface SelectTokenButtonProps {
  onPress: () => void
  selectedCurrencyInfo: CurrencyInfo
  formattedAmount: string
  amountReady?: boolean
  disabled?: boolean
  loading?: boolean
  showCaret?: boolean
}

export function SelectTokenButton({
  selectedCurrencyInfo,
  onPress,
  formattedAmount,
  amountReady,
  disabled,
  loading,
  showCaret = true,
}: SelectTokenButtonProps): JSX.Element {
  const textColor = !amountReady || disabled || loading ? '$neutral3' : '$neutral2'

  return (
    <TouchableArea
      hapticFeedback
      borderRadius="$roundedFull"
      disabled={disabled}
      testID={ElementName.TokenSelectorToggle}
      onPress={onPress}>
      <Flex centered row flexDirection="row" gap="$none" p="$spacing4">
        {loading ? (
          <SpinningLoader />
        ) : (
          <CurrencyLogo
            currencyInfo={selectedCurrencyInfo}
            networkLogoBorderWidth={spacing.spacing1}
            size={iconSizes.icon24}
          />
        )}
        <Text color={textColor} pl="$spacing8" variant="body1">
          {formattedAmount}
        </Text>
        <Text color={textColor} pl="$spacing1" variant="body1">
          {getSymbolDisplayText(selectedCurrencyInfo.currency.symbol)}
        </Text>
        {showCaret && (
          <RotatableChevron color={textColor} direction="end" height={iconSizes.icon16} />
        )}
      </Flex>
    </TouchableArea>
  )
}
