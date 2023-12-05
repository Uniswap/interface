import { notificationAsync } from 'expo-haptics'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn } from 'react-native-reanimated'
import { useAppDispatch } from 'src/app/hooks'
import { Arrow } from 'src/components/icons/Arrow'
import { BiometricsIcon } from 'src/components/icons/BiometricsIcon'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { OnShowSwapFeeInfo } from 'src/components/SwapFee/SwapFee'
import {
  useBiometricAppSettings,
  useBiometricPrompt,
  useOsBiometricAuthEnabled,
} from 'src/features/biometrics/hooks'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import {
  useAcceptedTrade,
  useSwapCallback,
  useWrapCallback,
} from 'src/features/transactions/swap/hooks'
import { FeeOnTransferInfoModal } from 'src/features/transactions/swap/modals/FeeOnTransferInfoModal'
import { NetworkFeeInfoModal } from 'src/features/transactions/swap/modals/NetworkFeeInfoModal'
import { SlippageInfoModal } from 'src/features/transactions/swap/modals/SlippageInfoModal'
import { SwapFeeInfoModal } from 'src/features/transactions/swap/modals/SwapFeeInfoModal'
import { SwapDetails } from 'src/features/transactions/swap/SwapDetails'
import { getActionName, isWrapAction } from 'src/features/transactions/swap/utils'
import { useSwapBottomSheetModalContext } from 'src/features/transactions/swapRewrite/contexts/SwapBottomSheetModalContext'
import { useSwapFormContext } from 'src/features/transactions/swapRewrite/contexts/SwapFormContext'
import {
  SwapScreen,
  useSwapScreenContext,
} from 'src/features/transactions/swapRewrite/contexts/SwapScreenContext'
import { useSwapTxContext } from 'src/features/transactions/swapRewrite/contexts/SwapTxContext'
import { GasAndWarningRows } from 'src/features/transactions/swapRewrite/GasAndWarningRows'
import { HOLD_TO_SWAP_TIMEOUT } from 'src/features/transactions/swapRewrite/HoldToSwapProgressCircle'
import { useParsedSwapWarnings } from 'src/features/transactions/swapRewrite/hooks/useParsedSwapWarnings'
import {
  SwapBottomSheetModalFooterContainer,
  SwapBottomSheetModalInnerContainer,
} from 'src/features/transactions/swapRewrite/SwapBottomSheetModal'
import { TransactionAmountsReview } from 'src/features/transactions/swapRewrite/TransactionAmountsReview'
import { TransactionDetails } from 'src/features/transactions/TransactionDetails'
import { AnimatedFlex, Button, Flex, Separator, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { pushNotification } from 'wallet/src/features/notifications/slice'
import { AppNotificationType } from 'wallet/src/features/notifications/types'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

// eslint-disable-next-line complexity
export function SwapReviewScreen({ hideContent }: { hideContent: boolean }): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const dispatch = useAppDispatch()

  const account = useActiveAccountWithThrow()
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [showNetworkFeeInfoModal, setShowNetworkFeeInfoModal] = useState(false)
  const [showSwapFeeInfoModal, setShowSwapFeeInfoModal] = useState(false)
  const [noSwapFee, setNoSwapFee] = useState(false)
  const [showSlippageModal, setShowSlippageModal] = useState(false)
  const [showFOTInfoModal, setShowFOTInfoModal] = useState(false)
  const [warningAcknowledged, setWarningAcknowledged] = useState(false)
  const [shouldSubmitTx, setShouldSubmitTx] = useState(false)

  const { handleContentLayout, bottomSheetViewStyles } = useSwapBottomSheetModalContext()

  const { screen, screenRef, setScreen } = useSwapScreenContext()

  const { approveTxRequest, gasFee, txRequest } = useSwapTxContext()

  const {
    derivedSwapInfo,
    exactCurrencyField: ctxExactCurrencyField,
    focusOnCurrencyField,
    isSubmitting,
    onClose,
    updateSwapForm,
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
    screen === SwapScreen.SwapReviewHoldingToSwap
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

  const { trigger: submitWithBiometrix } = useBiometricPrompt(
    submitTransaction,
    onSubmitTransactionFailed
  )

  const { requiredForTransactions: requiresBiometrics } = useBiometricAppSettings()

  // Detect auth type for icon display
  const isBiometricAuthEnabled = useOsBiometricAuthEnabled()

  const onSubmitTransaction = useCallback(async () => {
    updateSwapForm({ isSubmitting: true })

    await notificationAsync()

    if (requiresBiometrics) {
      await submitWithBiometrix()
    } else {
      submitTransaction()
    }
  }, [requiresBiometrics, submitTransaction, submitWithBiometrix, updateSwapForm])

  const submitButtonDisabled =
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

  const onShowFOTInfo = useCallback(() => {
    setShowFOTInfoModal(true)
  }, [])

  const onCloseFOTInfo = useCallback(() => {
    setShowFOTInfoModal(false)
  }, [])

  const onShowNetworkFeeInfo = useCallback(() => {
    setShowNetworkFeeInfoModal(true)
  }, [])

  const onShowSwapFeeInfo = useCallback<OnShowSwapFeeInfo>((_noSwapFee: boolean) => {
    setShowSwapFeeInfoModal(true)
    setNoSwapFee(_noSwapFee)
  }, [])

  const onCloseNetworkFeeInfo = useCallback(() => {
    setShowNetworkFeeInfoModal(false)
  }, [])

  const onCloseSwapFeeInfo = useCallback(() => {
    setShowSwapFeeInfoModal(false)
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

  const submitButtonIcon =
    isBiometricAuthEnabled && requiresBiometrics ? <BiometricsIcon /> : undefined

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
      <SwapBottomSheetModalInnerContainer
        bottomSheetViewStyles={bottomSheetViewStyles}
        fullscreen={false}
        onLayout={handleContentLayout}>
        {showWarningModal && reviewScreenWarning?.warning.title && (
          <WarningModal
            caption={reviewScreenWarning.warning.message}
            closeText={blockingWarning ? undefined : t('Cancel')}
            confirmText={blockingWarning ? t('OK') : t('Confirm')}
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

            {showFOTInfoModal && <FeeOnTransferInfoModal onClose={onCloseFOTInfo} />}

            {showNetworkFeeInfoModal && <NetworkFeeInfoModal onClose={onCloseNetworkFeeInfo} />}

            {showSwapFeeInfoModal && (
              <SwapFeeInfoModal noFee={noSwapFee} onClose={onCloseSwapFeeInfo} />
            )}

            <AnimatedFlex entering={FadeIn} gap="$spacing16">
              <TransactionAmountsReview
                acceptedDerivedSwapInfo={acceptedDerivedSwapInfo}
                newTradeRequiresAcceptance={newTradeRequiresAcceptance}
              />

              {isWrap ? (
                <TransactionDetails
                  chainId={chainId}
                  gasFee={gasFee}
                  warning={reviewScreenWarning?.warning}
                  onShowNetworkFeeInfo={onShowNetworkFeeInfo}
                  onShowSwapFeeInfo={onShowSwapFeeInfo}
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
                  onShowFOTInfo={onShowFOTInfo}
                  onShowNetworkFeeInfo={onShowNetworkFeeInfo}
                  onShowSlippageModal={onShowSlippageModal}
                  onShowSwapFeeInfo={onShowSwapFeeInfo}
                  onShowWarning={onShowWarning}
                />
              )}
            </AnimatedFlex>
          </>
        )}
      </SwapBottomSheetModalInnerContainer>

      {screen !== SwapScreen.SwapReviewHoldingToSwap && (
        <SwapBottomSheetModalFooterContainer>
          <Flex row gap="$spacing8">
            <Button
              icon={<Arrow color={colors.neutral1.val} direction="w" size={iconSizes.icon24} />}
              size="large"
              theme="tertiary"
              onPress={onPrev}
            />

            <Button
              fill
              disabled={submitButtonDisabled}
              icon={submitButtonIcon}
              size="large"
              testID={ElementName.Swap}
              onPress={onSubmitTransaction}>
              {actionText}
            </Button>
          </Flex>
        </SwapBottomSheetModalFooterContainer>
      )}
    </>
  )
}
