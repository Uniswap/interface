import { notificationAsync } from 'expo-haptics'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { FadeIn } from 'react-native-reanimated'
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
import { AnimatedFlex, Button, Flex, Icons, useSporeColors } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NumberType } from 'utilities/src/format/types'
import { useFiatConverter } from 'wallet/src/features/fiatCurrency/conversion'
import { useLocalizedFormatter } from 'wallet/src/features/language/formatter'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

// eslint-disable-next-line complexity
export function SwapReviewScreen({ hideContent }: { hideContent: boolean }): JSX.Element | null {
  const { t } = useTranslation()
  const colors = useSporeColors()
  const { convertFiatAmountFormatted } = useFiatConverter()
  const { formatCurrencyAmount, formatNumberOrString } = useLocalizedFormatter()

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
  const { derivedSwapInfo } = useSwapFormContext()

  const {
    autoSlippageTolerance,
    chainId,
    currencies,
    currencyAmounts,
    currencyAmountsUSDValue,
    customSlippageTolerance,
    exactAmountToken,
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

  const { onAcceptTrade, acceptedDerivedSwapInfo, newTradeRequiresAcceptance } = useAcceptedTrade({
    derivedSwapInfo,
  })
  const acceptedTrade = acceptedDerivedSwapInfo?.trade.trade

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

  const derivedCurrencyField =
    exactCurrencyField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT

  const derivedAmount = formatCurrencyAmount({
    value: acceptedDerivedSwapInfo?.currencyAmounts[derivedCurrencyField],
    type: NumberType.TokenTx,
  })

  const formattedExactAmountToken = formatNumberOrString({
    value: exactAmountToken,
    type: NumberType.TokenTx,
  })

  const [formattedTokenAmountIn, formattedTokenAmountOut] =
    exactCurrencyField === CurrencyField.INPUT
      ? [formattedExactAmountToken, derivedAmount]
      : [derivedAmount, formattedExactAmountToken]

  const usdAmountIn =
    exactCurrencyField === CurrencyField.INPUT
      ? currencyAmountsUSDValue[CurrencyField.INPUT]?.toExact()
      : acceptedDerivedSwapInfo?.currencyAmountsUSDValue[CurrencyField.INPUT]?.toExact()

  const usdAmountOut =
    exactCurrencyField === CurrencyField.OUTPUT
      ? currencyAmountsUSDValue[CurrencyField.OUTPUT]?.toExact()
      : acceptedDerivedSwapInfo?.currencyAmountsUSDValue[CurrencyField.OUTPUT]?.toExact()

  const formattedFiatAmountIn = convertFiatAmountFormatted(
    usdAmountIn,
    NumberType.FiatTokenQuantity
  )
  const formattedFiatAmountOut = convertFiatAmountFormatted(
    usdAmountOut,
    NumberType.FiatTokenQuantity
  )

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
          currencyInInfo={currencyInInfo}
          currencyOutInfo={currencyOutInfo}
          formattedFiatAmountIn={formattedFiatAmountIn}
          formattedFiatAmountOut={formattedFiatAmountOut}
          formattedTokenAmountIn={formattedTokenAmountIn}
          formattedTokenAmountOut={formattedTokenAmountOut}
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
            icon={<Icons.Faceid color="white" size="$icon.20" />}
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
