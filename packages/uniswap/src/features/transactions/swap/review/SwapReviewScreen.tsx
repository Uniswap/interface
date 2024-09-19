import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn } from 'react-native-reanimated'
import { Button, Flex, SpinningLoader, Text, isWeb, useHapticFeedback, useIsShortMobileDevice } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes } from 'ui/src/theme'
import { WarningModal } from 'uniswap/src/components/modals/WarningModal/WarningModal'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import { TransactionDetails } from 'uniswap/src/features/transactions/TransactionDetails/TransactionDetails'
import {
  TransactionModalFooterContainer,
  TransactionModalInnerContainer,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModal'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { SwapScreen, useSwapScreenContext } from 'uniswap/src/features/transactions/swap/contexts/SwapScreenContext'
import { isValidSwapTxContext, useSwapTxContext } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import { SWAP_BUTTON_TEXT_VARIANT, SubmittingText } from 'uniswap/src/features/transactions/swap/form/SwapFormButton'
import { useAcceptedTrade } from 'uniswap/src/features/transactions/swap/hooks/useAcceptedTrade'
import { useParsedSwapWarnings } from 'uniswap/src/features/transactions/swap/hooks/useSwapWarnings'
import { SwapDetails } from 'uniswap/src/features/transactions/swap/review/SwapDetails'
import { TransactionAmountsReview } from 'uniswap/src/features/transactions/swap/review/TransactionAmountsReview'
import { SwapCallback } from 'uniswap/src/features/transactions/swap/types/swapCallback'
import { WrapCallback } from 'uniswap/src/features/transactions/swap/types/wrapCallback'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { getActionName, isWrapAction } from 'uniswap/src/features/transactions/swap/utils/wrap'
import { WrapType } from 'uniswap/src/features/transactions/types/wrap'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { CurrencyField } from 'uniswap/src/types/currency'
import { createTransactionId } from 'uniswap/src/utils/createTransactionId'

interface SwapReviewScreenProps {
  hideContent: boolean
  swapCallback: SwapCallback
  wrapCallback: WrapCallback
}

// eslint-disable-next-line complexity
export function SwapReviewScreen(props: SwapReviewScreenProps): JSX.Element | null {
  const { hideContent, swapCallback, wrapCallback } = props

  const { t } = useTranslation()
  const isShortMobileDevice = useIsShortMobileDevice()

  const [showWarningModal, setShowWarningModal] = useState(false)
  const [warningAcknowledged, setWarningAcknowledged] = useState(false)
  const [shouldSubmitTx, setShouldSubmitTx] = useState(false)

  const account = useAccountMeta()
  const { bottomSheetViewStyles, onClose, authTrigger } = useTransactionModalContext()

  const { setScreen } = useSwapScreenContext()

  const swapTxContext = useSwapTxContext()
  const { gasFee } = swapTxContext
  const uniswapXGasBreakdown = isUniswapX(swapTxContext) ? swapTxContext.gasFeeBreakdown : undefined
  const { hapticFeedback } = useHapticFeedback()

  const {
    derivedSwapInfo,
    exactCurrencyField: ctxExactCurrencyField,
    focusOnCurrencyField,
    isSubmitting,
    updateSwapForm,
    isFiatMode,
  } = useSwapFormContext()

  const {
    autoSlippageTolerance,
    chainId,
    currencies,
    currencyAmounts,
    currencyAmountsUSDValue,
    customSlippageTolerance,
    txId,
    wrapType,
    trade: { trade, indicativeTrade },
  } = derivedSwapInfo

  const isWrap = isWrapAction(wrapType)

  const outputCurrencyPricePerUnitExact =
    currencyAmountsUSDValue[CurrencyField.OUTPUT] && currencyAmounts[CurrencyField.OUTPUT]
      ? (
          parseFloat(currencyAmountsUSDValue[CurrencyField.OUTPUT].toExact()) /
          parseFloat(currencyAmounts[CurrencyField.OUTPUT].toExact())
        ).toString()
      : undefined

  const { blockingWarning, reviewScreenWarning } = useParsedSwapWarnings()

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

  const onPrev = useCallback(() => {
    if (!focusOnCurrencyField) {
      // We make sure that one of the input fields is focused (and the `DecimalPad` open) when the user goes back.
      updateSwapForm({ focusOnCurrencyField: ctxExactCurrencyField })
    }
    setScreen(SwapScreen.SwapForm)
  }, [ctxExactCurrencyField, focusOnCurrencyField, setScreen, updateSwapForm])

  const onWrap = useMemo(() => {
    const inputCurrencyAmount = currencyAmounts[CurrencyField.INPUT]
    const txRequest = isUniswapX(swapTxContext) ? undefined : swapTxContext.txRequest
    if (!txRequest || !isWrap || !account || !inputCurrencyAmount) {
      return (): void => {}
    }

    return () => {
      wrapCallback({ account, inputCurrencyAmount, onSuccess: onClose, txRequest, txId, wrapType })
    }
  }, [account, currencyAmounts, isWrap, onClose, swapTxContext, txId, wrapCallback, wrapType])

  const onSubmitTransactionFailed = useCallback(() => {
    setScreen(SwapScreen.SwapReview)

    // Create a new txId for the next transaction, as the existing one may be used in state to track the failed submission.
    const newTxId = createTransactionId()
    updateSwapForm({ isSubmitting: false, txId: newTxId })
  }, [setScreen, updateSwapForm])

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
            onSubmit: onClose,
            onFailure: onSubmitTransactionFailed,
            txId,
            isFiatInputMode: isFiatMode,
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
    onClose,
    onSubmitTransactionFailed,
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

  const onSubmitTransaction = useCallback(async () => {
    updateSwapForm({ isSubmitting: true })

    await hapticFeedback.success()

    if (authTrigger) {
      await authTrigger({
        successCallback: submitTransaction,
        failureCallback: onSubmitTransactionFailed,
      })
    } else {
      submitTransaction()
    }
  }, [authTrigger, hapticFeedback, onSubmitTransactionFailed, submitTransaction, updateSwapForm])

  const submitButtonDisabled =
    (!validSwap && !isWrap) || !!blockingWarning || newTradeRequiresAcceptance || isSubmitting

  const showUniswapXSubmittingUI = isUniswapX(swapTxContext) && isSubmitting

  const onConfirmWarning = useCallback(() => {
    setWarningAcknowledged(true)
    setShowWarningModal(false)

    if (shouldSubmitTx) {
      isWrap ? onWrap() : onSwap()
    }
  }, [shouldSubmitTx, isWrap, onWrap, onSwap])

  const onCancelWarning = useCallback(() => {
    if (shouldSubmitTx) {
      onSubmitTransactionFailed()
    }

    setShowWarningModal(false)
    setWarningAcknowledged(false)
    setShouldSubmitTx(false)
  }, [onSubmitTransactionFailed, shouldSubmitTx])

  const onShowWarning = useCallback(() => {
    setShowWarningModal(true)
  }, [])

  const onCloseWarning = useCallback(() => {
    setShowWarningModal(false)
  }, [])

  if (hideContent || !acceptedDerivedSwapInfo || (!isWrap && !indicativeTrade && (!acceptedTrade || !trade))) {
    // We forcefully hide the content via `hideContent` to allow the bottom sheet to animate faster while still allowing all API requests to trigger ASAP.
    // A missing `acceptedTrade` or `trade` can happen when the user leaves the app and comes back to the review screen after 1 minute when the TTL for the quote has expired.
    // When that happens, we remove the quote from the cache before refetching, so there's no `trade`.
    return (
      // The value of `height + mb` must be equal to the height of the fully rendered component to avoid any jumps.
      <Flex centered height={377} mb="$spacing28">
        {!hideContent && <SpinningLoader size={iconSizes.icon40} />}
      </Flex>
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
    // This should never happen. It's just to keep TS happy.
    throw new Error('Missing required props in `derivedSwapInfo` to render `SwapReview` screen.')
  }

  return (
    <>
      <TransactionModalInnerContainer bottomSheetViewStyles={bottomSheetViewStyles} fullscreen={false}>
        {reviewScreenWarning?.warning.title && (
          <WarningModal
            caption={reviewScreenWarning.warning.message}
            closeText={blockingWarning ? undefined : t('common.button.cancel')}
            confirmText={blockingWarning ? t('common.button.ok') : t('common.button.confirm')}
            isOpen={showWarningModal}
            modalName={ModalName.SwapWarning}
            severity={reviewScreenWarning.warning.severity}
            title={reviewScreenWarning.warning.title}
            onCancel={onCancelWarning}
            onClose={onCloseWarning}
            onConfirm={onConfirmWarning}
          />
        )}

        <>
          <AnimatedFlex entering={FadeIn} gap="$spacing16" pt={isWeb ? '$spacing8' : undefined}>
            <TransactionAmountsReview
              acceptedDerivedSwapInfo={acceptedDerivedSwapInfo}
              newTradeRequiresAcceptance={newTradeRequiresAcceptance}
              onClose={onPrev}
            />

            {isWrap ? (
              <TransactionDetails
                chainId={chainId}
                gasFee={gasFee}
                warning={reviewScreenWarning?.warning}
                onShowWarning={onShowWarning}
              />
            ) : (
              <SwapDetails
                acceptedDerivedSwapInfo={acceptedDerivedSwapInfo}
                autoSlippageTolerance={autoSlippageTolerance}
                customSlippageTolerance={customSlippageTolerance}
                derivedSwapInfo={derivedSwapInfo}
                gasFee={gasFee}
                newTradeRequiresAcceptance={newTradeRequiresAcceptance}
                outputCurrencyPricePerUnitExact={outputCurrencyPricePerUnitExact}
                uniswapXGasBreakdown={uniswapXGasBreakdown}
                warning={reviewScreenWarning?.warning}
                onAcceptTrade={onAcceptTrade}
                onShowWarning={onShowWarning}
              />
            )}
          </AnimatedFlex>
        </>
      </TransactionModalInnerContainer>
      <TransactionModalFooterContainer>
        <Flex row gap="$spacing8">
          {!isWeb && !showUniswapXSubmittingUI && (
            <Button
              icon={<BackArrow />}
              size={isShortMobileDevice ? 'medium' : 'large'}
              theme="tertiary"
              onPress={onPrev}
            />
          )}
          <SubmitButton
            indicative={Boolean(!trade && indicativeTrade)}
            showUniswapXSubmittingUI={showUniswapXSubmittingUI}
            submitButtonDisabled={submitButtonDisabled}
            wrapType={wrapType}
            onSubmitTransaction={onSubmitTransaction}
          />
        </Flex>
      </TransactionModalFooterContainer>
    </>
  )
}

function SubmitButton({
  submitButtonDisabled,
  onSubmitTransaction,
  showUniswapXSubmittingUI,
  indicative,
  wrapType,
}: {
  submitButtonDisabled: boolean
  onSubmitTransaction: () => void
  showUniswapXSubmittingUI: boolean
  indicative: boolean
  wrapType: WrapType
}): JSX.Element {
  const { t } = useTranslation()
  const { BiometricsIcon } = useTransactionModalContext()
  const isShortMobileDevice = useIsShortMobileDevice()
  const size = isWeb ? 'medium' : isShortMobileDevice ? 'small' : 'large'
  const actionText = getActionName(t, wrapType)

  switch (true) {
    case indicative: {
      return (
        <Button
          fill
          backgroundColor="$surface2"
          disabled={true}
          icon={<SpinningLoader color="$neutral2" size={isWeb ? iconSizes.icon20 : iconSizes.icon24} />}
          opacity={1} // For indicative loading UI, opacity should be full despite disabled state
          size={size}
        >
          <Text color="$neutral2" flex={1} textAlign="center" variant={SWAP_BUTTON_TEXT_VARIANT}>
            {t('swap.finalizingQuote')}
          </Text>
        </Button>
      )
    }
    case showUniswapXSubmittingUI: {
      return (
        <Button
          fill
          backgroundColor="$accent2"
          color="$accent1"
          disabled={true}
          icon={<SpinningLoader color="$accent1" size={isWeb ? iconSizes.icon20 : iconSizes.icon24} />}
          opacity={1} // For UniswapX submitting UI, opacity should be full despite disabled state
          size={size}
        >
          <SubmittingText />
        </Button>
      )
    }
    default: {
      return (
        <Button
          fill
          backgroundColor="$accent1"
          disabled={submitButtonDisabled}
          icon={BiometricsIcon}
          size={size}
          testID={TestID.Swap}
          onPress={onSubmitTransaction}
        >
          <Text color="$white" variant={SWAP_BUTTON_TEXT_VARIANT}>
            {actionText}
          </Text>
        </Button>
      )
    }
  }
}
