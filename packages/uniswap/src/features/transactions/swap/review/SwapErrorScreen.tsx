import { useTranslation } from 'react-i18next'
import { Button, Flex, IconButton, isWeb } from 'ui/src'
import { HelpCenter } from 'ui/src/components/icons/HelpCenter'
import { X } from 'ui/src/components/icons/X'
import { WarningModalContent } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { ProtocolItems } from 'uniswap/src/data/tradingApi/__generated__'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionModalInnerContainer } from 'uniswap/src/features/transactions/TransactionModal/TransactionModal'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { TransactionStepFailedError, getErrorContent } from 'uniswap/src/features/transactions/errors'
import { useTransactionSettingsContext } from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import { TransactionStepType } from 'uniswap/src/features/transactions/swap/types/steps'
import { openUri } from 'uniswap/src/utils/linking'

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
  const { updateTransactionSettings, selectedProtocols } = useTransactionSettingsContext()

  const { title, message, supportArticleURL } = getErrorContent(t, submissionError)

  const isUniswapXBackendError =
    submissionError instanceof TransactionStepFailedError &&
    submissionError.isBackendRejection &&
    submissionError.step.type === TransactionStepType.UniswapXSignature

  const handleTryAgain = (): void => {
    if (isUniswapXBackendError) {
      // Update swap preferences for this session to exclude UniswapX if Uniswap x failed
      const updatedProtocols = selectedProtocols.filter((protocol) => protocol !== ProtocolItems.UNISWAPX_V2)
      updateTransactionSettings({ selectedProtocols: updatedProtocols })
    } else {
      resubmitSwap()
    }
    setSubmissionError(undefined)
  }

  const onPressGetHelp = async (): Promise<void> => {
    await openUri(supportArticleURL ?? uniswapUrls.helpUrl)
  }

  return (
    <TransactionModalInnerContainer bottomSheetViewStyles={bottomSheetViewStyles} fullscreen={false}>
      <Flex gap="$spacing16">
        {isWeb && (
          <Flex row justifyContent="flex-end" m="$spacing12" gap="$spacing8">
            <Button fill={false} emphasis="tertiary" size="xxsmall" icon={<HelpCenter />} onPress={onPressGetHelp}>
              {t('common.getHelp.button')}
            </Button>
            <IconButton size="xxsmall" variant="default" emphasis="text-only" icon={<X />} onPress={onClose} />
          </Flex>
        )}
        <Flex animation="quick" enterStyle={{ opacity: 0 }} exitStyle={{ opacity: 0 }}>
          <WarningModalContent
            modalName={ModalName.SwapError}
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
