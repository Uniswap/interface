import { notificationAsync } from 'expo-haptics'
import React, { useCallback, useEffect, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn } from 'react-native-reanimated'
import { Arrow } from 'src/components/icons/Arrow'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { OnShowSwapFeeInfo } from 'src/components/SwapFee/SwapFee'
import {
  useBiometricAppSettings,
  useBiometricPrompt,
  useDeviceSupportsBiometricAuth,
  useOsBiometricAuthEnabled,
} from 'src/features/biometrics/hooks'
import { ModalName } from 'src/features/telemetry/constants'
import {
  useAcceptedTrade,
  useSwapCallback,
  useWrapCallback,
} from 'src/features/transactions/swap/hooks'
import { FeeOnTransferInfoModal } from 'src/features/transactions/swap/modals/FeeOnTransferInfoModal'
import { NetworkFeeInfoModal } from 'src/features/transactions/swap/modals/NetworkFeeInfoModal'
import { SlippageInfoModal } from 'src/features/transactions/swap/modals/SlippageInfoModal'
import { SwapFeeInfoModal } from 'src/features/transactions/swap/modals/SwapFeeInfoModal'
import { SwapProtectionInfoModal } from 'src/features/transactions/swap/modals/SwapProtectionModal'
import { SwapDetails } from 'src/features/transactions/swap/SwapDetails'
import {
  getActionElementName,
  getActionName,
  isWrapAction,
} from 'src/features/transactions/swap/utils'
import { useSwapFormContext } from 'src/features/transactions/swapRewrite/contexts/SwapFormContext'
import {
  SwapScreen,
  useSwapScreenContext,
} from 'src/features/transactions/swapRewrite/contexts/SwapScreenContext'
import { useSwapTxContext } from 'src/features/transactions/swapRewrite/contexts/SwapTxContext'
import { GasAndWarningRows } from 'src/features/transactions/swapRewrite/GasAndWarningRows'
import { HoldToSwapProgressBar } from 'src/features/transactions/swapRewrite/HoldToSwapProgressBar'
import { useParsedSwapWarnings } from 'src/features/transactions/swapRewrite/hooks/useParsedSwapWarnings'
import {
  HOLD_TO_SWAP_TIMEOUT,
  SwapFormButtonEmptySpace,
} from 'src/features/transactions/swapRewrite/SwapFormButton'
import { TransactionAmountsReview } from 'src/features/transactions/swapRewrite/TransactionAmountsReview'
import { TransactionDetails } from 'src/features/transactions/TransactionDetails'
import { AnimatedFlex, Button, Flex, Icons, Separator, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

// eslint-disable-next-line complexity
export function SwapReviewScreen({ hideContent }: { hideContent: boolean }): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const account = useActiveAccountWithThrow()
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [showNetworkFeeInfoModal, setShowNetworkFeeInfoModal] = useState(false)
  const [showSwapFeeInfoModal, setShowSwapFeeInfoModal] = useState(false)
  const [noSwapFee, setNoSwapFee] = useState(false)
  const [showSlippageModal, setShowSlippageModal] = useState(false)
  const [showFOTInfoModal, setShowFOTInfoModal] = useState(false)
  const [warningAcknowledged, setWarningAcknowledged] = useState(false)
  const [shouldSubmitTx, setShouldSubmitTx] = useState(false)
  const [showSwapProtectionModal, setShowSwapProtectionModal] = useState(false)

  const { screen, screenRef, setScreen } = useSwapScreenContext()

  const { approveTxRequest, gasFee, txRequest } = useSwapTxContext()

  const {
    derivedSwapInfo,
    updateSwapForm,
    focusOnCurrencyField,
    exactCurrencyField: ctxExactCurrencyField,
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

  const outputCurrencyPricePerUnitExact =
    currencyAmountsUSDValue[CurrencyField.OUTPUT] && currencyAmounts[CurrencyField.OUTPUT]
      ? (
          parseFloat(currencyAmountsUSDValue[CurrencyField.OUTPUT].toExact()) /
          parseFloat(currencyAmounts[CurrencyField.OUTPUT].toExact())
        ).toString()
      : undefined

  const { blockingWarning, reviewScreenWarning } = useParsedSwapWarnings()

  const { onAcceptTrade, acceptedDerivedSwapInfo, newTradeRequiresAcceptance } = useAcceptedTrade({
    derivedSwapInfo,
  })
  const acceptedTrade = acceptedDerivedSwapInfo?.trade.trade

  const noValidSwap = !isWrapAction(wrapType) && !trade

  const onPrev = useCallback(() => {
    if (!focusOnCurrencyField) {
      // We make sure that one of the input fields is focused (and the `DecimalPad` open) when the user goes back.
      updateSwapForm({ focusOnCurrencyField: ctxExactCurrencyField })
    }
    setScreen(SwapScreen.SwapForm)
  }, [ctxExactCurrencyField, focusOnCurrencyField, setScreen, updateSwapForm])

  const onNext = useCallback(() => {
    setScreen(SwapScreen.SwapPending)
  }, [setScreen])

  const { wrapCallback: onWrap } = useWrapCallback(
    currencyAmounts[CurrencyField.INPUT],
    wrapType,
    onNext,
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
    onNext,
    txId
  )

  const submitTransaction = useCallback(() => {
    if (reviewScreenWarning && !showWarningModal && !warningAcknowledged) {
      setShouldSubmitTx(true)
      setShowWarningModal(true)
      return
    }

    isWrapAction(wrapType) ? onWrap() : onSwap()
  }, [reviewScreenWarning, showWarningModal, warningAcknowledged, wrapType, onWrap, onSwap])

  const { trigger: submitWithBiometrix } = useBiometricPrompt(submitTransaction)
  const { requiredForTransactions: requiresBiometrics } = useBiometricAppSettings()

  // Detect auth type for icon display
  const isBiometricAuthEnabled = useOsBiometricAuthEnabled()
  const { touchId: isTouchIdSupported, faceId: isFaceIdSupported } =
    useDeviceSupportsBiometricAuth()

  const onSubmitTransaction = useCallback(async () => {
    await notificationAsync()

    if (requiresBiometrics) {
      await submitWithBiometrix()
    } else {
      submitTransaction()
    }
  }, [requiresBiometrics, submitTransaction, submitWithBiometrix])

  const holdToSwapTimeoutStartTime = useRef<number>()

  // This is the timeout that counts how long the user has been pressing the button for "hold to swap" and then auto-submits the transaction.
  useEffect(() => {
    if (screen !== SwapScreen.SwapReviewHoldingToSwap) {
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

      setScreen(SwapScreen.SwapReview)
      await onSubmitTransaction()
    }, millisecondsLeft)

    return () => clearTimeout(timeout)
  }, [newTradeRequiresAcceptance, onSubmitTransaction, screen, screenRef, setScreen])

  const onConfirmWarning = useCallback(() => {
    setWarningAcknowledged(true)
    setShowWarningModal(false)

    if (shouldSubmitTx) {
      isWrapAction(wrapType) ? onWrap() : onSwap()
    }
  }, [wrapType, onWrap, onSwap, shouldSubmitTx])

  const onCancelWarning = useCallback(() => {
    setShowWarningModal(false)
    setWarningAcknowledged(false)
    setShouldSubmitTx(false)
  }, [])

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

  const onShowSwapProtectionModal = useCallback(() => {
    setShowSwapProtectionModal(true)
  }, [])

  const onCloseSwapProtectionModal = useCallback(() => {
    setShowSwapProtectionModal(false)
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

  if (hideContent || !acceptedTrade || !trade) {
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

  const submitButtonDisabled =
    noValidSwap ||
    !!blockingWarning ||
    newTradeRequiresAcceptance ||
    !gasFee.value ||
    !!gasFee.error ||
    !txRequest ||
    account.type === AccountType.Readonly

  const submitButtonIcon =
    isBiometricAuthEnabled && requiresBiometrics ? (
      isFaceIdSupported ? (
        <Icons.Faceid color="white" size="$icon.20" />
      ) : isTouchIdSupported ? (
        <Icons.Fingerprint color="white" size="$icon.20" />
      ) : undefined
    ) : undefined

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

  return screen === SwapScreen.SwapReviewHoldingToSwap ? (
    <Flex>
      <HoldToSwapProgressBar />

      <AnimatedFlex entering={FadeIn} gap="$spacing2">
        <TransactionAmountsReview
          acceptedDerivedSwapInfo={acceptedDerivedSwapInfo}
          newTradeRequiresAcceptance={newTradeRequiresAcceptance}
        />

        <Separator mb="$spacing12" mt="$spacing16" />

        <GasAndWarningRows renderEmptyRows={false} />

        <SwapFormButtonEmptySpace />
      </AnimatedFlex>
    </Flex>
  ) : (
    <>
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

      {showSlippageModal && acceptedTrade && (
        <SlippageInfoModal
          autoSlippageTolerance={autoSlippageTolerance}
          isCustomSlippage={!!customSlippageTolerance}
          trade={acceptedTrade}
          onClose={onCloseSlippageModal}
        />
      )}

      {showSwapProtectionModal && <SwapProtectionInfoModal onClose={onCloseSwapProtectionModal} />}

      {showFOTInfoModal && <FeeOnTransferInfoModal onClose={onCloseFOTInfo} />}

      {showNetworkFeeInfoModal && <NetworkFeeInfoModal onClose={onCloseNetworkFeeInfo} />}

      {showSwapFeeInfoModal && <SwapFeeInfoModal noFee={noSwapFee} onClose={onCloseSwapFeeInfo} />}

      <AnimatedFlex entering={FadeIn} gap="$spacing16">
        <TransactionAmountsReview
          acceptedDerivedSwapInfo={acceptedDerivedSwapInfo}
          newTradeRequiresAcceptance={newTradeRequiresAcceptance}
        />

        {isWrapAction(wrapType) ? (
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
            onShowSwapProtectionModal={onShowSwapProtectionModal}
            onShowWarning={onShowWarning}
          />
        )}

        <Flex row gap="$spacing8">
          <Button
            icon={<Arrow color={colors.neutral1.get()} direction="w" size={iconSizes.icon24} />}
            size="large"
            theme="tertiary"
            onPress={onPrev}
          />

          <Button
            fill
            disabled={submitButtonDisabled}
            icon={submitButtonIcon}
            size="large"
            testID={getActionElementName(wrapType)}
            onPress={onSubmitTransaction}>
            {getActionName(t, wrapType)}
          </Button>
        </Flex>
      </AnimatedFlex>
    </>
  )
}
