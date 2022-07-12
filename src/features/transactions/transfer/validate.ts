import { TFunction } from 'react-i18next'
import {
  SwapWarning,
  SwapWarningAction,
  SwapWarningLabel,
  SwapWarningSeverity,
} from 'src/features/transactions/swap/validate'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { DerivedTransferInfo } from 'src/features/transactions/transfer/hooks'

type PartialDerivedTransferInfo = Pick<
  DerivedTransferInfo,
  'currencyBalances' | 'currencyAmounts' | 'currencies' | 'recipient'
>

export function getTransferWarnings(t: TFunction, state: PartialDerivedTransferInfo) {
  const { currencyBalances, currencyAmounts, currencies, recipient } = state

  const warnings: SwapWarning[] = []

  // insufficient balance
  const currencyBalanceIn = currencyBalances[CurrencyField.INPUT]
  const currencyAmountIn = currencyAmounts[CurrencyField.INPUT]
  if (currencyAmountIn && currencyBalanceIn?.lessThan(currencyAmountIn)) {
    warnings.push({
      type: SwapWarningLabel.InsufficientFunds,
      severity: SwapWarningSeverity.None,
      action: SwapWarningAction.DisableSwapReview,
      title: t('You don’t have enough {{ symbol }}.', {
        symbol: currencyAmountIn.currency?.symbol,
      }),
    })
  }

  // transfer form is missing fields
  if (!currencies[CurrencyField.INPUT] || !recipient) {
    warnings.push({
      type: SwapWarningLabel.FormIncomplete,
      severity: SwapWarningSeverity.None,
      action: SwapWarningAction.DisableSwapReview,
    })
  }

  return warnings
}
