import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { CurrencySearch } from 'src/components/CurrencySelector/CurrencySearch'
import { Screen } from 'src/components/layout/Screen'
import { useCurrency } from 'src/features/tokens/useCurrency'
import { Screens } from 'src/screens/Screens'

export function CurrencySelectorScreen({
  navigation,
  route: {
    params: {
      otherCurrencyAddress,
      otherCurrencyChainId,
      selectedCurrencyAddress,
      selectedCurrencyChainId,
      onSelectCurrency,
    },
  },
}: AppStackScreenProp<Screens.CurrencySelector>) {
  const selectedCurrency = useCurrency(selectedCurrencyAddress, selectedCurrencyChainId)
  const otherCurrency = useCurrency(otherCurrencyAddress, otherCurrencyChainId)

  return (
    <Screen>
      <CurrencySearch
        selectedCurrency={selectedCurrency}
        otherCurrency={otherCurrency}
        onSelectCurrency={(currency: Currency) => {
          onSelectCurrency(currency)
          navigation.goBack()
        }}
      />
    </Screen>
  )
}
