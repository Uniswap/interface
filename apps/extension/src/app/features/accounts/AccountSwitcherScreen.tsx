import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { BaseSyntheticEvent, useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch, useSelector } from 'react-redux'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { AccountItem } from 'src/app/features/accounts/AccountItem'
import { CreateWalletModal } from 'src/app/features/accounts/CreateWalletModal'
import { EditLabelModal } from 'src/app/features/accounts/EditLabelModal'
import { useSortedAccountList } from 'src/app/features/accounts/useSortedAccountList'
import { updateDappConnectedAddressFromExtension } from 'src/app/features/dapp/actions'
import { useDappContext } from 'src/app/features/dapp/DappContext'
import { useDappConnectedAccounts } from 'src/app/features/dapp/hooks'
import { isConnectedAccount } from 'src/app/features/dapp/utils'
import { openPopup, PopupName } from 'src/app/features/popups/slice'
import { AppRoutes, RemoveRecoveryPhraseRoutes, SettingsRoutes, UnitagClaimRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { focusOrCreateUnitagTab, useExtensionNavigation } from 'src/app/navigation/utils'
import { Button, Flex, Popover, ScrollView, Text, TouchableArea, useSporeColors } from 'ui/src'
import { Ellipsis, Globe, Person, TrashFilled, WalletFilled, X } from 'ui/src/components/icons'
import { spacing } from 'ui/src/theme'
import { AddressDisplay } from 'uniswap/src/components/accounts/AddressDisplay'
import { buildWrappedUrl } from 'uniswap/src/components/banners/shared/utils'
import { UniswapWrapped2025Card } from 'uniswap/src/components/banners/UniswapWrapped2025Card/UniswapWrapped2025Card'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { UNISWAP_WEB_URL } from 'uniswap/src/constants/urls'
import { AccountType, DisplayNameType } from 'uniswap/src/features/accounts/types'
import { setHasDismissedUniswapWrapped2025Banner } from 'uniswap/src/features/behaviorHistory/slice'
import { Platform } from 'uniswap/src/features/platforms/types/Platform'
import { ModalName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ImportType } from 'uniswap/src/types/onboarding'
import { areAddressesEqual } from 'uniswap/src/utils/addresses'
import { logger } from 'utilities/src/logger/logger'
import { sleep } from 'utilities/src/time/timing'
import { PlusCircle } from 'wallet/src/components/icons/PlusCircle'
import { ContextMenu } from 'wallet/src/components/menu/ContextMenu'
import { MenuContent } from 'wallet/src/components/menu/MenuContent'
import { MenuContentItem } from 'wallet/src/components/menu/types'
import { createOnboardingAccount } from 'wallet/src/features/onboarding/createOnboardingAccount'
import { useCanActiveAddressClaimUnitag } from 'wallet/src/features/unitags/hooks/useCanActiveAddressClaimUnitag'
import { BackupType, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { hasBackup } from 'wallet/src/features/wallet/accounts/utils'
import { createAccountsActions } from 'wallet/src/features/wallet/create/createAccountsSaga'
import {
  useActiveAccountAddressWithThrow,
  useActiveAccountWithThrow,
  useDisplayName,
  useSignerAccounts,
} from 'wallet/src/features/wallet/hooks'
import { selectSortedSignerMnemonicAccounts } from 'wallet/src/features/wallet/selectors'
import { setAccountAsActive } from 'wallet/src/features/wallet/slice'

const MIN_MENU_WIDTH = 200

export function AccountSwitcherScreen(): JSX.Element {
  const colors = useSporeColors()
  const dispatch = useDispatch()
  const { t } = useTranslation()

  const { navigateTo } = useExtensionNavigation()
  const activeAccount = useActiveAccountWithThrow()
  const activeAddress = activeAccount.address
  const isViewOnly = activeAccount.type === AccountType.Readonly

  const isWrappedBannerEnabled = useFeatureFlag(FeatureFlags.UniswapWrapped2025)

  const accounts = useSignerAccounts()
  const accountAddresses = useMemo(
    () =>
      accounts
        .map((account) => account.address)
        .filter(
          (address) =>
            !areAddressesEqual({
              addressInput1: { address, platform: Platform.EVM },
              addressInput2: { address: activeAddress, platform: Platform.EVM },
            }),
        ),
    [accounts, activeAddress],
  )
  const { dappUrl } = useDappContext()

  const connectedAccounts = useDappConnectedAccounts(dappUrl)

  // TODO: EXT-899 https://linear.app/uniswap/issue/EXT-899/enable-unitag-edit-button-is-account-header
  const activeAccountDisplayName = useDisplayName(activeAddress)
  const activeAccountHasUnitag = activeAccountDisplayName?.type === DisplayNameType.Unitag
  const activeAccountHasENS = activeAccountDisplayName?.type === DisplayNameType.ENS

  const [showEditLabelModal, setShowEditLabelModal] = useState(false)

  const [showRemoveWalletModal, setShowRemoveWalletModal] = useState(false)
  const [showImportWalletModal, setShowImportWalletModal] = useState(false)
  const [showCreateWalletModal, setShowCreateWalletModal] = useState(false)

  const [pendingWallet, setPendingWallet] = useState<SignerMnemonicAccount>()

  const sortedMnemonicAccounts = useSelector(selectSortedSignerMnemonicAccounts)

  const { canClaimUnitag } = useCanActiveAddressClaimUnitag(activeAddress)

  useEffect(() => {
    const createOnboardingAccountAfterTransitionAnimation = async (): Promise<void> => {
      // TODO: EXT-1164 - Move Keyring methods to workers to not block main thread during onboarding
      // Delays computation heavy function invocation to avoid disrupting transition animation
      await sleep(400)
      setPendingWallet(await createOnboardingAccount(sortedMnemonicAccounts))
    }
    createOnboardingAccountAfterTransitionAnimation().catch((e) => {
      logger.error(e, {
        tags: { file: 'AccountSwitcherScreen', function: 'createOnboardingAccount' },
      })
    })
  }, [sortedMnemonicAccounts])

  const onNavigateToRemoveWallet = (): void => {
    setShowRemoveWalletModal(false)
    setShowImportWalletModal(false)
    navigate(`/${AppRoutes.Settings}/${SettingsRoutes.RemoveRecoveryPhrase}/${RemoveRecoveryPhraseRoutes.Wallets}`)
  }

  const onCancelCreateWallet = (): void => {
    setShowCreateWalletModal(false)
  }

  const onConfirmCreateWallet = useCallback(
    async (walletLabel: string): Promise<void> => {
      setShowCreateWalletModal(false)
      if (!pendingWallet) {
        return
      }

      if (walletLabel) {
        pendingWallet.name = walletLabel
      }

      dispatch(
        createAccountsActions.trigger({
          accounts: [pendingWallet],
        }),
      )

      sendAnalyticsEvent(WalletEventName.WalletAdded, {
        wallet_type: ImportType.CreateAdditional,
        accounts_imported_count: 1,
        wallets_imported: [pendingWallet.address],
        cloud_backup_used: hasBackup(BackupType.Cloud, pendingWallet),
        modal: ModalName.AccountSwitcher,
      })

      navigate(-1)

      // Only show connect popup if some account is connected to current dapp
      if (connectedAccounts.length > 0) {
        dispatch(openPopup(PopupName.Connect))
      }
    },
    [connectedAccounts.length, dispatch, pendingWallet],
  )

  const onPressWrappedCard = useCallback(() => {
    try {
      const url = buildWrappedUrl(UNISWAP_WEB_URL, activeAddress)
      window.open(url, '_blank')
      dispatch(setHasDismissedUniswapWrapped2025Banner(true))
      navigate(-1)
    } catch (error) {
      logger.error(error, { tags: { file: 'AccountSwitcherScreen', function: 'onPressWrappedCard' } })
    }
  }, [activeAddress, dispatch])

  const addWalletMenuOptions: MenuContentItem[] = [
    {
      label: t('account.wallet.button.create'),
      onPress: (): void => setShowCreateWalletModal(true),
    },
    {
      label: t('account.wallet.button.import'),
      onPress: (): void => setShowImportWalletModal(true),
    },
  ]

  const sortedAddressesByBalance = useSortedAccountList(accountAddresses)

  const contentShadowProps = {
    shadowColor: colors.shadowColor.val,
    shadowRadius: 12,
    shadowOpacity: 0.1,
    zIndex: 1,
  }

  const menuOptions = useMemo((): MenuContentItem[] => {
    return [
      ...(canClaimUnitag
        ? [
            {
              label: t('account.wallet.menu.claimUsername'),

              onPress: async () => await focusOrCreateUnitagTab(activeAddress, UnitagClaimRoutes.ClaimIntro),

              Icon: Person,
            },
          ]
        : []),

      {
        label: t('account.wallet.menu.manageConnections'),
        onPress: () => navigateTo(`/${AppRoutes.Settings}/${SettingsRoutes.ManageConnections}`),
        Icon: Globe,
      },
      {
        label: t('account.wallet.menu.remove.title'),
        onPress: (e: BaseSyntheticEvent): void => {
          // We have to manually prevent click-through because the way the context menu is inside of a TouchableArea in this component it
          // means that without it the TouchableArea handler will get called
          e.preventDefault()
          e.stopPropagation()
          setShowRemoveWalletModal(true)
        },
        textProps: { color: '$statusCritical' },
        Icon: TrashFilled,
        iconProps: { color: '$statusCritical' },
      },
    ]
  }, [canClaimUnitag, activeAddress, navigateTo, t])

  return (
    <Trace logImpression modal={ModalName.AccountSwitcher}>
      <EditLabelModal
        address={activeAddress}
        isOpen={showEditLabelModal}
        onClose={() => setShowEditLabelModal(false)}
      />
      <WarningModal
        caption={
          showImportWalletModal
            ? t('account.recoveryPhrase.remove.import.description')
            : t('account.recoveryPhrase.remove.mnemonic.description', {
                walletNames: [activeAccountDisplayName?.name ?? ''],
              })
        }
        rejectText={t('common.button.cancel')}
        acknowledgeText={t('common.button.continue')}
        icon={<WalletFilled color="$statusCritical" size="$icon.24" />}
        isOpen={showImportWalletModal || showRemoveWalletModal}
        modalName={ModalName.RemoveWallet}
        severity={WarningSeverity.High}
        title={
          showImportWalletModal
            ? t('account.wallet.button.import')
            : t('account.wallet.remove.title', { name: activeAccountDisplayName?.name ?? '' })
        }
        onClose={() => {
          setShowImportWalletModal(false)
          setShowRemoveWalletModal(false)
        }}
        onAcknowledge={onNavigateToRemoveWallet}
      />
      <CreateWalletModal
        isOpen={showCreateWalletModal}
        pendingWallet={pendingWallet}
        onCancel={onCancelCreateWallet}
        onConfirm={onConfirmCreateWallet}
      />
      <Flex backgroundColor="$surface1" px="$spacing12" py="$spacing8">
        <ScreenHeader
          Icon={X}
          rightColumn={
            <ContextMenu
              closeOnClick
              itemId="account-switcher-ellipsis-dropdown"
              menuOptions={menuOptions}
              placement="bottom"
              onLeftClick
              menuContainerStyleProps={{ mr: '$spacing12' }}
            >
              <TouchableArea
                borderRadius="$roundedFull"
                hoverStyle={{ backgroundColor: '$surface2Hovered' }}
                p="$spacing8"
              >
                <Ellipsis color="$neutral2" size="$icon.20" />
              </TouchableArea>
            </ContextMenu>
          }
        />
        <Flex pb="$spacing4" pt="$spacing8" px="$spacing12">
          <Flex row alignSelf="stretch" width="100%" justifyContent="center">
            <Flex flex={1} justifyContent="center" alignItems="center">
              <AddressDisplay
                showCopy
                centered
                address={activeAddress}
                captionVariant="body3"
                direction="column"
                displayNameTextAlign="center"
                horizontalGap="$spacing8"
                showViewOnlyBadge={isViewOnly}
                size={spacing.spacing60 - spacing.spacing4}
                variant="subheading1"
              />
            </Flex>
          </Flex>

          {isWrappedBannerEnabled && (
            <Flex pt="$spacing16">
              <UniswapWrapped2025Card onPress={onPressWrappedCard} />
            </Flex>
          )}

          <Flex pt={activeAccountHasENS ? undefined : '$padding16'}>
            {activeAccountHasUnitag ? (
              <UnitagActionButton />
            ) : (
              !activeAccountHasENS && (
                <Flex row>
                  <Button
                    size="small"
                    testID={TestID.AccountCard}
                    emphasis="secondary"
                    onPress={() => setShowEditLabelModal(true)}
                  >
                    {t('account.wallet.header.button.title')}
                  </Button>
                </Flex>
              )
            )}
          </Flex>
        </Flex>
        <ScrollView backgroundColor="$surface1" height="auto">
          <Flex pt="$padding20">
            {sortedAddressesByBalance.map(({ address, balance }) => {
              return (
                <AccountItem
                  key={address}
                  address={address}
                  balanceUSD={balance}
                  onAccountSelect={async (): Promise<void> => {
                    dispatch(setAccountAsActive(address))
                    await updateDappConnectedAddressFromExtension(address)
                    if (connectedAccounts.length > 0 && !isConnectedAccount(connectedAccounts, address)) {
                      dispatch(openPopup(PopupName.Connect))
                    }
                    navigate(-1)
                  }}
                />
              )
            })}
          </Flex>
          <Popover offset={-spacing.spacing4} placement="top-start">
            <Popover.Trigger>
              <Flex
                row
                alignItems="center"
                cursor="pointer"
                gap="$spacing12"
                mt="$spacing12"
                pb="$spacing4"
                px="$spacing12"
              >
                <PlusCircle />
                <Text color="$neutral1" py="$spacing8" variant="buttonLabel2">
                  {t('account.wallet.button.add')}
                </Text>
              </Flex>
            </Popover.Trigger>
            <Popover.Content
              animation={[
                'quick',
                {
                  opacity: {
                    overshootClamping: true,
                  },
                },
              ]}
              borderColor="$surface3"
              borderRadius="$rounded16"
              borderWidth="$spacing1"
              enableRemoveScroll={true}
              enterStyle={{ y: -10, opacity: 0 }}
              exitStyle={{ y: -10, opacity: 0 }}
              p="$none"
              {...contentShadowProps}
            >
              <MenuContent items={addWalletMenuOptions} minWidth={MIN_MENU_WIDTH} />
            </Popover.Content>
          </Popover>
        </ScrollView>
      </Flex>
    </Trace>
  )
}

const UnitagActionButton = (): JSX.Element => {
  const { t } = useTranslation()
  const address = useActiveAccountAddressWithThrow()

  const onPressEditProfile = useCallback(async () => {
    await focusOrCreateUnitagTab(address, UnitagClaimRoutes.EditProfile)
  }, [address])

  return (
    <Flex row>
      <Button size="small" testID={TestID.AccountCard} emphasis="secondary" onPress={onPressEditProfile}>
        {t('account.wallet.header.button.disabled.title')}
      </Button>
    </Flex>
  )
}
