import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React from 'react'
import { useTranslation } from 'react-i18next'
import { StyleSheet } from 'react-native'
import { ScrollView } from 'react-native-gesture-handler'
import { RootStackParamList } from 'src/app/navTypes'
import { Screens } from 'src/app/Screens'
import { AccountHeader } from 'src/components/AccountHeader'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { Screen } from 'src/components/layout/Screen'
import { Text } from 'src/components/Text'
import { AccountStub } from 'src/features/wallet/accounts/types'
import { useAccounts } from 'src/features/wallet/hooks'
import { shortenAddress } from 'src/utils/addresses'

type Props = NativeStackScreenProps<RootStackParamList, Screens.Accounts>

export function AccountsScreen({ navigation }: Props) {
  const { t } = useTranslation()

  const accounts = useAccounts()

  return (
    <Screen>
      <ScrollView contentContainerStyle={styles.scrollView}>
        <Box flex={1}>
          <AccountHeader>
            <Button label={t`Manage`} p="sm" />
            <Button
              label="+"
              onPress={() => navigation.navigate(Screens.ImportAccount)}
              p="sm"
              testID="accounts/add/button"
            />
          </AccountHeader>
          <Box flex={1} p="md">
            {Object.values(accounts).map((account) => (
              <AccountItem account={account} key={account.address} />
            ))}
          </Box>
        </Box>
      </ScrollView>
    </Screen>
  )
}

interface AccountItemProps {
  account: AccountStub
}

function AccountItem({ account: { address, name } }: AccountItemProps) {
  return (
    <Box
      flexDirection="row"
      p="md"
      borderColor="gray200"
      borderRadius="lg"
      borderWidth={2}
      mb="sm"
      testID={`account_item/${address.toLowerCase()}`}>
      <Box bg="gray400" borderRadius="full" width={50} height={50} marginRight="sm" />
      <Box>
        <Text variant="h3">$2,243.22</Text>
        <Text variant="body">
          {name} - {shortenAddress(address)}
        </Text>
      </Box>
    </Box>
  )
}

const styles = StyleSheet.create({
  scrollView: { flex: 1 },
})
