import React from 'react'
import { useTranslation } from 'react-i18next'
import { Flex, Icons, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { CurrencyLogo } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'
import { getSymbolDisplayText } from 'wallet/src/utils/currency'

interface SelectTokenButtonProps {
  showNonZeroBalancesOnly?: boolean
  onPress: () => void
  selectedCurrencyInfo?: CurrencyInfo | null
}

export function SelectTokenButton({
  showNonZeroBalancesOnly,
  selectedCurrencyInfo,
  onPress,
}: SelectTokenButtonProps): JSX.Element {
  const { t } = useTranslation()
  return (
    <TouchableArea
      hapticFeedback
      bg={selectedCurrencyInfo ? '$surface1' : '$accent1'}
      borderRadius="$roundedFull"
      testID={`currency-selector-toggle-${showNonZeroBalancesOnly ? 'in' : 'out'}`}
      onPress={onPress}>
      {selectedCurrencyInfo ? (
        <Flex centered row gap="$spacing4" p="$spacing4">
          <CurrencyLogo currencyInfo={selectedCurrencyInfo} size={iconSizes.icon28} />
          <Text color="$neutral1" pl="$spacing4" variant="buttonLabelLarge">
            {getSymbolDisplayText(selectedCurrencyInfo.currency.symbol)}
          </Text>
          <Icons.RotatableChevron color="$neutral3" direction="e" />
        </Flex>
      ) : (
        <Flex centered row py="$spacing4">
          <Flex centered row gap="$spacing4" pl="$spacing12" pr="$spacing8" py="$spacing2">
            <Text color="$sporeWhite" variant="buttonLabelLarge">
              {t('Choose a token')}
            </Text>
            <Icons.RotatableChevron color="$sporeWhite" direction="e" />
          </Flex>
        </Flex>
      )}
    </TouchableArea>
  )
}
