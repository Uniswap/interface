import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React, { useState } from 'react'
import Svg, { Defs, LinearGradient, Rect, Stop } from 'react-native-svg'
import { AccountHeader } from 'src/components/AccountHeader'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { TokenBalanceList } from 'src/components/TokenBalanceList'
import { ChainId } from 'src/constants/chains'
import { useEthBalance, useTokenBalances } from 'src/features/balances/hooks'
import { useAllTokens } from 'src/features/tokens/useTokens'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { RootStackParamList } from 'src/screens/navTypes'
import { Screens } from 'src/screens/Screens'

type Props = NativeStackScreenProps<RootStackParamList, Screens.Accounts>

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
      <Screen backgroundColor="mainBackground">
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
      <Svg height="100%" width="100%" opacity={0.05}>
        <Defs>
          <LinearGradient id="background" x1="0" y1="0" x2="0" y2="1">
            <Stop offset="0" stopColor="#FF007A" stopOpacity="1" />
            <Stop offset="1" stopColor="#426CFF" stopOpacity="0.3" />
          </LinearGradient>
        </Defs>
        <Rect x="0" y="0" width="100%" height="100%" fill="url(#background)" />
      </Svg>
      <Box height="100%" width="100%" position="absolute" my="xxl">
        <AccountHeader onPressAccounts={() => navigation.navigate(Screens.Accounts)} />
        <TokenBalanceList
          loading={tokenBalancesLoading}
          balances={balances}
          onPressToken={onPressToken}
        />
      </Box>
    </Box>
  )
}
