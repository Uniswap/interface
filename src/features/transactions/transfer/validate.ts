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

export function getTransferWarnings(state: PartialDerivedTransferInfo) {
  const { currencyBalances, currencyAmounts, currencies, recipient } = state

  const warnings: SwapWarning[] = []

  // insufficient balance
  const currencyBalanceIn = currencyBalances[CurrencyField.INPUT]
  const currencyAmountIn = currencyAmounts[CurrencyField.INPUT]
  if (currencyAmountIn && currencyBalanceIn?.lessThan(currencyAmountIn)) {
    warnings.push({
      name: SwapWarningLabel.InsufficientFunds,
      severity: SwapWarningSeverity.None,
      action: SwapWarningAction.DisableSwapReview,
    })
  }

  // transfer form is missing fields
  if (!currencies[CurrencyField.INPUT] || !recipient) {
    warnings.push({
      name: SwapWarningLabel.FormIncomplete,
      severity: SwapWarningSeverity.None,
      action: SwapWarningAction.DisableSwapReview,
    })
  }

  return warnings
}
