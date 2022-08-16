import { useTheme } from '@shopify/restyle'
import { Currency } from '@uniswap/sdk-core'
import { selectionAsync } from 'expo-haptics'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Text } from 'src/components/Text'
import { Toggle } from 'src/components/TokenSelector/Toggle'
import { Theme } from 'src/styles/theme'

interface TokenSelectorProps {
  showNonZeroBalancesOnly?: boolean
  onPress: () => void
  selectedCurrency?: Currency | null
}

export function TokenSelector({
  showNonZeroBalancesOnly,
  selectedCurrency,
  onPress,
}: TokenSelectorProps) {
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
        borderRadius="lg"
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
            <Flex centered row py="xxs">
              <Flex centered row gap="xs" pl="sm" pr="xs" py="xxxs">
                <Text color="accentTextLightPrimary" variant="largeLabel">
                  {t('Choose token')}
                </Text>
                <Chevron color={theme.colors.accentTextLightPrimary} direction="e" />
              </Flex>
            </Flex>
          )}
        </CenterBox>
      </Toggle>
    </Box>
  )
}
