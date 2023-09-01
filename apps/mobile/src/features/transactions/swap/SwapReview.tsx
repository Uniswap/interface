/* eslint-disable complexity */
import { providers } from 'ethers'
import React, { useCallback, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import { Warning, WarningAction, WarningSeverity } from 'src/components/modals/WarningModal/types'
import WarningModal from 'src/components/modals/WarningModal/WarningModal'
import Trace from 'src/components/Trace/Trace'
import { ModalName, SectionName } from 'src/features/telemetry/constants'
import {
  DerivedSwapInfo,
  useAcceptedTrade,
  useSwapCallback,
  useWrapCallback,
} from 'src/features/transactions/swap/hooks'
import SlippageInfoModal from 'src/features/transactions/swap/SlippageInfoModal'
import { SwapDetails } from 'src/features/transactions/swap/SwapDetails'
import { SwapProtectionInfoModal } from 'src/features/transactions/swap/SwapProtectionModal'
import {
  getActionElementName,
  getActionName,
  isWrapAction,
  requireAcceptNewTrade,
} from 'src/features/transactions/swap/utils'
import { TransactionDetails } from 'src/features/transactions/TransactionDetails'
import { TransactionReview } from 'src/features/transactions/TransactionReview'
import { Icons } from 'ui/src'
import { formatCurrencyAmount, formatNumberOrString, NumberType } from 'utilities/src/format/format'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { AccountType } from 'wallet/src/features/wallet/accounts/types'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

interface SwapFormProps {
  onNext: () => void
  onPrev: () => void
  derivedSwapInfo: DerivedSwapInfo
  approveTxRequest?: providers.TransactionRequest
  txRequest?: providers.TransactionRequest
  totalGasFee?: string
  gasFeeUSD?: string
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
  gasFeeUSD,
  gasFallbackUsed,
  warnings,
  exactValue,
}: SwapFormProps): JSX.Element | null {
  const { t } = useTranslation()
  const theme = useAppTheme()
  const account = useActiveAccountWithThrow()
  const [showWarningModal, setShowWarningModal] = useState(false)
  const [showGasWarningModal, setShowGasWarningModal] = useState(false)
  const [showSlippageModal, setShowSlippageModal] = useState(false)
  const [warningAcknowledged, setWarningAcknowledged] = useState(false)
  const [shouldSubmitTx, setShouldSubmitTx] = useState(false)
  const [showSwapProtectionModal, setShowSwapProtectionModal] = useState(false)

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

  const onSwap = useSwapCallback(
    approveTxRequest,
    txRequest,
    totalGasFee,
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

  const onShowGasWarning = useCallback(() => {
    setShowGasWarningModal(true)
  }, [])

  const onCloseGasWarning = useCallback(() => {
    setShowGasWarningModal(false)
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

  const actionButtonDisabled =
    noValidSwap ||
    blockingWarning ||
    newTradeToAccept ||
    !totalGasFee ||
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
          gasFallbackUsed={gasFallbackUsed}
          gasFeeUSD={gasFeeUSD}
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
        autoSlippageTolerance={autoSlippageTolerance}
        customSlippageTolerance={customSlippageTolerance}
        gasFallbackUsed={gasFallbackUsed}
        gasFeeUSD={gasFeeUSD}
        newTradeToAccept={newTradeToAccept}
        trade={trade}
        warning={swapWarning}
        onAcceptTrade={onAcceptTrade}
        onShowGasWarning={onShowGasWarning}
        onShowSlippageModal={onShowSlippageModal}
        onShowSwapProtectionModal={onShowSwapProtectionModal}
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
          backgroundIconColor={theme.colors.surface3}
          caption={t(
            'This maximum network fee estimate is more conservative than usual—we’re unable to provide a more accurate figure at this time.'
          )}
          closeText={t('Dismiss')}
          icon={
            <Icons.InfoCircleFilled
              color={theme.colors.neutral2}
              size={theme.iconSizes.icon24}
              // not sure why this one is upside down
              style={{ transform: [{ rotate: '180deg' }] }}
            />
          }
          modalName={ModalName.GasEstimateWarning}
          severity={WarningSeverity.Medium}
          title={t('Conservative network fee estimate')}
          onClose={onCloseGasWarning}
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
