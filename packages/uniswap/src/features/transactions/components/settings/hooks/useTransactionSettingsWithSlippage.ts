import {
  type ModalIdWithSlippage,
  TransactionSettingsModalId,
} from 'uniswap/src/features/transactions/components/settings/stores/TransactionSettingsModalStore/createTransactionSettingsModalStore'
import {
  useModalHide,
  useModalShow,
  useModalVisibility,
} from 'uniswap/src/features/transactions/components/settings/stores/TransactionSettingsModalStore/useTransactionSettingsModalStore'
import {
  useTransactionSettingsActions,
  useTransactionSettingsStore,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { isMobileApp } from 'utilities/src/platform'
import { useEvent } from 'utilities/src/react/hooks'

export function useTransactionSettingsWithSlippage(): {
  isSlippageWarningModalVisible: boolean
  handleShowSlippageWarningModal: () => void
  handleHideSlippageWarningModalWithSeen: () => void
  onCloseSettingsModal: () => void
} {
  const { customSlippageTolerance, slippageWarningModalSeen } = useTransactionSettingsStore((s) => ({
    customSlippageTolerance: s.customSlippageTolerance,
    slippageWarningModalSeen: s.slippageWarningModalSeen,
  }))
  const { setSlippageWarningModalSeen } = useTransactionSettingsActions()

  const handleHideTransactionSettingsModal = useModalHide<ModalIdWithSlippage>(
    TransactionSettingsModalId.TransactionSettings,
  )
  const isSlippageWarningModalVisible = useModalVisibility<ModalIdWithSlippage>(
    TransactionSettingsModalId.SlippageWarning,
  )
  const handleShowSlippageWarningModal = useModalShow<ModalIdWithSlippage>(TransactionSettingsModalId.SlippageWarning)
  const handleHideSlippageWarningModal = useModalHide<ModalIdWithSlippage>(TransactionSettingsModalId.SlippageWarning)

  const onCloseSettingsModal = useEvent((): void => {
    const shouldShowSlippageWarning =
      !slippageWarningModalSeen && customSlippageTolerance && customSlippageTolerance >= 20

    if (shouldShowSlippageWarning) {
      // Set the seen flag when showing the modal to prevent repeated displays
      setSlippageWarningModalSeen(true)
      // Delay showing the slippage warning modal to avoid conflict with popover dismissal for a smoother UX
      setTimeout(() => {
        handleShowSlippageWarningModal()
      }, 80)
      // Don't close the transaction settings modal on mobile when showing the slippage warning
      if (!isMobileApp) {
        handleHideTransactionSettingsModal()
      }
    } else {
      handleHideTransactionSettingsModal()
    }
  })

  return {
    isSlippageWarningModalVisible,
    handleShowSlippageWarningModal,
    handleHideSlippageWarningModalWithSeen: handleHideSlippageWarningModal,
    onCloseSettingsModal,
  }
}
