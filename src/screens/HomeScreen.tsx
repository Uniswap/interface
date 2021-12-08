import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React from 'react'
import { AppStackParamList } from 'src/app/navigation/types'
import Bell from 'src/assets/icons/bell.svg'
import Settings from 'src/assets/icons/settings.svg'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { TokenBalanceList } from 'src/components/TokenBalanceList'
import { useAllBalances } from 'src/features/balances/hooks'
import { useActiveChainIds } from 'src/features/chains/hooks'
import { useAllTokens } from 'src/features/tokens/useTokens'
import { TransactionNotificationBanner } from 'src/features/transactions/Notification'
import { useTestAccount } from 'src/features/wallet/accounts/useTestAccount'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<AppStackParamList, Screens.TabNavigator>

export function HomeScreen({ navigation }: Props) {
  const currentChains = useActiveChainIds()
  // imports test account for easy development/testing
  useTestAccount()
  const activeAccount = useActiveAccount()
  const chainIdToTokens = useAllTokens()
  const balances = useAllBalances(currentChains, chainIdToTokens, activeAccount?.address)

  const onPressToken = (currencyAmount: CurrencyAmount<Currency>) => {
    navigation.navigate(Screens.TokenDetails, { currency: currencyAmount.currency })
  }

  if (!activeAccount)
    return (
      <Screen>
        <Box mx="md" my="sm">
          <AccountHeader />
        </Box>
      </Screen>
    )

  return (
    <Screen>
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" mx="md" my="sm">
        <AccountHeader />
        <Box flexDirection="row" mr="md">
          <Button
            onPress={() => navigation.navigate(Screens.DevStack, { screen: Screens.Dev })}
            mr="md">
            <Settings height={24} width={24} />
          </Button>
          <Button onPress={() => navigation.navigate(Screens.Notifications)}>
            <Bell height={24} width={24} />
          </Button>
        </Box>
      </Box>
      <TransactionNotificationBanner />
      <TokenBalanceList
        loading={balances.length === 0}
        balances={balances}
        onPressToken={onPressToken}
      />
    </Screen>
  )
}
