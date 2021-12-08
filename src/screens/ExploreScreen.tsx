import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { TabScreenProp } from 'src/app/navigation/types'
import { CurrencySearch } from 'src/components/CurrencySelector/CurrencySearch'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { Screens, Tabs } from 'src/screens/Screens'

export function ExploreScreen({ navigation }: TabScreenProp<Tabs.Explore>) {
  const { t } = useTranslation()

  const onPressCurrency = (currency: Currency) => {
    navigation.navigate(Screens.TokenDetails, { currency })
  }

  return (
    <Screen>
      <Box mx="lg" my="lg">
        <Text variant="h3">{t('Explore')}</Text>
      </Box>
      <CenterBox flex={1}>
        <CurrencySearch onSelectCurrency={onPressCurrency} />
      </CenterBox>
    </Screen>
  )
}
