import { NativeStackScreenProps } from '@react-navigation/native-stack'
import { Currency, CurrencyAmount } from '@uniswap/sdk-core'
import React, { useState } from 'react'
import { RootStackParamList } from 'src/app/navTypes'
import { Screens } from 'src/app/Screens'
import { AccountHeader } from 'src/components/AccountHeader'
import { Screen } from 'src/components/layout/Screen'
import { TokenBalanceList } from 'src/components/TokenBalanceList'
import { ChainId } from 'src/constants/chains'
import { useEthBalance, useTokenBalances } from 'src/features/balances/hooks'
import { useAllTokens } from 'src/features/tokens/useTokens'
import { useActiveAccount } from 'src/features/wallet/hooks'

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
    <Screen backgroundColor="mainBackground">
      <AccountHeader onPressAccounts={() => navigation.navigate(Screens.Accounts)} />
      <TokenBalanceList loading={tokenBalancesLoading} balances={balances} />
    </Screen>
  )
}
