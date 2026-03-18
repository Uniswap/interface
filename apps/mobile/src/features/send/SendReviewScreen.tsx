import React, { useEffect, useState } from 'react'
import { SEND_CONTENT_RENDER_DELAY_MS } from 'src/features/send/constants'
import { Flex } from 'ui/src/components/layout/Flex'
import { useHapticFeedback } from 'uniswap/src/features/settings/useHapticFeedback/useHapticFeedback'
import { TransactionModalInnerContainer } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { SendReviewDetails } from 'wallet/src/features/transactions/send/SendReviewDetails'

// We add a short hardcoded delay to allow the sheet to animate quickly both on first render and when going back from Review -> Form.
export function SendReviewScreen(): JSX.Element {
  const [hideContent, setHideContent] = useState(true)
  useEffect(() => {
    setTimeout(() => setHideContent(false), SEND_CONTENT_RENDER_DELAY_MS)
  }, [])

  return <SendReviewScreenContent hideContent={hideContent} />
}

function SendReviewScreenContent({ hideContent }: { hideContent: boolean }): JSX.Element {
  const { bottomSheetViewStyles, renderBiometricsIcon, onClose, authTrigger } = useTransactionModalContext()

  const { hapticFeedback } = useHapticFeedback()

  // Same logic we apply in `SwapReviewScreen`
  // We forcefully hide the content via `hideContent` to allow the bottom sheet to animate faster while still allowing all API requests to trigger ASAP.
  // The value of `height + mb` must be equal to the height of the fully rendered component to avoid the modal jumping on open.
  if (hideContent) {
    return <Flex centered height={340} mb="$spacing28" />
  }

  return (
    <TransactionModalInnerContainer bottomSheetViewStyles={bottomSheetViewStyles} fullscreen={false}>
      <SendReviewDetails
        ButtonAuthIcon={renderBiometricsIcon?.({ color: 'white' })}
        authTrigger={authTrigger}
        onCloseModal={onClose}
        onSubmitSend={hapticFeedback.success}
      />
    </TransactionModalInnerContainer>
  )
}
