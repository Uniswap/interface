import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { Action } from 'redux'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { AccountList } from 'src/components/accounts/AccountList'
import { AddressDisplay } from 'src/components/AddressDisplay'
import { ActionSheetModal, MenuItemProp } from 'src/components/modals/ActionSheetModal'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { IS_ANDROID } from 'src/constants/globals'
import { isCloudStorageAvailable } from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { closeModal, openModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import { openSettings } from 'src/utils/linking'
import {
  Button,
  Flex,
  Icons,
  Text,
  TouchableArea,
  useDeviceDimensions,
  useDeviceInsets,
  useSporeColors,
} from 'ui/src'
import { spacing } from 'ui/src/theme'
import { ImportType, OnboardingEntryPoint } from 'wallet/src/features/onboarding/types'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { createAccountActions } from 'wallet/src/features/wallet/create/createAccountSaga'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import { useActiveAccountAddress, useNativeAccountExists } from 'wallet/src/features/wallet/hooks'
import { selectAllAccountsSorted } from 'wallet/src/features/wallet/selectors'
import { setAccountAsActive } from 'wallet/src/features/wallet/slice'

export function AccountSwitcherModal(): JSX.Element {
  const dispatch = useAppDispatch()
  const colors = useSporeColors()

  return (
    <BottomSheetModal
      backgroundColor={colors.surface1.get()}
      name={ModalName.AccountSwitcher}
      onClose={(): Action => dispatch(closeModal({ name: ModalName.AccountSwitcher }))}>
      <Flex bg="$surface1">
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
  const dispatch = useAppDispatch()
  const hasImportedSeedPhrase = useNativeAccountExists()
  const modalState = useAppSelector(selectModalState(ModalName.AccountSwitcher))

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
    [dispatch, onClose]
  )

  const onPressAddWallet = (): void => {
    setShowAddWalletModal(true)
  }

  const onCloseAddWallet = (): void => {
    setShowAddWalletModal(false)
  }

  const onManageWallet = (): void => {
    if (!activeAccountAddress) return

    dispatch(closeModal({ name: ModalName.AccountSwitcher }))
    navigate(Screens.SettingsStack, {
      screen: Screens.SettingsWallet,
      params: { address: activeAccountAddress },
    })
  }

  const addWalletOptions = useMemo<MenuItemProp[]>(() => {
    const onPressCreateNewWallet = (): void => {
      // Clear any existing pending accounts first.
      dispatch(pendingAccountActions.trigger(PendingAccountActions.Delete))
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
      if (hasImportedSeedPhrase && activeAccountAddress) {
        dispatch(openModal({ name: ModalName.RemoveWallet }))
      } else {
        navigate(Screens.OnboardingStack, {
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
          IS_ANDROID ? t('Google Drive not available') : t('iCloud Drive not available'),
          IS_ANDROID
            ? t(
                'Please verify that you are logged in to a Google account with Google Drive enabled on this device and try again.'
              )
            : t(
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
          <Flex
            alignItems="center"
            borderBottomColor="$surface3"
            borderBottomWidth={1}
            p="$spacing16">
            <Text variant="body1">{t('Create a new wallet')}</Text>
          </Flex>
        ),
      },
      {
        key: ElementName.AddViewOnlyWallet,
        onPress: onPressAddViewOnlyWallet,
        render: () => (
          <Flex alignItems="center" p="$spacing16">
            <Text variant="body1">{t('Add a view-only wallet')}</Text>
          </Flex>
        ),
      },
      {
        key: ElementName.ImportAccount,
        onPress: onPressImportWallet,
        render: () => (
          <Flex alignItems="center" borderTopColor="$surface3" borderTopWidth={1} p="$spacing16">
            <Text variant="body1">{t('Import a new wallet')}</Text>
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
              {IS_ANDROID ? t('Restore from Google Drive') : t('Restore from iCloud')}
            </Text>
          </Flex>
        ),
      })
    }

    return options
  }, [activeAccountAddress, dispatch, hasImportedSeedPhrase, onClose, t])

  const accountsWithoutActive = accounts.filter((a) => a.address !== activeAccountAddress)

  const isViewOnly =
    accounts.find((a) => a.address === activeAccountAddress)?.type === AccountType.Readonly

  if (!activeAccountAddress) {
    return null
  }

  const fullScreenContentHeight =
    dimensions.fullHeight - insets.top - insets.bottom - spacing.spacing36 // approximate bottom sheet handle height + padding bottom

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
        />
        <Flex px="$spacing24">
          <Button
            size="small"
            testID={ElementName.WalletSettings}
            theme="secondary"
            onPress={onManageWallet}>
            {t('Manage wallet')}
          </Button>
        </Flex>
      </Flex>
      <AccountList
        accounts={accountsWithoutActive}
        isVisible={modalState.isOpen}
        onPress={onPressAccount}
      />
      <TouchableArea hapticFeedback mt="$spacing16" onPress={onPressAddWallet}>
        <Flex row alignItems="center" gap="$spacing16" ml="$spacing24">
          <Flex borderColor="$surface3" borderRadius="$roundedFull" borderWidth={1} p="$spacing8">
            <Icons.Plus color="$neutral2" size="$icon.12" strokeWidth={2} />
          </Flex>
          <Text color="$neutral2" variant="buttonLabel3">
            {t('Add wallet')}
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
