/* eslint-disable complexity */
import { providers } from 'ethers'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { Warning, WarningAction, WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import Trace from 'src/components/Trace/Trace'
import { ModalName, SectionName } from 'src/features/telemetry/constants'
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
import {
  getActionElementName,
  getActionName,
  isWrapAction,
} from 'src/features/transactions/swap/utils'
import { TransactionDetails } from 'src/features/transactions/TransactionDetails'
import { TransactionReview } from 'src/features/transactions/TransactionReview'
import { NumberType } from 'utilities/src/format/types'
import { GasFeeResult } from 'wallet/src/features/gas/types'
import { useLocalizationContext } from 'wallet/src/features/language/LocalizationContext'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'
import { DerivedSwapInfo } from './types'

interface SwapFormProps {
  onNext: () => void
  onPrev: () => void
  derivedSwapInfo: DerivedSwapInfo
  approveTxRequest?: providers.TransactionRequest
  txRequest?: providers.TransactionRequest
  gasFee: GasFeeResult
  warnings: Warning[]
  exactValue: string
}

export function SwapReview({
  onNext,
  onPrev,
  derivedSwapInfo,
  approveTxRequest,
  txRequest,
  gasFee,
  warnings,
  exactValue,
}: SwapFormProps): JSX.Element | null {
  const { t } = useTranslation()
  const { formatNumberOrString, formatCurrencyAmount } = useLocalizationContext()
  const account = useActiveAccountWithThrow()
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [showNetworkFeeInfoModal, setShowNetworkFeeInfoModal] = useState(false)
  const [showSwapFeeInfoModal, setShowSwapFeeInfoModal] = useState(false)
  const [noSwapFee, setNoSwapFee] = useState(false)
  const [showSlippageModal, setShowSlippageModal] = useState(false)
  const [showFOTInfoModal, setShowFOTInfoModal] = useState(false)
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
    currencyAmountsUSDValue,
    autoSlippageTolerance,
    customSlippageTolerance,
  } = derivedSwapInfo

  const outputCurrencyPricePerUnitExact =
    currencyAmountsUSDValue[CurrencyField.OUTPUT] && currencyAmounts[CurrencyField.OUTPUT]
      ? (
          parseFloat(currencyAmountsUSDValue[CurrencyField.OUTPUT].toExact()) /
          parseFloat(currencyAmounts[CurrencyField.OUTPUT].toExact())
        ).toString()
      : undefined

  const swapWarning = warnings.find((warning) => warning.severity >= WarningSeverity.Medium)

  const { onAcceptTrade, acceptedDerivedSwapInfo, newTradeRequiresAcceptance } = useAcceptedTrade({
    derivedSwapInfo,
  })
  const acceptedTrade = acceptedDerivedSwapInfo?.trade.trade

  const noValidSwap = !isWrapAction(wrapType) && !trade
  const blockingWarning = warnings.some(
    (warning) =>
      warning.action === WarningAction.DisableSubmit ||
      warning.action === WarningAction.DisableReview
  )

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

  const onShowSwapFeeInfo = useCallback((noFee: boolean) => {
    setShowSwapFeeInfoModal(true)
    setNoSwapFee(noFee)
  }, [])

  const onCloseNetworkFeeInfo = useCallback(() => {
    setShowNetworkFeeInfoModal(false)
  }, [])

  const onCloseSwapFeeInfo = useCallback(() => {
    setShowSwapFeeInfoModal(false)
  }, [])

  const actionButtonDisabled =
    noValidSwap ||
    blockingWarning ||
    newTradeRequiresAcceptance ||
    !gasFee.value ||
    !!gasFee.error ||
    !txRequest ||
    account.type === AccountType.Readonly

  const actionButtonProps = {
    disabled: actionButtonDisabled,
    label: getActionName(t, wrapType),
    name: getActionElementName(wrapType),
    onPress,
  }

  const getTransactionDetails = (): JSX.Element | null => {
    if (isWrapAction(wrapType)) {
      return (
        <TransactionDetails
          chainId={chainId}
          gasFee={gasFee}
          warning={swapWarning}
          onShowNetworkFeeInfo={onShowNetworkFeeInfo}
          onShowSwapFeeInfo={onShowSwapFeeInfo}
          onShowWarning={onShowWarning}
        />
      )
    }

    if (!acceptedTrade || !trade) return null

    return (
      <SwapDetails
        acceptedDerivedSwapInfo={acceptedDerivedSwapInfo}
        autoSlippageTolerance={autoSlippageTolerance}
        customSlippageTolerance={customSlippageTolerance}
        derivedSwapInfo={derivedSwapInfo}
        gasFee={gasFee}
        newTradeRequiresAcceptance={newTradeRequiresAcceptance}
        outputCurrencyPricePerUnitExact={outputCurrencyPricePerUnitExact}
        warning={swapWarning}
        onAcceptTrade={onAcceptTrade}
        onShowFOTInfo={onShowFOTInfo}
        onShowNetworkFeeInfo={onShowNetworkFeeInfo}
        onShowSlippageModal={onShowSlippageModal}
        onShowSwapFeeInfo={onShowSwapFeeInfo}
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
  const derivedAmount = formatCurrencyAmount({
    value: currencyAmounts[derivedCurrencyField],
    type: NumberType.TokenTx,
  })
  const formattedExactValue = formatNumberOrString({
    value: exactValue,
    type: NumberType.TokenTx,
  })
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
      {showSwapFeeInfoModal && <SwapFeeInfoModal noFee={noSwapFee} onClose={onCloseSwapFeeInfo} />}
      <Trace logImpression section={SectionName.SwapReview}>
        <TransactionReview
          actionButtonProps={actionButtonProps}
          currencyInInfo={currencyInInfo}
          currencyOutInfo={currencyOutInfo}
          formattedAmountIn={amountIn}
          formattedAmountOut={amountOut}
          inputCurrencyUSDValue={currencyAmountsUSDValue[CurrencyField.INPUT]}
          outputCurrencyUSDValue={currencyAmountsUSDValue[CurrencyField.OUTPUT]}
          transactionDetails={getTransactionDetails()}
          onPrev={onPrev}
        />
      </Trace>
    </>
  )
}
