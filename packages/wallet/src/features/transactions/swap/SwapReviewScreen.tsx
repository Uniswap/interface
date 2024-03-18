import { notificationAsync } from 'expo-haptics'
import { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn } from 'react-native-reanimated'
import { SpinningLoader } from 'wallet/src/components/loading/SpinningLoader'
import { WarningModal } from 'wallet/src/components/modals/WarningModal/WarningModal'
import { selectHasViewedReviewScreen } from 'wallet/src/features/behaviorHistory/selectors'
import { setHasViewedReviewScreen } from 'wallet/src/features/behaviorHistory/slice'
import { useSwapFormContext } from 'wallet/src/features/transactions/contexts/SwapFormContext'
import {
  SwapScreen,
  useSwapScreenContext,
} from 'wallet/src/features/transactions/contexts/SwapScreenContext'
import { useSwapTxContext } from 'wallet/src/features/transactions/contexts/SwapTxContext'
import { useTransactionModalContext } from 'wallet/src/features/transactions/contexts/TransactionModalContext'
import { GasAndWarningRows } from 'wallet/src/features/transactions/swap/GasAndWarningRows'
import { SlippageInfoModal } from 'wallet/src/features/transactions/swap/modals/SlippageInfoModal'
import { SwapDetails } from 'wallet/src/features/transactions/swap/SwapDetails'
import {
  TransactionModalFooterContainer,
  TransactionModalInnerContainer,
} from 'wallet/src/features/transactions/swap/TransactionModal'
import { ElementName, ModalName } from 'wallet/src/telemetry/constants'

import { AnimatedFlex, Button, Flex, isWeb, Separator } from 'ui/src'
import { BackArrow } from 'ui/src/components/icons/BackArrow'
import { iconSizes } from 'ui/src/theme'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { useParsedSwapWarnings } from 'wallet/src/features/transactions/hooks/useParsedSwapWarnings'
import { HOLD_TO_SWAP_TIMEOUT } from 'wallet/src/features/transactions/swap/HoldToSwapProgressCircle'
import { useAcceptedTrade } from 'wallet/src/features/transactions/swap/trade/hooks/useAcceptedTrade'
import { useSwapCallback } from 'wallet/src/features/transactions/swap/trade/hooks/useSwapCallback'
import { useWrapCallback } from 'wallet/src/features/transactions/swap/trade/hooks/useWrapCallback'
import { TransactionAmountsReview } from 'wallet/src/features/transactions/swap/TransactionAmountsReview'
import { getActionName, isWrapAction } from 'wallet/src/features/transactions/swap/utils'
import { TransactionDetails } from 'wallet/src/features/transactions/TransactionDetails/TransactionDetails'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'
import { useAppDispatch, useAppSelector } from 'wallet/src/state'

