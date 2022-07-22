import { DrawerContentComponentProps } from '@react-navigation/drawer'
import { default as React, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import 'react-native-gesture-handler'
import {
  Extrapolate,
  interpolate,
  useAnimatedScrollHandler,
  useAnimatedStyle,
  useSharedValue,
  withTiming,
} from 'react-native-reanimated'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import PlusSquareIcon from 'src/assets/icons/plus-square.svg'
import SettingsIcon from 'src/assets/icons/settings.svg'
import { AccountCardItem } from 'src/components/accounts/AccountCardItem'
import { RemoveAccountModal } from 'src/components/accounts/RemoveAccountModal'
import { Button } from 'src/components/buttons/Button'
import { AnimatedBox, Box, Flex } from 'src/components/layout'
import { AnimatedFlatList } from 'src/components/layout/AnimatedFlatList'
import { Screen } from 'src/components/layout/Screen'
import { ActionSheetModal, MenuItemProp } from 'src/components/modals/ActionSheetModal'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { WalletQRCode } from 'src/components/WalletConnect/ScanSheet/WalletQRCode'
import { ImportType, OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { Account, AccountType, NativeAccount } from 'src/features/wallet/accounts/types'
import { createAccountActions } from 'src/features/wallet/createAccountSaga'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useAccounts, useActiveAccount, useNativeAccountExists } from 'src/features/wallet/hooks'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'src/features/wallet/pendingAcccountsSaga'
import { activateAccount } from 'src/features/wallet/walletSlice'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import { setClipboard } from 'src/utils/clipboard'

const key = (account: Account) => account.address
const CONTENT_MAX_SCROLL_Y = 20

export function AccountDrawer({ navigation }: DrawerContentComponentProps) {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const activeAccount = useActiveAccount()
  const addressToAccount = useAccounts()
  const dispatch = useAppDispatch()
  const hasImportedSeedPhrase = useNativeAccountExists()

  const [qrCodeAddress, setQRCodeAddress] = useState(activeAccount?.address)
  const [showQRModal, setShowQRModal] = useState(false)
  const [showAddWalletModal, setShowAddWalletModal] = useState(false)
  const [showEditAccountModal, setShowEditAccountModal] = useState(false)
  const [pendingEditAddress, setPendingEditAddress] = useState<Address | null>(null)
  const [pendingRemoveAccount, setPendingRemoveAccount] = useState<Account | null>(null)

  const { accountsData, mnemonicWallets } = useMemo(() => {
    const accounts = Object.values(addressToAccount)
    const _mnemonicWallets = accounts
      .filter((a) => a.type === AccountType.Native)
      .sort((a, b) => {
        return (a as NativeAccount).derivationIndex - (b as NativeAccount).derivationIndex
      })
    const _privateKeyWallets = accounts
      .filter((a) => a.type === AccountType.Local)
      .sort((a, b) => {
        return a.timeImportedMs - b.timeImportedMs
      })
    const _viewOnlyWallets = accounts
      .filter((a) => a.type === AccountType.Readonly)
      .sort((a, b) => {
        return a.timeImportedMs - b.timeImportedMs
      })
    return {
      accountsData: [..._mnemonicWallets, ..._privateKeyWallets, ..._viewOnlyWallets],
      mnemonicWallets: _mnemonicWallets,
    }
  }, [addressToAccount])

  const onPressEdit = (address: Address) => {
    setShowEditAccountModal(true)
    setPendingEditAddress(address)
  }
  const onPressEditCancel = () => {
    setShowEditAccountModal(false)
    setPendingEditAddress(null)
  }

  const onPressRemoveCancel = () => {
    setPendingRemoveAccount(null)
  }
  const onPressRemoveConfirm = () => {
    if (!pendingRemoveAccount) return
    dispatch(
      editAccountActions.trigger({
        type: EditAccountAction.Remove,
        address: pendingRemoveAccount.address,
      })
    )
    setPendingRemoveAccount(null)
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

  const onPressAddWallet = () => {
    setShowAddWalletModal(true)
  }

  const onCloseAddWallet = () => {
    setShowAddWalletModal(false)
  }

  const onPressSettings = () => {
    navigation.closeDrawer()
    navigation.navigate(Screens.SettingsStack, { screen: Screens.Settings })
  }

  const renderItem = ({ item }: ListRenderItemInfo<Account>) => {
    return (
      <AccountCardItem
        account={item}
        isActive={!!activeAccount && activeAccount.address === item.address}
        isViewOnly={item.type === AccountType.Readonly}
        onPress={onPressAccount}
        onPressEdit={onPressEdit}
        onPressQRCode={onPressQRCode}
      />
    )
  }

  const scrollY = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
    onEndDrag: (event) => {
      scrollY.value = withTiming(
        event.contentOffset.y > CONTENT_MAX_SCROLL_Y / 2 ? CONTENT_MAX_SCROLL_Y : 0
      )
    },
  })
  const headerBorderStyle = useAnimatedStyle(() => {
    return {
      opacity: interpolate(scrollY.value, [0, CONTENT_MAX_SCROLL_Y], [0, 1], Extrapolate.CLAMP),
    }
  })

  const header = (
    <Flex bg="backgroundBackdrop" borderBottomColor="backgroundOutline" pt="sm">
      <Text color="textPrimary" px="lg" variant="headlineSmall">
        {t('Your wallets')}
      </Text>
      <AnimatedBox bg="backgroundOutline" height={1} style={headerBorderStyle} />
    </Flex>
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
      if (!pendingEditAddress || !addressToAccount[pendingEditAddress]) return
      setShowEditAccountModal(false)
      setPendingRemoveAccount(addressToAccount[pendingEditAddress])
    }

    const editWalletOptions = [
      {
        key: ElementName.WalletSettings,
        onPress: onPressWalletSettings,
        render: () => (
          <Box
            alignItems="center"
            borderBottomColor="backgroundOutline"
            borderBottomWidth={1}
            p="md">
            <Text variant="body">{t('Wallet settings')}</Text>
          </Box>
        ),
      },
      {
        key: ElementName.Copy,
        onPress: onPressCopyAddress,
        render: () => (
          <Box
            alignItems="center"
            borderBottomColor="backgroundOutline"
            borderBottomWidth={1}
            p="md">
            <Text variant="body">{t('Copy address')}</Text>
          </Box>
        ),
      },
    ]

    // Should not show remove option if we have only one account remaining, or only one seed phrase wallet remaining
    const shouldHideRemoveOption =
      accountsData.length === 1 ||
      (mnemonicWallets.length === 1 &&
        !!pendingEditAddress &&
        addressToAccount[pendingEditAddress]?.type === AccountType.Native)

    if (!shouldHideRemoveOption) {
      editWalletOptions.push({
        key: ElementName.Remove,
        onPress: onPressRemove,
        render: () => (
          <Box alignItems="center" p="md">
            <Text color="accentFailure" variant="body">
              {t('Remove wallet')}
            </Text>
          </Box>
        ),
      })
    }
    return editWalletOptions
  }, [
    navigation,
    pendingEditAddress,
    t,
    accountsData.length,
    mnemonicWallets.length,
    addressToAccount,
  ])

  const addWalletOptions = useMemo<MenuItemProp[]>(() => {
    const onPressCreateNewWallet = () => {
      // Clear any existing pending accounts first.
      dispatch(pendingAccountActions.trigger(PendingAccountActions.DELETE))
      dispatch(createAccountActions.trigger())

      navigation.navigate(Screens.OnboardingStack, {
        screen: OnboardingScreens.EditName,
        params: {
          importType: ImportType.Create,
          entryPoint: OnboardingEntryPoint.Sidebar,
        },
        merge: false,
      })
      setShowAddWalletModal(false)
    }

    const onPressAddViewOnlyWallet = () => {
      navigation.navigate(Screens.OnboardingStack, {
        screen: OnboardingScreens.WatchWallet,
        params: {
          importType: ImportType.Watch,
          entryPoint: OnboardingEntryPoint.Sidebar,
        },
        merge: false,
      })
      setShowAddWalletModal(false)
    }

    const onPressImportWallet = () => {
      navigation.navigate(Screens.OnboardingStack, {
        screen: OnboardingScreens.ImportMethod,
        params: { entryPoint: OnboardingEntryPoint.Sidebar },
        merge: false,
      })

      setShowAddWalletModal(false)
    }

    const menuItems = [
      {
        key: ElementName.CreateAccount,
        onPress: onPressCreateNewWallet,
        render: () => (
          <Box
            alignItems="center"
            borderBottomColor="backgroundOutline"
            borderBottomWidth={1}
            p="md">
            <Text variant="body">{t('Create a new wallet')}</Text>
          </Box>
        ),
      },
      {
        key: ElementName.AddViewOnlyWallet,
        onPress: onPressAddViewOnlyWallet,
        render: () => (
          <Box alignItems="center" p="md">
            <Text variant="body">{t('Add a view-only wallet')}</Text>
          </Box>
        ),
      },
    ]

    if (!hasImportedSeedPhrase) {
      menuItems.push({
        key: ElementName.ImportAccount,
        onPress: onPressImportWallet,
        render: () => (
          <Box alignItems="center" borderTopColor="backgroundOutline" borderTopWidth={1} p="md">
            <Text variant="body">{t('Import a wallet')}</Text>
          </Box>
        ),
      })
    }
    return menuItems
  }, [hasImportedSeedPhrase, dispatch, navigation, t])

  return (
    <Screen bg="backgroundBackdrop">
      <AnimatedFlatList
        ListHeaderComponent={header}
        data={accountsData}
        keyExtractor={key}
        renderItem={renderItem}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        stickyHeaderIndices={[0]}
        onScroll={scrollHandler}
      />
      <Flex>
        <Box bg="backgroundOutline" height={0.5} mb="sm" />
        <Flex gap="xl" pb="xl" px="lg">
          <Button
            name={ElementName.ImportAccount}
            testID={ElementName.ImportAccount}
            onPress={onPressAddWallet}>
            <Flex row alignItems="center" gap="sm">
              <PlusSquareIcon color={theme.colors.textSecondary} height={24} width={24} />
              <Text color="textSecondary" variant="subhead">
                {t('Add wallet')}
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
      <ActionSheetModal
        isVisible={showEditAccountModal}
        name={ModalName.Account}
        options={editAccountOptions}
        onClose={() => setShowEditAccountModal(false)}
      />
      <ActionSheetModal
        isVisible={showAddWalletModal}
        name={ModalName.AddWallet}
        options={addWalletOptions}
        onClose={onCloseAddWallet}
      />
      {!!pendingRemoveAccount && (
        <RemoveAccountModal
          accountType={pendingRemoveAccount.type}
          onCancel={onPressRemoveCancel}
          onConfirm={onPressRemoveConfirm}
        />
      )}
      <BottomSheetModal
        isVisible={showQRModal}
        name={ModalName.WalletQRCode}
        onClose={onCloseQrCode}>
        <WalletQRCode address={qrCodeAddress} />
      </BottomSheetModal>
    </Screen>
  )
}
