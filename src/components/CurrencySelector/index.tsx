import { useTheme } from '@shopify/restyle'
import { Currency } from '@uniswap/sdk-core'
import { selectionAsync } from 'expo-haptics'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Toggle } from 'src/components/CurrencySelector/Toggle'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Text } from 'src/components/Text'
import { Theme } from 'src/styles/theme'

interface CurrencySelectorProps {
  showNonZeroBalancesOnly?: boolean
  onPress: () => void
  selectedCurrency?: Currency | null
}

export function CurrencySelector({
  showNonZeroBalancesOnly,
  selectedCurrency,
  onPress,
}: CurrencySelectorProps) {
  const { t } = useTranslation()
  const theme = useTheme<Theme>()

  const selectCurrency = () => {
    selectionAsync()
    onPress()
  }

  return (
    <Box>
      <Toggle
        backgroundColor={!selectedCurrency ? 'accentActive' : 'backgroundAction'}
        borderRadius="xl"
        filled={!selectedCurrency}
        testID={`currency-selector-toggle-${showNonZeroBalancesOnly ? 'in' : 'out'}`}
        onToggle={() => {
          selectCurrency()
        }}>
        <CenterBox>
          {selectedCurrency ? (
            <Flex centered row flexDirection="row" gap="xs" pl="xxs" pr="xs" py="xxs">
              <CurrencyLogo currency={selectedCurrency} size={28} />
              <Text color="textPrimary" variant="largeLabel">
                {selectedCurrency.symbol}
              </Text>
              <Chevron color={theme.colors.textPrimary} direction="e" />
            </Flex>
          ) : (
            <Flex centered row gap="xs" p="xs" paddingLeft="sm">
              <Text color="accentTextLightPrimary" lineHeight={20} variant="mediumLabel">
                {t('Choose token')}
              </Text>
              <Chevron color={theme.colors.textPrimary} direction="e" />
            </Flex>
          )}
        </CenterBox>
      </Toggle>
    </Box>
  )
}
