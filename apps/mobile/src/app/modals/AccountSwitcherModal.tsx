import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import { Action } from 'redux'
import { useAppDispatch, useAppSelector } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { AccountList } from 'src/components/accounts/AccountList'
import { isCloudStorageAvailable } from 'src/features/CloudBackup/RNCloudStorageBackupsManager'
import { closeModal, openModal } from 'src/features/modals/modalSlice'
import { selectModalState } from 'src/features/modals/selectModalState'
import { useCompleteOnboardingCallback } from 'src/features/onboarding/hooks'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import { useSagaStatus } from 'src/utils/useSagaStatus'
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
import { isAndroid } from 'uniswap/src/utils/platform'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { ActionSheetModal, MenuItemProp } from 'wallet/src/components/modals/ActionSheetModal'
import { BottomSheetModal } from 'wallet/src/components/modals/BottomSheetModal'
import { FEATURE_FLAGS } from 'wallet/src/features/experiments/constants'
import { useFeatureFlag } from 'wallet/src/features/experiments/hooks'
import { ImportType, OnboardingEntryPoint } from 'wallet/src/features/onboarding/types'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import {
  createAccountActions,
  createAccountSagaName,
} from 'wallet/src/features/wallet/create/createAccountSaga'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'wallet/src/features/wallet/create/pendingAccountsSaga'
import { useActiveAccountAddress, useNativeAccountExists } from 'wallet/src/features/wallet/hooks'
import { selectAllAccountsSorted } from 'wallet/src/features/wallet/selectors'
import { setAccountAsActive } from 'wallet/src/features/wallet/slice'
import { ElementName, ModalName } from 'wallet/src/telemetry/constants'
import { openSettings } from 'wallet/src/utils/linking'

export function AccountSwitcherModal(): JSX.Element {
  const dispatch = useAppDispatch()
  const colors = useSporeColors()

  return (
    <BottomSheetModal
      backgroundColor={colors.surface1.get()}
      name={ModalName.AccountSwitcher}
      onClose={(): Action => dispatch(closeModal({ name: ModalName.AccountSwitcher }))}>
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
  const dispatch = useAppDispatch()
  const hasImportedSeedPhrase = useNativeAccountExists()
  const modalState = useAppSelector(selectModalState(ModalName.AccountSwitcher))
  const unitagsFeatureFlagEnabled = useFeatureFlag(FEATURE_FLAGS.Unitags)
  const onCompleteOnboarding = useCompleteOnboardingCallback({
    entryPoint: OnboardingEntryPoint.Sidebar,
    importType: hasImportedSeedPhrase ? ImportType.CreateAdditional : ImportType.CreateNew,
  })

  const [showAddWalletModal, setShowAddWalletModal] = useState(false)
  const [createdAdditionalAccount, setCreatedAdditionalAccount] = useState(false)

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
    if (!activeAccountAddress) {
      return
    }

    dispatch(closeModal({ name: ModalName.AccountSwitcher }))
    navigate(Screens.SettingsStack, {
      screen: Screens.SettingsWallet,
      params: { address: activeAccountAddress },
    })
  }

  // Pick up account creation and activate
  useSagaStatus(createAccountSagaName, async () => {
    if (createdAdditionalAccount) {
      setCreatedAdditionalAccount(false)
      await onCompleteOnboarding()
    }
  })

  const addWalletOptions = useMemo<MenuItemProp[]>(() => {
    const onPressCreateNewWallet = (): void => {
      // Ensure no pending accounts
      dispatch(pendingAccountActions.trigger(PendingAccountActions.ActivateOneAndDelete))
      dispatch(createAccountActions.trigger())

      if (unitagsFeatureFlagEnabled) {
        if (hasImportedSeedPhrase) {
          setCreatedAdditionalAccount(true)
        } else {
          // create pending account and place into welcome flow
          navigate(Screens.OnboardingStack, {
            screen: OnboardingScreens.WelcomeWallet,
            params: {
              importType: ImportType.CreateNew,
              entryPoint: OnboardingEntryPoint.Sidebar,
            },
          })
        }
      } else {
        navigate(Screens.OnboardingStack, {
          screen: OnboardingScreens.EditName,
          params: {
            entryPoint: OnboardingEntryPoint.Sidebar,
            importType: hasImportedSeedPhrase ? ImportType.CreateAdditional : ImportType.CreateNew,
          },
        })
      }

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

    const options: MenuItemProp[] = [
      {
        key: ElementName.CreateAccount,
        onPress: onPressCreateNewWallet,
        render: () => (
          <Flex
            alignItems="center"
            borderBottomColor="$surface3"
            borderBottomWidth={1}
            p="$spacing16">
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
              {isAndroid
                ? t('account.cloud.button.restore.android')
                : t('account.cloud.button.restore.ios')}
            </Text>
          </Flex>
        ),
      })
    }

    return options
  }, [activeAccountAddress, dispatch, hasImportedSeedPhrase, onClose, t, unitagsFeatureFlagEnabled])

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
          variant="subheading1"
        />
        <Flex px="$spacing24">
          <Button
            size="small"
            testID={ElementName.WalletSettings}
            theme="secondary"
            onPress={onManageWallet}>
            {t('account.wallet.button.manage')}
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
