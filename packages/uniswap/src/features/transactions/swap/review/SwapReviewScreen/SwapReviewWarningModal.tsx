import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useSwapReviewCallbacksStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewCallbacksStore/useSwapReviewCallbacksStore'
import { useSwapReviewTransactionStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/useSwapReviewTransactionStore'
import { useSwapReviewWarningStore } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewWarningStore/useSwapReviewWarningStore'

export const SwapReviewWarningModal = memo(function SwapReviewWarningModal(): JSX.Element | null {
  const { t } = useTranslation()
  const { reviewScreenWarning, blockingWarning } = useSwapReviewTransactionStore((s) => ({
    reviewScreenWarning: s.reviewScreenWarning,
    blockingWarning: s.blockingWarning,
  }))
  const showWarningModal = useSwapReviewWarningStore((s) => s.showWarningModal)
  const { onCloseWarning, onConfirmWarning, onCancelWarning } = useSwapReviewCallbacksStore((s) => ({
    onCloseWarning: s.onCloseWarning,
    onConfirmWarning: s.onConfirmWarning,
    onCancelWarning: s.onCancelWarning,
  }))

  if (!reviewScreenWarning?.warning.title) {
    return null
  }

  return (
    <WarningModal
      caption={reviewScreenWarning.warning.message}
      rejectText={blockingWarning ? undefined : t('common.button.cancel')}
      acknowledgeText={blockingWarning ? t('common.button.ok') : t('common.button.confirm')}
      isOpen={showWarningModal}
      modalName={ModalName.SwapWarning}
      severity={reviewScreenWarning.warning.severity}
      title={reviewScreenWarning.warning.title}
      onReject={onCancelWarning}
      onClose={onCloseWarning}
      onAcknowledge={onConfirmWarning}
    />
  )
})
