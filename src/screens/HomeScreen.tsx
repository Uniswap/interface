import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { RootStackParamList } from 'src/app/navTypes'
import { Screens } from 'src/app/Screens'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { TokenBalanceItem } from 'src/components/TokenBalanceItem/TokenBalanceItem'
import { ChainId } from 'src/constants/chains'
import { useActiveAccountEthBalance } from 'src/features/balances/hooks'
import { AccountHeader } from '../components/AccountHeader'

type Props = NativeStackScreenProps<RootStackParamList, Screens.Accounts>

export function HomeScreen({ navigation }: Props) {
  const ethBalance = useActiveAccountEthBalance(ChainId.RINKEBY)

  // TODO: Handle no activeAccount
  // TODO: Fetch balances against a token list across chains, combine with TokenLists and TokenInfo to get image

  return (
    <Screen backgroundColor="mainBackground">
      <ScrollView contentContainerStyle={style.scrollView}>
        <Box flex={1}>
          <AccountHeader onPressAccounts={() => navigation.navigate(Screens.Accounts)} />
          <Box flex={1} backgroundColor="gray50" />
        </Box>
        <Box flex={1} backgroundColor="mainBackground" padding="md">
          <TokenBalanceItem balance={ethBalance} />
        </Box>
      </ScrollView>
    </Screen>
  )
}

const style = StyleSheet.create({
  scrollView: { flex: 1 },
})
