import { TFunction } from 'react-i18next'
import {
  Warning,
  WarningAction,
  WarningLabel,
  WarningSeverity,
} from 'src/components/warnings/types'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { DerivedTransferInfo } from 'src/features/transactions/transfer/hooks'

export type PartialDerivedTransferInfo = Pick<
  DerivedTransferInfo,
  'currencyBalances' | 'currencyAmounts' | 'currencies' | 'recipient'
>

export function getTransferWarnings(t: TFunction, state: PartialDerivedTransferInfo) {
  const { currencyBalances, currencyAmounts, currencies, recipient } = state

  const warnings: Warning[] = []

  // insufficient balance
  const currencyBalanceIn = currencyBalances[CurrencyField.INPUT]
  const currencyAmountIn = currencyAmounts[CurrencyField.INPUT]
  if (currencyAmountIn && currencyBalanceIn?.lessThan(currencyAmountIn)) {
    warnings.push({
      type: WarningLabel.InsufficientFunds,
      severity: WarningSeverity.None,
      action: WarningAction.DisableReview,
      title: t('You don’t have enough {{ symbol }}.', {
        symbol: currencyAmountIn.currency?.symbol,
      }),
    })
  }

  // transfer form is missing fields
  if (!currencies[CurrencyField.INPUT] || !recipient || !currencyAmountIn) {
    warnings.push({
      type: WarningLabel.FormIncomplete,
      severity: WarningSeverity.None,
      action: WarningAction.DisableReview,
    })
  }

  return warnings
}
