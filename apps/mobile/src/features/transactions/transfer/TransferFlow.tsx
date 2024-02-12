import { providers } from 'ethers'
import React, { useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RecipientSelect } from 'src/components/RecipientSelect/RecipientSelect'
import { useOnSendEmptyActionPress } from 'src/features/transactions/hooks/useOnSendEmptyActionPress'
import { TransactionFlow } from 'src/features/transactions/TransactionFlow'
import {
  TokenSelectorModal,
  TokenSelectorVariation,
} from 'wallet/src/components/TokenSelector/TokenSelector'
import { useTransactionGasFee } from 'wallet/src/features/gas/hooks'
import { GasSpeed } from 'wallet/src/features/gas/types'
import { useTokenSelectorActionHandlers } from 'wallet/src/features/transactions/hooks/useTokenSelectorActionHandlers'
import { useTransactionGasWarning } from 'wallet/src/features/transactions/hooks/useTransactionGasWarning'
import {
  initialState as emptyState,
  transactionStateReducer,
} from 'wallet/src/features/transactions/transactionState/transactionState'
import {
  CurrencyField,
  TransactionState,
} from 'wallet/src/features/transactions/transactionState/types'
import { useDerivedTransferInfo } from 'wallet/src/features/transactions/transfer/hooks/useDerivedTransferInfo'
import { useOnSelectRecipient } from 'wallet/src/features/transactions/transfer/hooks/useOnSelectRecipient'
import { useOnToggleShowRecipientSelector } from 'wallet/src/features/transactions/transfer/hooks/useOnToggleShowRecipientSelector'
import { useTransferTransactionRequest } from 'wallet/src/features/transactions/transfer/hooks/useTransferTransactionRequest'
import { useTransferWarnings } from 'wallet/src/features/transactions/transfer/hooks/useTransferWarnings'
import { TokenSelectorFlow } from 'wallet/src/features/transactions/transfer/types'
import { TransactionStep } from 'wallet/src/features/transactions/types'
import { WarningAction } from 'wallet/src/features/transactions/WarningModal/types'

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
  const onSendEmptyActionPress = useOnSendEmptyActionPress()

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
          onSendEmptyActionPress={onSendEmptyActionPress}
        />
      )}
    </>
  )
}
