import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import 'react-native-gesture-handler'
import { Action } from 'redux'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { navigate } from 'src/app/navigation/rootNavigation'
import { AccountList } from 'src/components/accounts/AccountList'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box, Flex } from 'src/components/layout'
import { Screen } from 'src/components/layout/Screen'
import { ActionSheetModal, MenuItemProp } from 'src/components/modals/ActionSheetModal'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import { Text } from 'src/components/Text'
import { IS_ANDROID } from 'src/constants/globals'
import { isICloudAvailable } from 'src/features/CloudBackup/RNICloudBackupsManager'
import { closeModal, openModal, selectModalState } from 'src/features/modals/modalSlice'
import { ImportType, OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import { openSettings } from 'src/utils/linking'
import PlusIcon from 'ui/src/assets/icons/plus.svg'
import { dimensions } from 'ui/src/theme/restyle/sizing'
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
  const theme = useAppTheme()

  return (
    <BottomSheetModal
      disableSwipe
      backgroundColor={theme.colors.surface1}
      name={ModalName.AccountSwitcher}
      onClose={(): Action => dispatch(closeModal({ name: ModalName.AccountSwitcher }))}>
      <Screen bg="surface1" noInsets={true}>
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
 * TODO [MOB-259] Once testing works with the BottomSheetModal stop exporting this component.
 */
export function AccountSwitcher({ onClose }: { onClose: () => void }): JSX.Element | null {
  const { t } = useTranslation()
  const theme = useAppTheme()

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
        dispatch(
          openModal({
            name: ModalName.RemoveWallet,
          })
        )
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
          <Box alignItems="center" borderBottomColor="surface3" borderBottomWidth={1} p="spacing16">
            <Text variant="bodyLarge">{t('Create a new wallet')}</Text>
          </Box>
        ),
      },
      {
        key: ElementName.AddViewOnlyWallet,
        onPress: onPressAddViewOnlyWallet,
        render: () => (
          <Box alignItems="center" p="spacing16">
            <Text variant="bodyLarge">{t('Add a view-only wallet')}</Text>
          </Box>
        ),
      },
      {
        key: ElementName.ImportAccount,
        onPress: onPressImportWallet,
        render: () => (
          <Box alignItems="center" borderTopColor="surface3" borderTopWidth={1} p="spacing16">
            <Text variant="bodyLarge">{t('Import a new wallet')}</Text>
          </Box>
        ),
      },
    ]

    if (!hasImportedSeedPhrase) {
      options.push({
        key: ElementName.RestoreFromICloud,
        onPress: onPressRestore,
        render: () => (
          <Box alignItems="center" borderTopColor="surface3" borderTopWidth={1} p="spacing16">
            <Text variant="bodyLarge">
              {IS_ANDROID ? t('Restore from Google Drive') : t('Restore from iCloud')}
            </Text>
          </Box>
        ),
      })
    }

    return options
  }, [activeAccountAddress, dispatch, hasImportedSeedPhrase, onClose, t])

  if (!activeAccountAddress) {
    return null
  }

  const fullScreenContentHeight = 0.89 * dimensions.fullHeight

  return (
    <Flex fill gap="none" maxHeight={fullScreenContentHeight} mb="spacing12">
      <Flex row alignItems="center" mb="spacing16">
        <Box flex={1} pl="spacing24">
          <Text color="neutral1" textAlign="left" variant="bodyLarge">
            {t('Your wallets')}
          </Text>
        </Box>
      </Flex>
      <AccountList accounts={accounts} isVisible={modalState.isOpen} onPress={onPressAccount} />
      <TouchableArea hapticFeedback my="spacing24" onPress={onPressAddWallet}>
        <Flex row alignItems="center" ml="spacing24">
          <Box borderColor="surface3" borderRadius="roundedFull" borderWidth={1} p="spacing12">
            <PlusIcon
              color={theme.colors.neutral1}
              height={theme.iconSizes.icon16}
              strokeWidth={2}
              width={theme.iconSizes.icon16}
            />
          </Box>
          <Text color="neutral1" variant="bodyLarge">
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
