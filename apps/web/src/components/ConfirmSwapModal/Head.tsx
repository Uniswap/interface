import { ConfirmModalState } from 'components/ConfirmSwapModal'
import { Trans } from 'react-i18next'
import { GetHelpHeader } from 'uniswap/src/components/dialog/GetHelpHeader'

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
