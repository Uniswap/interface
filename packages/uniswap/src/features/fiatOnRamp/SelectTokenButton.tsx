import { ComponentProps } from 'react'
import { Flex, SpinningLoader, Text, TouchableArea } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes, spacing } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'

interface SelectTokenButtonProps {
  onPress: () => void
  selectedCurrencyInfo: CurrencyInfo
  formattedAmount: string
  amountReady?: boolean
  disabled?: boolean
  loading?: boolean
  iconSize?: number
  backgroundColor?: ComponentProps<typeof TouchableArea>['backgroundColor']
  chevronDirection?: ComponentProps<typeof RotatableChevron>['direction']
  testID?: string
}

export function SelectTokenButton({
  selectedCurrencyInfo,
  onPress,
  formattedAmount,
  amountReady,
  disabled,
  loading,
  iconSize = iconSizes.icon24,
  chevronDirection = 'end',
  testID,
}: SelectTokenButtonProps): JSX.Element {
  const textColor = !amountReady || disabled || loading ? '$neutral3' : '$neutral2'

  return (
    <TouchableArea
      hapticFeedback
      borderRadius="$roundedFull"
      disabled={disabled}
      p="$spacing4"
      testID={testID}
      onPress={onPress}
    >
      <Flex centered row flexDirection="row" gap="$none" pr="$spacing4">
        {loading ? (
          <SpinningLoader />
        ) : (
          <CurrencyLogo currencyInfo={selectedCurrencyInfo} networkLogoBorderWidth={spacing.spacing1} size={iconSize} />
        )}
        <Text color={textColor} pl="$spacing8" variant="body1">
          {formattedAmount}
        </Text>
        <Text color={textColor} pl="$spacing4" variant="body1">
          {getSymbolDisplayText(selectedCurrencyInfo.currency.symbol)}
        </Text>
        <RotatableChevron color={textColor} direction={chevronDirection} height={iconSizes.icon16} />
      </Flex>
    </TouchableArea>
  )
}
