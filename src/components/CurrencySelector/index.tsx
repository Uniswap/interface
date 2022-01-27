import { Currency } from '@uniswap/sdk-core'
import { selectionAsync } from 'expo-haptics'
import React, { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { CurrencySearch } from 'src/components/CurrencySelector/CurrencySearch'
import { Toggle } from 'src/components/CurrencySelector/Toggle'
import { Chevron } from 'src/components/icons/Chevron'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Text } from 'src/components/Text'
import { Screens } from 'src/screens/Screens'
import { currencyId } from 'src/utils/currencyId'

interface CurrencySelectorProps {
  showNonZeroBalancesOnly?: boolean
  onSelectCurrency: ComponentProps<typeof CurrencySearch>['onSelectCurrency']
  otherSelectedCurrency?: Currency | null
  selectedCurrency?: Currency | null
}

export function CurrencySelector({
  showNonZeroBalancesOnly,
  onSelectCurrency,
  otherSelectedCurrency,
  selectedCurrency,
}: CurrencySelectorProps) {
  const navigation = useAppStackNavigation()

  const { t } = useTranslation()

  const selectCurrency = () => {
    selectionAsync()
    navigation.navigate(Screens.CurrencySelector, {
      onSelectCurrency,
      otherCurrencyAddress: otherSelectedCurrency ? currencyId(otherSelectedCurrency) : undefined,
      otherCurrencyChainId: otherSelectedCurrency?.chainId,
      selectedCurrencyAddress: selectedCurrency ? currencyId(selectedCurrency) : undefined,
      selectedCurrencyChainId: selectedCurrency?.chainId,
      showNonZeroBalancesOnly: Boolean(showNonZeroBalancesOnly),
    })
  }

  return (
    <Box>
      <Toggle
        filled={!selectedCurrency}
        onToggle={() => {
          selectCurrency()
        }}>
        <CenterBox>
          {selectedCurrency ? (
            <Flex centered row flexDirection="row" gap="sm" px="sm" py="xs">
              <CurrencyLogo currency={selectedCurrency} size={25} />
              <Text color="black" variant="h3">
                {selectedCurrency.symbol}
              </Text>
              <Chevron color="black" direction="e" height={10} width={16} />
            </Flex>
          ) : (
            <Flex centered row gap="xs" px="md" py="xs">
              <Text color="white" lineHeight={20} variant="h4">
                {t('Select a token')}
              </Text>
              <Chevron color="white" direction="e" height={12} width={12} />
            </Flex>
          )}
        </CenterBox>
      </Toggle>
    </Box>
  )
}
