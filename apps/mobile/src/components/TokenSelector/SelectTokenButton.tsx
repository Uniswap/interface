import { useTheme } from '@shopify/restyle'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { CurrencyInfo } from 'src/features/dataApi/types'
import { ElementName } from 'src/features/telemetry/constants'
import { iconSizes } from 'src/styles/sizing'
import { Theme } from 'src/styles/theme'

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
      bg={selectedCurrencyInfo ? 'background3' : 'magentaVibrant'}
      borderRadius="roundedFull"
      name={ElementName.TokenSelectorToggle}
      testID={`currency-selector-toggle-${showNonZeroBalancesOnly ? 'in' : 'out'}`}
      onPress={onPress}>
      {selectedCurrencyInfo ? (
        <Flex centered row flexDirection="row" gap="spacing4" p="spacing4">
          <CurrencyLogo currencyInfo={selectedCurrencyInfo} size={iconSizes.icon28} />
          <Text color="textPrimary" pl="spacing4" variant="buttonLabelLarge">
            {selectedCurrencyInfo.currency.symbol}
          </Text>
          <Chevron color={theme.colors.textTertiary} direction="e" />
        </Flex>
      ) : (
        <Flex centered row py="spacing4">
          <Flex centered row gap="spacing4" pl="spacing12" pr="spacing8" py="spacing2">
            <Text color="textOnBrightPrimary" variant="buttonLabelLarge">
              {t('Choose a token')}
            </Text>
            <Chevron color={theme.colors.textOnBrightPrimary} direction="e" />
          </Flex>
        </Flex>
      )}
    </TouchableArea>
  )
}
