import React from 'react'
import { ScrollView, StyleSheet } from 'react-native'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { TokenBalanceItem } from 'src/components/TokenBalanceItem/TokenBalanceItem'
import { ChainId } from 'src/constants/chains'
import { useActiveAccountEthBalance } from 'src/features/balances/hooks'
import { AccountStub } from 'src/features/wallet/accounts/types'
import { useActiveAccount } from 'src/features/wallet/hooks'
import { shortenAddress } from 'src/utils/addresses'

interface AddressHeaderProps {
  activeAccount: AccountStub
}

function AddressHeader({ activeAccount }: AddressHeaderProps) {
  // TODO: get ENS Name

  return (
    <Box
      flexDirection="row"
      alignItems="center"
      height={50}
      paddingHorizontal="md"
      marginVertical="md">
      <Button flex={1} flexDirection="row" alignItems="center">
        <Button
          marginRight="sm"
          width={40}
          height={40}
          borderRadius="full"
          backgroundColor="gray100"
        />
        <Text variant="h3" textAlign="left">
          {shortenAddress(activeAccount!.address)}
        </Text>
      </Button>
      <Box flexDirection="row" />
    </Box>
  )
}

export function HomeScreen() {
  const activeAccount = useActiveAccount()

  const ethBalance = useActiveAccountEthBalance(ChainId.RINKEBY)

  // TODO: Handle no activeAccount
  // TODO: Fetch balances against a token list across chains, combine with TokenLists and TokenInfo to get image

  return (
    <Screen backgroundColor="mainBackground">
      <ScrollView contentContainerStyle={style.scrollView}>
        <Box flex={1}>
          <AddressHeader activeAccount={activeAccount!} />
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
