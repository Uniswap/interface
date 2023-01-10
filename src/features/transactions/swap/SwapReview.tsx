import { providers } from 'ethers'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import InfoCircleSVG from 'src/assets/icons/info-circle.svg'
import { Warning, WarningAction, WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import { useUSDCValue } from 'src/features/routing/useUSDCPrice'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import {
  DerivedSwapInfo,
  useAcceptedTrade,
  useSwapCallback,
  useWrapCallback,
} from 'src/features/transactions/swap/hooks'
import { SwapDetails } from 'src/features/transactions/swap/SwapDetails'
import {
  getActionName,
  isWrapAction,
  requireAcceptNewTrade,
} from 'src/features/transactions/swap/utils'
import { WrapType } from 'src/features/transactions/swap/wrapSaga'
import { TransactionDetails } from 'src/features/transactions/TransactionDetails'
import { TransactionReview } from 'src/features/transactions/TransactionReview'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { formatCurrencyAmount, formatNumberOrString, NumberType } from 'src/utils/format'

interface SwapFormProps {
  onNext: () => void
  onPrev: () => void
  derivedSwapInfo: DerivedSwapInfo
  approveTxRequest?: providers.TransactionRequest
  txRequest?: providers.TransactionRequest
  totalGasFee?: string
  gasFallbackUsed?: boolean
  warnings: Warning[]
  exactValue: string
}

export function SwapReview({
  onNext,
  onPrev,
  derivedSwapInfo,
  approveTxRequest,
  txRequest,
  totalGasFee,
  gasFallbackUsed,
  warnings,
  exactValue,
}: SwapFormProps) {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [showGasWarningModal, setShowGasWarningModal] = useState(false)
  const [warningAcknowledged, setWarningAcknowledged] = useState(false)
  const [shouldSubmitTx, setShouldSubmitTx] = useState(false)

  const {
    chainId,
    currencies,
    currencyAmounts,
    trade: { trade: trade },
    wrapType,
    exactCurrencyField,
    txId,
  } = derivedSwapInfo

  const swapWarning = warnings.find((warning) => warning.severity >= WarningSeverity.Medium)

  const { onAcceptTrade, acceptedTrade } = useAcceptedTrade(trade)

  const noValidSwap = !isWrapAction(wrapType) && !trade
  const blockingWarning = warnings.some(
    (warning) =>
      warning.action === WarningAction.DisableSubmit ||
      warning.action === WarningAction.DisableReview
  )
  const newTradeToAccept = requireAcceptNewTrade(acceptedTrade, trade)

  const { wrapCallback: onWrap } = useWrapCallback(
    currencyAmounts[CurrencyField.INPUT],
    wrapType,
    onNext,
    txRequest,
    txId
  )

  const inputCurrencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.INPUT])
  const outputCurrencyUSDValue = useUSDCValue(currencyAmounts[CurrencyField.OUTPUT])

  const onSwap = useSwapCallback(approveTxRequest, txRequest, totalGasFee, trade, onNext, txId)

  const onPress = useCallback(() => {
    if (swapWarning && !showWarningModal && !warningAcknowledged) {
      setShouldSubmitTx(true)
      setShowWarningModal(true)
      return
    }

    isWrapAction(wrapType) ? onWrap() : onSwap()
  }, [warningAcknowledged, swapWarning, showWarningModal, wrapType, onWrap, onSwap])

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

  const onShowGasWarning = useCallback(() => {
    setShowGasWarningModal(true)
  }, [])

  const onCloseGasWarning = useCallback(() => {
    setShowGasWarningModal(false)
  }, [])

  const actionButtonProps = {
    disabled: noValidSwap || blockingWarning || newTradeToAccept || !totalGasFee || !txRequest,
    label: getActionName(t, wrapType),
    name:
      wrapType === WrapType.Wrap
        ? ElementName.Wrap
        : wrapType === WrapType.Unwrap
        ? ElementName.Unwrap
        : ElementName.Swap,
    onPress,
  }

  const getTransactionDetails = () => {
    if (isWrapAction(wrapType)) {
      return (
        <TransactionDetails
          chainId={chainId}
          gasFallbackUsed={gasFallbackUsed}
          gasFee={totalGasFee}
          warning={swapWarning}
          onShowGasWarning={onShowGasWarning}
          onShowWarning={onShowWarning}
        />
      )
    }

    if (!acceptedTrade || !trade) return null

    return (
      <SwapDetails
        acceptedTrade={acceptedTrade}
        gasFallbackUsed={gasFallbackUsed}
        gasFee={totalGasFee}
        newTradeToAccept={newTradeToAccept}
        trade={trade}
        warning={swapWarning}
        onAcceptTrade={onAcceptTrade}
        onShowGasWarning={onShowGasWarning}
        onShowWarning={onShowWarning}
      />
    )
  }

  const currencyInInfo = currencies[CurrencyField.INPUT]
  const currencyOutInfo = currencies[CurrencyField.OUTPUT]

  if (
    !currencyInInfo ||
    !currencyOutInfo ||
    !currencyAmounts[CurrencyField.INPUT] ||
    !currencyAmounts[CurrencyField.OUTPUT]
  ) {
    return null
  }

  const derivedCurrencyField =
    exactCurrencyField === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT
  const derivedAmount = formatCurrencyAmount(
    currencyAmounts[derivedCurrencyField],
    NumberType.TokenTx
  )
  const formattedExactValue = formatNumberOrString(exactValue, NumberType.TokenTx)
  const [amountIn, amountOut] =
    exactCurrencyField === CurrencyField.INPUT
      ? [formattedExactValue, derivedAmount]
      : [derivedAmount, formattedExactValue]

  return (
    <>
      {showWarningModal && swapWarning?.title && (
        <WarningModal
          caption={swapWarning.message}
          closeText={blockingWarning ? undefined : t('Cancel')}
          confirmText={blockingWarning ? t('OK') : t('Confirm')}
          modalName={ModalName.SwapWarning}
          severity={swapWarning.severity}
          title={swapWarning.title}
          onCancel={onCancelWarning}
          onClose={onCloseWarning}
          onConfirm={onConfirmWarning}
        />
      )}
      {showGasWarningModal && (
        <WarningModal
          caption={t(
            'This maximum network fee estimate is more conservative than usual—we’re unable to provide a more accurate figure at this time.'
          )}
          closeText={t('Dismiss')}
          icon={
            <InfoCircleSVG
              color={theme.colors.accentWarning}
              height={theme.iconSizes.lg}
              width={theme.iconSizes.lg}
            />
          }
          modalName={ModalName.GasEstimateWarning}
          severity={WarningSeverity.Medium}
          title={t('Conservative network fee estimate')}
          onClose={onCloseGasWarning}
        />
      )}
      <TransactionReview
        actionButtonProps={actionButtonProps}
        currencyInInfo={currencyInInfo}
        currencyOutInfo={currencyOutInfo}
        formattedAmountIn={amountIn}
        formattedAmountOut={amountOut}
        inputCurrencyUSDValue={inputCurrencyUSDValue}
        outputCurrencyUSDValue={outputCurrencyUSDValue}
        transactionDetails={getTransactionDetails()}
        onPrev={onPrev}
      />
    </>
  )
}
