import { Currency } from '@uniswap/sdk-core'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { ActivityIndicator, ScrollView } from 'react-native'
import { AppStackScreenProp } from 'src/app/navigation/types'
import { BackButton } from 'src/components/buttons/BackButton'
import { CurrencyLogo } from 'src/components/CurrencyLogo'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Screen } from 'src/components/layout/Screen'
import { PriceChart } from 'src/components/PriceChart'
import { Text } from 'src/components/Text'
import { TokenBalanceItem } from 'src/components/TokenBalanceList/TokenBalanceItem'
import { useTokenBalance } from 'src/features/balances/hooks'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'

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

export function TokenDetailsScreen({ route }: AppStackScreenProp<Screens.TokenDetails>) {
  const { currency } = route.params

  const activeAccount = useActiveAccount()
  const [balance, loading] = useTokenBalance(
    currency.isToken ? currency : undefined,
    activeAccount?.address
  )

  const { t } = useTranslation()

  return (
    <Screen>
      <TokenDetailsHeader currency={currency} />
      <CenterBox>
        <Text variant="h4" color="gray200">
          {currency.name ?? t('Unknown token')}
        </Text>
      </CenterBox>
      <ScrollView>
        <PriceChart token={currency.wrapped} />
        <Box mx="lg" mt="xl">
          <Text variant="h4" color="gray200">
            {t('Your balance')}
          </Text>
          {loading ? (
            balance && <TokenBalanceItem currencyAmount={balance} />
          ) : (
            <ActivityIndicator color="grey" animating={loading} />
          )}
        </Box>
      </ScrollView>
    </Screen>
  )
}
