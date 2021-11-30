import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native-gesture-handler'
import { useAppDispatch } from 'src/app/hooks'
import { HomeStackParamList } from 'src/app/navigation/types'
import Plus from 'src/assets/icons/plus.svg'
import { AccountCard } from 'src/components/accounts/AccountCard'
import { AccountHeader } from 'src/components/accounts/AccountHeader'
import { Button } from 'src/components/buttons/Button'
import { BlueToPinkRadial } from 'src/components/gradients/BlueToPinkRadial'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Screen } from 'src/components/layout/Screen'
import { Modal } from 'src/components/modals/Modal'
import { Text } from 'src/components/Text'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useAccounts, useActiveAccount } from 'src/features/wallet/hooks'
import { activateAccount } from 'src/features/wallet/walletSlice'
import { Screens } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'

type Props = NativeStackScreenProps<HomeStackParamList, Screens.Accounts>

export function AccountsScreen({ navigation }: Props) {
  const [isEditMode, setIsEditMode] = useState(false)
  const [pendingRemoveAddress, setPendingRemoveAddress] = useState<Address | null>(null)

  const { t } = useTranslation()

  const accounts = useAccounts()
  const activeAccount = useActiveAccount()

  const dispatch = useAppDispatch()

  const onPressActivate = (address: Address) => {
    dispatch(activateAccount(address))
  }

  const onPressRemove = (address: Address) => {
    setPendingRemoveAddress(address)
  }
  const onPressRemoveCancel = () => {
    setPendingRemoveAddress(null)
  }
  const onPressConfirmRemove = () => {
    if (!pendingRemoveAddress) return
    dispatch(
      editAccountActions.trigger({ type: EditAccountAction.Remove, address: pendingRemoveAddress })
    )
    setPendingRemoveAddress(null)
  }

  // TODO wire up renaming action when designs are ready
  // TODO surface errors from editAccountSaga when designs are ready

  return (
    <Screen>
      <GradientBackground>
        <BlueToPinkRadial />
      </GradientBackground>
      <ScrollView contentContainerStyle={flex.fill}>
        <Box>
          <AccountHeader>
            {!isEditMode ? (
              <>
                <Button onPress={() => setIsEditMode(true)} mr="md">
                  <Text variant="bodyLg">{t`Manage`}</Text>
                </Button>
                <Button
                  onPress={() => navigation.navigate(Screens.ImportAccount)}
                  testID="accounts/add/button">
                  <Plus height={14} width={14} />
                </Button>
              </>
            ) : (
              <Button onPress={() => setIsEditMode(false)}>
                <Text variant="bodyLg" color="primary1">{t`Done`}</Text>
              </Button>
            )}
          </AccountHeader>
          <Box p="md">
            {Object.values(accounts).map((account) => (
              <AccountCard
                account={account}
                key={account.address}
                isActive={!!activeAccount && activeAccount.address === account.address}
                isEditable={isEditMode}
                onPress={onPressActivate}
                onRemove={onPressRemove}
              />
            ))}
          </Box>
        </Box>
      </ScrollView>
      <Modal title={t`Remove Account?`} visible={!!pendingRemoveAddress}>
        <Text
          variant="body"
          textAlign="center">{t`Are you sure you want to remove this account?`}</Text>
        <Text variant="bodySm" textAlign="center" mt="md">
          {pendingRemoveAddress}
        </Text>
        <CenterBox flexDirection="row" mt="md">
          <Button variant="text" label={t`Cancel`} onPress={onPressRemoveCancel} mr="lg" />
          <Button variant="text" label={t`Remove`} onPress={onPressConfirmRemove} />
        </CenterBox>
      </Modal>
    </Screen>
  )
}
