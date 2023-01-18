import { DrawerContentComponentProps, useDrawerStatus } from '@react-navigation/drawer'
import { useResponsiveProp } from '@shopify/restyle'
import { default as React, useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import 'react-native-gesture-handler'
import { Edge } from 'react-native-safe-area-context'
import { SvgProps } from 'react-native-svg'
import { useAppDispatch, useAppTheme } from 'src/app/hooks'
import GlobalIcon from 'src/assets/icons/global.svg'
import HelpIcon from 'src/assets/icons/help.svg'
import InformationIcon from 'src/assets/icons/i-icon.svg'
import PlusIcon from 'src/assets/icons/plus.svg'
import SettingsIcon from 'src/assets/icons/settings.svg'
import { AccountList } from 'src/components/accounts/AccountList'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { Separator } from 'src/components/layout/Separator'
import { ActionSheetModal, MenuItemProp } from 'src/components/modals/ActionSheetModal'
import { WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal, {
  captionForAccountRemovalWarning,
} from 'src/components/modals/WarningModal/WarningModal'
import { Text } from 'src/components/Text'
import { uniswapUrls } from 'src/constants/urls'
import { isICloudAvailable } from 'src/features/CloudBackup/RNICloudBackupsManager'
import { useFiatOnRampEnabled } from 'src/features/experiments/hooks'
import { FiatOnRampBanner } from 'src/features/fiatOnRamp/FiatOnRampBanner'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType } from 'src/features/notifications/types'
import { ImportType, OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { useDrawerStatusLogging } from 'src/features/telemetry/hooks'
import { Account, AccountType, SignerMnemonicAccount } from 'src/features/wallet/accounts/types'
import { createAccountActions } from 'src/features/wallet/createAccountSaga'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import { useAccounts, useActiveAccount, useNativeAccountExists } from 'src/features/wallet/hooks'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'src/features/wallet/pendingAcccountsSaga'
import { activateAccount } from 'src/features/wallet/walletSlice'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import { iconSizes } from 'src/styles/sizing'
import { setClipboard } from 'src/utils/clipboard'
import { openSettings, openUri } from 'src/utils/linking'

const onPressGetHelp = (): void => {
  openUri(uniswapUrls.helpUrl)
}

const UNICON_SIZE = iconSizes.xxxl

export function AccountDrawer({ navigation }: DrawerContentComponentProps): JSX.Element | null {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const activeAccount = useActiveAccount()
  const addressToAccount = useAccounts()
  const dispatch = useAppDispatch()
  const hasImportedSeedPhrase = useNativeAccountExists()

  const [showAddWalletModal, setShowAddWalletModal] = useState(false)
  const [showEditAccountModal, setShowEditAccountModal] = useState(false)
  const [showUninstallToImportModal, setShowUninstallToImportModal] = useState(false)
  const [pendingEditAddress, setPendingEditAddress] = useState<Address | null>(null)
  const [pendingRemoveAccount, setPendingRemoveAccount] = useState<Account | null>(null)

  useDrawerStatusLogging()
  const isDrawerOpen = useDrawerStatus() === 'open'

  const addAccountBottomMargin = useResponsiveProp({ xs: 'md', sm: 'none' })

  const { accountsData, mnemonicWallets } = useMemo(() => {
    const accounts = Object.values(addressToAccount)
    const _mnemonicWallets = accounts
      .filter((a) => a.type === AccountType.SignerMnemonic)
      .sort((a, b) => {
        return (
          (a as SignerMnemonicAccount).derivationIndex -
          (b as SignerMnemonicAccount).derivationIndex
        )
      })
    const _viewOnlyWallets = accounts
      .filter((a) => a.type === AccountType.Readonly)
      .sort((a, b) => {
        return a.timeImportedMs - b.timeImportedMs
      })
    return {
      accountsData: [..._mnemonicWallets, ..._viewOnlyWallets],
      mnemonicWallets: _mnemonicWallets,
    }
  }, [addressToAccount])

  // hide fiat onramp banner when active account isn't a signer account.
  const fiatOnRampShown =
    useFiatOnRampEnabled() && activeAccount?.type === AccountType.SignerMnemonic

  const onPressEdit = useCallback((address: Address) => {
    setShowEditAccountModal(true)
    setPendingEditAddress(address)
  }, [])

  const onPressEditCancel = (): void => {
    setShowEditAccountModal(false)
    setPendingEditAddress(null)
  }

  const onPressRemoveCancel = (): void => {
    setPendingRemoveAccount(null)
  }
  const onPressRemoveConfirm = (): void => {
    if (!pendingRemoveAccount) return
    dispatch(
      editAccountActions.trigger({
        type: EditAccountAction.Remove,
        address: pendingRemoveAccount.address,
        notificationsEnabled:
          !!addressToAccount[pendingRemoveAccount.address]?.pushNotificationsEnabled,
      })
    )
    setPendingRemoveAccount(null)
    onPressEditCancel() // Dismiss bottom sheet
  }

  const onPressAccount = useCallback(
    (address: Address) => {
      navigation.closeDrawer()
      dispatch(activateAccount(address))
    },
    [navigation, dispatch]
  )

  const onPressAddWallet = (): void => {
    setShowAddWalletModal(true)
  }

  const onCloseAddWallet = (): void => {
    setShowAddWalletModal(false)
  }

  const onPressSettings = (): void => {
    navigation.navigate(Screens.SettingsStack, { screen: Screens.Settings })
  }

  const onPressManageConnections = useCallback(() => {
    navigation.navigate(Screens.SettingsWalletManageConnection, { address: activeAccount?.address })
  }, [navigation, activeAccount])

  const editAccountOptions = useMemo<MenuItemProp[]>(() => {
    const onPressWalletSettings = (): void => {
      setShowEditAccountModal(false)
      navigation.closeDrawer()
      if (!pendingEditAddress) return
      navigation.navigate(Screens.SettingsStack, {
        screen: Screens.SettingsWallet,
        params: { address: pendingEditAddress },
      })
    }

    const onPressCopyAddress = (): void => {
      if (!pendingEditAddress) return
      setClipboard(pendingEditAddress)
      dispatch(pushNotification({ type: AppNotificationType.Copied }))
      setShowEditAccountModal(false)
    }

    const onPressRemove = (): void => {
      if (!pendingEditAddress) return
      const account = addressToAccount[pendingEditAddress]
      if (!account) return
      setShowEditAccountModal(false)
      setPendingRemoveAccount(account)
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
            <Text variant="bodyLarge">{t('Wallet settings')}</Text>
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
            borderBottomWidth={shouldHideRemoveOption ? 0 : 1}
            p="md">
            <Text variant="bodyLarge">{t('Copy wallet address')}</Text>
          </Box>
        ),
      },
    ]

    // Should not show remove option if we have only one account remaining, or only one seed phrase wallet remaining
    const shouldHideRemoveOption =
      accountsData.length === 1 ||
      (mnemonicWallets.length === 1 &&
        !!pendingEditAddress &&
        addressToAccount[pendingEditAddress]?.type === AccountType.SignerMnemonic)

    if (!shouldHideRemoveOption) {
      editWalletOptions.push({
        key: ElementName.Remove,
        onPress: onPressRemove,
        render: () => (
          <Box alignItems="center" p="md">
            <Text color="accentCritical" variant="bodyLarge">
              {t('Remove wallet')}
            </Text>
          </Box>
        ),
      })
    }
    return editWalletOptions
  }, [
    accountsData.length,
    mnemonicWallets.length,
    pendingEditAddress,
    addressToAccount,
    navigation,
    dispatch,
    t,
  ])

  const addWalletOptions = useMemo<MenuItemProp[]>(() => {
    const onPressCreateNewWallet = (): void => {
      // Clear any existing pending accounts first.
      dispatch(pendingAccountActions.trigger(PendingAccountActions.DELETE))
      dispatch(createAccountActions.trigger())

      navigation.navigate(Screens.OnboardingStack, {
        screen: OnboardingScreens.EditName,
        params: {
          importType: hasImportedSeedPhrase ? ImportType.CreateAdditional : ImportType.CreateNew,
          entryPoint: OnboardingEntryPoint.Sidebar,
        },
      })
      setShowAddWalletModal(false)
    }

    const onPressAddViewOnlyWallet = (): void => {
      navigation.navigate(Screens.OnboardingStack, {
        screen: OnboardingScreens.WatchWallet,
        params: {
          importType: ImportType.Watch,
          entryPoint: OnboardingEntryPoint.Sidebar,
        },
      })
      setShowAddWalletModal(false)
    }

    const onPressImportWallet = (): void => {
      if (hasImportedSeedPhrase) {
        // Show warning modal that the only way to reimport seed phrase is to uninstall and reinstall app
        setShowUninstallToImportModal(true)
        return
      }

      navigation.navigate(Screens.OnboardingStack, {
        screen: OnboardingScreens.SeedPhraseInput,
        params: { importType: ImportType.SeedPhrase, entryPoint: OnboardingEntryPoint.Sidebar },
      })
      setShowAddWalletModal(false)
    }

    const onPressRestore = async (): Promise<void> => {
      const iCloudAvailable = await isICloudAvailable()

      if (!iCloudAvailable) {
        Alert.alert(
          t('iCloud Drive not available'),
          t(
            'Please verify that you are logged in to an Apple ID with iCloud Drive enabled on this device and try again.'
          ),
          [
            { text: t('Go to settings'), onPress: openSettings, style: 'default' },
            { text: t('Not now'), style: 'cancel' },
          ]
        )
        return
      }

      navigation.navigate(Screens.OnboardingStack, {
        screen: OnboardingScreens.RestoreCloudBackupLoading,
        params: { importType: ImportType.Restore, entryPoint: OnboardingEntryPoint.Sidebar },
      })
      setShowAddWalletModal(false)
    }

    const options = [
      {
        key: ElementName.CreateAccount,
        onPress: onPressCreateNewWallet,
        render: () => (
          <Box
            alignItems="center"
            borderBottomColor="backgroundOutline"
            borderBottomWidth={1}
            p="md">
            <Text variant="bodyLarge">{t('Create a new wallet')}</Text>
          </Box>
        ),
      },
      {
        key: ElementName.AddViewOnlyWallet,
        onPress: onPressAddViewOnlyWallet,
        render: () => (
          <Box alignItems="center" p="md">
            <Text variant="bodyLarge">{t('Add a view-only wallet')}</Text>
          </Box>
        ),
      },
      {
        key: ElementName.ImportAccount,
        onPress: onPressImportWallet,
        render: () => (
          <Box alignItems="center" borderTopColor="backgroundOutline" borderTopWidth={1} p="md">
            <Text variant="bodyLarge">{t('Import a wallet')}</Text>
          </Box>
        ),
      },
    ]

    if (!hasImportedSeedPhrase) {
      options.push({
        key: ElementName.RestoreFromICloud,
        onPress: onPressRestore,
        render: () => (
          <Box alignItems="center" borderTopColor="backgroundOutline" borderTopWidth={1} p="md">
            <Text variant="bodyLarge">{t('Restore from iCloud')}</Text>
          </Box>
        ),
      })
    }

    return options
  }, [hasImportedSeedPhrase, dispatch, navigation, t])

  const screenEdges: Edge[] = useMemo(
    () => (accountsData.length <= 1 ? ['top', 'bottom'] : ['top']),
    [accountsData.length]
  )

  if (!activeAccount?.address) {
    return null
  }

  return (
    <Screen bg="background0" edges={screenEdges}>
      <Flex pt="lg" px="lg">
        <AddressDisplay
          showCopy
          address={activeAccount.address}
          captionVariant="subheadSmall"
          size={UNICON_SIZE}
          variant="subheadLarge"
        />
      </Flex>

      {fiatOnRampShown ? <FiatOnRampBanner mx="md" my="lg" /> : <Separator my="md" />}

      <Flex gap="lg" pb="lg" px="md">
        <SettingsButton
          Icon={GlobalIcon}
          label={t('Manage connections')}
          name={ElementName.ManageConnections}
          onPress={onPressManageConnections}
        />
        <SettingsButton
          Icon={SettingsIcon}
          label={t('Settings')}
          name={ElementName.Settings}
          onPress={onPressSettings}
        />
        <SettingsButton
          Icon={HelpIcon}
          label={t('Get help')}
          name={ElementName.GetHelp}
          onPress={onPressGetHelp}
        />
      </Flex>

      <Box flexGrow={1} />

      <Separator mb="md" />

      {accountsData.length <= 1 ? (
        <TouchableArea mb={addAccountBottomMargin} ml="lg" onPress={onPressAddWallet}>
          <Flex row alignItems="center">
            <Box
              alignItems="center"
              borderColor="backgroundOutline"
              borderRadius="full"
              borderWidth={1}
              justifyContent="center"
              p="xs">
              <PlusIcon
                color={theme.colors.textSecondary}
                height={theme.iconSizes.xs}
                width={theme.iconSizes.xs}
              />
            </Box>
            <Text variant="bodyLarge">{t('Add another wallet')}</Text>
          </Flex>
        </TouchableArea>
      ) : (
        <AccountList
          accounts={accountsData}
          isVisible={isDrawerOpen}
          onAddWallet={onPressAddWallet}
          onPress={onPressAccount}
          onPressEdit={onPressEdit}
        />
      )}

      <ActionSheetModal
        isVisible={showEditAccountModal}
        name={ModalName.AccountEdit}
        options={editAccountOptions}
        onClose={(): void => setShowEditAccountModal(false)}
      />
      <ActionSheetModal
        isVisible={showAddWalletModal}
        name={ModalName.AddWallet}
        options={addWalletOptions}
        onClose={onCloseAddWallet}
      />
      {!!pendingRemoveAccount && (
        <WarningModal
          useBiometric
          caption={captionForAccountRemovalWarning(pendingRemoveAccount.type, t)}
          closeText={t('Cancel')}
          confirmText={t('Remove')}
          modalName={ModalName.RemoveWallet}
          severity={WarningSeverity.High}
          title={t('Are you sure?')}
          onClose={onPressRemoveCancel}
          onConfirm={onPressRemoveConfirm}
        />
      )}
      {showUninstallToImportModal && (
        <WarningModal
          caption={t(
            'Uniswap Wallet can only store one recovery phrase at a time. In order to import a new recovery phrase, you have to re-install the app. Your current recovery phrase will be permanently deleted, so make sure you’ve backed it up first.'
          )}
          closeText={t('Close')}
          icon={<InformationIcon color={theme.colors.textSecondary} />}
          modalName={ModalName.ReimportUninstall}
          severity={WarningSeverity.None}
          title={t('Import a Wallet')}
          onClose={(): void => setShowUninstallToImportModal(false)}
        />
      )}
    </Screen>
  )
}

function SettingsButton({
  name,
  Icon,
  onPress,
  label,
}: {
  name: ElementName
  Icon: React.FC<SvgProps>
  label: string
  onPress: () => void
}): JSX.Element {
  const theme = useAppTheme()

  return (
    <TouchableArea name={name} testID={name} onPress={onPress}>
      <Flex row alignItems="center" gap="xs">
        <Box alignItems="center" width={UNICON_SIZE}>
          <Icon
            color={theme.colors.textSecondary}
            height={theme.iconSizes.lg}
            width={theme.iconSizes.lg}
          />
        </Box>
        <Text color="textPrimary" variant="bodyLarge">
          {label}
        </Text>
      </Flex>
    </TouchableArea>
  )
}
