import { ComponentProps, memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, getContrastPassingTextColor, getHoverCssFilter, Text, TouchableArea, useIsDarkMode } from 'ui/src'
import { PRESS_SCALE } from 'ui/src/components/buttons/Button/components/CustomButtonFrame/constants'
import { RotatableChevron } from 'ui/src/components/icons/RotatableChevron'
import { iconSizes, spacing, validColor } from 'ui/src/theme'
import { CurrencyLogo } from 'uniswap/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { TestIDType } from 'uniswap/src/test/fixtures/testIDs'
import { getSymbolDisplayText } from 'uniswap/src/utils/currency'
import { isMobileWeb, isWebApp, isWebPlatform } from 'utilities/src/platform'

interface SelectTokenButtonProps {
  onPress?: () => void
  selectedCurrencyInfo?: CurrencyInfo | null
  testID?: TestIDType
  tokenColor?: string
}

export const SelectTokenButton = memo(function _SelectTokenButton({
  selectedCurrencyInfo,
  onPress,
  testID,
  tokenColor,
}: SelectTokenButtonProps): JSX.Element {
  const { t } = useTranslation()
  const isDarkMode = useIsDarkMode()
  const validTokenColor = validColor(tokenColor)
  const hoverStyle: { backgroundColor: ComponentProps<typeof Flex>['backgroundColor'] } = useMemo(
    () => ({
      backgroundColor: selectedCurrencyInfo ? '$surface1Hovered' : (validTokenColor ?? '$accent1Hovered'),
      filter: validTokenColor ? getHoverCssFilter({ isDarkMode }) : undefined,
    }),
    [selectedCurrencyInfo, validTokenColor, isDarkMode],
  )

  const isCompact = !isWebApp || isMobileWeb

  if (!onPress && selectedCurrencyInfo) {
    return (
      <Flex centered row gap="$spacing4" p="$spacing4" pr={isWebPlatform ? undefined : '$spacing12'}>
        <CurrencyLogo currencyInfo={selectedCurrencyInfo} size={iconSizes.icon28} />
        <Text color="$neutral1" pl="$spacing4" testID={`${testID}-label`} variant="buttonLabel1">
          {getSymbolDisplayText(selectedCurrencyInfo.currency.symbol)}
        </Text>
      </Flex>
    )
  }

  const textColor = selectedCurrencyInfo ? '$neutral1' : tokenColor ? getContrastPassingTextColor(tokenColor) : '$white'
  const chevronColor = selectedCurrencyInfo ? '$neutral2' : textColor

  return (
    <TouchableArea
      backgroundColor={selectedCurrencyInfo ? '$surface1' : (validTokenColor ?? '$accent1')}
      borderRadius="$roundedFull"
      testID={testID}
      borderColor="$surface3Solid"
      borderWidth="$spacing1"
      shadowColor="$surface3"
      shadowRadius={10}
      shadowOpacity={0.04}
      scaleTo={PRESS_SCALE}
      hoverable={!!selectedCurrencyInfo}
      hoverStyle={hoverStyle}
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
