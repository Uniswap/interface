import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useDispatch } from 'react-redux'
import { Flex, IconButton, SpinningLoader, isWeb, useIsShortMobileDevice } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { iconSizes } from 'ui/src/theme'
import { ProgressIndicator } from 'uniswap/src/components/ConfirmSwapModal/ProgressIndicator'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionDetails } from 'uniswap/src/features/transactions/TransactionDetails/TransactionDetails'
import {
  getRelevantTokenWarningSeverity,
  getShouldDisplayTokenWarningCard,
} from 'uniswap/src/features/transactions/TransactionDetails/utils'
import {
  TransactionModalFooterContainer,
  TransactionModalInnerContainer,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModal'
import {
  TransactionScreen,
  useTransactionModalContext,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { useTransactionSettingsContext } from 'uniswap/src/features/transactions/settings/contexts/TransactionSettingsContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useSwapTxContext } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import { useAcceptedTrade } from 'uniswap/src/features/transactions/swap/hooks/useAcceptedTrade'
import { useFeeOnTransferAmounts } from 'uniswap/src/features/transactions/swap/hooks/useFeeOnTransferAmount'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings'
import { SubmitSwapButton } from 'uniswap/src/features/transactions/swap/review/SubmitSwapButton'
import { SwapDetails } from 'uniswap/src/features/transactions/swap/review/SwapDetails'
import { SwapErrorScreen } from 'uniswap/src/features/transactions/swap/review/SwapErrorScreen'
import { TransactionAmountsReview } from 'uniswap/src/features/transactions/swap/review/TransactionAmountsReview'
import { TransactionStep } from 'uniswap/src/features/transactions/swap/types/steps'
import { SwapCallback } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { isValidSwapTxContext } from 'uniswap/src/features/transactions/swap/types/swapTxAndGasInfo'
import { WrapCallback } from 'uniswap/src/features/transactions/swap/types/wrapCallback'
import { isClassic, isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { isWrapAction } from 'uniswap/src/features/transactions/swap/utils/wrap'
import { CurrencyField } from 'uniswap/src/types/currency'
import { createTransactionId } from 'uniswap/src/utils/createTransactionId'
import { interruptTransactionFlow } from 'uniswap/src/utils/saga'
import { logger } from 'utilities/src/logger/logger'
import { isInterface } from 'utilities/src/platform'

interface SwapReviewScreenProps {
  hideContent: boolean
  swapCallback: SwapCallback
  wrapCallback: WrapCallback
  onSubmitSwap?: () => Promise<void>
}

// eslint-disable-next-line complexity
export function SwapReviewScreen(props: SwapReviewScreenProps): JSX.Element | null {
  const { hideContent, swapCallback, wrapCallback, onSubmitSwap } = props

  const dispatch = useDispatch()
  const { t } = useTranslation()
  const isShortMobileDevice = useIsShortMobileDevice()

  const [showWarningModal, setShowWarningModal] = useState(false)
  const [warningAcknowledged, setWarningAcknowledged] = useState(false)
  const [shouldSubmitTx, setShouldSubmitTx] = useState(false)
  const [tokenWarningChecked, setTokenWarningChecked] = useState(false)

  // Submission error UI is currently interface-only
  const [submissionError, setSubmissionError] = useState<Error>()

  const account = useAccountMeta()
  const { bottomSheetViewStyles, onClose, authTrigger, setScreen } = useTransactionModalContext()

  const [steps, setSteps] = useState<TransactionStep[]>([])
  const [currentStep, setCurrentStep] = useState<{ step: TransactionStep; accepted: boolean } | undefined>()
  const showInterfaceReviewSteps = Boolean(isInterface && currentStep && steps.length > 1) // Only show review steps UI for interface, while a step is active and there is more than 1 step

  const swapTxContext = useSwapTxContext()
  const { gasFee } = swapTxContext
  const uniswapXGasBreakdown = isUniswapX(swapTxContext) ? swapTxContext.gasFeeBreakdown : undefined

  const {
    derivedSwapInfo,
    exactCurrencyField: ctxExactCurrencyField,
    focusOnCurrencyField,
    isSubmitting,
    updateSwapForm,
    isFiatMode,
  } = useSwapFormContext()

  const { autoSlippageTolerance, customSlippageTolerance } = useTransactionSettingsContext()

  const onSuccess = useCallback(() => {
    // On interface, the swap component stays mounted; after swap we reset the form to avoid showing the previous values.
    if (isInterface) {
      updateSwapForm({ exactAmountFiat: undefined, exactAmountToken: '', isSubmitting: false })
      setScreen(TransactionScreen.Form)
    }
    onClose()
  }, [onClose, setScreen, updateSwapForm])

  const {
    chainId,
    currencies,
    currencyAmounts,
    currencyAmountsUSDValue,
    txId,
    wrapType,
    trade: { trade, indicativeTrade }, // TODO(WEB-5823): rm indicative trade usage from review screen
  } = derivedSwapInfo

  const isWrap = isWrapAction(wrapType)

  const { blockingWarning, reviewScreenWarning } = useParsedSwapWarnings()
  const txSimulationErrors = useMemo(() => {
    if (!trade || !isClassic(trade)) {
      return undefined
    }

    return trade.quote?.quote.txFailureReasons
  }, [trade])

  const {
    onAcceptTrade,
    acceptedDerivedSwapInfo: swapAcceptedDerivedSwapInfo,
    newTradeRequiresAcceptance,
  } = useAcceptedTrade({
    derivedSwapInfo,
    isSubmitting,
  })

  const acceptedDerivedSwapInfo = isWrap ? derivedSwapInfo : swapAcceptedDerivedSwapInfo
  const acceptedTrade = acceptedDerivedSwapInfo?.trade.trade

  const feeOnTransferProps = useFeeOnTransferAmounts(acceptedDerivedSwapInfo)

  const onPrev = useCallback(() => {
    if (!focusOnCurrencyField) {
      // We make sure that one of the input fields is focused (and the `DecimalPad` open) when the user goes back.
      updateSwapForm({ focusOnCurrencyField: ctxExactCurrencyField })
    }
    // On interface, closing the review modal should cancel the transaction flow saga and remove submitting UI.
    if (isInterface) {
      updateSwapForm({ isSubmitting: false })
      dispatch(interruptTransactionFlow())
    }

    setScreen(TransactionScreen.Form)
  }, [ctxExactCurrencyField, focusOnCurrencyField, setScreen, updateSwapForm, dispatch])

  const onFailure = useCallback(
    (error?: Error) => {
      setCurrentStep(undefined)

      // Create a new txId for the next transaction, as the existing one may be used in state to track the failed submission.
      const newTxId = createTransactionId()
      updateSwapForm({ isSubmitting: false, txId: newTxId })

      setSubmissionError(error)
    },
    [updateSwapForm],
  )

  const onWrap = useMemo(() => {
    const inputCurrencyAmount = currencyAmounts[CurrencyField.INPUT]
    const txRequest = isUniswapX(swapTxContext) ? undefined : swapTxContext.txRequest
    if (!txRequest || !isWrap || !account || !inputCurrencyAmount) {
      return (): void => {}
    }

    return () => {
      wrapCallback({
        account,
        inputCurrencyAmount,
        onSuccess,
        onFailure,
        txRequest,
        txId,
        wrapType,
        gasEstimates: swapTxContext.gasFeeEstimation.wrapEstimates,
      })
    }
  }, [account, currencyAmounts, isWrap, onSuccess, onFailure, swapTxContext, txId, wrapCallback, wrapType])

  const { onSwap, validSwap } = useMemo(() => {
    const isValidSwap = isValidSwapTxContext(swapTxContext)

    if (isValidSwap && account?.type === AccountType.SignerMnemonic) {
      return {
        onSwap: (): void => {
          swapCallback({
            account,
            swapTxContext,
            currencyInAmountUSD: currencyAmountsUSDValue[CurrencyField.INPUT],
            currencyOutAmountUSD: currencyAmountsUSDValue[CurrencyField.OUTPUT],
            isAutoSlippage: !customSlippageTolerance,
            onSuccess,
            onFailure,
            txId,
            isFiatInputMode: isFiatMode,
            setCurrentStep,
            setSteps,
          })
        },
        validSwap: true,
      }
    } else {
      return {
        onSwap: (): void => {},
        validSwap: false,
      }
    }
  }, [
    account,
    currencyAmountsUSDValue,
    customSlippageTolerance,
    isFiatMode,
    onSuccess,
    onFailure,
    swapCallback,
    swapTxContext,
    txId,
  ])

  const submitTransaction = useCallback(() => {
    if (reviewScreenWarning && !showWarningModal && !warningAcknowledged) {
      setShouldSubmitTx(true)
      setShowWarningModal(true)
      return
    }

    isWrap ? onWrap() : onSwap()
  }, [reviewScreenWarning, showWarningModal, warningAcknowledged, isWrap, onWrap, onSwap])

  const onSwapButtonClick = useCallback(async () => {
    updateSwapForm({ isSubmitting: true })

    if (authTrigger) {
      await authTrigger({
        successCallback: submitTransaction,
        failureCallback: onFailure,
      })
    } else {
      submitTransaction()
    }
    await onSubmitSwap?.()
  }, [authTrigger, onFailure, submitTransaction, updateSwapForm, onSubmitSwap])

  const tokenWarningProps = getRelevantTokenWarningSeverity(acceptedDerivedSwapInfo)
  const { shouldDisplayTokenWarningCard } = getShouldDisplayTokenWarningCard({
    tokenWarningProps,
    feeOnTransferProps,
  })
  const isTokenWarningBlocking = shouldDisplayTokenWarningCard && !tokenWarningChecked
  const submitButtonDisabled =
    (!validSwap && !isWrap) || !!blockingWarning || newTradeRequiresAcceptance || isSubmitting || isTokenWarningBlocking

  const showUniswapXSubmittingUI = isUniswapX(swapTxContext) && isSubmitting && !isInterface

  const onConfirmWarning = useCallback(() => {
    setWarningAcknowledged(true)
    setShowWarningModal(false)

    if (shouldSubmitTx) {
      isWrap ? onWrap() : onSwap()
    }
  }, [shouldSubmitTx, isWrap, onWrap, onSwap])

  const onCancelWarning = useCallback(() => {
    if (shouldSubmitTx) {
      onFailure()
    }

    setShowWarningModal(false)
    setWarningAcknowledged(false)
    setShouldSubmitTx(false)
  }, [onFailure, shouldSubmitTx])

  const onShowWarning = useCallback(() => {
    setShowWarningModal(true)
  }, [])

  const onCloseWarning = useCallback(() => {
    setShowWarningModal(false)
  }, [])

  if (!acceptedDerivedSwapInfo || (!isWrap && !indicativeTrade && (!acceptedTrade || !trade))) {
    // A missing `acceptedTrade` or `trade` can happen when the user leaves the app and comes back to the review screen after 1 minute when the TTL for the quote has expired.
    // When that happens, we remove the quote from the cache before refetching, so there's no `trade`.
    return (
      <TransactionModalInnerContainer bottomSheetViewStyles={bottomSheetViewStyles} fullscreen={false}>
        {/* The value of `height + mb` must be equal to the height of the fully rendered component to avoid any jumps. */}
        <Flex centered height={377} mb="$spacing28">
          <SpinningLoader size={iconSizes.icon40} />
        </Flex>
      </TransactionModalInnerContainer>
    )
  }

  const currencyInInfo = currencies[CurrencyField.INPUT]
  const currencyOutInfo = currencies[CurrencyField.OUTPUT]

  if (
    !currencyInInfo ||
    !currencyOutInfo ||
    !currencyAmounts[CurrencyField.INPUT] ||
    !currencyAmounts[CurrencyField.OUTPUT] ||
    !acceptedDerivedSwapInfo.currencyAmounts[CurrencyField.INPUT] ||
    !acceptedDerivedSwapInfo.currencyAmounts[CurrencyField.OUTPUT]
  ) {
    // This should never happen, but sometimes it does because tamagui renders the mobile web drawer when isModalOpen is false.
    logger.error('Missing required props in `derivedSwapInfo` to render `SwapReview` screen.', {
      tags: {
        file: 'SwapReviewScreen',
        function: 'render',
      },
    })
    return null
  }

  if (submissionError) {
    return (
      <SwapErrorScreen
        submissionError={submissionError}
        setSubmissionError={setSubmissionError}
        resubmitSwap={onSwapButtonClick}
        onClose={onPrev}
      />
    )
  }

  return (
    <>
      <TransactionModalInnerContainer bottomSheetViewStyles={bottomSheetViewStyles} fullscreen={false}>
        {reviewScreenWarning?.warning.title && (
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
        )}

        {/* We hide the content via `hideContent` to allow the bottom sheet to animate properly while still rendering the components to allow the sheet to calculate its height. */}
        <Flex animation="quick" opacity={hideContent ? 0 : 1} gap="$spacing16" pt={isWeb ? '$spacing8' : undefined}>
          <TransactionAmountsReview
            acceptedDerivedSwapInfo={acceptedDerivedSwapInfo}
            newTradeRequiresAcceptance={newTradeRequiresAcceptance}
            onClose={onPrev}
          />

          {showInterfaceReviewSteps ? (
            <ProgressIndicator currentStep={currentStep} steps={steps} />
          ) : isWrap ? (
            <TransactionDetails
              chainId={chainId}
              gasFee={gasFee}
              warning={reviewScreenWarning?.warning}
              txSimulationErrors={txSimulationErrors}
              onShowWarning={onShowWarning}
            />
          ) : (
            <SwapDetails
              acceptedDerivedSwapInfo={acceptedDerivedSwapInfo}
              autoSlippageTolerance={autoSlippageTolerance}
              customSlippageTolerance={customSlippageTolerance}
              derivedSwapInfo={derivedSwapInfo}
              feeOnTransferProps={feeOnTransferProps}
              tokenWarningProps={tokenWarningProps}
              tokenWarningChecked={tokenWarningChecked}
              setTokenWarningChecked={setTokenWarningChecked}
              gasFee={gasFee}
              newTradeRequiresAcceptance={newTradeRequiresAcceptance}
              uniswapXGasBreakdown={uniswapXGasBreakdown}
              warning={reviewScreenWarning?.warning}
              txSimulationErrors={txSimulationErrors}
              onAcceptTrade={onAcceptTrade}
              onShowWarning={onShowWarning}
            />
          )}
        </Flex>
      </TransactionModalInnerContainer>

      {!showInterfaceReviewSteps && (
        <TransactionModalFooterContainer>
          <Flex row gap="$spacing8">
            {!isWeb && !showUniswapXSubmittingUI && (
              <IconButton
                icon={<BackArrow />}
                emphasis="secondary"
                size={isShortMobileDevice ? 'medium' : 'large'}
                onPress={onPrev}
              />
            )}
            <SubmitSwapButton
              disabled={submitButtonDisabled}
              showUniswapXSubmittingUI={showUniswapXSubmittingUI}
              warning={reviewScreenWarning?.warning}
              onSubmit={onSwapButtonClick}
            />
          </Flex>
        </TransactionModalFooterContainer>
      )}
    </>
  )
}
