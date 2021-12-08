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

interface CurrencySelectorProps {
  onSelectCurrency: ComponentProps<typeof CurrencySearch>['onSelectCurrency']
  selectedCurrency: Currency | null | undefined
  // TODO:
  //  - otherSelectCurrency (to hide)
}

export function CurrencySelector({ onSelectCurrency, selectedCurrency }: CurrencySelectorProps) {
  const navigation = useAppStackNavigation()

  const { t } = useTranslation()

  const selectCurrency = () => {
    navigation.navigate(Screens.CurrencySelector, {
      onSelectCurrency,
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
