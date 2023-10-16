import { notificationAsync } from 'expo-haptics'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Arrow } from 'src/components/icons/Arrow'
import { SpinningLoader } from 'src/components/loading/SpinningLoader'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { OnShowSwapFeeInfo } from 'src/components/SwapFee/SwapFee'
import { useBiometricAppSettings, useBiometricPrompt } from 'src/features/biometrics/hooks'
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
import { useParsedSwapWarnings } from 'src/features/transactions/swapRewrite/hooks/useParsedSwapWarnings'
import { TransactionAmountsReview } from 'src/features/transactions/swapRewrite/TransactionAmountsReview'
import { TransactionDetails } from 'src/features/transactions/TransactionDetails'
import { Button, Flex, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { formatCurrencyAmount, formatNumberOrString, NumberType } from 'utilities/src/format/format'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

// eslint-disable-next-line complexity
export function SwapReviewScreen(): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()

  const { setScreen } = useSwapScreenContext()

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

  const { approveTxRequest, gasFee, txRequest } = useSwapTxContext()
  const { derivedSwapInfo, isFiatInput } = useSwapFormContext()

  const {
    autoSlippageTolerance,
    chainId,
    currencies,
    currencyAmounts,
    currencyAmountsUSDValue,
    customSlippageTolerance,
    exactAmountToken,
    exactAmountUSD,
    exactCurrencyField,
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

  const { onAcceptTrade, acceptedTrade, newTradeRequiresAcceptance } = useAcceptedTrade(trade)

  const noValidSwap = !isWrapAction(wrapType) && !trade

  const onPrev = useCallback(() => {
    setScreen(SwapScreen.SwapForm)
  }, [setScreen])

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
  }, [warningAcknowledged, reviewScreenWarning, showWarningModal, wrapType, onWrap, onSwap])

  const { trigger: submitWithBiometrix } = useBiometricPrompt(submitTransaction)
  const { requiredForTransactions: requiresBiometrics } = useBiometricAppSettings()

  const onSubmitTransaction = useCallback(async () => {
    await notificationAsync()

    if (requiresBiometrics) {
      await submitWithBiometrix()
    } else {
      submitTransaction()
    }
  }, [requiresBiometrics, submitTransaction, submitWithBiometrix])

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

  if (!acceptedTrade || !trade) {
    // This can happen when the user leaves the app and comes back to the review screen after 1 minute when the TTL for the quote has expired.
    // When that happens, we remove the quote from the cache before refetching, so there's no `trade`.
    return (
      <Flex centered height={300} mb="$spacing28">
        <SpinningLoader size={iconSizes.icon40} />
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

  const currencyInInfo = currencies[CurrencyField.INPUT]
  const currencyOutInfo = currencies[CurrencyField.OUTPUT]

  if (
    !currencyInInfo ||
    !currencyOutInfo ||
    !currencyAmounts[CurrencyField.INPUT] ||
    !currencyAmounts[CurrencyField.OUTPUT]
  ) {
    // This should never happen. It's just to keep TS happy.
    throw new Error('Missing required props in `derivedSwapInfo` to render `SwapReview` screen.')
  }

  const derivedCurrencyField =
    exactCurrencyField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT

  const derivedAmount = formatCurrencyAmount(
    currencyAmounts[derivedCurrencyField],
    NumberType.TokenTx
  )

  const exactValue = isFiatInput ? exactAmountUSD : exactAmountToken
  const formattedExactValue = formatNumberOrString(exactValue, NumberType.TokenTx)

  const [formattedTokenAmountIn, formattedTokenAmountOut] =
    exactCurrencyField === CurrencyField.INPUT
      ? [formattedExactValue, derivedAmount]
      : [derivedAmount, formattedExactValue]

  const formattedFiatAmountIn = formatNumberOrString(
    currencyAmountsUSDValue[CurrencyField.INPUT]?.toExact(),
    NumberType.FiatTokenQuantity
  )
  const formattedFiatAmountOut = formatNumberOrString(
    currencyAmountsUSDValue[CurrencyField.OUTPUT]?.toExact(),
    NumberType.FiatTokenQuantity
  )

  return (
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

      <Flex gap="$spacing16">
        <TransactionAmountsReview
          currencyInInfo={currencyInInfo}
          currencyOutInfo={currencyOutInfo}
          formattedFiatAmountIn={formattedFiatAmountIn}
          formattedFiatAmountOut={formattedFiatAmountOut}
          formattedTokenAmountIn={formattedTokenAmountIn}
          formattedTokenAmountOut={formattedTokenAmountOut}
        />

        {/* TODO: review new design for these rows. */}

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
            acceptedTrade={acceptedTrade}
            autoSlippageTolerance={autoSlippageTolerance}
            customSlippageTolerance={customSlippageTolerance}
            gasFee={gasFee}
            newTradeRequiresAcceptance={newTradeRequiresAcceptance}
            outputCurrencyPricePerUnitExact={outputCurrencyPricePerUnitExact}
            trade={trade}
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
            size="large"
            testID={getActionElementName(wrapType)}
            onPress={onSubmitTransaction}>
            {getActionName(t, wrapType)}
          </Button>
        </Flex>
      </Flex>
    </>
  )
}
