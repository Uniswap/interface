import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Text, TouchableArea, isWeb } from 'ui/src'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes, spacing } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { TestIDType } from 'uniswap/src/test/fixtures/testIDs'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { isInterface, isMobileWeb } from 'utilities/src/platform'

interface SelectTokenButtonProps {
  onPress?: () => void
  selectedCurrencyInfo?: CurrencyInfo | null
  testID?: TestIDType
}

export const SelectTokenButton = memo(function _SelectTokenButton({
  selectedCurrencyInfo,
  onPress,
  testID,
}: SelectTokenButtonProps): JSX.Element {
  const { t } = useTranslation()

  const isCompact = !isInterface || isMobileWeb

  if (!onPress && selectedCurrencyInfo) {
    return (
      <Flex centered row gap="$spacing4" p="$spacing4" pr={isWeb ? undefined : '$spacing12'}>
        <CurrencyLogo currencyInfo={selectedCurrencyInfo} size={iconSizes.icon28} />
        <Text color="$neutral1" pl="$spacing4" testID={`${testID}-label`} variant="buttonLabel1">
          {getSymbolDisplayText(selectedCurrencyInfo.currency.symbol)}
        </Text>
      </Flex>
    )
  }

  const textColor = selectedCurrencyInfo ? '$neutral1' : '$white'
  const chevronColor = selectedCurrencyInfo ? '$neutral2' : textColor

  return (
    <TouchableArea
      hapticFeedback
      backgroundColor={selectedCurrencyInfo ? '$surface1' : '$accent1'}
      borderRadius="$roundedFull"
      testID={testID}
      borderColor="$surface3"
      borderWidth={1}
      shadowColor="$surface3"
      shadowRadius={10}
      shadowOpacity={0.04}
      onPress={onPress}
    >
      <Flex centered row gap="$spacing6" px="$spacing12" height="$spacing36">
        {selectedCurrencyInfo && (
          <Flex ml={-spacing.spacing8}>
            <CurrencyLogo currencyInfo={selectedCurrencyInfo} size={iconSizes.icon28} />
          </Flex>
        )}
        <Text color={textColor} testID={`${testID}-label`} variant="buttonLabel2">
          {selectedCurrencyInfo
            ? getSymbolDisplayText(selectedCurrencyInfo.currency.symbol)
            : t('tokens.selector.button.choose')}
        </Text>
        {!isCompact && (
          <RotatableChevron color={chevronColor} direction="down" height="$spacing24" mx={-spacing.spacing2} />
        )}
      </Flex>
    </TouchableArea>
  )
})
