import { Currency } from '@uniswap/sdk-core'
import React, { ComponentProps } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppNavigation } from 'src/app/navigation/types'
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
  const navigation = useAppNavigation()

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
        {selectedCurrency ? (
          <CenterBox flexDirection="row">
            <CurrencyLogo currency={selectedCurrency} size={20} />
            <CenterBox flexDirection="row" ml="sm">
              <Text variant="h3" color="black" mr="sm">
                {selectedCurrency.symbol}
              </Text>
              <Text variant="body" color="black">
                {selectedCurrency.chainId}
              </Text>
            </CenterBox>
          </CenterBox>
        ) : (
          <Text variant="body" color="white">{t`Select a token`}</Text>
        )}
      </Toggle>
    </Box>
  )
}
