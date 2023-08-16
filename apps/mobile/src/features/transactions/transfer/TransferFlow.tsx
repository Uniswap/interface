import React, { useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { WarningAction } from 'src/components/modals/WarningModal/types'
import { RecipientSelect } from 'src/components/RecipientSelect/RecipientSelect'
import {
  TokenSelectorFlow,
  TokenSelectorModal,
  TokenSelectorVariation,
} from 'src/components/TokenSelector/TokenSelector'
import { useTokenSelectorActionHandlers } from 'src/features/transactions/hooks'
import { TransactionFlow, TransactionStep } from 'src/features/transactions/TransactionFlow'
import {
  initialState as emptyState,
  transactionStateReducer,
} from 'src/features/transactions/transactionState/transactionState'
import { useTransactionGasWarning } from 'src/features/transactions/useTransactionGasWarning'
import { useTransactionGasFee, useUSDValue } from 'wallet/src/features/gas/hooks'
import { GasSpeed } from 'wallet/src/features/gas/types'
import {
  CurrencyField,
  TransactionState,
} from 'wallet/src/features/transactions/transactionState/types'
import {
  useDerivedTransferInfo,
  useOnSelectRecipient,
  useOnToggleShowRecipientSelector,
} from './hooks'
import { useTransferTransactionRequest } from './useTransferTransactionRequest'
import { useTransferWarnings } from './useTransferWarnings'

interface TransferFormProps {
  prefilledState?: TransactionState
  onClose: () => void
}

export function TransferFlow({ prefilledState, onClose }: TransferFormProps): JSX.Element {
  const [state, dispatch] = useReducer(transactionStateReducer, prefilledState || emptyState)
  const { t } = useTranslation()
  const onSelectRecipient = useOnSelectRecipient(dispatch)
  const onToggleShowRecipientSelector = useOnToggleShowRecipientSelector(dispatch)
  const derivedTransferInfo = useDerivedTransferInfo(state)
  const { isUSDInput, exactAmountToken, exactAmountUSD } = derivedTransferInfo
  const [step, setStep] = useState<TransactionStep>(TransactionStep.FORM)
  const txRequest = useTransferTransactionRequest(derivedTransferInfo)
  const warnings = useTransferWarnings(t, derivedTransferInfo)
  const gasFeeInfo = useTransactionGasFee(
    txRequest,
    GasSpeed.Urgent,
    // stop polling for gas once transaction is submitted
    step === TransactionStep.SUBMITTED ||
      warnings.some((warning) => warning.action === WarningAction.DisableReview)
  ).data

  const gasFeeUSD = useUSDValue(derivedTransferInfo.chainId, gasFeeInfo?.gasFee)
  const transferTxWithGasSettings = useMemo(() => {
    return gasFeeInfo ? { ...txRequest, ...gasFeeInfo.params } : txRequest
  }, [gasFeeInfo, txRequest])

  const gasWarning = useTransactionGasWarning(derivedTransferInfo, gasFeeInfo?.gasFee)

  const allWarnings = useMemo(() => {
    return !gasWarning ? warnings : [...warnings, gasWarning]
  }, [warnings, gasWarning])

  const { onSelectCurrency, onHideTokenSelector } = useTokenSelectorActionHandlers(
    dispatch,
    TokenSelectorFlow.Transfer
  )

  return (
    <>
      <TransactionFlow
        showUSDToggle
        derivedInfo={derivedTransferInfo}
        dispatch={dispatch}
        exactValue={isUSDInput ? exactAmountUSD : exactAmountToken}
        flowName={t('Send')}
        gasFallbackUsed={false}
        gasFeeUSD={gasFeeUSD}
        isUSDInput={derivedTransferInfo.isUSDInput}
        recipientSelector={
          <RecipientSelect
            recipient={state.recipient}
            onSelectRecipient={onSelectRecipient}
            onToggleShowRecipientSelector={onToggleShowRecipientSelector}
          />
        }
        setStep={setStep}
        showRecipientSelector={state.showRecipientSelector}
        step={step}
        totalGasFee={gasFeeInfo?.gasFee}
        txRequest={transferTxWithGasSettings}
        warnings={allWarnings}
        onClose={onClose}
      />
      {!!state.selectingCurrencyField && (
        <TokenSelectorModal
          currencyField={CurrencyField.INPUT}
          flow={TokenSelectorFlow.Transfer}
          variation={TokenSelectorVariation.BalancesOnly}
          onClose={onHideTokenSelector}
          onSelectCurrency={onSelectCurrency}
        />
      )}
    </>
  )
}
