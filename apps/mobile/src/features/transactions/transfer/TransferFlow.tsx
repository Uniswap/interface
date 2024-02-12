import { providers } from 'ethers'
import React, { useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { WarningAction } from 'src/components/modals/WarningModal/types'
import { RecipientSelect } from 'src/components/RecipientSelect/RecipientSelect'
import {
  TokenSelectorModal,
  TokenSelectorVariation,
} from 'src/components/TokenSelector/TokenSelector'
import { TokenSelectorFlow } from 'src/components/TokenSelector/types'
import { useTokenSelectorActionHandlers } from 'src/features/transactions/hooks'
import { TransactionFlow } from 'src/features/transactions/TransactionFlow'
import {
  initialState as emptyState,
  transactionStateReducer,
} from 'src/features/transactions/transactionState/transactionState'
import { TransactionStep } from 'src/features/transactions/types'
import { useTransactionGasWarning } from 'src/features/transactions/useTransactionGasWarning'
import { useTransactionGasFee } from 'wallet/src/features/gas/hooks'
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
  const { isFiatInput, exactAmountToken, exactAmountFiat } = derivedTransferInfo
  const [step, setStep] = useState<TransactionStep>(TransactionStep.FORM)
  const txRequest = useTransferTransactionRequest(derivedTransferInfo)
  const warnings = useTransferWarnings(t, derivedTransferInfo)
  const gasFee = useTransactionGasFee(
    txRequest,
    GasSpeed.Urgent,
    // stop polling for gas once transaction is submitted
    step === TransactionStep.SUBMITTED ||
      warnings.some((warning) => warning.action === WarningAction.DisableReview)
  )

  const transferTxWithGasSettings = useMemo(
    (): providers.TransactionRequest | undefined =>
      gasFee?.params ? { ...txRequest, ...gasFee.params } : txRequest,
    [gasFee?.params, txRequest]
  )

  const gasWarning = useTransactionGasWarning({
    derivedInfo: derivedTransferInfo,
    gasFee: gasFee?.value,
  })

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
        showFiatToggle
        derivedInfo={derivedTransferInfo}
        dispatch={dispatch}
        exactValue={isFiatInput ? exactAmountFiat : exactAmountToken}
        flowName={t('Send')}
        gasFee={gasFee}
        isFiatInput={derivedTransferInfo.isFiatInput}
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
