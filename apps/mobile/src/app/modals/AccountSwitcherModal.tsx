import { useIsFocused } from '@react-navigation/core'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import React, { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { navigate } from 'src/app/navigation/rootNavigation'
import { AccountList } from 'src/components/accounts/AccountList'
import { checkCloudBackupOrShowAlert } from 'src/components/mnemonic/cloudImportUtils'
import { useReactNavigationModal } from 'src/components/modals/useReactNavigationModal'
import { WalletRestoreType } from 'src/components/RestoreWalletModal/RestoreWalletModalState'
import { useWalletRestore } from 'src/features/wallet/useWalletRestore'
import { Button, Flex, Text, TouchableArea, useSporeColors } from 'ui/src'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { spacing } from 'ui/src/theme'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { buildWrappedUrl } from 'uniswap/src/components/banners/shared/utils'
import { UniswapWrapped2025Card } from 'uniswap/src/components/banners/UniswapWrapped2025Card/UniswapWrapped2025Card'
import { ActionSheetModal, MenuItemProp } from 'uniswap/src/components/modals/ActionSheetModal'
import { Modal } from 'uniswap/src/components/modals/Modal'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { setHasDismissedUniswapWrapped2025Banner } from 'uniswap/src/features/behaviorHistory/slice'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ElementName, ModalName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ImportType, OnboardingEntryPoint } from 'uniswap/src/types/onboarding'
import { MobileScreens, OnboardingScreens } from 'uniswap/src/types/screens/mobile'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { openUri } from 'uniswap/src/utils/linking'
import { logger } from 'utilities/src/logger/logger'
import { isAndroid } from 'utilities/src/platform'
import { PlusCircle } from 'wallet/src/components/icons/PlusCircle'
import { createOnboardingAccount } from 'wallet/src/features/onboarding/createOnboardingAccount'
import { BackupType } from 'wallet/src/features/wallet/accounts/types'
import { hasBackup } from 'wallet/src/features/wallet/accounts/utils'
import { createAccountsActions } from 'wallet/src/features/wallet/create/createAccountsSaga'
import { useActiveAccountAddress, useNativeAccountExists } from 'wallet/src/features/wallet/hooks'
import { selectAllAccountsSorted, selectSortedSignerMnemonicAccounts } from 'wallet/src/features/wallet/selectors'
import { setAccountAsActive } from 'wallet/src/features/wallet/slice'

export function AccountSwitcherModal(): JSX.Element {
  const colors = useSporeColors()
  const { onClose } = useReactNavigationModal()

  return (
    <Modal backgroundColor={colors.surface1.val} name={ModalName.AccountSwitcher} onClose={onClose}>
      <Flex backgroundColor="$surface1">
        <AccountSwitcher onClose={onClose} />
      </Flex>
    </Modal>
  )
}

/**
 * Exported for testing only.
 * TODO [MOB-259] Once testing works with the Modal stop exporting this component.
 */
