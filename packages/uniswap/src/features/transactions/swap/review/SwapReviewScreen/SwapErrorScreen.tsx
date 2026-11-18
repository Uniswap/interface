import { SharedEventName } from '@uniswap/analytics-events'
import { TradingApi } from '@universe/api'
import { isWebPlatform } from '@universe/environment'
import { Button, Flex, IconButton, AnimatedFlex } from '@universe/mycelium'
import { HelpCenter } from '@universe/mycelium/icons/HelpCenter'
import { X } from '@universe/mycelium/icons/X'
import { createSlideFadePresence } from '@universe/tailwind/animations/slide-fade-presence'
import { ErrorView } from '@universe/transactions-ui'
import { useTranslation } from 'react-i18next'
import { UniswapHelpUrls } from 'uniswap/src/constants/urls'
import { ElementName, ModalName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  useTransactionSettingsActions,
  useTransactionSettingsStore,
} from 'uniswap/src/features/transactions/components/settings/stores/transactionSettingsStore/useTransactionSettingsStore'
import { TransactionModalInnerContainer } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { getErrorContent, TransactionStepFailedError } from 'uniswap/src/features/transactions/errors'
import { TransactionStepType } from 'uniswap/src/features/transactions/steps/types'
import { openUri } from 'uniswap/src/utils/linking'
import { useTrace } from 'utilities/src/telemetry/trace/TraceContext'

// Native (Reanimated) and web (Tamagui CSS transition) legs of the legacy Tamagui 'quick'
// mount-in/out fade (enterStyle/exitStyle opacity 0), bundled by the shared helper so the two
// platforms can't drift apart.
const fadeQuickProps = createSlideFadePresence('quick', { axis: 'translateY', offset: 0 })

export function SwapErrorScreen({
  submissionError,
  setSubmissionError,
  onPressRetry,
  resubmitSwap,
  onClose,
}: {
  submissionError: Error
  setSubmissionError: (e: Error | undefined) => void
  resubmitSwap: () => void
  onPressRetry: (() => void) | undefined
  onClose: () => void
}): JSX.Element {
  const { t } = useTranslation()
  const { bottomSheetViewStyles } = useTransactionModalContext()
  const { selectedProtocols } = useTransactionSettingsStore((s) => ({
    selectedProtocols: s.selectedProtocols,
  }))
  const { setSelectedProtocols } = useTransactionSettingsActions()
  const trace = useTrace()

  const { title, message, supportArticleURL, buttonText } = getErrorContent(t, submissionError)

  const isUniswapXBackendError =
    submissionError instanceof TransactionStepFailedError &&
    submissionError.isBackendRejection &&
    submissionError.step.type === TransactionStepType.UniswapXSignature

  const handleTryAgain = (): void => {
    if (onPressRetry) {
      onPressRetry()
    } else if (isUniswapXBackendError) {
      // TODO(WEB-7668): move this into onPressRetry logic.
      // Update swap preferences for this session to exclude UniswapX if Uniswap x failed
      const updatedProtocols = selectedProtocols.filter(
        (protocol) => protocol !== TradingApi.ProtocolItems.UNISWAPX_LATEST,
      )
      setSelectedProtocols(updatedProtocols)
    } else {
      resubmitSwap()
    }
    setSubmissionError(undefined)

    // Same event WarningModalContent's Trace sent for this button. Native only, like before: on web
    // and extension the ui/src Button frame keeps onPress over Trace's injected onClick, so the old
    // button never logged there.
    if (!isWebPlatform) {
      sendAnalyticsEvent(SharedEventName.ELEMENT_CLICKED, {
        ...trace,
        modal: ModalName.SwapError,
        element: ElementName.BackButton,
      })
    }
  }

  const onPressGetHelp = async (): Promise<void> => {
    await openUri({ uri: supportArticleURL ?? UniswapHelpUrls.baseUrl })
  }

  // LearnMoreLink's TouchableTextLink opened the article outside the app: Linking.openURL on native,
  // a new tab on web.
  const onPressLearnMore = supportArticleURL
    ? (): Promise<void> => openUri({ uri: supportArticleURL, openExternalBrowser: true })
    : undefined

  return (
    <TransactionModalInnerContainer bottomSheetViewStyles={bottomSheetViewStyles} fullscreen={false}>
      <Flex gap="$spacing16">
        {isWebPlatform && (
          <Flex row justifyContent="flex-end" m="$spacing12" gap="$spacing8">
            <Button fill={false} emphasis="tertiary" size="xxsmall" icon={<HelpCenter />} onPress={onPressGetHelp}>
              {t('common.getHelp.button')}
            </Button>
            <IconButton size="xxsmall" variant="default" emphasis="text-only" icon={<X />} onPress={onClose} />
          </Flex>
        )}
        <AnimatedFlex {...fadeQuickProps}>
          <ErrorView
            message={message}
            primaryAction={{ label: buttonText ?? t('common.button.tryAgain'), onPress: handleTryAgain }}
            title={title}
            onPressLearnMore={onPressLearnMore}
          />
        </AnimatedFlex>
      </Flex>
    </TransactionModalInnerContainer>
  )
}
