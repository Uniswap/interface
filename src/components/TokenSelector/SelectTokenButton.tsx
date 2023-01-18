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
      borderRadius="full"
      name={ElementName.TokenSelectorToggle}
      testID={`currency-selector-toggle-${showNonZeroBalancesOnly ? 'in' : 'out'}`}
      onPress={onPress}>
      {selectedCurrencyInfo ? (
        <Flex centered row flexDirection="row" gap="xxs" p="xxs">
          <CurrencyLogo currencyInfo={selectedCurrencyInfo} size={iconSizes.xl} />
          <Text color="textPrimary" pl="xxs" variant="buttonLabelLarge">
            {selectedCurrencyInfo.currency.symbol}
          </Text>
          <Chevron color={theme.colors.textTertiary} direction="e" />
        </Flex>
      ) : (
        <Flex centered row py="xxs">
          <Flex centered row gap="xs" pl="sm" pr="xs" py="xxxs">
            <Text color="textOnBrightPrimary" variant="buttonLabelLarge">
              {t('Choose token')}
            </Text>
            <Chevron color={theme.colors.textOnBrightPrimary} direction="e" />
          </Flex>
        </Flex>
      )}
    </TouchableArea>
  )
}