export function AccountSwitcher({ onClose }: { onClose: () => void }): JSX.Element | null {
  const insets = useAppInsets()
  const dimensions = useDeviceDimensions()
  const { t } = useTranslation()
  const activeAccountAddress = useActiveAccountAddress()
  const dispatch = useDispatch()
  const hasImportedSeedPhrase = useNativeAccountExists()
  const isModalOpen = useIsFocused()
  const { openWalletRestoreModal, walletRestoreType } = useWalletRestore()

  const isWrappedBannerEnabled = useFeatureFlag(FeatureFlags.UniswapWrapped2025)

  const sortedMnemonicAccounts = useSelector(selectSortedSignerMnemonicAccounts)

  const [showAddWalletModal, setShowAddWalletModal] = useState(false)

  const accounts = useSelector(selectAllAccountsSorted)

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

    onClose()
    navigate(ModalName.ManageWalletsModal, {
      address: activeAccountAddress,
    })
  }

  const onPressWrappedCard = useCallback(async () => {
    if (!activeAccountAddress) {
      return
    }

    try {
      const url = buildWrappedUrl(UNISWAP_WEB_URL, activeAccountAddress)
      await openUri({ uri: url, openExternalBrowser: true })
      onClose()
      dispatch(setHasDismissedUniswapWrapped2025Banner(true))
    } catch (error) {
      logger.error(error, { tags: { file: 'AccountSwitcherModal', function: 'onPressWrappedCard' } })
    }
  }, [activeAccountAddress, onClose, dispatch])

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
        cloud_backup_used: hasBackup(BackupType.Cloud, newAccount),
        modal: ModalName.AccountSwitcher,
      })
    }

    const onPressCreateNewWallet = async (): Promise<void> => {
      setShowAddWalletModal(false)
      onClose()

      if (walletRestoreType === WalletRestoreType.SeedPhrase) {
        openWalletRestoreModal()
        return
      }

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
      onClose()
      navigate(MobileScreens.OnboardingStack, {
        screen: OnboardingScreens.WatchWallet,
        params: {
          importType: ImportType.Watch,
          entryPoint: OnboardingEntryPoint.Sidebar,
        },
      })
      setShowAddWalletModal(false)
    }

    const onPressImportWallet = (): void => {
      onClose()
      if (hasImportedSeedPhrase && activeAccountAddress) {
        navigate(ModalName.RemoveWallet, {
          replaceMnemonic: true,
        })
      } else {
        navigate(MobileScreens.OnboardingStack, {
          screen: OnboardingScreens.SeedPhraseInput,
          params: { importType: ImportType.SeedPhrase, entryPoint: OnboardingEntryPoint.Sidebar },
        })
      }
      setShowAddWalletModal(false)
    }

    const onPressRestore = async (): Promise<void> => {
      const hasCloudBackup = await checkCloudBackupOrShowAlert(t)
      if (!hasCloudBackup) {
        return
      }

      onClose()
      navigate(MobileScreens.OnboardingStack, {
        screen: OnboardingScreens.RestoreCloudBackupLoading,
        params: { importType: ImportType.Restore, entryPoint: OnboardingEntryPoint.Sidebar },
      })
      setShowAddWalletModal(false)
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
  }, [
    activeAccountAddress,
    dispatch,
    hasImportedSeedPhrase,
    onClose,
    sortedMnemonicAccounts,
    t,
    openWalletRestoreModal,
    walletRestoreType,
  ])

  const accountsWithoutActive = accounts.filter((a) => a.address !== activeAccountAddress)

  const isViewOnly =
    accounts.find((a) =>
      // TODO(WALL-7065): Update to support solana
      areAddressesEqual({
        addressInput1: { address: a.address, platform: Platform.EVM },
        addressInput2: { address: activeAccountAddress, platform: Platform.EVM },
      }),
    )?.type === AccountType.Readonly

  if (!activeAccountAddress) {
    return null
  }

  const fullScreenContentHeight = dimensions.fullHeight - insets.top - insets.bottom - spacing.spacing36 // approximate bottom sheet handle height + padding bottom

  return (
    <Flex $short={{ pb: '$none' }} maxHeight={fullScreenContentHeight} pb="$spacing12">
      <Flex gap="$spacing16" pb="$spacing16" pt="$spacing12" mx="$spacing12">
        <AddressDisplay
          showCopy
          centered
          address={activeAccountAddress}
          direction="column"
          horizontalGap="$spacing8"
          showViewOnlyBadge={isViewOnly}
          size={spacing.spacing60 - spacing.spacing4}
          variant="subheading1"
        />
        {isWrappedBannerEnabled && (
          <Flex row px="$spacing12">
            <UniswapWrapped2025Card onPress={onPressWrappedCard} />
          </Flex>
        )}
        <Flex row px="$spacing12">
          <Button
            lineHeightDisabled
            size="medium"
            testID={TestID.WalletSettings}
            emphasis="secondary"
            onPress={onManageWallet}
          >
            {t('account.wallet.button.manage')}
          </Button>
        </Flex>
      </Flex>
      <Flex maxHeight={fullScreenContentHeight / 2}>
        <AccountList
          accounts={accountsWithoutActive}
          isVisible={isModalOpen}
          onPress={onPressAccount}
          onClose={onClose}
        />
      </Flex>
      <TouchableArea mt="$spacing16" testID={TestID.AccountSwitcherAddWallet} onPress={onPressAddWallet}>
        <Flex row alignItems="center" gap="$spacing8" ml="$spacing24">
          <PlusCircle />
          <Text numberOfLines={1} width="100%" color="$neutral1" variant="buttonLabel2">
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
