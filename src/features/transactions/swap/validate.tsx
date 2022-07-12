import { TFunction } from 'react-i18next'
import { DerivedSwapInfo } from 'src/features/transactions/swap/hooks'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'

export enum SwapWarningLabel {
  InsufficientFunds = 'insufficient_funds',
  FormIncomplete = 'form_incomplete',
  UnsupportedNetwork = 'unsupported_network',
}

export enum SwapWarningSeverity {
  None = 'none',
  Medium = 'medium',
  High = 'high',
}

export enum SwapWarningAction {
  None = 'none',

  // prevents users from continuing to the review screen
  DisableSwapReview = 'disable_swap_review',

  // allows users to continue to review screen, but requires them to
  // acknowledge a popup warning before submitting
  WarnBeforeSwapSubmit = 'warn_before_swap_submit',

  // prevents submission altogether
  DisableSwapSubmit = 'disable_swap_submit',
}

export type SwapWarning = {
  type: SwapWarningLabel
  severity: SwapWarningSeverity
  action: SwapWarningAction
  title?: string
  message?: string
}

export type PartialDerivedSwapInfo = Pick<
  DerivedSwapInfo,
  'currencyBalances' | 'currencyAmounts' | 'currencies' | 'exactCurrencyField'
>

// TODO: add swap warnings for: price impact, router errors, insufficient gas funds, low liquidity
export function getSwapWarnings(t: TFunction, state: PartialDerivedSwapInfo) {
  const { currencyBalances, currencyAmounts, currencies, exactCurrencyField } = state

  const warnings: SwapWarning[] = []

  // insufficient balance for swap
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

  // swap form is missing input, output fields
  if (
    !currencies[CurrencyField.INPUT] ||
    !currencies[CurrencyField.OUTPUT] ||
    (exactCurrencyField === CurrencyField.INPUT && !currencyAmounts[CurrencyField.INPUT]) ||
    (exactCurrencyField === CurrencyField.OUTPUT && !currencyAmounts[CurrencyField.OUTPUT])
  ) {
    warnings.push({
      type: SwapWarningLabel.FormIncomplete,
      severity: SwapWarningSeverity.None,
      action: SwapWarningAction.DisableSwapReview,
    })
  }

  return warnings
}
