import { ConfirmModalState } from 'components/ConfirmSwapModal'
import { GetHelpHeader } from 'components/Modal/GetHelpHeader'
import { Trans } from 'i18n'

export function SwapHead({
  onDismiss,
  isLimitTrade,
  confirmModalState,
}: {
  onDismiss: () => void
  isLimitTrade: boolean
  confirmModalState: ConfirmModalState
}) {
  const swapTitle = isLimitTrade ? <Trans i18nKey="swap.reviewLimit" /> : <Trans i18nKey="swap.review" />
  return (
    <GetHelpHeader
      title={confirmModalState === ConfirmModalState.REVIEWING && swapTitle}
      closeModal={onDismiss}
      closeDataTestId="confirmation-close-icon"
    />
  )
}
