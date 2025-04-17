import { memo } from 'react'
import { useTranslation } from 'react-i18next'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { useSwapReviewCallbacks } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewCallbacksContext'
import { useSwapReviewTransactionState } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewTransactionContext'
import { useSwapWarningState } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewWarningStateContext'

export const SwapReviewWarningModal = memo(function SwapReviewWarningModal(): JSX.Element | null {
  const { t } = useTranslation()
  const { reviewScreenWarning, blockingWarning } = useSwapReviewTransactionState()
  const { showWarningModal } = useSwapWarningState()
  const { onCloseWarning, onConfirmWarning, onCancelWarning } = useSwapReviewCallbacks()

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
