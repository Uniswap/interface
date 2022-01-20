import React, { useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, View } from 'react-native'
import { useAppDispatch } from 'src/app/hooks'
import { useAccountStackNavigation } from 'src/app/navigation/types'
import CopyIcon from 'src/assets/icons/copy-sheets.svg'
import EditIcon from 'src/assets/icons/pencil-box.svg'
import { AccountCard } from 'src/components/accounts/AccountCard'
import { RemoveAccountModal } from 'src/components/accounts/RemoveAccountModal'
import { RenameAccountModal } from 'src/components/accounts/RenameAccountModal'
import { BackButton } from 'src/components/buttons/BackButton'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { Flex } from 'src/components/layout'
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { SheetScreen } from 'src/components/layout/SheetScreen'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { importAccountActions } from 'src/features/import/importAccountSaga'
import { AccountType } from 'src/features/wallet/accounts/types'
import {
  EditAccountAction,
  editAccountActions,
  editAccountSagaName,
} from 'src/features/wallet/editAccountSaga'
import { useAccounts, useActiveAccount } from 'src/features/wallet/hooks'
import { activateAccount } from 'src/features/wallet/walletSlice'
import { Screens } from 'src/screens/Screens'
import { flex } from 'src/styles/flex'
import { theme } from 'src/styles/theme'
import { setClipboard } from 'src/utils/clipboard'
import { SagaStatus } from 'src/utils/saga'
import { useSagaStatus } from 'src/utils/useSagaStatus'

export function AccountsScreen() {
  const [isEditMode, setIsEditMode] = useState(false)
  const navigation = useAccountStackNavigation()
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
    navigation.goBack()
  }

  const onPressImport = () => {
    // First reset to clear saga state that's left over from dev account import
    // TODO remove when use of dev account is removed
    dispatch(importAccountActions.reset())
    navigation.navigate(Screens.ImportAccount)
  }
  const onPressCreate = onPressImport // TODO implement for realsies

  const [showEditAccountModal, setShowEditAccountModal] = useState(false)

  const [pendingEditAddress, setPendingEditAddress] = useState<Address | null>(null)
  const onPressEdit = (address: Address) => {
    setShowEditAccountModal(true)
    setPendingEditAddress(address)
  }
  const onPressEditCancel = () => {
    setShowEditAccountModal(false)
    setPendingEditAddress(null)
  }

  const onPressCopyAddress = () => {
    if (!pendingEditAddress) return
    setClipboard(pendingEditAddress)
  }

  const [pendingRenameAddress, setPendingRenameAddress] = useState<Address | null>(null)
  const onPressRename = () => {
    if (!pendingEditAddress) return
    setShowEditAccountModal(false)
    setPendingRenameAddress(pendingEditAddress)
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
    onPressEditCancel() // Dismiss bottom sheet
  }

  const [pendingRemoveAddress, setPendingRemoveAddress] = useState<Address | null>(null)
  const onPressRemove = () => {
    if (!pendingEditAddress) return
    setShowEditAccountModal(false)
    setPendingRemoveAddress(pendingEditAddress)
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
    onPressEditCancel() // Dismiss bottom sheet
  }

  // TODO surface errors from editAccountSaga when designs are ready
  const { status } = useSagaStatus(editAccountSagaName)
  const isLoading = status === SagaStatus.Started

  return (
    <SheetScreen px="lg">
      <ScrollView contentContainerStyle={flex.fill}>
        <Box alignItems="center" flexDirection="row" justifyContent="space-between" mb="lg">
          <BackButton />
          <Text color="gray400" variant="bodyLg">
            {t('Switch Accounts')}
          </Text>
          {!isEditMode ? (
            <TextButton textColor="pink" textVariant="bodyLg" onPress={() => setIsEditMode(true)}>
              {t('Edit')}
            </TextButton>
          ) : (
            <TextButton textColor="pink" textVariant="bodyLg" onPress={() => setIsEditMode(false)}>
              {t('Done')}
            </TextButton>
          )}
        </Box>
        {Object.values(signerAccounts).map((account) => (
          <Box key={account.address} mb="xl">
            <AccountCard
              account={account}
              isActive={!!activeAccount && activeAccount.address === account.address}
              isEditable={isEditMode}
              onEdit={onPressEdit}
              onPress={onPressActivate}
            />
          </Box>
        ))}
        {!!readOnlyAccounts.length && (
          <>
            <Text color="gray400" mb="lg" variant="body">
              {t('Watching')}
            </Text>
            {Object.values(readOnlyAccounts).map((account) => (
              <Box key={account.address} mb="xl">
                <AccountCard
                  account={account}
                  isActive={!!activeAccount && activeAccount.address === account.address}
                  isEditable={isEditMode}
                  onEdit={onPressEdit}
                  onPress={onPressActivate}
                />
              </Box>
            ))}
          </>
        )}
      </ScrollView>
      <CenterBox flexDirection="row" py="md">
        <PrimaryButton
          disabled={isLoading}
          label={t('Import Account')}
          mr="lg"
          testID="accounts/add/button"
          variant="palePink"
          onPress={onPressImport}
        />
        <PrimaryButton
          disabled={isLoading}
          label={t('Create Account')}
          testID="accounts/create/button"
          onPress={onPressCreate}
        />
      </CenterBox>
      <BottomSheetModal
        isVisible={showEditAccountModal}
        onClose={() => setShowEditAccountModal(false)}>
        <Flex centered gap="sm" p="md">
          <Text color="gray400" variant="bodySm">
            {t('Edit or rename your account')}
          </Text>
          <PrimaryButton
            disabled={isLoading}
            icon={<EditIcon height={18} width={18} />}
            label={t('Rename Account')}
            variant="palePink"
            width="100%"
            onPress={onPressRename}
          />
          <PrimaryButton
            disabled={isLoading}
            icon={<CopyIcon height={18} stroke={theme.colors.pink} width={18} />}
            label={t('Copy Address')}
            variant="palePink"
            width="100%"
            onPress={onPressCopyAddress}
          />
          <PrimaryButton
            disabled={isLoading}
            label={t('Remove Account')}
            variant="paleOrange"
            width="100%"
            onPress={onPressRemove}
          />
          <TextButton
            disabled={isLoading}
            pb="sm"
            pt="xs"
            textAlign="center"
            textColor="pink"
            textVariant="body"
            width="100%"
            onPress={onPressEditCancel}>
            {t('Cancel')}
          </TextButton>
        </Flex>
      </BottomSheetModal>
      {!!pendingRenameAddress && (
        <View style={flex.fill}>
          <RenameAccountModal
            address={pendingRenameAddress}
            onCancel={onPressRenameCancel}
            onConfirm={onPressRenameConfirm}
          />
        </View>
      )}
      {!!pendingRemoveAddress && (
        <View style={flex.fill}>
          <RemoveAccountModal
            address={pendingRemoveAddress}
            onCancel={onPressRemoveCancel}
            onConfirm={onPressRemoveConfirm}
          />
        </View>
      )}
    </SheetScreen>
  )
}
