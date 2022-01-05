import { BottomSheetModal, BottomSheetModalProvider } from '@gorhom/bottom-sheet'
import React, { useMemo, useRef, useState } from 'react'
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
import { Box } from 'src/components/layout/Box'
import { CenterBox } from 'src/components/layout/CenterBox'
import { SheetScreen } from 'src/components/layout/SheetScreen'
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
import { bottomSheetStyles } from 'src/styles/bottomSheet'
import { flex } from 'src/styles/flex'
import { setClipboard } from 'src/utils/clipboard'
import { SagaStatus } from 'src/utils/saga'
import { useSagaStatus } from 'src/utils/useSagaStatus'

const BOTTOM_SHEET_SNAP_POINTS = [275]

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

  const editAccountModalRef = useRef<BottomSheetModal>(null)
  const [pendingEditAddress, setPendingEditAddress] = useState<Address | null>(null)
  const onPressEdit = (address: Address) => {
    editAccountModalRef.current?.present()
    setPendingEditAddress(address)
  }
  const onPressEditCancel = () => {
    editAccountModalRef.current?.dismiss()
    setPendingEditAddress(null)
  }

  const onPressCopyAddress = () => {
    if (!pendingEditAddress) return
    setClipboard(pendingEditAddress)
  }

  const [pendingRenameAddress, setPendingRenameAddress] = useState<Address | null>(null)
  const onPressRename = () => {
    if (!pendingEditAddress) return
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
    <SheetScreen>
      {/* This provider is needed here in the screen directly otherwise the sheet is rendered
      behind the screen because AccountStack is itself in a sheet/modal. */}
      <BottomSheetModalProvider>
        <ScrollView contentContainerStyle={flex.fill}>
          <Box px="lg">
            <Box flexDirection="row" alignItems="center" justifyContent="space-between" mb="lg">
              <BackButton size={30} />
              <Text variant="bodyLg" color="gray400">
                {t('Switch Accounts')}
              </Text>
              {!isEditMode ? (
                <TextButton
                  textVariant="bodyLg"
                  textColor="pink"
                  onPress={() => setIsEditMode(true)}>
                  {t('Edit')}
                </TextButton>
              ) : (
                <TextButton
                  textVariant="bodyLg"
                  textColor="pink"
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
        <CenterBox flexDirection="row" px="md" py="md">
          <PrimaryButton
            variant="palePink"
            label={t('Import Account')}
            onPress={onPressImport}
            testID="accounts/add/button"
            mr="lg"
            disabled={isLoading}
          />
          <PrimaryButton
            label={t('Create Account')}
            onPress={onPressCreate}
            testID="accounts/create/button"
            disabled={isLoading}
          />
        </CenterBox>
        <BottomSheetModal
          ref={editAccountModalRef}
          snapPoints={BOTTOM_SHEET_SNAP_POINTS}
          style={bottomSheetStyles.bottomSheet}>
          <CenterBox px="md" pt="xs" pb="sm" flex={1} justifyContent="space-between">
            <Text variant="bodySm" color="gray400">
              {t('Edit or rename your account')}
            </Text>
            <PrimaryButton
              variant="palePink"
              label={t('Rename Account')}
              icon={<EditIcon width={18} height={18} />}
              onPress={onPressRename}
              width="100%"
              disabled={isLoading}
            />
            <PrimaryButton
              variant="palePink"
              label={t('Copy Address')}
              icon={<CopyIcon width={18} height={18} />}
              onPress={onPressCopyAddress}
              width="100%"
              disabled={isLoading}
            />
            <PrimaryButton
              variant="paleOrange"
              label={t('Remove Account')}
              onPress={onPressRemove}
              width="100%"
              disabled={isLoading}
            />
            <TextButton
              onPress={onPressEditCancel}
              textVariant="body"
              textColor="pink"
              textAlign="center"
              width="100%"
              pt="xs"
              pb="sm"
              disabled={isLoading}>
              {t('Cancel')}
            </TextButton>
          </CenterBox>
        </BottomSheetModal>
      </BottomSheetModalProvider>
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
