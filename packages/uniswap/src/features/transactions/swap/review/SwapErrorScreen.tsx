import { useTranslation } from 'react-i18next'
import { Button, Flex, isWeb } from 'ui/src'
import { X } from 'ui/src/components/icons/X'
import { WarningModalContent } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { ProtocolItems } from 'uniswap/src/data/tradingApi/__generated__'
import { TransactionModalInnerContainer } from 'uniswap/src/features/transactions/TransactionModal/TransactionModal'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { TransactionStepFailedError, getErrorContent } from 'uniswap/src/features/transactions/errors'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { TransactionStepType } from 'uniswap/src/features/transactions/swap/utils/generateTransactionSteps'

export function SwapErrorScreen({
  submissionError,
  setSubmissionError,
  resubmitSwap,
  onClose,
}: {
  submissionError: Error
  setSubmissionError: (e: Error | undefined) => void
  resubmitSwap: () => void
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { bottomSheetViewStyles } = useTransactionModalContext()
  const { updateSwapForm, selectedProtocols } = useSwapFormContext()

  // TODO(WEB-4970): use getErrorContent().supportArticleURL to render help center UI
  const { title, message } = getErrorContent(t, submissionError)

  const isUniswapXBackendError =
    submissionError instanceof TransactionStepFailedError &&
    submissionError.isBackendRejection &&
    submissionError.step.type === TransactionStepType.UniswapXSignature

  const handleTryAgain = (): void => {
    if (isUniswapXBackendError) {
      // Update swap preferences for this session to exclude UniswapX if Uniswap x failed
      const updatedProtocols = selectedProtocols.filter((protocol) => protocol !== ProtocolItems.UNISWAPX_V2)
      updateSwapForm({
        selectedProtocols: updatedProtocols,
      })
    } else {
      resubmitSwap()
    }
    setSubmissionError(undefined)
  }

  return (
    <TransactionModalInnerContainer bottomSheetViewStyles={bottomSheetViewStyles} fullscreen={false}>
      <Flex gap="$spacing16">
        <Flex row justifyContent="flex-end" mx="$spacing12">
          {isWeb && (
            <Button
              backgroundColor="$transparent"
              color="$neutral2"
              icon={<X size="$icon.20" />}
              p="$none"
              theme="secondary"
              onPress={onClose}
            />
          )}
        </Flex>
        <Flex animation="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }}>
          <WarningModalContent
            title={title}
            caption={message}
            severity={WarningSeverity.Low}
            rejectText={t('common.button.tryAgain')}
            onReject={handleTryAgain}
          />
        </Flex>
      </Flex>
    </TransactionModalInnerContainer>
  )
}
