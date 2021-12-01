import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { HomeStackParamList } from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Screen } from 'src/components/layout/Screen'
import { PriceChart } from 'src/components/PriceChart'
import { Text } from 'src/components/Text'
import { TokenBalanceItem } from 'src/components/TokenBalanceList/TokenBalanceItem'
import { Screens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<HomeStackParamList, Screens.TokenDetails>

interface TokenDetailsHeaderProps {
  currency: Currency
}

function TokenDetailsHeader({ currency }: TokenDetailsHeaderProps) {
  const { t } = useTranslation()

  return (
    <CenterBox flexDirection="row" my="md" justifyContent="space-between">
      <BackButton ml="lg" size={30} />
      <Box alignItems="center" flexDirection="row">
        <CurrencyLogo currency={currency} size={30} />
        <Text variant="h2" ml="sm">
          {currency.symbol ?? t('Unknown token')}
        </Text>
      </Box>
      <Box width={40} height={40} mr="lg" />
    </CenterBox>
  )
}

export function TokenDetailsScreen({ route }: Props) {
  const { currencyAmount } = route.params
  const { currency } = currencyAmount

  const { t } = useTranslation()

  return (
    <Screen>
      <TokenDetailsHeader currency={currency} />
      <ScrollView>
        <PriceChart token={currency.wrapped} />
        <Box mx="lg" mt="xl">
          <Text variant="h4" color="gray200">
            {t('Your balance')}
          </Text>
          <TokenBalanceItem currencyAmount={currencyAmount} />
        </Box>
      </ScrollView>
    </Screen>
  )
}
