import { useCallback, useEffect, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { ComingSoon } from 'src/app/components/ComingSoon'
import { ScreenHeader } from 'src/app/components/layout/ScreenHeader'
import { AccountItem } from 'src/app/features/accounts/AccountItem'
import { CreateWalletModal } from 'src/app/features/accounts/CreateWalletModal'
import { EditLabelModal } from 'src/app/features/accounts/EditLabelModal'
import { useDappContext } from 'src/app/features/dapp/DappContext'
import { updateDappConnectedAddressFromExtension } from 'src/app/features/dapp/actions'
import { useDappConnectedAccounts } from 'src/app/features/dapp/hooks'
import { isConnectedAccount } from 'src/app/features/dapp/utils'
import { PopupName, openPopup } from 'src/app/features/popups/slice'
import { AppRoutes, RemoveRecoveryPhraseRoutes, SettingsRoutes } from 'src/app/navigation/constants'
import { navigate } from 'src/app/navigation/state'
import { useAppDispatch } from 'src/store/store'
import { Button, Flex, MenuContent, MenuContentItem, Popover, ScrollView, Text, useSporeColors } from 'ui/src'
import { WalletFilled, X } from 'ui/src/components/icons'
import { spacing } from 'ui/src/theme'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { ModalName, WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { ImportType } from 'uniswap/src/types/onboarding'
import { logger } from 'utilities/src/logger/logger'
import { sleep } from 'utilities/src/time/timing'
import { AddressDisplay } from 'wallet/src/components/accounts/AddressDisplay'
import { PlusCircle } from 'wallet/src/components/icons/PlusCircle'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { createOnboardingAccount } from 'wallet/src/features/onboarding/createOnboardingAccount'
import { WarningSeverity } from 'wallet/src/features/transactions/WarningModal/types'
import { AccountType, BackupType, SignerMnemonicAccount } from 'wallet/src/features/wallet/accounts/types'
import { createAccountsActions } from 'wallet/src/features/wallet/create/createAccountsSaga'
import { useActiveAccountWithThrow, useDisplayName, useSignerAccounts } from 'wallet/src/features/wallet/hooks'
import { selectSortedSignerMnemonicAccounts } from 'wallet/src/features/wallet/selectors'
import { setAccountAsActive } from 'wallet/src/features/wallet/slice'
import { DisplayNameType } from 'wallet/src/features/wallet/types'

const MIN_MENU_WIDTH = 200

export function AccountSwitcherScreen(): JSX.Element {
  const colors = useSporeColors()
  const dispatch = useAppDispatch()
  const { t } = useTranslation()

  const activeAccount = useActiveAccountWithThrow()
  const activeAddress = activeAccount.address
  const isViewOnly = activeAccount.type === AccountType.Readonly

  const accounts = useSignerAccounts()
  const accountAddresses = useMemo(
    () => accounts.map((account) => account.address).filter((address) => address !== activeAddress),
    [accounts, activeAddress],
  )
  const { dappUrl } = useDappContext()

  const connectedAccounts = useDappConnectedAccounts(dappUrl)

  // TODO: EXT-899 https://linear.app/uniswap/issue/EXT-899/enable-unitag-edit-button-is-account-header
  const activeAccountDisplayName = useDisplayName(activeAddress)
  const activeAccountHasUnitag = activeAccountDisplayName?.type === DisplayNameType.Unitag

  const [showEditLabelModal, setShowEditLabelModal] = useState(false)

  const [showRemoveWalletModal, setShowRemoveWalletModal] = useState(false)
  const [showCreateWalletModal, setShowCreateWalletModal] = useState(false)

  const [pendingWallet, setPendingWallet] = useState<SignerMnemonicAccount>()

  const sortedMnemonicAccounts = useSelector(selectSortedSignerMnemonicAccounts)

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
        cloud_backup_used: pendingWallet.backups?.includes(BackupType.Cloud) ?? false,
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

  const addWalletMenuOptions: MenuContentItem[] = [
    {
      label: t('account.wallet.button.create'),
      onPress: (): void => setShowCreateWalletModal(true),
    },
    {
      label: t('account.wallet.button.import'),
      onPress: (): void => setShowRemoveWalletModal(true),
    },
  ]

  const contentShadowProps = {
    shadowColor: colors.shadowColor.val,
    shadowRadius: 12,
    shadowOpacity: 0.1,
    zIndex: 1,
  }

  return (
    <Trace logImpression modal={ModalName.AccountSwitcher}>
      {showEditLabelModal && <EditLabelModal address={activeAddress} onClose={() => setShowEditLabelModal(false)} />}
      {showRemoveWalletModal && (
        <WarningModal
          caption={t('account.recoveryPhrase.remove.import.description')}
          closeText={t('common.button.cancel')}
          confirmText={t('common.button.continue')}
          icon={<WalletFilled color="$statusCritical" size="$icon.24" />}
          modalName={ModalName.RemoveWallet}
          severity={WarningSeverity.High}
          title={t('account.wallet.button.import')}
          onClose={() => setShowRemoveWalletModal(false)}
          onConfirm={onNavigateToRemoveWallet}
        />
      )}
      {showCreateWalletModal && (
        <CreateWalletModal
          pendingWallet={pendingWallet}
          onCancel={onCancelCreateWallet}
          onConfirm={onConfirmCreateWallet}
        />
      )}
      <Flex backgroundColor="$surface1" px="$spacing12" py="$spacing8">
        <ScreenHeader Icon={X} />
        <Flex gap="$spacing16" pb="$spacing4" pt="$spacing8" px="$spacing12">
          <AddressDisplay
            showCopy
            address={activeAddress}
            captionVariant="body3"
            direction="column"
            gapBetweenLines="$spacing8"
            horizontalGap="$spacing8"
            showViewOnlyBadge={isViewOnly}
            size={spacing.spacing60 - spacing.spacing4}
            variant="subheading1"
          />
          {activeAccountHasUnitag ? (
            <UnitagActionButton />
          ) : (
            <Button
              size="small"
              testID={TestID.AccountCard}
              theme="secondary"
              onPress={() => setShowEditLabelModal(true)}
            >
              {t('account.wallet.header.button.title')}
            </Button>
          )}
        </Flex>
        <ScrollView backgroundColor="$surface1" height="auto">
          {accountAddresses.length > 0 && (
            <Text color="$neutral2" mb="$spacing8" mt="$spacing16" px="$spacing12" variant="body2">
              {t('account.wallet.header.other')}
            </Text>
          )}
          <Flex>
            {accountAddresses.map((address: string) => {
              return (
                <AccountItem
                  key={address}
                  address={address}
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
                <Text color="$neutral2" py="$spacing8" variant="buttonLabel3">
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
              disableRemoveScroll={false}
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
  return (
    <ComingSoon placement="top">
      <Button color="$neutral2" disabled={true} size="small" testID={TestID.AccountCard} theme="secondary">
        {t('account.wallet.header.button.disabled.title')}
      </Button>
    </ComingSoon>
  )
}