// eslint-disable-next-line complexity
export function SwapReviewScreen({ hideContent }: { hideContent: boolean }): JSX.Element | null {
  const { t } = useTranslation()
  const dispatch = useAppDispatch()

  const account = useActiveAccountWithThrow()
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [showSlippageModal, setShowSlippageModal] = useState(false)
  const [warningAcknowledged, setWarningAcknowledged] = useState(false)
  const [shouldSubmitTx, setShouldSubmitTx] = useState(false)

  const { bottomSheetViewStyles, onClose, BiometricsIcon, authTrigger } =
    useTransactionModalContext()

  const { screen, screenRef, setScreen } = useSwapScreenContext()

  const { approveTxRequest, approvalError, gasFee, txRequest } = useSwapTxContext()

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
    trade: { trade: trade },
    txId,
    wrapType,
  } = derivedSwapInfo

  const isWrap = isWrapAction(wrapType)
  const noValidSwap = !isWrap && !trade

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
      })
    )
  }, [dispatch, wrapType])

  const navigateToNextScreen = useCallback(() => {
    onClose()
    triggerSwapPendingNotification()
  }, [onClose, triggerSwapPendingNotification])

  const { wrapCallback: onWrap } = useWrapCallback(
    currencyAmounts[CurrencyField.INPUT],
    wrapType,
    navigateToNextScreen,
    txRequest,
    txId
  )

  const onSwap = useSwapCallback(
    approveTxRequest,
    txRequest,
    gasFee,
    trade,
    currencyAmountsUSDValue[CurrencyField.INPUT],
    currencyAmountsUSDValue[CurrencyField.OUTPUT],
    !customSlippageTolerance,
    navigateToNextScreen,
    txId,
    screen === SwapScreen.SwapReviewHoldingToSwap,
    isFiatMode
  )

  const submitTransaction = useCallback(() => {
    if (reviewScreenWarning && !showWarningModal && !warningAcknowledged) {
      setShouldSubmitTx(true)
      setShowWarningModal(true)
      return
    }

    isWrap ? onWrap() : onSwap()
  }, [reviewScreenWarning, showWarningModal, warningAcknowledged, isWrap, onWrap, onSwap])

  const onSubmitTransactionFailed = useCallback(() => {
    setScreen(SwapScreen.SwapReview)
    updateSwapForm({ isSubmitting: false })
  }, [setScreen, updateSwapForm])

  const onSubmitTransaction = useCallback(async () => {
    updateSwapForm({ isSubmitting: true })

    if (!isWeb) {
      await notificationAsync()
    }

    if (authTrigger) {
      await authTrigger({
        successCallback: submitTransaction,
        failureCallback: onSubmitTransactionFailed,
      })
    } else {
      submitTransaction()
    }
  }, [authTrigger, onSubmitTransactionFailed, submitTransaction, updateSwapForm])

  const submitButtonDisabled =
    approvalError ||
    noValidSwap ||
    !!blockingWarning ||
    newTradeRequiresAcceptance ||
    !gasFee.value ||
    !!gasFee.error ||
    !txRequest ||
    account.type === AccountType.Readonly ||
    isSubmitting

  const holdToSwapTimeoutStartTime = useRef<number>()

  // This is the timeout that counts how long the user has been pressing the button for "hold to swap" and then auto-submits the transaction.
  useEffect(() => {
    if (isSubmitting || screen !== SwapScreen.SwapReviewHoldingToSwap) {
      return
    }

    if (newTradeRequiresAcceptance) {
      // If while the user is pressing the button, we get a worse quote,
      // we show them the regular Review screen and they must "accept" the new quote.
      setScreen(SwapScreen.SwapReview)
      return
    }

    const now = Date.now()

    if (holdToSwapTimeoutStartTime.current === undefined) {
      holdToSwapTimeoutStartTime.current = now
    }

    const millisecondsLeft = HOLD_TO_SWAP_TIMEOUT - (now - holdToSwapTimeoutStartTime.current)

    const timeout = setTimeout(async () => {
      if (screenRef.current !== SwapScreen.SwapReviewHoldingToSwap) {
        return
      }

      if (submitButtonDisabled) {
        // If the submit button became disabled while the user was "holding to swap",
        // we do not submit the transaction and we simply show them the regular Review screen.
        setScreen(SwapScreen.SwapReview)
        return
      }

      await onSubmitTransaction()
    }, millisecondsLeft)

    return () => clearTimeout(timeout)
  }, [
    isSubmitting,
    newTradeRequiresAcceptance,
    onSubmitTransaction,
    screen,
    screenRef,
    setScreen,
    submitButtonDisabled,
    updateSwapForm,
  ])

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

  const onShowSlippageModal = useCallback(() => {
    setShowSlippageModal(true)
  }, [])

  const onCloseSlippageModal = useCallback(() => {
    setShowSlippageModal(false)
  }, [])

  // Flag review screen user behavior, used to show hold to swap tip
  const hasViewedReviewScreen = useAppSelector(selectHasViewedReviewScreen)
  useEffect(() => {
    if (!hasViewedReviewScreen) {
      dispatch(setHasViewedReviewScreen(true))
    }
  }, [dispatch, hasViewedReviewScreen])

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
      <TransactionModalInnerContainer
        bottomSheetViewStyles={bottomSheetViewStyles}
        fullscreen={false}>
        {showWarningModal && reviewScreenWarning?.warning.title && (
          <WarningModal
            caption={reviewScreenWarning.warning.message}
            closeText={blockingWarning ? undefined : t('common.button.cancel')}
            confirmText={blockingWarning ? t('common.button.ok') : t('common.button.confirm')}
            modalName={ModalName.SwapWarning}
            severity={reviewScreenWarning.warning.severity}
            title={reviewScreenWarning.warning.title}
            onCancel={onCancelWarning}
            onClose={onCloseWarning}
            onConfirm={onConfirmWarning}
          />
        )}

        {screen === SwapScreen.SwapReviewHoldingToSwap ? (
          <Flex>
            <AnimatedFlex entering={FadeIn} gap="$spacing2">
              <TransactionAmountsReview
                acceptedDerivedSwapInfo={acceptedDerivedSwapInfo}
                newTradeRequiresAcceptance={newTradeRequiresAcceptance}
                onClose={onPrev}
              />

              <Separator mb="$spacing24" mt="$spacing16" />

              <Flex mb="$spacing8">
                <GasAndWarningRows renderEmptyRows={false} />
              </Flex>
            </AnimatedFlex>
          </Flex>
        ) : (
          <>
            {showSlippageModal && acceptedTrade && (
              <SlippageInfoModal
                autoSlippageTolerance={autoSlippageTolerance}
                isCustomSlippage={!!customSlippageTolerance}
                trade={acceptedTrade}
                onClose={onCloseSlippageModal}
              />
            )}

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
                  warning={reviewScreenWarning?.warning}
                  onAcceptTrade={onAcceptTrade}
                  onShowSlippageModal={onShowSlippageModal}
                  onShowWarning={onShowWarning}
                />
              )}
            </AnimatedFlex>
          </>
        )}
      </TransactionModalInnerContainer>

      {screen !== SwapScreen.SwapReviewHoldingToSwap && (
        <TransactionModalFooterContainer>
          <Flex row gap="$spacing8">
            {!isWeb && (
              <Button icon={<BackArrow />} size="large" theme="tertiary" onPress={onPrev} />
            )}

            <Button
              fill
              disabled={submitButtonDisabled}
              icon={BiometricsIcon}
              size="large"
              testID={ElementName.Swap}
              onPress={onSubmitTransaction}>
              {actionText}
            </Button>
          </Flex>
        </TransactionModalFooterContainer>
      )}
    </>
  )
}
