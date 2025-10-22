import { useCallback, useEffect, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { pushNotification } from 'uniswap/src/features/notifications/slice/slice'
import { AppNotificationType } from 'uniswap/src/features/notifications/slice/types'
import { logger } from 'utilities/src/logger/logger'
import { useEvent } from 'utilities/src/react/hooks'
import { useBooleanState } from 'utilities/src/react/useBooleanState'
import { SmartWalletActionRequiredModal } from 'wallet/src/components/smartWallet/modals/SmartWalletActionRequiredModal'
import { SmartWalletConfirmModal } from 'wallet/src/components/smartWallet/modals/SmartWalletConfirmModal'
import { SmartWalletDisableWarningModal } from 'wallet/src/components/smartWallet/modals/SmartWalletDisableWarningModal'
import { SmartWalletEnabledModal } from 'wallet/src/components/smartWallet/modals/SmartWalletEnabledModal'
import { SmartWalletInsufficientFundsOnNetworkModal } from 'wallet/src/components/smartWallet/modals/SmartWalletInsufficientFundsOnNetworkModal'
import { SmartWalletUnavailableModal } from 'wallet/src/components/smartWallet/modals/SmartWalletUnavailableModal'
import { setIsAllSmartWalletNudgesDisabled } from 'wallet/src/features/behaviorHistory/slice'
import { useNetworkBalances } from 'wallet/src/features/smartWallet/hooks/useNetworkBalances'
import { SmartWalletDisableModal } from 'wallet/src/features/smartWallet/SmartWalletDisableModal'
import { removeDelegationActions } from 'wallet/src/features/smartWallet/sagas/removeDelegationSaga'
import { SmartWalletModalState, WalletData } from 'wallet/src/features/smartWallet/types'
import { useWalletDelegationContext } from 'wallet/src/features/smartWallet/WalletDelegationProvider'
import {
  useActiveAccountAddressWithThrow,
  useActiveAccountWithThrow,
  useDisplayName,
} from 'wallet/src/features/wallet/hooks'
import { setSmartWalletConsent } from 'wallet/src/features/wallet/slice'

interface SmartWalletModalsManagerProps {
  selectedWallet: WalletData | undefined
  modalState: SmartWalletModalState
  onModalStateChange: (state: SmartWalletModalState) => void
  onWalletChange: (wallet: WalletData | undefined) => void
}

/**
 * Smart Wallet Settings Modal State Machine
 *
 * This component manages multiple modals using a single state machine to ensure
 * only one modal is open at a time and transitions are predictable.
 *
 * State Transition Diagram:
 * ========================
 *
 * Initial State: None
 *
 * From None:
 * ├─ Click Active Wallet → Disable
 * ├─ Click Inactive Wallet → EnabledSuccess (+ dispatch setSmartWalletConsent(true))
 * ├─ Click ActionRequired Wallet → ActionRequired
 * └─ Click Unavailable Wallet → Unavailable
 *
 * From Disable:
 * ├─ onClose → None
 * └─ onConfirm → DisableWarning (if has delegations) OR None (+ dispatch setSmartWalletConsent(false)) (if no delegations)
 *
 * From DisableWarning:
 * ├─ onClose/onReject → None
 * └─ onAcknowledge → Confirm (if allNetworksEligible) OR InsufficientFunds (if !allNetworksEligible)
 *
 * From Confirm:
 * ├─ onClose/onCancel → None
 * └─ onConfirm → None (+ delegation removal + notification + dispatch setSmartWalletConsent(false))
 *
 * From InsufficientFunds:
 * ├─ onClose → None
 * └─ onContinueButton → Confirm
 *
 * From ActionRequired:
 * ├─ onClose → None
 * ├─ onConfirm → DisableWarning
 * └─ onReactivate → None (+ dispatch setSmartWalletConsent(true))
 *
 * From EnabledSuccess:
 * └─ onClose → None
 *
 * From Unavailable:
 * └─ onClose → None
 *
 * State Dependencies:
 * ==================
 * - selectedWallet: Set when opening wallet-specific modals, cleared when modalState becomes None
 * - allNetworksEligible: Determines DisableWarning → Confirm vs InsufficientFunds transition
 * - activeDelegations: Determines Disable → DisableWarning vs immediate None transition
 *
 * Close Handler Strategy:
 * ======================
 * Each modal uses closeModal(expectedState) which only closes if current state matches expected state.
 * This prevents race conditions where late-firing close handlers interfere with state transitions.
 */
export function SmartWalletModalsManager({
  selectedWallet,
  modalState,
  onModalStateChange,
  onWalletChange,
}: SmartWalletModalsManagerProps): JSX.Element {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const activeAccount = useActiveAccountWithThrow()
  const activeAccountAddress = useActiveAccountAddressWithThrow()
  const { refreshDelegationData } = useWalletDelegationContext()

  const { value: inProgress, setTrue: setInProgressTrue, setFalse: setInProgressFalse } = useBooleanState(false)

  const [revokeDelegationError, setRevokeDelegationError] = useState(false)

  const networkBalances = useNetworkBalances(selectedWallet?.walletAddress)
  const selectedWalletDisplayName = useDisplayName(selectedWallet?.walletAddress, { includeUnitagSuffix: true })
  const eligibleNetworksToRemoveDelegation = networkBalances.filter((c) => c.hasSufficientFunds)
  const allNetworksAreEligible = networkBalances.length === eligibleNetworksToRemoveDelegation.length

  const onDelegationsRemoved = useEvent(async () => {
    if (!selectedWallet?.walletAddress) {
      return
    }

    dispatch(
      setSmartWalletConsent({
        address: selectedWallet.walletAddress,
        smartWalletConsent: false,
      }),
    )

    //Block all nudges
    dispatch(setIsAllSmartWalletNudgesDisabled({ walletAddress: selectedWallet.walletAddress, isDisabled: true }))

    setInProgressFalse()
    onModalStateChange(SmartWalletModalState.None)

    const notificationTitle = allNetworksAreEligible
      ? t('notification.smartWallet.disabled.all')
      : eligibleNetworksToRemoveDelegation.length > 1
        ? t('notification.smartWallet.disabled.plural', { amount: eligibleNetworksToRemoveDelegation.length })
        : t('notification.smartWallet.disabled')

    await refreshDelegationData().catch((delegationError) => {
      logger.error(delegationError, {
        tags: { file: 'SmartWalletModalsManager', function: 'handleRemoveDelegations' },
        extra: { activeAccountAddress },
      })
    })

    dispatch(
      pushNotification({
        type: AppNotificationType.SmartWalletDisabled,
        title: notificationTitle,
      }),
    )
  })

  const handleRemoveDelegations = useEvent(async () => {
    if (!selectedWallet?.walletAddress) {
      return
    }

    // Reset error state before attempting removal
    setRevokeDelegationError(false)

    const chainIds = eligibleNetworksToRemoveDelegation.map((c) => c.chainId)
    setInProgressTrue()
    dispatch(
      removeDelegationActions.trigger({
        account: {
          address: selectedWallet.walletAddress,
          type: AccountType.SignerMnemonic,
        },
        walletAddress: selectedWallet.walletAddress,
        chainIds,
        onSuccess: onDelegationsRemoved,
        onFailure: async (error: Error) => {
          logger.error(error, {
            tags: { file: 'SmartWalletModalsManager', function: 'handleRemoveDelegations' },
            extra: { chainIds, walletAddress: selectedWallet.walletAddress },
          })
          setInProgressFalse()
          setRevokeDelegationError(true)

          dispatch(
            setSmartWalletConsent({
              address: selectedWallet.walletAddress,
              smartWalletConsent: false,
            }),
          )

          await refreshDelegationData().catch((delegationError) => {
            logger.error(delegationError, {
              tags: { file: 'SmartWalletModalsManager', function: 'handleRemoveDelegations' },
              extra: { activeAccountAddress },
            })
          })
        },
      }),
    )
  })

  const handleDisableConfirm = useCallback(async () => {
    if (!selectedWallet?.walletAddress || activeAccount.type !== AccountType.SignerMnemonic) {
      return
    }

    const activeDelegations = selectedWallet.activeDelegationNetworkToAddress
    const hasActiveDelegations = Object.keys(activeDelegations).length > 0
    if (hasActiveDelegations) {
      onModalStateChange(SmartWalletModalState.DisableWarning)
    } else {
      await onDelegationsRemoved()
    }
  }, [selectedWallet, activeAccount, onDelegationsRemoved, onModalStateChange])

  const unavailableWalletDisplayName = selectedWalletDisplayName?.name || selectedWallet?.walletAddress

  useEffect(() => {
    if (modalState === SmartWalletModalState.None && selectedWallet) {
      onWalletChange(undefined)
    }
  }, [modalState, selectedWallet, onWalletChange])

  const closeModal = useEvent((expectedModalState: SmartWalletModalState) => {
    // When transitioning between modal states, the previous modal's `isOpen` becomes `false` and triggers `onClose`.
    // This check ensures the close action is from user interaction, not from modal state changes.
    if (modalState === expectedModalState) {
      onModalStateChange(SmartWalletModalState.None)
      onWalletChange(undefined)
      // Clear any previous error so next open starts fresh
      setRevokeDelegationError(false)
    }
  })

  return (
    <>
      <SmartWalletEnabledModal
        isOpen={modalState === SmartWalletModalState.EnabledSuccess}
        onClose={() => closeModal(SmartWalletModalState.EnabledSuccess)}
      />
      <SmartWalletDisableWarningModal
        isOpen={modalState === SmartWalletModalState.DisableWarning}
        onClose={() => closeModal(SmartWalletModalState.DisableWarning)}
        onCancel={() => closeModal(SmartWalletModalState.DisableWarning)}
        onContinue={() => {
          if (allNetworksAreEligible) {
            onModalStateChange(SmartWalletModalState.Confirm)
          } else {
            onModalStateChange(SmartWalletModalState.InsufficientFunds)
          }
        }}
      />
      {unavailableWalletDisplayName && selectedWallet && (
        <SmartWalletUnavailableModal
          isOpen={modalState === SmartWalletModalState.Unavailable}
          displayName={unavailableWalletDisplayName}
          walletAddress={selectedWallet.walletAddress}
          onClose={() => closeModal(SmartWalletModalState.Unavailable)}
        />
      )}
      {selectedWallet && (
        <>
          <SmartWalletDisableModal
            wallet={selectedWallet}
            isOpen={modalState === SmartWalletModalState.Disable}
            onClose={() => closeModal(SmartWalletModalState.Disable)}
            onConfirm={handleDisableConfirm}
          />
          <SmartWalletConfirmModal
            isOpen={modalState === SmartWalletModalState.Confirm}
            networkBalances={networkBalances}
            inProgress={inProgress}
            isDismissible={!inProgress}
            walletAddress={selectedWallet.walletAddress}
            hasError={revokeDelegationError}
            onClose={() => closeModal(SmartWalletModalState.Confirm)}
            onCancel={() => closeModal(SmartWalletModalState.Confirm)}
            onConfirm={handleRemoveDelegations}
          />
          <SmartWalletInsufficientFundsOnNetworkModal
            networkBalances={networkBalances}
            isOpen={modalState === SmartWalletModalState.InsufficientFunds}
            onClose={() => closeModal(SmartWalletModalState.InsufficientFunds)}
            onContinue={() => onModalStateChange(SmartWalletModalState.Confirm)}
          />
          <SmartWalletActionRequiredModal
            isOpen={modalState === SmartWalletModalState.ActionRequired}
            networkBalances={networkBalances}
            walletAddress={selectedWallet.walletAddress}
            onClose={() => closeModal(SmartWalletModalState.ActionRequired)}
            onConfirm={() => onModalStateChange(SmartWalletModalState.Confirm)}
            onReactivate={() => {
              dispatch(
                setSmartWalletConsent({
                  address: selectedWallet.walletAddress,
                  smartWalletConsent: true,
                }),
              )
              closeModal(SmartWalletModalState.ActionRequired)
            }}
          />
        </>
      )}
    </>
  )
}

export function useSmartWalletModals(): {
  selectedWallet: WalletData | undefined
  modalState: SmartWalletModalState
  setSelectedWallet: (wallet: WalletData | undefined) => void
  setModalState: (state: SmartWalletModalState) => void
} {
  const [selectedWallet, setSelectedWallet] = useState<WalletData | undefined>(undefined)
  const [modalState, setModalState] = useState<SmartWalletModalState>(SmartWalletModalState.None)

  return {
    selectedWallet,
    modalState,
    setSelectedWallet,
    setModalState,
  }
}
