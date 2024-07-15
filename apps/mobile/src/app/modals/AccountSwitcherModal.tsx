import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { useDispatch } from 'react-redux'
import { Action } from 'redux'
import { useAppSelector } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { AccountList } from 'src/components/accounts/AccountList'
import { isCloudStorageAvailable } from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { closeModal, openModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { Button, Flex, Text, TouchableArea, useDeviceInsets, useSporeColors } from 'ui/src'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { spacing } from 'ui/src/theme'
import { ActionSheetModal, MenuItemProp } from 'uniswap/src/components/modals/ActionSheetModal'
import { BottomSheetModal } from 'uniswap/src/components/modals/BottomSheetModal'
import { ElementName, ModalName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { isAndroid } from 'utilities/src/platform'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { PlusCircle } from 'wallet/src/components/icons/PlusCircle'
import { createOnboardingAccount } from 'wallet/src/features/onboarding/createOnboardingAccount'
import { AccountType, BackupType } from 'wallet/src/features/wallet/accounts/types'
import { createAccountsActions } from 'wallet/src/features/wallet/create/createAccountsSaga'
import { useActiveAccountAddress, useNativeAccountExists } from 'wallet/src/features/wallet/hooks'
import { selectAllAccountsSorted, selectSortedSignerMnemonicAccounts } from 'wallet/src/features/wallet/selectors'
import { setAccountAsActive } from 'wallet/src/features/wallet/slice'
import { openSettings } from 'wallet/src/utils/linking'

export function AccountSwitcherModal(): JSX.Element {
  const dispatch = useDispatch()
  const colors = useSporeColors()

  return (
    <BottomSheetModal
      backgroundColor={colors.surface1.get()}
      name={ModalName.AccountSwitcher}
      onClose={(): Action => dispatch(closeModal({ name: ModalName.AccountSwitcher }))}
    >
      <Flex backgroundColor="$surface1">
        <AccountSwitcher
          onClose={(): void => {
            dispatch(closeModal({ name: ModalName.AccountSwitcher }))
          }}
        />
      </Flex>
    </BottomSheetModal>
  )
}

/**
 * Exported for testing only.
 * TODO [MOB-259] Once testing works with the BottomSheetModal stop exporting this component.
 */
export function AccountSwitcher({ onClose }: { onClose: () => void }): JSX.Element | null {
  const insets = useDeviceInsets()
  const dimensions = useDeviceDimensions()
  const { t } = useTranslation()
  const activeAccountAddress = useActiveAccountAddress()
  const dispatch = useDispatch()
  const hasImportedSeedPhrase = useNativeAccountExists()
  const modalState = useAppSelector(selectModalState(ModalName.AccountSwitcher))
  const sortedMnemonicAccounts = useAppSelector(selectSortedSignerMnemonicAccounts)

  const [showAddWalletModal, setShowAddWalletModal] = useState(false)

  const accounts = useAppSelector(selectAllAccountsSorted)

  const onPressAccount = useCallback(
    (address: Address) => {
      onClose()
      // allow close modal logic to finish in JS thread before `setAccountAsActive` logic kicks in
      setImmediate(() => {
        dispatch(setAccountAsActive(address))
      })
    },
    [dispatch, onClose],
  )

  const onPressAddWallet = (): void => {
    setShowAddWalletModal(true)
  }

  const onCloseAddWallet = (): void => {
    setShowAddWalletModal(false)
  }

  const onManageWallet = (): void => {
    if (!activeAccountAddress) {
      return
    }

    dispatch(closeModal({ name: ModalName.AccountSwitcher }))
    navigate(MobileScreens.SettingsStack, {
      screen: MobileScreens.SettingsWallet,
      params: { address: activeAccountAddress },
    })
  }

  const addWalletOptions = useMemo<MenuItemProp[]>(() => {
    const createAdditionalAccount = async (): Promise<void> => {
      // Generate new account
      const newAccount = await createOnboardingAccount(sortedMnemonicAccounts)

      // Create new account in redux
      dispatch(
        createAccountsActions.trigger({
          accounts: [newAccount],
        }),
      )

      sendAnalyticsEvent(WalletEventName.WalletAdded, {
        wallet_type: ImportType.CreateAdditional,
        accounts_imported_count: 1,
        wallets_imported: [newAccount.address],
        cloud_backup_used: newAccount.backups?.includes(BackupType.Cloud) ?? false,
        modal: ModalName.AccountSwitcher,
      })
    }

    const onPressCreateNewWallet = async (): Promise<void> => {
      setShowAddWalletModal(false)
      onClose()
      if (hasImportedSeedPhrase) {
        await createAdditionalAccount()
      } else {
        // create pending account and place into welcome flow
        navigate(MobileScreens.OnboardingStack, {
          screen: OnboardingScreens.WelcomeWallet,
          params: {
            importType: ImportType.CreateNew,
            entryPoint: OnboardingEntryPoint.Sidebar,
          },
        })
      }
    }

    const onPressAddViewOnlyWallet = (): void => {
      navigate(MobileScreens.OnboardingStack, {
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
      if (hasImportedSeedPhrase && activeAccountAddress) {
        dispatch(openModal({ name: ModalName.RemoveWallet }))
      } else {
        navigate(MobileScreens.OnboardingStack, {
          screen: OnboardingScreens.SeedPhraseInput,
          params: { importType: ImportType.SeedPhrase, entryPoint: OnboardingEntryPoint.Sidebar },
        })
      }

      setShowAddWalletModal(false)
      onClose()
    }

    const onPressRestore = async (): Promise<void> => {
      const cloudStorageAvailable = await isCloudStorageAvailable()

      if (!cloudStorageAvailable) {
        Alert.alert(
          isAndroid
            ? t('account.cloud.error.unavailable.title.android')
            : t('account.cloud.error.unavailable.title.ios'),
          isAndroid
            ? t('account.cloud.error.unavailable.message.android')
            : t('account.cloud.error.unavailable.message.ios'),
          [
            {
              text: t('account.cloud.error.unavailable.button.settings'),
              onPress: openSettings,
              style: 'default',
            },
            { text: t('account.cloud.error.unavailable.button.cancel'), style: 'cancel' },
          ],
        )
        return
      }

      navigate(MobileScreens.OnboardingStack, {
        screen: OnboardingScreens.RestoreCloudBackupLoading,
        params: { importType: ImportType.Restore, entryPoint: OnboardingEntryPoint.Sidebar },
      })
      setShowAddWalletModal(false)
      onClose()
    }

    const options: MenuItemProp[] = [
      {
        key: ElementName.CreateAccount,
        onPress: onPressCreateNewWallet,
        render: () => (
          <Flex alignItems="center" borderBottomColor="$surface3" borderBottomWidth={1} p="$spacing16">
            <Text variant="body1">{t('account.wallet.button.create')}</Text>
          </Flex>
        ),
      },
      {
        key: ElementName.AddViewOnlyWallet,
        onPress: onPressAddViewOnlyWallet,
        render: () => (
          <Flex alignItems="center" p="$spacing16">
            <Text variant="body1">{t('account.wallet.button.addViewOnly')}</Text>
          </Flex>
        ),
      },
      {
        key: ElementName.ImportAccount,
        onPress: onPressImportWallet,
        render: () => (
          <Flex alignItems="center" borderTopColor="$surface3" borderTopWidth={1} p="$spacing16">
            <Text variant="body1">{t('account.wallet.button.import')}</Text>
          </Flex>
        ),
      },
    ]

    if (!hasImportedSeedPhrase) {
      options.push({
        key: ElementName.RestoreFromCloud,
        onPress: onPressRestore,
        render: () => (
          <Flex alignItems="center" borderTopColor="$surface3" borderTopWidth={1} p="$spacing16">
            <Text variant="body1">
              {isAndroid ? t('account.cloud.button.restore.android') : t('account.cloud.button.restore.ios')}
            </Text>
          </Flex>
        ),
      })
    }

    return options
  }, [activeAccountAddress, dispatch, hasImportedSeedPhrase, onClose, sortedMnemonicAccounts, t])

  const accountsWithoutActive = accounts.filter((a) => a.address !== activeAccountAddress)

  const isViewOnly = accounts.find((a) => a.address === activeAccountAddress)?.type === AccountType.Readonly

  if (!activeAccountAddress) {
    return null
  }

  const fullScreenContentHeight = dimensions.fullHeight - insets.top - insets.bottom - spacing.spacing36 // approximate bottom sheet handle height + padding bottom

  return (
    <Flex $short={{ pb: '$none' }} maxHeight={fullScreenContentHeight} pb="$spacing12">
      <Flex gap="$spacing16" pb="$spacing16" pt="$spacing12">
        <AddressDisplay
          showCopy
          address={activeAccountAddress}
          direction="column"
          horizontalGap="$spacing8"
          showViewOnlyBadge={isViewOnly}
          size={spacing.spacing60 - spacing.spacing4}
          variant="subheading1"
        />
        <Flex px="$spacing24">
          <Button size="small" testID={TestID.WalletSettings} theme="secondary" onPress={onManageWallet}>
            {t('account.wallet.button.manage')}
          </Button>
        </Flex>
      </Flex>
      <AccountList accounts={accountsWithoutActive} isVisible={modalState.isOpen} onPress={onPressAccount} />
      <TouchableArea hapticFeedback mt="$spacing16" onPress={onPressAddWallet}>
        <Flex row alignItems="center" gap="$spacing8" ml="$spacing24">
          <PlusCircle />
          <Text color="$neutral2" variant="buttonLabel3">
            {t('account.wallet.button.add')}
          </Text>
        </Flex>
      </TouchableArea>
      <ActionSheetModal
        isVisible={showAddWalletModal}
        name={ModalName.AddWallet}
        options={addWalletOptions}
        onClose={onCloseAddWallet}
      />
    </Flex>
  )
}
