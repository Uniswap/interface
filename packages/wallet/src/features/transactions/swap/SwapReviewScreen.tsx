import { useCallback, useMemo, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn } from 'react-native-reanimated'
import { useDispatch } from 'react-redux'
import { Button, Flex, SpinningLoader, Text, isWeb, useHapticFeedback, useIsShortMobileDevice } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons'
import { AnimatedFlex } from 'ui/src/components/layout/AnimatedFlex'
import { iconSizes } from 'ui/src/theme'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { AccountType } from 'uniswap/src/features/accounts/types'
import { ModalName } from 'uniswap/src/features/telemetry/constants'
import {
  TransactionModalFooterContainer,
  TransactionModalInnerContainer,
} from 'uniswap/src/features/transactions/TransactionModal/TransactionModal'
import { useTransactionModalContext } from 'uniswap/src/features/transactions/TransactionModal/TransactionModalContext'
import { SwapScreen, useSwapScreenContext } from 'uniswap/src/features/transactions/swap/contexts/SwapScreenContext'
import { isUniswapX } from 'uniswap/src/features/transactions/swap/utils/routing'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { CurrencyField } from 'uniswap/src/types/currency'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { TransactionDetails } from 'wallet/src/features/transactions/TransactionDetails/TransactionDetails'
import { useSwapFormContext } from 'wallet/src/features/transactions/contexts/SwapFormContext'
import { isValidSwapTxContext, useSwapTxContext } from 'wallet/src/features/transactions/contexts/SwapTxContext'
import { useParsedSwapWarnings } from 'wallet/src/features/transactions/hooks/useParsedTransactionWarnings'
import { SwapDetails } from 'wallet/src/features/transactions/swap/SwapDetails'
import { SWAP_BUTTON_TEXT_VARIANT, SubmittingText } from 'wallet/src/features/transactions/swap/SwapFormButton'
import { TransactionAmountsReview } from 'wallet/src/features/transactions/swap/TransactionAmountsReview'
import { useAcceptedTrade } from 'wallet/src/features/transactions/swap/trade/hooks/useAcceptedTrade'
import { useSwapCallback } from 'wallet/src/features/transactions/swap/trade/hooks/useSwapCallback'
import { useWrapCallback } from 'wallet/src/features/transactions/swap/trade/hooks/useWrapCallback'
import { getActionName, isWrapAction } from 'wallet/src/features/transactions/swap/utils'
import { createTransactionId } from 'wallet/src/features/transactions/utils'

// eslint-disable-next-line complexity
export function SwapReviewScreen({ hideContent }: { hideContent: boolean }): JSX.Element | null {
  const { t } = useTranslation()
  const dispatch = useDispatch()
  const isShortMobileDevice = useIsShortMobileDevice()

  const [showWarningModal, setShowWarningModal] = useState(false)
  const [warningAcknowledged, setWarningAcknowledged] = useState(false)
  const [shouldSubmitTx, setShouldSubmitTx] = useState(false)

  const account = useAccountMeta()
  const { bottomSheetViewStyles, onClose, BiometricsIcon, authTrigger } = useTransactionModalContext()

  const { setScreen } = useSwapScreenContext()

  const swapTxContext = useSwapTxContext()
  const { gasFee, trade } = swapTxContext
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

  const triggerSwapPendingNotification = useCallback(() => {
    dispatch(
      pushNotification({
        type: AppNotificationType.SwapPending,
        wrapType,
      }),
    )
  }, [dispatch, wrapType])

  const navigateToNextScreen = useCallback(() => {
    onClose()
    triggerSwapPendingNotification()
  }, [onClose, triggerSwapPendingNotification])

  const { wrapCallback: onWrap } = useWrapCallback(
    account,
    currencyAmounts[CurrencyField.INPUT],
    wrapType,
    navigateToNextScreen,
    isUniswapX(swapTxContext) ? swapTxContext.wrapTxRequest : swapTxContext.txRequest,
    txId,
  )

  const onSubmitTransactionFailed = useCallback(() => {
    setScreen(SwapScreen.SwapReview)

    // Create a new txId for the next transaction, as the existing one may be used in state to track the failed submission.
    const newTxId = createTransactionId()
    updateSwapForm({ isSubmitting: false, txId: newTxId })
  }, [setScreen, updateSwapForm])

  const swapCallback = useSwapCallback()
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
            onSubmit: navigateToNextScreen,
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
    navigateToNextScreen,
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
  const submitButtonIcon = showUniswapXSubmittingUI ? (
    <SpinningLoader color="$accent1" size={isWeb ? iconSizes.icon20 : iconSizes.icon24} />
  ) : (
    BiometricsIcon
  )

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

  if (hideContent || !acceptedDerivedSwapInfo || (!isWrap && (!acceptedTrade || !trade))) {
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

  const actionText = getActionName(t, wrapType)

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

          <Button
            fill
            backgroundColor={showUniswapXSubmittingUI ? '$accent2' : '$accent1'}
            color={showUniswapXSubmittingUI ? '$accent1' : undefined}
            disabled={submitButtonDisabled}
            icon={submitButtonIcon}
            opacity={showUniswapXSubmittingUI ? 1 : undefined}
            size={isWeb ? 'medium' : isShortMobileDevice ? 'small' : 'large'}
            testID={TestID.Swap}
            onPress={onSubmitTransaction}
          >
            {showUniswapXSubmittingUI ? (
              <SubmittingText />
            ) : (
              <Text color="$white" variant={SWAP_BUTTON_TEXT_VARIANT}>
                {actionText}
              </Text>
            )}
          </Button>
        </Flex>
      </TransactionModalFooterContainer>
    </>
  )
}
