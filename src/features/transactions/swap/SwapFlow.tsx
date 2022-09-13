import { Currency } from '@uniswap/sdk-core'
import React, { useEffect, useReducer, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { TokenSelector, TokenSelectorVariation } from 'src/components/TokenSelector/TokenSelector'
import { useDerivedSwapInfo, useSwapActionHandlers } from 'src/features/transactions/swap/hooks'
import { TransactionFlow } from 'src/features/transactions/TransactionFlow'
import {
  CurrencyField,
  initialState as emptyState,
  TransactionState,
  transactionStateReducer,
} from 'src/features/transactions/transactionState/transactionState'

interface SwapFormProps {
  prefilledState?: TransactionState
  onClose: () => void
}

function otherCurrencyField(field: CurrencyField): CurrencyField {
  return field === CurrencyField.INPUT ? CurrencyField.OUTPUT : CurrencyField.INPUT
}

export function SwapFlow({ prefilledState, onClose }: SwapFormProps) {
  const { t } = useTranslation()
  const [state, dispatch] = useReducer(transactionStateReducer, prefilledState || emptyState)
  const derivedSwapInfo = useDerivedSwapInfo(state)
  const { onSelectCurrency, onHideTokenSelector } = useSwapActionHandlers(dispatch)
  const { selectingCurrencyField, currencies } = derivedSwapInfo

  // keep currencies list option as state so that rendered list remains stable through the slide animation
  const [listVariation, setListVariation] = useState<TokenSelectorVariation>(
    TokenSelectorVariation.BalancesAndPopular
  )

  useEffect(() => {
    if (selectingCurrencyField) {
      setListVariation(
        selectingCurrencyField === CurrencyField.INPUT
          ? TokenSelectorVariation.BalancesAndPopular
          : TokenSelectorVariation.SuggestedAndPopular
      )
    }
  }, [selectingCurrencyField])

  return (
    <TransactionFlow
      derivedInfo={derivedSwapInfo}
      dispatch={dispatch}
      flowName={t('Swap')}
      showTokenSelector={!!selectingCurrencyField}
      tokenSelector={
        <TokenSelector
          otherCurrency={
            selectingCurrencyField
              ? currencies[otherCurrencyField(selectingCurrencyField)]
              : undefined
          }
          selectedCurrency={selectingCurrencyField ? currencies[selectingCurrencyField] : undefined}
          variation={listVariation}
          onBack={onHideTokenSelector}
          onSelectCurrency={(currency: Currency) =>
            selectingCurrencyField && onSelectCurrency(selectingCurrencyField, currency)
          }
        />
      }
      onClose={onClose}
    />
  )
}
