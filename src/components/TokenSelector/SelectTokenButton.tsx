import { useTheme } from '@shopify/restyle'
import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { TokenLogo } from 'src/components/CurrencyLogo/TokenLogo'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Text } from 'src/components/Text'
import { ElementName } from 'src/features/telemetry/constants'
import { iconSizes } from 'src/styles/sizing'
import { Theme } from 'src/styles/theme'

interface SelectTokenButtonProps {
  showNonZeroBalancesOnly?: boolean
  onPress: () => void
  selectedCurrency?: Currency | null
  selectedCurrencyLogo?: string | null
}

export function SelectTokenButton({
  showNonZeroBalancesOnly,
  selectedCurrency,
  selectedCurrencyLogo,
  onPress,
}: SelectTokenButtonProps) {
  const { t } = useTranslation()
  const theme = useTheme<Theme>()

  return (
    <TouchableArea
      hapticFeedback
      bg={selectedCurrency ? 'background3' : 'magentaVibrant'}
      borderRadius="full"
      name={ElementName.TokenSelectorToggle}
      testID={`currency-selector-toggle-${showNonZeroBalancesOnly ? 'in' : 'out'}`}
      onPress={onPress}>
      {selectedCurrency ? (
        <Flex centered row flexDirection="row" gap="xxs" p="xxs">
          <TokenLogo
            chainId={selectedCurrency.chainId}
            size={iconSizes.xl}
            symbol={selectedCurrency.symbol}
            url={selectedCurrencyLogo}
          />
          <Text color="textPrimary" pl="xxs" variant="buttonLabelLarge">
            {selectedCurrency.symbol}
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
