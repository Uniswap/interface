import { AnyAction } from '@reduxjs/toolkit'
import React, { Dispatch } from 'react'
import { useTranslation } from 'react-i18next'
import { WarningAction, WarningModalType } from 'src/components/warnings/types'
import { GasSpeed } from 'src/features/gas/types'
import { ElementName } from 'src/features/telemetry/constants'
import {
  DerivedSwapInfo,
  useAcceptedTrade,
  useSwapActionHandlers,
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

  useUpdateSwapGasEstimate(dispatch, trade)
  const gasFee = useSwapGasFee(gasFeeEstimate, GasSpeed.Urgent, optimismL1Fee)

  const { onAcceptTrade, acceptedTrade } = useAcceptedTrade(trade)

  const { onShowSwapWarning } = useSwapActionHandlers(dispatch)

  const noValidSwap = !isWrapAction(wrapType) && !trade
  const blockingWarning = warnings.some(
    (warning) =>
      warning.action === WarningAction.DisableSubmit ||
      warning.action === WarningAction.DisableReview
  )
  const newTradeToAccept = requireAcceptNewTrade(acceptedTrade, trade)

  const { swapCallback } = useSwapCallback(
    trade,
    gasFeeEstimate,
    exactApproveRequired,
    swapMethodParameters,
    onNext,
    txId
  )

  const onSwap = () => {
    if (warnings.some((warning) => warning.action === WarningAction.WarnBeforeSubmit)) {
      onShowSwapWarning(WarningModalType.ACTION)
      return
    }

    swapCallback()
  }

  const { wrapCallback: onWrap } = useWrapCallback(
    currencyAmounts[CurrencyField.INPUT],
    wrapType,
    onNext,
    txId
  )

  const actionButtonProps = {
    disabled: noValidSwap || blockingWarning || newTradeToAccept || !gasFee,
    label: getActionName(t, wrapType),
    name:
      wrapType === WrapType.Wrap
        ? ElementName.Wrap
        : wrapType === WrapType.Unwrap
        ? ElementName.Unwrap
        : ElementName.Swap,
    onPress: isWrapAction(wrapType) ? onWrap : onSwap,
  }

  const getTransactionDetails = () => {
    if (isWrapAction(wrapType) || !acceptedTrade || !trade) {
      return
    }

    return (
      <SwapDetails
        acceptedTrade={acceptedTrade}
        dispatch={dispatch}
        gasFee={gasFee}
        newTradeToAccept={newTradeToAccept}
        trade={trade}
        warnings={warnings}
        onAcceptTrade={onAcceptTrade}
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
  )
}
