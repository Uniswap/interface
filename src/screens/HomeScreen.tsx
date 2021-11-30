import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React, { useState } from 'react'
import { HomeStackParamList } from 'src/app/navigation/types'
import Bell from 'src/assets/icons/bell.svg'
import Settings from 'src/assets/icons/settings.svg'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { Button } from 'src/components/buttons/Button'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { PinkToBlueLinear } from 'src/components/gradients/PinkToBlueLinear'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { TokenBalanceList } from 'src/components/TokenBalanceList'
import { ChainId } from 'src/constants/chains'
import { useEthBalance, useTokenBalances } from 'src/features/balances/hooks'
import { useAllTokens } from 'src/features/tokens/useTokens'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { Screens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<HomeStackParamList, Screens.Accounts>

export function HomeScreen({ navigation }: Props) {
  const [currentChain] = useState(ChainId.MAINNET)
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
        <AccountHeader onPressAccounts={() => navigation.navigate(Screens.Accounts)} />
      </Screen>
    )

  const filteredTokenBalances = tokenBalances
    ? (Object.values(tokenBalances).filter(
        (balance) => balance && balance.greaterThan(0)
      ) as CurrencyAmount<Currency>[])
    : []

  const balances = ethBalance ? [ethBalance, ...filteredTokenBalances] : filteredTokenBalances

  return (
    <Box flex={1}>
      <GradientBackground>
        <PinkToBlueLinear />
      </GradientBackground>
      <Box height="100%" width="100%" position="absolute" my="xl">
        <Box flexDirection="row" alignItems="center" justifyContent="space-between">
          <AccountHeader onPressAccounts={() => navigation.navigate(Screens.Accounts)} />
          <Box flexDirection="row" mr="md">
            <Button>
              <Settings height={24} width={24} />
            </Button>
            <Button onPress={() => navigation.navigate(Screens.Notifications)}>
              <Bell height={24} width={24} />
            </Button>
          </Box>
        </Box>
        <TokenBalanceList
          loading={tokenBalancesLoading}
          balances={balances}
          onPressToken={onPressToken}
        />
      </Box>
    </Box>
  )
}
