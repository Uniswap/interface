import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { RootStackParamList } from 'src/app/navTypes'
import { Screens } from 'src/app/Screens'
import ArrowLeft from 'src/assets/arrow-left.svg'
import { Button } from 'src/components/buttons/Button'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { PriceChart } from 'src/components/PriceChart'
import { Text } from 'src/components/Text'
type Props = NativeStackScreenProps<RootStackParamList, Screens.TokenDetails>

interface TokenDetailsHeaderProps {
  currency: Currency
  onPressBack: () => void
}

function TokenDetailsHeader({ currency, onPressBack }: TokenDetailsHeaderProps) {
  return (
    <Box my="md" alignItems="center" justifyContent="space-between" flexDirection="row">
      <Button ml="lg" onPress={onPressBack}>
        <ArrowLeft width={30} height={30} />
      </Button>
      <Box alignItems="center" flexDirection="row">
        <CurrencyLogo currency={currency} size={30} />
        <Text variant="h2" ml="sm">
          {currency.symbol ?? 'Unknown symbol'}
        </Text>
      </Box>
      <Box width={40} height={40} mr="lg" />
    </Box>
  )
}

export function TokenDetailsScreen({ route, navigation }: Props) {
  const { currencyAmount } = route.params
  const { currency } = currencyAmount

  const { t } = useTranslation()
  const onPressBack = () => {
    navigation.goBack()
  }

  return (
    <Screen>
      <TokenDetailsHeader currency={currency} onPressBack={onPressBack} />
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
