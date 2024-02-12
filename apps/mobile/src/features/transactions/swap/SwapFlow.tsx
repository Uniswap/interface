import React, { useEffect, useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TransactionFlow } from 'src/features/transactions/TransactionFlow'
import {
  TokenSelectorModal,
  TokenSelectorVariation,
} from 'wallet/src/components/TokenSelector/TokenSelector'
import { useSwapWarnings } from 'wallet/src/features/transactions/hooks/useSwapWarnings'
import { useTokenSelectorActionHandlers } from 'wallet/src/features/transactions/hooks/useTokenSelectorActionHandlers'
import { useTransactionGasWarning } from 'wallet/src/features/transactions/hooks/useTransactionGasWarning'
import {
  useDerivedSwapInfo,
  useSwapTxAndGasInfoLegacy,
} from 'wallet/src/features/transactions/swap/hooks'
import {
  initialState as emptyState,
  transactionStateReducer,
} from 'wallet/src/features/transactions/transactionState/transactionState'
import {
  CurrencyField,
  TransactionState,
} from 'wallet/src/features/transactions/transactionState/types'
import { TokenSelectorFlow } from 'wallet/src/features/transactions/transfer/types'
import { TransactionStep } from 'wallet/src/features/transactions/types'
import { WarningAction } from 'wallet/src/features/transactions/WarningModal/types'

interface SwapFormProps {
  prefilledState?: TransactionState
  onClose: () => void
}

function otherCurrencyField(field: CurrencyField): CurrencyField {
  return field === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT
}

export function SwapFlow({ prefilledState, onClose }: SwapFormProps): JSX.Element {
  const { t } = useTranslation()
  const [state, dispatch] = useReducer(transactionStateReducer, prefilledState || emptyState)
  const derivedSwapInfo = useDerivedSwapInfo(state)
  const { onSelectCurrency, onHideTokenSelector } = useTokenSelectorActionHandlers(
    dispatch,
    TokenSelectorFlow.Swap
  )
  const { selectingCurrencyField, currencies } = derivedSwapInfo
  const [step, setStep] = useState<TransactionStep>(TransactionStep.FORM)

  const warnings = useSwapWarnings(t, derivedSwapInfo)

  // Force this legacy swap flow to use the old routing api  logic, as we're planning to remove this, and splitting the code is complex.
  const { txRequest, approveTxRequest, gasFee } = useSwapTxAndGasInfoLegacy({
    derivedSwapInfo,
    skipGasFeeQuery:
      step === TransactionStep.SUBMITTED ||
      warnings.some((warning) => warning.action === WarningAction.DisableReview),
  })

  const gasWarning = useTransactionGasWarning({
    derivedInfo: derivedSwapInfo,
    gasFee: gasFee.value,
  })

  const allWarnings = useMemo(() => {
    return !gasWarning ? warnings : [...warnings, gasWarning]
  }, [warnings, gasWarning])

  // keep currencies list option as state so that rendered list remains stable through the slide animation
  const [listVariation, setListVariation] = useState<
    | TokenSelectorVariation.BalancesAndPopular
    | TokenSelectorVariation.SuggestedAndFavoritesAndPopular
  >(TokenSelectorVariation.BalancesAndPopular)

  useEffect(() => {
    if (selectingCurrencyField) {
      setListVariation(
        selectingCurrencyField === CurrencyField.INPUT
          ? TokenSelectorVariation.BalancesAndPopular
          : TokenSelectorVariation.SuggestedAndFavoritesAndPopular
      )
    }
  }, [selectingCurrencyField])

  const exactValue = state.isFiatInput ? state.exactAmountFiat : state.exactAmountToken

  const otherCurrencyChainId = selectingCurrencyField
    ? currencies[otherCurrencyField(selectingCurrencyField)]?.currency.chainId
    : undefined

  return (
    <>
      <TransactionFlow
        approveTxRequest={approveTxRequest}
        derivedInfo={derivedSwapInfo}
        dispatch={dispatch}
        exactValue={exactValue ?? ''}
        flowName={t('Swap')}
        gasFee={gasFee}
        setStep={setStep}
        step={step}
        txRequest={txRequest}
        warnings={allWarnings}
        onClose={onClose}
      />
      {!!selectingCurrencyField && (
        <TokenSelectorModal
          chainId={otherCurrencyChainId}
          currencyField={selectingCurrencyField}
          flow={TokenSelectorFlow.Swap}
          variation={listVariation}
          onClose={onHideTokenSelector}
          onSelectCurrency={onSelectCurrency}
        />
      )}
    </>
  )
}
