import { DrawerContentComponentProps } from '@react-navigation/drawer'
import { default as React, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, SectionList, useColorScheme, ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppDispatch } from 'src/app/hooks'
import CopyIcon from 'src/assets/icons/copy-sheets.svg'
import EditIcon from 'src/assets/icons/pencil-box.svg'
import PlusSquareIcon from 'src/assets/icons/plus-square.svg'
import SettingsIcon from 'src/assets/icons/settings.svg'
import { AccountCardItem } from 'src/components/accounts/AccountCardItem'
import { RemoveAccountModal } from 'src/components/accounts/RemoveAccountModal'
import { RenameAccountModal } from 'src/components/accounts/RenameAccountModal'
import { Button } from 'src/components/buttons/Button'
import { PrimaryButton } from 'src/components/buttons/PrimaryButton'
import { TextButton } from 'src/components/buttons/TextButton'
import { Box, Flex } from 'src/components/layout'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { importAccountActions } from 'src/features/import/importAccountSaga'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import {
  EditAccountAction,
  editAccountActions,
  editAccountSagaName,
} from 'src/features/wallet/editAccountSaga'
import { useAccounts, useActiveAccount } from 'src/features/wallet/hooks'
import { activateAccount } from 'src/features/wallet/walletSlice'
import { WalletQRCode } from 'src/features/walletConnect/WalletQRCode'
import { Screens } from 'src/screens/Screens'
import { darkTheme, theme } from 'src/styles/theme'
import { setClipboard } from 'src/utils/clipboard'
import { SagaStatus } from 'src/utils/saga'
import { useSagaStatus } from 'src/utils/useSagaStatus'

const drawerContentStyle: ViewStyle = {
  justifyContent: 'space-between',
  flex: 1,
}

const key = (account: Account) => account.address

