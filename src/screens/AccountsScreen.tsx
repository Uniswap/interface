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
import { TextButton } from 'src/components/buttons/TextButton'
import { BlueToPinkRadial } from 'src/components/gradients/BlueToPinkRadial'
import { GradientBackground } from 'src/components/gradients/GradientBackground'
import { TextInput } from 'src/components/input/TextInput'
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
import { setClipboard } from 'src/utils/clipboard'

type Props = NativeStackScreenProps<HomeStackParamList, Screens.Accounts>

export function AccountsScreen({ navigation }: Props) {
  const [isEditMode, setIsEditMode] = useState(false)

  const { t } = useTranslation()

  const accounts = useAccounts()
  const activeAccount = useActiveAccount()
  const dispatch = useAppDispatch()
  const onPressActivate = (address: Address) => {
    dispatch(activateAccount(address))
  }

  const [pendingEditAddress, setPendingEditAddress] = useState<Address | null>(null)
  const onPressEdit = (address: Address) => {
    setPendingEditAddress(address)
  }
  const onPressEditCancel = () => {
    setPendingEditAddress(null)
  }

  const onPressCopyAddress = () => {
    if (!pendingEditAddress) return
    setClipboard(pendingEditAddress)
    setPendingEditAddress(null)
  }

  const [pendingRenameAddress, setPendingRenameAddress] = useState<Address | null>(null)
  const [newAccountName, setNewAccountName] = useState('')
  const onPressRename = () => {
    if (!pendingEditAddress) return
    setPendingRenameAddress(pendingEditAddress)
    setPendingEditAddress(null)
  }
  const onPressRenameCancel = () => {
    setPendingRenameAddress(null)
  }
  const onPressRenameConfirm = () => {
    if (!pendingRenameAddress || !newAccountName) return
    dispatch(
      editAccountActions.trigger({
        type: EditAccountAction.Rename,
        address: pendingRenameAddress,
        newName: newAccountName,
      })
    )
    setPendingRenameAddress(null)
  }

  const [pendingRemoveAddress, setPendingRemoveAddress] = useState<Address | null>(null)
  const onPressRemove = () => {
    if (!pendingEditAddress) return
    setPendingRemoveAddress(pendingEditAddress)
    setPendingEditAddress(null)
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

  const onPressHeader = () => {
    navigation.goBack()
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
          <AccountHeader chevronDirection="n" onPress={onPressHeader}>
            {!isEditMode ? (
              <>
                <Button onPress={() => setIsEditMode(true)} mr="md">
                  <Text variant="bodyLg">{t('Manage')}</Text>
                </Button>
                <Button
                  onPress={() => navigation.navigate(Screens.ImportAccount)}
                  testID="accounts/add/button">
                  <Plus height={14} width={14} />
                </Button>
              </>
            ) : (
              <Button onPress={() => setIsEditMode(false)}>
                <Text variant="bodyLg" color="primary1">
                  {t('Done')}
                </Text>
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
                onEdit={onPressEdit}
              />
            ))}
          </Box>
        </Box>
      </ScrollView>
      <Modal title={t('Edit Account Options')} visible={!!pendingEditAddress} position="bottom">
        <TextButton onPress={onPressRename} textVariant="body" width="100%" py="sm">
          {t('Rename Account')}
        </TextButton>
        <TextButton onPress={onPressCopyAddress} textVariant="body" width="100%" py="sm">
          {t('Copy Address')}
        </TextButton>
        <TextButton onPress={onPressRemove} textVariant="body" width="100%" py="sm">
          {t('Remove Account')}
        </TextButton>
        <TextButton onPress={onPressEditCancel} textVariant="body" width="100%" pt="md">
          {t('Cancel')}
        </TextButton>
      </Modal>
      <Modal title={t('Rename Account')} visible={!!pendingRenameAddress}>
        <Text variant="bodySm" textAlign="center" mt="md">
          {pendingRenameAddress}
        </Text>
        <Text variant="body" textAlign="center">
          {t('Set a new account name')}
        </Text>
        <TextInput value={newAccountName} onChangeText={setNewAccountName} mt="md" />
        <CenterBox flexDirection="row" mt="md">
          <TextButton onPress={onPressRenameCancel} textVariant="body" mr="lg">
            {t('Cancel')}
          </TextButton>
          <TextButton onPress={onPressRenameConfirm} textVariant="body">
            {t('Done')}
          </TextButton>
        </CenterBox>
      </Modal>
      <Modal title={t('Remove Account?')} visible={!!pendingRemoveAddress}>
        <Text variant="body" textAlign="center">
          {t('Are you sure you want to remove this account?')}
        </Text>
        <Text variant="bodySm" textAlign="center" mt="md">
          {pendingRemoveAddress}
        </Text>
        <CenterBox flexDirection="row" mt="md">
          <TextButton onPress={onPressRemoveCancel} textVariant="body" mr="lg">
            {t('Cancel')}
          </TextButton>
          <TextButton onPress={onPressConfirmRemove} textVariant="body" textColor="red">
            {t('Remove')}
          </TextButton>
        </CenterBox>
      </Modal>
    </Screen>
  )
}
