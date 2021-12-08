import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { CurrencySearch } from 'src/components/CurrencySelector/CurrencySearch'
import { Screen } from 'src/components/layout/Screen'
import { Screens } from 'src/screens/Screens'

export function CurrencySelectorScreen({
  navigation,
  route: {
    params: { onSelectCurrency },
  },
}: AppStackScreenProp<Screens.CurrencySelector>) {
  return (
    <Screen>
      <CurrencySearch
        onSelectCurrency={(currency: Currency) => {
          onSelectCurrency(currency)
          navigation.goBack()
        }}
      />
    </Screen>
  )
}
