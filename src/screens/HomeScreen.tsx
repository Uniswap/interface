import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React from 'react'
import { HomeStackParamList } from 'src/app/navigation/types'
import Bell from 'src/assets/icons/bell.svg'
import Settings from 'src/assets/icons/settings.svg'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { TokenBalanceList } from 'src/components/TokenBalanceList'
import { ChainId } from 'src/constants/chains'
import { useEthBalance, useTokenBalances } from 'src/features/balances/hooks'
import { useAllTokens } from 'src/features/tokens/useTokens'
import { TransactionNotificationBanner } from 'src/features/transactions/Notification'
import { useTestAccount } from 'src/features/wallet/accounts/useTestAccount'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<HomeStackParamList, Screens.Accounts>

export function HomeScreen({ navigation }: Props) {
  const currentChain = ChainId.RINKEBY // Temporarily Rinkeby, change to ChainId.MAINNET

  // imports test account for easy development/testing
  useTestAccount()

  const activeAccount = useActiveAccount()
  const chainIdToTokens = useAllTokens()
  const [tokenBalances, tokenBalancesLoading] = useTokenBalances(
    currentChain,
    chainIdToTokens,
    activeAccount?.address
  )

  const ethBalance = useEthBalance(currentChain, activeAccount?.address)

  const onPressToken = (currencyAmount: CurrencyAmount<Currency>) => {
    navigation.navigate(Screens.TokenDetails, { currencyAmount })
  }

  if (!activeAccount)
    return (
      <Screen>
        <Box mx="md" my="sm">
          <AccountHeader />
        </Box>
      </Screen>
    )

  const filteredTokenBalances = tokenBalances
    ? (Object.values(tokenBalances).filter(
        (balance) => balance && balance.greaterThan(0)
      ) as CurrencyAmount<Currency>[])
    : []

  const balances = ethBalance ? [ethBalance, ...filteredTokenBalances] : filteredTokenBalances

  return (
    <Screen>
      <Box flexDirection="row" alignItems="center" justifyContent="space-between" mx="md" my="sm">
        <AccountHeader />
        <Box flexDirection="row" mr="md">
          <Button mr="md">
            <Settings height={24} width={24} />
          </Button>
          <Button onPress={() => navigation.navigate(Screens.Notifications)}>
            <Bell height={24} width={24} />
          </Button>
        </Box>
      </Box>
      <TransactionNotificationBanner />
      <TokenBalanceList
        loading={tokenBalancesLoading}
        balances={balances}
        onPressToken={onPressToken}
      />
    </Screen>
  )
}
