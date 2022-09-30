import { Currency } from '@uniswap/sdk-core'
import React, { useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { RecipientSelect } from 'src/components/RecipientSelect/RecipientSelect'
import { TokenSelector, TokenSelectorVariation } from 'src/components/TokenSelector/TokenSelector'
import { useTransactionGasFee } from 'src/features/gas/hooks'
import { GasSpeed } from 'src/features/gas/types'
import { useSwapActionHandlers } from 'src/features/transactions/swap/hooks'
import { TransactionFlow, TransactionStep } from 'src/features/transactions/TransactionFlow'
import {
  CurrencyField,
  initialState as emptyState,
  TransactionState,
  transactionStateReducer,
} from 'src/features/transactions/transactionState/transactionState'
import { useDerivedTransferInfo } from 'src/features/transactions/transfer/hooks'
import { useTransferTransactionRequest } from 'src/features/transactions/transfer/useTransferTransactionRequest'
import {
  createOnSelectRecipient,
  createOnToggleShowRecipientSelector,
} from 'src/features/transactions/transfer/utils'
import { useTransferWarnings } from 'src/features/transactions/transfer/useTransferWarnings'

interface TransferFormProps {
  prefilledState?: TransactionState
  onClose: () => void
}

export function TransferFlow({ prefilledState, onClose }: TransferFormProps) {
  const [state, dispatch] = useReducer(transactionStateReducer, prefilledState || emptyState)
  const { t } = useTranslation()
  const { onSelectCurrency, onHideTokenSelector } = useSwapActionHandlers(dispatch)
  const onSelectRecipient = createOnSelectRecipient(dispatch)
  const onToggleShowRecipientSelector = createOnToggleShowRecipientSelector(dispatch)
  const derivedTransferInfo = useDerivedTransferInfo(state)
  const [step, setStep] = useState<TransactionStep>(TransactionStep.FORM)
  const txRequest = useTransferTransactionRequest(derivedTransferInfo)
  const gasFeeInfo = useTransactionGasFee(
    txRequest,
    GasSpeed.Urgent,
    // stop polling for gas once transaction is submitted
    step === TransactionStep.SUBMITTED
  )
  const transferTxWithGasSettings = useMemo(() => {
    return gasFeeInfo ? { ...txRequest, ...gasFeeInfo.params } : txRequest
  }, [gasFeeInfo, txRequest])
  const warnings = useTransferWarnings(t, derivedTransferInfo)

  return (
    <TransactionFlow
      derivedInfo={derivedTransferInfo}
      dispatch={dispatch}
      flowName={t('Send')}
      recipientSelector={
        <RecipientSelect
          recipient={state.recipient}
          onSelectRecipient={onSelectRecipient}
          onToggleShowRecipientSelector={onToggleShowRecipientSelector}
        />
      }
      setStep={setStep}
      showRecipientSelector={state.showRecipientSelector}
      showTokenSelector={!!state.selectingCurrencyField}
      step={step}
      tokenSelector={
        <TokenSelector
          variation={TokenSelectorVariation.BalancesOnly}
          onBack={onHideTokenSelector}
          onSelectCurrency={(currency: Currency) => onSelectCurrency(CurrencyField.INPUT, currency)}
        />
      }
      totalGasFee={gasFeeInfo?.gasFee}
      txRequest={transferTxWithGasSettings}
      warnings={warnings}
      onClose={onClose}
    />
  )
}
