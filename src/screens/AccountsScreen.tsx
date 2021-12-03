import { NativeStackScreenProps } from '@react-navigation/native-stack'
import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { HomeStackParamList } from 'src/app/navigation/types'
import { AccountCard } from 'src/components/accounts/AccountCard'
import { RemoveAccountModal } from 'src/components/accounts/RemoveAccountModal'
import { RenameAccountModal } from 'src/components/accounts/RenameAccountModal'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { Screen } from 'src/components/layout/Screen'
import { Modal } from 'src/components/modals/Modal'
import { Text } from 'src/components/Text'
import { AccountType } from 'src/features/wallet/accounts/types'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useAccounts, useActiveAccount } from 'src/features/wallet/hooks'
import { activateAccount } from 'src/features/wallet/walletSlice'
import { Screens } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'
import { dimensions } from 'src/styles/sizing'
import { setClipboard } from 'src/utils/clipboard'

type Props = NativeStackScreenProps<HomeStackParamList, Screens.Accounts>

export function AccountsScreen({ navigation }: Props) {
  const [isEditMode, setIsEditMode] = useState(false)

  const { t } = useTranslation()

  const addressToAccount = useAccounts()
  const [signerAccounts, readOnlyAccounts] = useMemo(() => {
    const accounts = Object.values(addressToAccount)
    const _signerAccounts = accounts.filter((a) => a.type !== AccountType.readonly)
    const _readOnlyAccounts = accounts.filter((a) => a.type === AccountType.readonly)
    return [_signerAccounts, _readOnlyAccounts]
  }, [addressToAccount])

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
  const onPressRename = () => {
    if (!pendingEditAddress) return
    setPendingRenameAddress(pendingEditAddress)
    setPendingEditAddress(null)
  }
  const onPressRenameCancel = () => {
    setPendingRenameAddress(null)
  }
  const onPressRenameConfirm = (newAccountName: string) => {
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
  const onPressRemoveConfirm = () => {
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
      <ScrollView contentContainerStyle={flex.fill}>
        <Box px="lg">
          <Box flexDirection="row" alignItems="center" justifyContent="space-between" mb="lg">
            <Text variant="bodyLg" color="gray400">
              {t('Switch Accounts')}
            </Text>
            {!isEditMode ? (
              <TextButton textVariant="bodyLg" textColor="blue" onPress={() => setIsEditMode(true)}>
                {t('Edit')}
              </TextButton>
            ) : (
              <TextButton
                textVariant="bodyLg"
                textColor="blue"
                onPress={() => setIsEditMode(false)}>
                {t('Done')}
              </TextButton>
            )}
          </Box>
          {Object.values(signerAccounts).map((account) => (
            <Box mb="xl" key={account.address}>
              <AccountCard
                account={account}
                isActive={!!activeAccount && activeAccount.address === account.address}
                isEditable={isEditMode}
                onPress={onPressActivate}
                onEdit={onPressEdit}
              />
            </Box>
          ))}
          {!!readOnlyAccounts.length && (
            <>
              <Text variant="body" color="gray400" mb="lg">
                {t('Watching')}
              </Text>
              {Object.values(readOnlyAccounts).map((account) => (
                <Box mb="xl" key={account.address}>
                  <AccountCard
                    account={account}
                    isActive={!!activeAccount && activeAccount.address === account.address}
                    isEditable={isEditMode}
                    onPress={onPressActivate}
                    onEdit={onPressEdit}
                  />
                </Box>
              ))}
            </>
          )}
        </Box>
      </ScrollView>
      <CenterBox flexDirection="row" px="md">
        <PrimaryButton
          variant="grayTextBlue"
          label={t('Import Wallet')}
          onPress={() => navigation.navigate(Screens.ImportAccount)}
          testID="accounts/add/button"
          mr="lg"
        />
        <PrimaryButton
          label={t('Create Wallet')}
          onPress={() => navigation.navigate(Screens.ImportAccount)}
          testID="accounts/create/button"
        />
      </CenterBox>
      <Modal
        visible={!!pendingEditAddress}
        position="bottom"
        width={dimensions.fullWidth}
        dimBackground={true}
        hide={onPressEditCancel}>
        <CenterBox>
          <Text variant="bodySm" color="gray400">
            {t('Edit or rename your account')}
          </Text>
          <TextButton onPress={onPressRename} textVariant="body" width="100%" py="md">
            {t('Rename Account')}
          </TextButton>
          <TextButton onPress={onPressCopyAddress} textVariant="body" width="100%" py="md">
            {t('Copy Address')}
          </TextButton>
          <TextButton onPress={onPressRemove} textVariant="body" width="100%" py="md">
            {t('Remove Account')}
          </TextButton>
          <TextButton
            onPress={onPressEditCancel}
            textVariant="body"
            textColor="blue"
            width="100%"
            pt="md">
            {t('Cancel')}
          </TextButton>
        </CenterBox>
      </Modal>
      <RenameAccountModal
        address={pendingRenameAddress}
        onCancel={onPressRenameCancel}
        onConfirm={onPressRenameConfirm}
      />
      <RemoveAccountModal
        address={pendingRemoveAddress}
        onCancel={onPressRemoveCancel}
        onConfirm={onPressRemoveConfirm}
      />
    </Screen>
  )
}
