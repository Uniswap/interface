import type { ReactNode } from 'react'
import { memo } from 'react'
import { Flex } from 'ui/src'
import { ProgressIndicator } from 'uniswap/src/components/ConfirmSwapModal/ProgressIndicator'
import { TransactionModalInnerContainer } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModal'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/components/TransactionModal/TransactionModalContext'
import { FLASHBLOCKS_UI_SKIP_ROUTES } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/constants'
import { useClearFlashblocksSwapNotifications } from 'uniswap/src/features/transactions/swap/components/UnichainInstantBalanceModal/hooks/useClearFlashblocksSwapNotifications'
import { useIsUnichainFlashblocksEnabled } from 'uniswap/src/features/transactions/swap/hooks/useIsUnichainFlashblocksEnabled'
import { useAcceptedTrade } from 'uniswap/src/features/transactions/swap/review/hooks/useAcceptedTrade'
import { usePrepareSwapTransactionEffect } from 'uniswap/src/features/transactions/swap/review/hooks/usePrepareSwapTransactionEffect'
import { useSwapOnPrevious } from 'uniswap/src/features/transactions/swap/review/hooks/useSwapOnPrevious'
import { SwapErrorScreen } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapErrorScreen'
import { SwapReviewFooter } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewFooter/SwapReviewFooter'
import { SwapReviewLoadingView } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewLoadingView'
import { SwapReviewSwapDetails } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewSwapDetails'
import { SwapReviewWarningModal } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewWarningModal'
import { SwapReviewWrapTransactionDetails } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/SwapReviewWrapTransactionDetails'
import { TransactionAmountsReview } from 'uniswap/src/features/transactions/swap/review/SwapReviewScreen/TransactionAmountsReview'
import { SwapReviewCallbacksContextProvider } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewCallbacksStore/SwapReviewCallbacksStoreContextProvider'
import { SwapReviewStoreContextProvider } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/SwapReviewStoreContextProvider'
import {
  useShowInterfaceReviewSteps,
  useSwapReviewStore,
} from 'uniswap/src/features/transactions/swap/review/stores/swapReviewStore/useSwapReviewStore'
import { SwapReviewTransactionStoreContextProvider } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/SwapReviewTransactionStoreContextProvider'
import {
  useIsSwapMissingParams,
  useIsSwapReviewLoading,
  useSwapReviewError,
  useSwapReviewTransactionStore,
} from 'uniswap/src/features/transactions/swap/review/stores/swapReviewTransactionStore/useSwapReviewTransactionStore'
import { SwapReviewWarningStoreContextProvider } from 'uniswap/src/features/transactions/swap/review/stores/swapReviewWarningStore/SwapReviewWarningStoreContextProvider'
import { useSwapDependenciesStore } from 'uniswap/src/features/transactions/swap/stores/swapDependenciesStore/useSwapDependenciesStore'
import { useSwapFormStore } from 'uniswap/src/features/transactions/swap/stores/swapFormStore/useSwapFormStore'
import { useSwapTxStore } from 'uniswap/src/features/transactions/swap/stores/swapTxStore/useSwapTxStore'
import { logger } from 'utilities/src/logger/logger'
import { isWebPlatform } from 'utilities/src/platform'

interface SwapReviewScreenProps {
  hideContent: boolean
  onSubmitSwap?: () => Promise<void> | void
}

export function SwapReviewScreen({ hideContent, onSubmitSwap }: SwapReviewScreenProps): JSX.Element {
  return <SwapReviewScreenProviders hideContent={hideContent} onSubmitSwap={onSubmitSwap} />
}

export function SwapReviewScreenProviders({ hideContent, onSubmitSwap }: SwapReviewScreenProps): JSX.Element {
  const { onClose, authTrigger, setScreen } = useTransactionModalContext()
  const isSubmitting = useSwapFormStore((s) => s.isSubmitting)
  const { derivedSwapInfo, getExecuteSwapService } = useSwapDependenciesStore((s) => ({
    derivedSwapInfo: s.derivedSwapInfo,
    getExecuteSwapService: s.getExecuteSwapService,
  }))
  const swapTxContext = useSwapTxStore((s) => s)
  const { onAcceptTrade, acceptedDerivedSwapInfo, newTradeRequiresAcceptance } = useAcceptedTrade({
    derivedSwapInfo,
    isSubmitting,
  })

  const isFlashblocksEnabled = useIsUnichainFlashblocksEnabled(acceptedDerivedSwapInfo?.chainId)
  useClearFlashblocksSwapNotifications(
    isFlashblocksEnabled &&
      !(
        acceptedDerivedSwapInfo?.trade.trade?.routing &&
        FLASHBLOCKS_UI_SKIP_ROUTES.includes(acceptedDerivedSwapInfo.trade.trade.routing)
      ),
  )

  return (
    <SwapReviewStoreContextProvider hideContent={hideContent}>
      <SwapReviewWarningStoreContextProvider>
        <SwapReviewCallbacksContextProvider
          setScreen={setScreen}
          authTrigger={authTrigger}
          getExecuteSwapService={getExecuteSwapService}
          onSubmitSwap={onSubmitSwap}
          onClose={onClose}
          onAcceptTrade={onAcceptTrade}
        >
          <SwapReviewTransactionStoreContextProvider
            derivedSwapInfo={derivedSwapInfo}
            swapTxContext={swapTxContext}
            acceptedDerivedSwapInfo={acceptedDerivedSwapInfo}
            newTradeRequiresAcceptance={newTradeRequiresAcceptance}
          >
            <SwapReviewContent />
          </SwapReviewTransactionStoreContextProvider>
        </SwapReviewCallbacksContextProvider>
      </SwapReviewWarningStoreContextProvider>
    </SwapReviewStoreContextProvider>
  )
}

function SwapReviewContent(): JSX.Element | null {
  const { acceptedDerivedSwapInfo, isWrap, newTradeRequiresAcceptance } = useSwapReviewTransactionStore((s) => ({
    acceptedDerivedSwapInfo: s.acceptedDerivedSwapInfo,
    isWrap: s.isWrap,
    newTradeRequiresAcceptance: s.newTradeRequiresAcceptance,
  }))

  const { steps, currentStep, hideContent } = useSwapReviewStore((s) => ({
    steps: s.steps,
    currentStep: s.currentStep,
    hideContent: s.hideContent,
  }))

  const showInterfaceReviewSteps = useShowInterfaceReviewSteps()

  const { onPrev } = useSwapOnPrevious()

  const isLoading = useIsSwapReviewLoading()
  const isSwapMissingParams = useIsSwapMissingParams()
  const error = useSwapReviewError()

  usePrepareSwapTransactionEffect()

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
        onPressRetry={error.onPressRetry}
        onClose={onPrev}
      />
    )
  }

  return (
    <>
      <SwapReviewContentWrapper>
        <SwapReviewWarningModal />
        {/* We hide the content via `hideContent` to allow the bottom sheet to animate properly while still rendering the components to allow the sheet to calculate its height. */}
        <Flex
          animation="quick"
          opacity={hideContent ? 0 : 1}
          gap="$spacing16"
          pt={isWebPlatform ? '$spacing8' : undefined}
        >
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
}): JSX.Element {
  const { bottomSheetViewStyles } = useTransactionModalContext()
  return (
    <TransactionModalInnerContainer bottomSheetViewStyles={bottomSheetViewStyles} fullscreen={false}>
      {children}
    </TransactionModalInnerContainer>
  )
})
