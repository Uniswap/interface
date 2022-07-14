import { Percent } from '@uniswap/sdk-core'
import { TFunction } from 'react-i18next'
import { DerivedSwapInfo } from 'src/features/transactions/swap/hooks'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { Theme } from 'src/styles/theme'
import { formatPriceImpact } from 'src/utils/format'

const PRICE_IMPACT_THRESHOLD_MEDIUM = new Percent(3, 100) // 3%
const PRICE_IMPACT_THRESHOLD_HIGH = new Percent(5, 100) // 5%

export enum SwapWarningLabel {
  InsufficientFunds = 'insufficient_funds',
  FormIncomplete = 'form_incomplete',
  UnsupportedNetwork = 'unsupported_network',
  PriceImpactMedium = 'price_impact_medium',
  PriceImpactHigh = 'price_impact_high',
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
  'currencyBalances' | 'currencyAmounts' | 'currencies' | 'exactCurrencyField' | 'trade'
>

export function showWarningInPanel(warning: SwapWarning) {
  return (
    warning.severity === SwapWarningSeverity.Medium || warning.severity === SwapWarningSeverity.High
  )
}

type SwapWarningColor = {
  text: keyof Theme['colors']
  background: keyof Theme['colors']
}

export function getSwapWarningColor(warning?: SwapWarning): SwapWarningColor {
  if (!warning) return { text: 'none', background: 'none' }

  switch (warning.severity) {
    case SwapWarningSeverity.High:
      return { text: 'accentFailure', background: 'accentFailureSoft' }
    case SwapWarningSeverity.Medium:
      return { text: 'accentWarning', background: 'accentWarningSoft' }
    default:
      return { text: 'none', background: 'none' }
  }
}

// TODO: add swap warnings for: price impact, router errors, insufficient gas funds, low liquidity
export function getSwapWarnings(t: TFunction, state: PartialDerivedSwapInfo) {
  const { currencyBalances, currencyAmounts, currencies, exactCurrencyField, trade } = state

  const warnings: SwapWarning[] = []
  const priceImpact = trade.trade?.priceImpact

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

  if (
    priceImpact?.greaterThan(PRICE_IMPACT_THRESHOLD_MEDIUM) &&
    priceImpact?.lessThan(PRICE_IMPACT_THRESHOLD_HIGH)
  ) {
    warnings.push({
      type: SwapWarningLabel.PriceImpactMedium,
      severity: SwapWarningSeverity.Medium,
      action: SwapWarningAction.WarnBeforeSwapSubmit,
      title: t('Rate impacted by swap size ({{ swapSize }})', {
        swapSize: formatPriceImpact(priceImpact),
      }),
      message: t(
        'Due to the amount of {{ currencyOut }} liquidity currently available, the more {{ currencyIn }} you try to swap, the less {{ currencyOut }} you will receive.',
        {
          currencyIn: currencies[CurrencyField.INPUT]?.symbol,
          currencyOut: currencies[CurrencyField.OUTPUT]?.symbol,
        }
      ),
    })
  }

  // price impact >= high threshold
  if (priceImpact && !priceImpact.lessThan(PRICE_IMPACT_THRESHOLD_HIGH)) {
    warnings.push({
      type: SwapWarningLabel.PriceImpactHigh,
      severity: SwapWarningSeverity.High,
      action: SwapWarningAction.WarnBeforeSwapSubmit,
      title: t('Rate impacted by swap size ({{ swapSize }})', {
        swapSize: formatPriceImpact(priceImpact),
      }),
      message: t(
        'Due to the amount of {{ currencyOut }} liquidity currently available, the more {{ currencyIn }} you try to swap, the less {{ currencyOut }} you will receive.',
        {
          currencyIn: currencies[CurrencyField.INPUT]?.symbol,
          currencyOut: currencies[CurrencyField.OUTPUT]?.symbol,
        }
      ),
    })
  }

  return warnings
}
