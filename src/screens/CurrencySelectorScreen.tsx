import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { SwapStackParamList } from 'src/app/navigation/types'
import { CurrencySearch } from 'src/components/CurrencySelector/CurrencySearch'
import { Screen } from 'src/components/layout/Screen'
import { Screens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<SwapStackParamList, Screens.CurrencySelector>

export function CurrencySelectorScreen({
  navigation,
  route: {
    params: { onSelectCurrency },
  },
}: Props) {
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
