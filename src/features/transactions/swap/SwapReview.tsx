import { AnyAction } from '@reduxjs/toolkit'
import React, { Dispatch, useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import WarningModal from 'src/components/modals/WarningModal'
import { WarningAction, WarningSeverity } from 'src/components/warnings/types'
import { GasSpeed } from 'src/features/gas/types'
import { ElementName, ModalName } from 'src/features/telemetry/constants'
import {
  DerivedSwapInfo,
  useAcceptedTrade,
  useSwapCallback,
  useSwapGasFee,
  useUpdateSwapGasEstimate,
  useWrapCallback,
} from 'src/features/transactions/swap/hooks'
import { SwapDetails } from 'src/features/transactions/swap/SwapDetails'
import {
  getActionName,
  isWrapAction,
  requireAcceptNewTrade,
} from 'src/features/transactions/swap/utils'
import { WrapType } from 'src/features/transactions/swap/wrapSaga'
import { TransactionReview } from 'src/features/transactions/TransactionReview'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'

interface SwapFormProps {
  dispatch: Dispatch<AnyAction>
  onNext: () => void
  onPrev: () => void
  derivedSwapInfo: DerivedSwapInfo
}

export function SwapReview({ dispatch, onNext, onPrev, derivedSwapInfo }: SwapFormProps) {
  const { t } = useTranslation()
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [warningAcknowledged, setWarningAcknowledged] = useState(false)
  const [shouldSubmitTx, setShouldSubmitTx] = useState(false)

  const {
    currencies,
    currencyAmounts,
    formattedAmounts,
    trade: { trade: trade },
    wrapType,
    isUSDInput = false,
    gasFeeEstimate,
    optimismL1Fee,
    exactApproveRequired,
    swapMethodParameters,
    warnings,
    txId,
  } = derivedSwapInfo

  const swapWarning = warnings.find((warning) => warning.severity >= WarningSeverity.Medium)

  useUpdateSwapGasEstimate(dispatch, trade)
  const gasFee = useSwapGasFee(gasFeeEstimate, GasSpeed.Urgent, optimismL1Fee)

  const { onAcceptTrade, acceptedTrade } = useAcceptedTrade(trade)

  const noValidSwap = !isWrapAction(wrapType) && !trade
  const blockingWarning = warnings.some(
    (warning) =>
      warning.action === WarningAction.DisableSubmit ||
      warning.action === WarningAction.DisableReview
  )
  const newTradeToAccept = requireAcceptNewTrade(acceptedTrade, trade)

  const onSwap = useSwapCallback(
    trade,
    gasFeeEstimate,
    exactApproveRequired,
    swapMethodParameters,
    onNext,
    txId
  )

  const { wrapCallback: onWrap } = useWrapCallback(
    currencyAmounts[CurrencyField.INPUT],
    wrapType,
    onNext,
    txId
  )

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

  const actionButtonProps = {
    disabled: noValidSwap || blockingWarning || newTradeToAccept || !gasFee,
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
    if (isWrapAction(wrapType) || !acceptedTrade || !trade) {
      return
    }

    return (
      <SwapDetails
        acceptedTrade={acceptedTrade}
        gasFee={gasFee}
        newTradeToAccept={newTradeToAccept}
        trade={trade}
        warning={swapWarning}
        onAcceptTrade={onAcceptTrade}
        onShowWarning={onShowWarning}
      />
    )
  }

  const currencyIn = currencies[CurrencyField.INPUT]
  const currencyOut = currencies[CurrencyField.OUTPUT]

  if (
    !currencyIn ||
    !currencyOut ||
    !currencyAmounts[CurrencyField.INPUT] ||
    !currencyAmounts[CurrencyField.OUTPUT]
  ) {
    return null
  }

  return (
    <>
      {showWarningModal && swapWarning?.title && (
        <WarningModal
          isVisible
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
      <TransactionReview
        actionButtonProps={actionButtonProps}
        currencyIn={currencyIn}
        currencyOut={currencyOut}
        formattedAmountIn={formattedAmounts[CurrencyField.INPUT]}
        formattedAmountOut={formattedAmounts[CurrencyField.OUTPUT]}
        isUSDInput={isUSDInput}
        transactionDetails={getTransactionDetails()}
        onPrev={onPrev}
      />
    </>
  )
}
