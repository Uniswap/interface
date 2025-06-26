import { useCallback } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { useSporeColors } from 'ui/src'
import { AlertTriangleFilled, SmartWallet } from 'ui/src/components/icons'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { setHasDismissedSmartWalletHomeScreenNudge } from 'wallet/src/features/behaviorHistory/slice'
import { NetworkInfo } from 'wallet/src/features/smartWallet/InsufficientFundsNetworkRow'
import { useWalletDelegationContext } from 'wallet/src/features/smartWallet/WalletDelegationProvider'
import { SmartWalletConfirmModal } from 'wallet/src/features/smartWallet/modals/SmartWalletConfirmModal'
import { SmartWalletInsufficientFundsOnNetworkModal } from 'wallet/src/features/smartWallet/modals/SmartWalletInsufficientFundsOnNetworkModal'
import { removeDelegationActions } from 'wallet/src/features/smartWallet/sagas/removeDelegationSaga'
import { useActiveAccountAddressWithThrow } from 'wallet/src/features/wallet/hooks'
import { setSmartWalletConsent } from 'wallet/src/features/wallet/slice'

type SmartWalletConfirmDisableModalProps = {
  isOpen: boolean
  onClose: () => void
  networkBalances: NetworkInfo[]
  walletAddress: string
}

export const SmartWalletConfirmDisableModal = ({
  isOpen,
  onClose,
  networkBalances,
  walletAddress,
}: SmartWalletConfirmDisableModalProps): JSX.Element | null => {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const eligibleNetworksToRemoveDelegation = networkBalances.filter((c) => c.hasSufficientFunds)
  const dispatch = useDispatch()
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const { refreshDelegationData } = useWalletDelegationContext()
  const allNetworksAreEligible = networkBalances.length === eligibleNetworksToRemoveDelegation.length

  const {
    value: showConfirmModal,
    setTrue: setShowConfirmModal,
    setFalse: setHideConfirmModal,
  } = useBooleanState(false)

  const {
    value: showInsufficientFundsModal,
    setTrue: setShowInsufficientFundsModal,
    setFalse: setHideInsufficientFundsModal,
  } = useBooleanState(false)

  const {
    value: showConfirmModalWithBanner,
    setTrue: setShowConfirmModalWithBanner,
    setFalse: setHideConfirmModalWithBanner,
  } = useBooleanState(false)

  const { value: inProgress, setTrue: setInProgressTrue, setFalse: setInProgressFalse } = useBooleanState(false)

  const handleOnClose = useCallback(() => {
    onClose()
  }, [onClose])

  const onDelegationsRemoved = useEvent(async () => {
    dispatch(
      setSmartWalletConsent({
        address: walletAddress,
        smartWalletConsent: false,
      }),
    )
    // Prevent the nudge from showing again
    dispatch(setHasDismissedSmartWalletHomeScreenNudge({ walletAddress, hasDismissed: true }))

    await refreshDelegationData().catch((error) => {
      logger.error(error, {
        tags: { file: 'SmartWalletConfirmDisableModal', function: 'onDelegationsRemoved' },
        extra: { activeAccountAddress },
      })
    })

    onClose()
    setInProgressFalse()
    setHideConfirmModalWithBanner()
    setHideConfirmModal()

    const notificationTitle = allNetworksAreEligible
      ? t('notification.smartWallet.disabled.all')
      : eligibleNetworksToRemoveDelegation.length > 1
        ? t('notification.smartWallet.disabled.plural', { amount: eligibleNetworksToRemoveDelegation.length })
        : t('notification.smartWallet.disabled')

    dispatch(
      pushNotification({
        type: AppNotificationType.SmartWalletDisabled,
        title: notificationTitle,
      }),
    )
  })

  const handleDisableSmartWallet = useEvent(async (): Promise<void> => {
    const chainIds = eligibleNetworksToRemoveDelegation.map((c) => c.chainId)
    setInProgressTrue()
    dispatch(
      removeDelegationActions.trigger({
        account: {
          address: walletAddress,
          type: AccountType.SignerMnemonic,
        },
        walletAddress,
        chainIds,
        onSuccess: onDelegationsRemoved,
        onFailure: async (error: Error) => {
          logger.error(error, {
            tags: { file: 'SmartWalletConfirmDisableModal', function: 'handleDisableSmartWallet' },
            extra: { chainIds, walletAddress },
          })
          await onDelegationsRemoved()
        },
      }),
    )
  })

  const handleModalClose = useCallback((): void => {
    if (showConfirmModalWithBanner) {
      handleOnClose()
      setHideConfirmModalWithBanner()
    } else {
      setHideConfirmModal()
    }
  }, [showConfirmModalWithBanner, handleOnClose, setHideConfirmModalWithBanner, setHideConfirmModal])

  const handleContinue = useEvent((): void => {
    if (allNetworksAreEligible) {
      setShowConfirmModal()
    } else {
      setShowInsufficientFundsModal()
    }
  })

  return (
    <>
      <WarningModal
        caption={t('smartWallet.confirmDisableSmartWallet.description')}
        rejectText={t('common.button.cancel')}
        acknowledgeText={t('common.button.continue')}
        icon={<AlertTriangleFilled color="$neutral1" size="$icon.24" />}
        backgroundIconColor={colors.surface3.val}
        isOpen={isOpen}
        modalName={ModalName.ConfirmDisableSmartWalletScreen}
        severity={WarningSeverity.Low}
        title={t('smartWallet.confirmDisableSmartWallet.title')}
        onClose={onClose}
        onAcknowledge={handleContinue}
      />

      <SmartWalletConfirmModal
        confirmationEnabled={true}
        icon={<SmartWallet color={colors.neutral1.val} size="$icon.24" />}
        title={t('smartWallets.disable.modal.title')}
        description={t('smartWallets.disable.modal.description')}
        isOpen={showConfirmModal || showConfirmModalWithBanner}
        networkBalances={networkBalances}
        inProgress={inProgress}
        walletAddress={walletAddress}
        onClose={handleModalClose}
        onCancel={handleModalClose}
        onConfirm={handleDisableSmartWallet}
      />

      <SmartWalletInsufficientFundsOnNetworkModal
        networkBalances={networkBalances}
        isOpen={showInsufficientFundsModal}
        onClose={setHideInsufficientFundsModal}
        onContinueButton={() => {
          setHideInsufficientFundsModal()
          setShowConfirmModalWithBanner()
        }}
      />
    </>
  )
}
