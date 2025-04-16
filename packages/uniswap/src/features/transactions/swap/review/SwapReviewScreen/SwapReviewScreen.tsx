import { ReactNode, memo } from 'react'
import { Flex, isWeb } from 'ui/src'
import { ProgressIndicator } from 'uniswap/src/components/ConfirmSwapModal/ProgressIndicator'
import { TransactionModalInnerContainer } from 'uniswap/src/features/transactions/TransactionModal/TransactionModal'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { useSwapDependencies } from 'uniswap/src/features/transactions/swap/contexts/SwapDependenciesContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useSwapTxContext } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import { SwapErrorScreen } from 'uniswap/src/features/transactions/swap/review/SwapErrorScreen'
import { TransactionAmountsReview } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/TransactionAmountsReview'
import { SwapReviewFooter } from 'uniswap/src/features/transactions/swap/review/components/SwapReviewFooter'
import { SwapReviewLoadingView } from 'uniswap/src/features/transactions/swap/review/components/SwapReviewLoadingView'
import { SwapReviewSwapDetails } from 'uniswap/src/features/transactions/swap/review/components/SwapReviewSwapDetails'
import { SwapReviewWarningModal } from 'uniswap/src/features/transactions/swap/review/components/SwapReviewWarningModal'
import { SwapReviewWrapTransactionDetails } from 'uniswap/src/features/transactions/swap/review/components/SwapReviewWrapTransactionDetails'
import { SwapReviewCallbacksContextProvider } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewCallbacksContextProvider'
import { useSwapReviewState } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewStateContext'
import { SwapReviewStateContextProvider } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewStateContextProvider'
import {
  useIsSwapMissingParams,
  useIsSwapReviewLoading,
  useSwapReviewError,
  useSwapReviewTransactionState,
} from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewTransactionContext'
import { SwapReviewTransactionContextProvider } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewTransactionContextProvider'
import { SwapReviewWarningStateContextProvider } from 'uniswap/src/features/transactions/swap/review/contexts/SwapReviewWarningStateContextProvider'
import { useAcceptedTrade } from 'uniswap/src/features/transactions/swap/review/hooks/useAcceptedTrade'
import { useSwapOnPrevious } from 'uniswap/src/features/transactions/swap/review/hooks/useSwapOnPrevious'
import { logger } from 'utilities/src/logger/logger'

interface SwapReviewScreenProps {
  hideContent: boolean
  onSubmitSwap?: () => Promise<void>
}

export function SwapReviewScreen(props: SwapReviewScreenProps): JSX.Element | null {
  const { hideContent, onSubmitSwap } = props
  return <SwapReviewScreenProviders hideContent={hideContent} onSubmitSwap={onSubmitSwap} />
}

export function SwapReviewScreenProviders(
  props: Omit<SwapReviewScreenProps, 'swapCallback' | 'wrapCallback'>,
): JSX.Element | null {
  const { hideContent, onSubmitSwap } = props
  const { onClose, authTrigger, setScreen } = useTransactionModalContext()
  const { isSubmitting } = useSwapFormContext()
  const { derivedSwapInfo, getExecuteSwapService } = useSwapDependencies()
  const swapTxContext = useSwapTxContext()
  const {
    onAcceptTrade,
    acceptedDerivedSwapInfo: swapAcceptedDerivedSwapInfo,
    newTradeRequiresAcceptance,
  } = useAcceptedTrade({
    derivedSwapInfo,
    isSubmitting,
  })

  return (
    <SwapReviewStateContextProvider hideContent={hideContent}>
      <SwapReviewWarningStateContextProvider>
        <SwapReviewCallbacksContextProvider
          setScreen={setScreen}
          authTrigger={authTrigger}
          getExecuteSwapService={getExecuteSwapService}
          onSubmitSwap={onSubmitSwap}
          onClose={onClose}
          onAcceptTrade={onAcceptTrade}
        >
          <SwapReviewTransactionContextProvider
            derivedSwapInfo={derivedSwapInfo}
            swapTxContext={swapTxContext}
            swapAcceptedDerivedSwapInfo={swapAcceptedDerivedSwapInfo}
            newTradeRequiresAcceptance={newTradeRequiresAcceptance}
          >
            <SwapReviewContent />
          </SwapReviewTransactionContextProvider>
        </SwapReviewCallbacksContextProvider>
      </SwapReviewWarningStateContextProvider>
    </SwapReviewStateContextProvider>
  )
}

function SwapReviewContent(): JSX.Element | null {
  const { acceptedDerivedSwapInfo, isWrap, newTradeRequiresAcceptance } = useSwapReviewTransactionState()
  const { hideContent, showInterfaceReviewSteps, steps, currentStep } = useSwapReviewState()
  const { onPrev } = useSwapOnPrevious()

  const isLoading = useIsSwapReviewLoading()
  const isSwapMissingParams = useIsSwapMissingParams()
  const error = useSwapReviewError()

  if (isLoading) {
    return <SwapReviewLoadingView />
  }

  if (isSwapMissingParams) {
    // This should never happen, but sometimes it does because tamagui renders the mobile web drawer when isModalOpen is false.
    logger.error('Missing required props in `derivedSwapInfo` to render `SwapReview` screen.', {
      tags: {
        file: 'SwapReviewScreen',
        function: 'render',
      },
    })
    return null
  }

  if (error.submissionError) {
    return (
      <SwapErrorScreen
        submissionError={error.submissionError}
        setSubmissionError={error.setSubmissionError}
        resubmitSwap={error.onSwapButtonClick}
        onClose={onPrev}
      />
    )
  }

  return (
    <>
      <SwapReviewContentWrapper>
        <SwapReviewWarningModal />
        {/* We hide the content via `hideContent` to allow the bottom sheet to animate properly while still rendering the components to allow the sheet to calculate its height. */}
        <Flex animation="quick" opacity={hideContent ? 0 : 1} gap="$spacing16" pt={isWeb ? '$spacing8' : undefined}>
          {acceptedDerivedSwapInfo && (
            <TransactionAmountsReview
              acceptedDerivedSwapInfo={acceptedDerivedSwapInfo}
              newTradeRequiresAcceptance={newTradeRequiresAcceptance}
              onClose={onPrev}
            />
          )}
          {showInterfaceReviewSteps ? (
            <ProgressIndicator currentStep={currentStep} steps={steps} />
          ) : isWrap ? (
            <SwapReviewWrapTransactionDetails />
          ) : (
            <SwapReviewSwapDetails />
          )}
        </Flex>
      </SwapReviewContentWrapper>
      <SwapReviewFooter />
    </>
  )
}

const SwapReviewContentWrapper = memo(function SwapReviewContentWrapper({
  children,
}: {
  children: ReactNode
}): JSX.Element | null {
  const { bottomSheetViewStyles } = useTransactionModalContext()
  return (
    <TransactionModalInnerContainer bottomSheetViewStyles={bottomSheetViewStyles} fullscreen={false}>
      {children}
    </TransactionModalInnerContainer>
  )
})
