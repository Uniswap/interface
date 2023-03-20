import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import 'react-native-gesture-handler'
import { Action } from 'redux'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import PlusIcon from 'src/assets/icons/plus.svg'
import WalletIcon from 'src/assets/icons/wallet-filled.svg'
import { AccountList } from 'src/components/accounts/AccountList'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { ActionSheetModal, MenuItemProp } from 'src/components/modals/ActionSheetModal'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal, {
  captionForAccountRemovalWarning,
} from 'src/components/modals/WarningModal/WarningModal'
import { Text } from 'src/components/Text'
import { isICloudAvailable } from 'src/features/CloudBackup/RNICloudBackupsManager'
import { closeModal, selectModalState } from 'src/features/modals/modalSlice'
import { pushNotification } from 'src/features/notifications/notificationSlice'
import { AppNotificationType, CopyNotificationType } from 'src/features/notifications/types'
import { ImportType, OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { Account, AccountType, SignerMnemonicAccount } from 'src/features/wallet/accounts/types'
import { createAccountActions } from 'src/features/wallet/createAccountSaga'
import { EditAccountAction, editAccountActions } from 'src/features/wallet/editAccountSaga'
import {
  useAccounts,
  useActiveAccountWithThrow,
  useNativeAccountExists,
} from 'src/features/wallet/hooks'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'src/features/wallet/pendingAccountsSaga'
import { activateAccount } from 'src/features/wallet/walletSlice'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import { dimensions } from 'src/styles/sizing'
import { setClipboard } from 'src/utils/clipboard'
import { openSettings } from 'src/utils/linking'

export function AccountSwitcherModal(): JSX.Element {
  const dispatch = useAppDispatch()
  const theme = useAppTheme()

  return (
    <BottomSheetModal
      disableSwipe
      backgroundColor={theme.colors.background1}
      name={ModalName.AccountSwitcher}
      onClose={(): Action => dispatch(closeModal({ name: ModalName.AccountSwitcher }))}>
      <Screen bg="background1" edges={[]}>
        <AccountSwitcher
          onClose={(): void => {
            dispatch(closeModal({ name: ModalName.AccountSwitcher }))
          }}
        />
      </Screen>
    </BottomSheetModal>
  )
}

/**
 * Exported for testing only.
 * TODO [MOB-3961] Once testing works with the BottomSheetModal stop exporting this component.
 */
export function AccountSwitcher({ onClose }: { onClose: () => void }): JSX.Element | null {
  const { t } = useTranslation()
  const theme = useAppTheme()

  const activeAccount = useActiveAccountWithThrow()
  const addressToAccount = useAccounts()
  const dispatch = useAppDispatch()
  const hasImportedSeedPhrase = useNativeAccountExists()
  const modalState = useAppSelector(selectModalState(ModalName.AccountSwitcher))

  const [showAddWalletModal, setShowAddWalletModal] = useState(false)
  const [showEditAccountModal, setShowEditAccountModal] = useState(false)
  const [showUninstallToImportModal, setShowUninstallToImportModal] = useState(false)
  const [pendingEditAddress, setPendingEditAddress] = useState<Address | null>(null)
  const [pendingRemoveAccount, setPendingRemoveAccount] = useState<Account | null>(null)

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
      dispatch(closeModal({ name: ModalName.AccountSwitcher }))
      // allow close modal logic to finish in JS thread before `activateAccount` logic kicks in
      setImmediate(() => dispatch(activateAccount(address)))
    },
    [dispatch]
  )

  const onPressAddWallet = (): void => {
    setShowAddWalletModal(true)
  }

  const onCloseAddWallet = (): void => {
    setShowAddWalletModal(false)
  }

  const editAccountOptions = useMemo<MenuItemProp[]>(() => {
    const onPressWalletSettings = (): void => {
      setShowEditAccountModal(false)
      dispatch(closeModal({ name: ModalName.AccountSwitcher }))
      if (!pendingEditAddress) return
      navigate(Screens.SettingsStack, {
        screen: Screens.SettingsWallet,
        params: { address: pendingEditAddress },
      })
    }

    const onPressCopyAddress = (): void => {
      if (!pendingEditAddress) return
      setClipboard(pendingEditAddress)
      dispatch(
        pushNotification({
          type: AppNotificationType.Copied,
          copyType: CopyNotificationType.Address,
        })
      )
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
            p="spacing16">
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
            p="spacing16">
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
          <Box alignItems="center" p="spacing16">
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
    dispatch,
    t,
  ])

  const addWalletOptions = useMemo<MenuItemProp[]>(() => {
    const onPressCreateNewWallet = (): void => {
      // Clear any existing pending accounts first.
      dispatch(pendingAccountActions.trigger(PendingAccountActions.DELETE))
      dispatch(createAccountActions.trigger())

      navigate(Screens.OnboardingStack, {
        screen: OnboardingScreens.EditName,
        params: {
          importType: hasImportedSeedPhrase ? ImportType.CreateAdditional : ImportType.CreateNew,
          entryPoint: OnboardingEntryPoint.Sidebar,
        },
      })
      setShowAddWalletModal(false)
      onClose()
    }

    const onPressAddViewOnlyWallet = (): void => {
      navigate(Screens.OnboardingStack, {
        screen: OnboardingScreens.WatchWallet,
        params: {
          importType: ImportType.Watch,
          entryPoint: OnboardingEntryPoint.Sidebar,
        },
      })
      setShowAddWalletModal(false)
      onClose()
    }

    const onPressImportWallet = (): void => {
      if (hasImportedSeedPhrase) {
        // Show warning modal that the only way to reimport seed phrase is to uninstall and reinstall app
        setShowUninstallToImportModal(true)
        return
      }

      navigate(Screens.OnboardingStack, {
        screen: OnboardingScreens.SeedPhraseInput,
        params: { importType: ImportType.SeedPhrase, entryPoint: OnboardingEntryPoint.Sidebar },
      })

      setShowAddWalletModal(false)
      onClose()
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

      navigate(Screens.OnboardingStack, {
        screen: OnboardingScreens.RestoreCloudBackupLoading,
        params: { importType: ImportType.Restore, entryPoint: OnboardingEntryPoint.Sidebar },
      })
      setShowAddWalletModal(false)
      onClose()
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
            p="spacing16">
            <Text variant="bodyLarge">{t('Create a new wallet')}</Text>
          </Box>
        ),
      },
      {
        key: ElementName.ImportAccount,
        onPress: onPressImportWallet,
        render: () => (
          <Box alignItems="center" p="spacing16">
            <Text variant="bodyLarge">{t('Import a wallet')}</Text>
          </Box>
        ),
      },
      {
        key: ElementName.AddViewOnlyWallet,
        onPress: onPressAddViewOnlyWallet,
        render: () => (
          <Box
            alignItems="center"
            borderTopColor="backgroundOutline"
            borderTopWidth={1}
            p="spacing16">
            <Text variant="bodyLarge">{t('Add a view-only wallet')}</Text>
          </Box>
        ),
      },
    ]

    if (!hasImportedSeedPhrase) {
      options.push({
        key: ElementName.RestoreFromICloud,
        onPress: onPressRestore,
        render: () => (
          <Box
            alignItems="center"
            borderTopColor="backgroundOutline"
            borderTopWidth={1}
            p="spacing16">
            <Text variant="bodyLarge">{t('Restore from iCloud')}</Text>
          </Box>
        ),
      })
    }

    return options
  }, [dispatch, hasImportedSeedPhrase, onClose, t])

  if (!activeAccount.address) {
    return null
  }

  const fullScreenContentHeight = 0.89 * dimensions.fullHeight

  return (
    <Flex fill gap="none" maxHeight={fullScreenContentHeight} mb="spacing12">
      <Flex row alignItems="center" borderBottomColor="backgroundOutline" mb="spacing16">
        <Box flex={1} pl="spacing24">
          <Text color="textPrimary" textAlign="left" variant="bodyLarge">
            {t('Your wallets')}
          </Text>
        </Box>
      </Flex>
      <AccountList
        accounts={accountsData}
        isVisible={modalState.isOpen}
        onPress={onPressAccount}
        onPressEdit={onPressEdit}
      />
      <TouchableArea hapticFeedback my="spacing24" onPress={onPressAddWallet}>
        <Flex row alignItems="center" ml="spacing24">
          <Box
            borderColor="backgroundOutline"
            borderRadius="roundedFull"
            borderWidth={1}
            p="spacing12">
            <PlusIcon
              color={theme.colors.textPrimary}
              height={theme.iconSizes.icon16}
              width={theme.iconSizes.icon16}
            />
          </Box>
          <Text color="textPrimary" variant="bodyLarge">
            {t('Add wallet')}
          </Text>
        </Flex>
      </TouchableArea>

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
          icon={<WalletIcon color={theme.colors.textSecondary} />}
          modalName={ModalName.ReimportUninstall}
          severity={WarningSeverity.None}
          title={t('Import a wallet')}
          onClose={(): void => setShowUninstallToImportModal(false)}
        />
      )}
    </Flex>
  )
}
