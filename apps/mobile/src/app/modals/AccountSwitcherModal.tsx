import { CommonActions } from '@react-navigation/core'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Alert } from 'react-native'
import 'react-native-gesture-handler'
import { Action } from 'redux'
import { useAppDispatch, useAppSelector, useAppTheme } from 'src/app/hooks'
import { dispatchNavigationAction, navigate } from 'src/app/navigation/rootNavigation'
import PlusIcon from 'src/assets/icons/plus.svg'
import { AccountList } from 'src/components/accounts/AccountList'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { Box, Flex } from 'src/components/layout'
import { Delay } from 'src/components/layout/Delayed'
import { Screen } from 'src/components/layout/Screen'
import { ActionSheetModal, MenuItemProp } from 'src/components/modals/ActionSheetModal'
import { BottomSheetModal } from 'src/components/modals/BottomSheetModal'
import RemoveSeedPhraseWarningModal from 'src/components/modals/WarningModal/RemoveSeedPhraseWarningModal'
import { Text } from 'src/components/Text'
import { isICloudAvailable } from 'src/features/CloudBackup/RNICloudBackupsManager'
import { closeModal, selectModalState } from 'src/features/modals/modalSlice'
import { ImportType, OnboardingEntryPoint } from 'src/features/onboarding/utils'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import { AccountType, SignerMnemonicAccount } from 'src/features/wallet/accounts/types'
import { createAccountActions } from 'src/features/wallet/createAccountSaga'
import { useAccounts, useActiveAccount, useNativeAccountExists } from 'src/features/wallet/hooks'
import {
  PendingAccountActions,
  pendingAccountActions,
} from 'src/features/wallet/pendingAccountsSaga'
import {
  activateAccount,
  removeAccounts,
  setFinishedOnboarding,
} from 'src/features/wallet/walletSlice'
import { OnboardingScreens, Screens } from 'src/screens/Screens'
import { dimensions } from 'src/styles/sizing'
import { openSettings } from 'src/utils/linking'

// This fast-forwards user to the same app state as if
// they have pressed "Get Started" on Landing and then "Import my wallet" on the next screen
function navigateToImportSeedPhrase(): void {
  dispatchNavigationAction((state) => {
    const routes = [
      ...state.routes,
      {
        name: OnboardingScreens.ImportMethod,
      },
      {
        name: OnboardingScreens.SeedPhraseInput,
        params: {
          importType: ImportType.SeedPhrase,
          entryPoint: OnboardingEntryPoint.FreshInstallOrReplace,
        },
      },
    ]
    return CommonActions.reset({
      ...state,
      routes,
      index: routes.length - 1,
    })
  })
}

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

  const activeAccount = useActiveAccount()
  const addressToAccount = useAccounts()
  const dispatch = useAppDispatch()
  const hasImportedSeedPhrase = useNativeAccountExists()
  const modalState = useAppSelector(selectModalState(ModalName.AccountSwitcher))

  const [showAddWalletModal, setShowAddWalletModal] = useState(false)
  const [showReplaceSeedPhraseModal, setShowReplaceSeedPhraseModal] = useState(false)
  const associatedAccounts = useMemo(
    () => Object.values(addressToAccount).filter((a) => a.type === AccountType.SignerMnemonic),
    [addressToAccount]
  )

  const accountsData = useMemo(() => {
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
    return [..._mnemonicWallets, ..._viewOnlyWallets]
  }, [addressToAccount])

  const onPressAccount = useCallback(
    (address: Address) => {
      onClose()
      // allow close modal logic to finish in JS thread before `activateAccount` logic kicks in
      setImmediate(() => dispatch(activateAccount(address)))
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
        setShowReplaceSeedPhraseModal(true)
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
          <Box
            alignItems="center"
            borderTopColor="backgroundOutline"
            borderTopWidth={1}
            p="spacing16">
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

  if (!activeAccount?.address) {
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
      <AccountList accounts={accountsData} isVisible={modalState.isOpen} onPress={onPressAccount} />
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
        isVisible={showAddWalletModal}
        name={ModalName.AddWallet}
        options={addWalletOptions}
        onClose={onCloseAddWallet}
      />
      {showReplaceSeedPhraseModal && (
        <RemoveSeedPhraseWarningModal
          associatedAccounts={associatedAccounts}
          onClose={(): void => setShowReplaceSeedPhraseModal(false)}
          onRemoveWallet={(): void => {
            onClose()
            // Need this timeout because AccountSwitcher is takes a long time to be closeModal
            // and only then we want to proceed with the remove logic
            setTimeout(() => {
              if (Object.keys(addressToAccount).length === associatedAccounts.length) {
                // user has no accounts left, so we bring onboarding back
                dispatch(setFinishedOnboarding({ finishedOnboarding: false }))
                // setImmediate, because first we need onboarding stack to be mounted
                setImmediate(navigateToImportSeedPhrase)
              } else {
                // user has view-only accounts left
                navigate(Screens.OnboardingStack, {
                  screen: OnboardingScreens.SeedPhraseInput,
                  params: {
                    importType: ImportType.SeedPhrase,
                    entryPoint: OnboardingEntryPoint.Sidebar,
                  },
                })
              }
              const accountsToRemove = removeAccounts(
                associatedAccounts.map((account) => account.address)
              )
              dispatch(accountsToRemove)
            }, Delay.Short)
          }}
        />
      )}
    </Flex>
  )
}
