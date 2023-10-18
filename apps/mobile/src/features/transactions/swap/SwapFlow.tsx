import React, { useEffect, useMemo, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { WarningAction } from 'src/components/modals/WarningModal/types'
import {
  TokenSelectorModal,
  TokenSelectorVariation,
} from 'src/components/TokenSelector/TokenSelector'
import { TokenSelectorFlow } from 'src/components/TokenSelector/types'
import { useTokenSelectorActionHandlers } from 'src/features/transactions/hooks'
import { useDerivedSwapInfo, useSwapTxAndGasInfo } from 'src/features/transactions/swap/hooks'
import { useSwapWarnings } from 'src/features/transactions/swap/useSwapWarnings'
import { TransactionFlow } from 'src/features/transactions/TransactionFlow'
import {
  initialState as emptyState,
  transactionStateReducer,
} from 'src/features/transactions/transactionState/transactionState'
import { TransactionStep } from 'src/features/transactions/types'
import { useTransactionGasWarning } from 'src/features/transactions/useTransactionGasWarning'
import {
  CurrencyField,
  TransactionState,
} from 'wallet/src/features/transactions/transactionState/types'

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
  const { txRequest, approveTxRequest, gasFee } = useSwapTxAndGasInfo({
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
  const [listVariation, setListVariation] = useState<TokenSelectorVariation>(
    TokenSelectorVariation.BalancesAndPopular
  )

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
