import { DrawerContentComponentProps } from '@react-navigation/drawer'
import { default as React, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo, SectionList, useColorScheme, ViewStyle } from 'react-native'
import { SafeAreaView } from 'react-native-safe-area-context'
import { useAppDispatch } from 'src/app/hooks'
import PlusSquareIcon from 'src/assets/icons/plus-square.svg'
import SettingsIcon from 'src/assets/icons/settings.svg'
import { AccountCardItem } from 'src/components/accounts/AccountCardItem'
import { RemoveAccountModal } from 'src/components/accounts/RemoveAccountModal'
import { Button } from 'src/components/buttons/Button'
import { Box, Flex } from 'src/components/layout'
import { ActionSheetModal, MenuItemProp } from 'src/components/modals/ActionSheetModal'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { WalletQRCode } from 'src/components/WalletConnect/ScanSheet/WalletQRCode'
import { importAccountActions } from 'src/features/import/importAccountSaga'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useAccounts, useActiveAccount } from 'src/features/wallet/hooks'
import { activateAccount } from 'src/features/wallet/walletSlice'
import { Screens } from 'src/screens/Screens'
import { darkTheme, theme } from 'src/styles/theme'
import { setClipboard } from 'src/utils/clipboard'

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

  const [pendingRemoveAddress, setPendingRemoveAddress] = useState<Address | null>(null)
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

  const onPressSettings = () => {
    navigation.closeDrawer()
    navigation.navigate(Screens.SettingsStack, { screen: Screens.Settings })
  }

  const renderItem = ({ item }: ListRenderItemInfo<Account>) => (
    <AccountCardItem
      account={item}
      isActive={!!activeAccount && activeAccount.address === item.address}
      onPress={onPressAccount}
      onPressEdit={onPressEdit}
      onPressQRCode={onPressQRCode}
    />
  )

  const editAccountOptions = useMemo<MenuItemProp[]>(() => {
    const onPressWalletSettings = () => {
      setShowEditAccountModal(false)
      navigation.closeDrawer()
      if (!pendingEditAddress) return
      navigation.navigate(Screens.SettingsStack, {
        screen: Screens.SettingsWallet,
        params: { address: pendingEditAddress },
      })
    }

    const onPressCopyAddress = () => {
      if (!pendingEditAddress) return
      setClipboard(pendingEditAddress)
      setShowEditAccountModal(false)
    }

    const onPressRemove = () => {
      if (!pendingEditAddress) return
      setShowEditAccountModal(false)
      setPendingRemoveAddress(pendingEditAddress)
    }

    return [
      {
        key: ElementName.WalletSettings,
        onPress: onPressWalletSettings,
        render: () => (
          <Box alignItems="center" p="md">
            <Text variant="body">{t('Wallet settings')}</Text>
          </Box>
        ),
      },
      {
        key: ElementName.Copy,
        onPress: onPressCopyAddress,
        render: () => (
          <Box alignItems="center" p="md">
            <Text variant="body">{t('Copy address')}</Text>
          </Box>
        ),
      },
      {
        key: ElementName.Remove,
        onPress: onPressRemove,
        render: () => (
          <Box alignItems="center" p="md">
            <Text color="accentFailure" variant="body">
              {t('Remove account')}
            </Text>
          </Box>
        ),
      },
    ]
  }, [navigation, pendingEditAddress, t])

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
              <Text color="textPrimary" variant="subhead">
                {title}
              </Text>
            </Box>
          )}
          sections={sectionData}
          showsVerticalScrollIndicator={false}
        />
        <Flex mb="sm">
          <Box bg="backgroundOutline" height={1} mb="md" />
          <Flex gap="xl">
            <Button
              name={ElementName.ImportAccount}
              testID={ElementName.ImportAccount}
              onPress={onPressNewAccount}>
              <Flex row alignItems="center" gap="sm">
                <PlusSquareIcon color={theme.colors.textSecondary} height={24} width={24} />
                <Text color="textSecondary" variant="subhead">
                  {t('New account')}
                </Text>
              </Flex>
            </Button>
            <Button
              name={ElementName.Settings}
              testID={ElementName.Settings}
              onPress={onPressSettings}>
              <Flex row alignItems="center" gap="sm">
                <SettingsIcon color={theme.colors.textSecondary} height={24} width={24} />
                <Text color="textSecondary" variant="subhead">
                  {t('Settings')}
                </Text>
              </Flex>
            </Button>
          </Flex>
        </Flex>
      </Box>
      <ActionSheetModal
        isVisible={showEditAccountModal}
        name={ModalName.Account}
        options={editAccountOptions}
        onClose={() => setShowEditAccountModal(false)}
      />
      {!!pendingRemoveAddress && (
        <RemoveAccountModal onCancel={onPressRemoveCancel} onConfirm={onPressRemoveConfirm} />
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
