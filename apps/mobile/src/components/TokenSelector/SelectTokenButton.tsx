import { useTheme } from '@shopify/restyle'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { iconSizes } from 'ui/src/theme/iconSizes'
import { Theme } from 'ui/src/theme/restyle/theme'
import { CurrencyLogo } from 'wallet/src/components/CurrencyLogo/CurrencyLogo'
import { CurrencyInfo } from 'wallet/src/features/dataApi/types'

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
  const theme = useTheme<Theme>()

  return (
    <TouchableArea
      hapticFeedback
      bg={selectedCurrencyInfo ? 'surface1' : 'accent1'}
      borderRadius="roundedFull"
      testID={`currency-selector-toggle-${showNonZeroBalancesOnly ? 'in' : 'out'}`}
      onPress={onPress}>
      {selectedCurrencyInfo ? (
        <Flex centered row flexDirection="row" gap="spacing4" p="spacing4">
          <CurrencyLogo currencyInfo={selectedCurrencyInfo} size={iconSizes.icon28} />
          <Text color="neutral1" pl="spacing4" variant="buttonLabelLarge">
            {selectedCurrencyInfo.currency.symbol}
          </Text>
          <Chevron color={theme.colors.neutral3} direction="e" />
        </Flex>
      ) : (
        <Flex centered row py="spacing4">
          <Flex centered row gap="spacing4" pl="spacing12" pr="spacing8" py="spacing2">
            <Text color="sporeWhite" variant="buttonLabelLarge">
              {t('Choose a token')}
            </Text>
            <Chevron color={theme.colors.sporeWhite} direction="e" />
          </Flex>
        </Flex>
      )}
    </TouchableArea>
  )
}