export function AccountDrawer({ navigation }: DrawerContentComponentProps) {
  const { t } = useTranslation()
  const isDarkMode = useColorScheme() === 'dark'

  const activeAccount = useActiveAccount()
  const addressToAccount = useAccounts()
  const dispatch = useAppDispatch()

  const [qrCodeAddress, setQRCodeAddress] = useState(activeAccount?.address)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showEditAccountModal, setShowEditAccountModal] = useState(false)
  const [pendingEditAddress, setPendingEditAddress] = useState<Address | null>(null)

  const { status } = useSagaStatus(editAccountSagaName)
  const isLoading = status === SagaStatus.Started

  const [signerAccounts, readOnlyAccounts] = useMemo(() => {
    const accounts = Object.values(addressToAccount)
    const _signerAccounts = accounts.filter((a) => a.type !== AccountType.Readonly)
    const _readOnlyAccounts = accounts.filter((a) => a.type === AccountType.Readonly)
    return [_signerAccounts, _readOnlyAccounts]
  }, [addressToAccount])

  const sectionData = [
    ...(signerAccounts.length > 0 ? [{ title: t('Your accounts'), data: signerAccounts }] : []),
    ...(readOnlyAccounts.length > 0 ? [{ title: t('Watching'), data: readOnlyAccounts }] : []),
  ]

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

  const onPressAccount = (address: Address) => {
    navigation.closeDrawer()
    dispatch(activateAccount(address))
  }

  const onPressQRCode = (address: Address) => {
    setQRCodeAddress(address)
    setShowQRModal(true)
  }

  const onCloseQrCode = () => setShowQRModal(false)

  const onPressNewAccount = () => {
    // First reset to clear saga state that's left over from dev account import
    // TODO remove when use of dev account is removed
    dispatch(importAccountActions.reset())
    navigation.navigate(Screens.ImportAccount)
  }

  const onPressSettings = () =>
    navigation.navigate(Screens.SettingsStack, { screen: Screens.Settings })

  const renderItem = ({ item }: ListRenderItemInfo<Account>) => (
    <AccountCardItem
      account={item}
      isActive={!!activeAccount && activeAccount.address === item.address}
      onPress={onPressAccount}
      onPressEdit={onPressEdit}
      onPressQRCode={onPressQRCode}
    />
  )

  return (
    <SafeAreaView
      style={{
        ...drawerContentStyle,
        backgroundColor: isDarkMode ? darkTheme.colors.mainBackground : theme.colors.mainBackground,
      }}>
      <Box flex={1} justifyContent="space-between" px="lg">
        <SectionList
          keyExtractor={key}
          renderItem={renderItem}
          renderSectionHeader={({ section: { title } }) => (
            <Box bg="mainBackground" py="md">
              <Text color="deprecated_gray600" variant="mediumLabel">
                {title}
              </Text>
            </Box>
          )}
          sections={sectionData}
          showsVerticalScrollIndicator={false}
        />
        <Flex mb="sm">
          <Box bg="deprecated_gray100" height={1} mb="md" />
          <Flex gap="xl">
            <Button
              name={ElementName.ImportAccount}
              testID={ElementName.ImportAccount}
              onPress={onPressNewAccount}>
              <Flex row gap="sm">
                <PlusSquareIcon color={theme.colors.deprecated_gray400} height={25} width={25} />
                <Text color="deprecated_gray400" variant="mediumLabel">
                  {t('New account')}
                </Text>
              </Flex>
            </Button>
            <Button
              name={ElementName.Settings}
              testID={ElementName.Settings}
              onPress={onPressSettings}>
              <Flex row gap="sm">
                <SettingsIcon color={theme.colors.deprecated_gray400} height={25} width={25} />
                <Text color="deprecated_gray400" variant="mediumLabel">
                  {t('Settings')}
                </Text>
              </Flex>
            </Button>
          </Flex>
        </Flex>
      </Box>
      <BottomSheetModal
        isVisible={showEditAccountModal}
        name={ModalName.Account}
        onClose={() => setShowEditAccountModal(false)}>
        <Flex centered gap="sm" p="md">
          <PrimaryButton
            disabled={isLoading}
            icon={<EditIcon color={theme.colors.white} height={18} strokeWidth={2} width={18} />}
            label={t('Rename Account')}
            name={ElementName.Rename}
            width="100%"
            onPress={onPressRename}
          />
          <PrimaryButton
            disabled={isLoading}
            icon={<CopyIcon color={theme.colors.white} height={18} width={18} />}
            label={t('Copy Address')}
            name={ElementName.Copy}
            width="100%"
            onPress={onPressCopyAddress}
          />
          <PrimaryButton
            disabled={isLoading}
            label={t('Remove Account')}
            name={ElementName.Remove}
            width="100%"
            onPress={onPressRemove}
          />
          <TextButton
            disabled={isLoading}
            name={ElementName.EditCancel}
            pb="sm"
            pt="xs"
            textAlign="center"
            textColor="deprecated_primary1"
            textVariant="body1"
            width="100%"
            onPress={onPressEditCancel}>
            {t('Cancel')}
          </TextButton>
        </Flex>
      </BottomSheetModal>
      {!!pendingRenameAddress && (
        <Box flexGrow={1}>
          <RenameAccountModal
            address={pendingRenameAddress}
            onCancel={onPressRenameCancel}
            onConfirm={onPressRenameConfirm}
          />
        </Box>
      )}
      {!!pendingRemoveAddress && (
        <Box flexGrow={1}>
          <RemoveAccountModal
            address={pendingRemoveAddress}
            onCancel={onPressRemoveCancel}
            onConfirm={onPressRemoveConfirm}
          />
        </Box>
      )}
      <BottomSheetModal
        isVisible={showQRModal}
        name={ModalName.WalletQRCode}
        onClose={onCloseQrCode}>
        <WalletQRCode address={qrCodeAddress} />
      </BottomSheetModal>
    </SafeAreaView>
  )
}
