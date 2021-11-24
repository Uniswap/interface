import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import Plus from 'src/assets/icons/plus.svg'
import { AccountCard } from 'src/components/accounts/AccountCard'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { Button } from 'src/components/buttons/Button'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Screen } from 'src/components/layout/Screen'
import { useAccounts, useActiveAccount } from 'src/features/wallet/hooks'
import { RootStackParamList } from 'src/screens/navTypes'
import { Screens } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'
import { logger } from 'src/utils/logger'

type Props = NativeStackScreenProps<RootStackParamList, Screens.Accounts>

export function AccountsScreen({ navigation }: Props) {
  const [isEditMode, setIsEditMode] = useState(false)
  const { t } = useTranslation()

  const accounts = useAccounts()
  const activeAccount = useActiveAccount()

  const onPressRemoveAddress = (address: Address) => {
    logger.debug('AccountsScreen', 'onPressRemoveAddress', 'removing', address)
    // TODO re-move it move it
  }

  return (
    <Screen bg="gray50">
      <ScrollView contentContainerStyle={flex.fill}>
        <Box>
          <AccountHeader>
            {!isEditMode ? (
              <CenterBox flexDirection="row">
                <Button
                  variant="text"
                  label={t`Manage`}
                  p="sm"
                  onPress={() => setIsEditMode(true)}
                />
                <Button
                  variant="text"
                  onPress={() => navigation.navigate(Screens.ImportAccount)}
                  p="sm"
                  testID="accounts/add/button">
                  <Plus height={14} width={14} />
                </Button>
              </CenterBox>
            ) : (
              <Button
                variant="text"
                label={t`Done`}
                p="sm"
                color="primary1"
                onPress={() => setIsEditMode(false)}
              />
            )}
          </AccountHeader>
          <Box p="md">
            {Object.values(accounts).map((account) => (
              <AccountCard
                account={account}
                key={account.address}
                isActive={!!activeAccount && activeAccount.address === account.address}
                isEditable={isEditMode}
                onRemove={onPressRemoveAddress}
              />
            ))}
          </Box>
        </Box>
      </ScrollView>
    </Screen>
  )
}
