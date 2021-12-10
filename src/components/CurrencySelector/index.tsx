import { Currency } from '@uniswap/sdk-core'
import React, { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { CurrencySearch } from 'src/components/CurrencySelector/CurrencySearch'
import { Toggle } from 'src/components/CurrencySelector/Toggle'
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
        onToggle={() => {
          selectCurrency()
        }}
        filled={!selectedCurrency}>
        <CenterBox px="sm" height={25}>
          {selectedCurrency ? (
            <CenterBox flexDirection="row">
              <CurrencyLogo currency={selectedCurrency} size={30} />
              <Text variant="h3" color="black" ml="sm">
                {selectedCurrency.symbol}
              </Text>
            </CenterBox>
          ) : (
            <Text variant="body" color="white">{t`Select a token`}</Text>
          )}
        </CenterBox>
      </Toggle>
    </Box>
  )
}
