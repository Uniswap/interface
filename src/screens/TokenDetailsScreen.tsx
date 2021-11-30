import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { HomeStackParamList } from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { PriceChart } from 'src/components/PriceChart'
import { Text } from 'src/components/Text'
import { Screens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<HomeStackParamList, Screens.TokenDetails>

interface TokenDetailsHeaderProps {
  currency: Currency
}

function TokenDetailsHeader({ currency }: TokenDetailsHeaderProps) {
  const { t } = useTranslation()

  return (
    <Box my="md" alignItems="center" justifyContent="space-between" flexDirection="row">
      <BackButton ml="lg" size={30} />
      <Box alignItems="center" flexDirection="row">
        <CurrencyLogo currency={currency} size={30} />
        <Text variant="h2" ml="sm">
          {currency.symbol ?? t('Unknown token')}
        </Text>
      </Box>
      <Box width={40} height={40} mr="lg" />
    </Box>
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
          <Text variant="h3" mb="sm">
            {t`About this token`}
          </Text>
          <Text variant="body">{currency.name ?? t`Unknown name`}</Text>
        </Box>
      </ScrollView>
    </Screen>
  )
}
