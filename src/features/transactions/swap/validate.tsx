import { CurrencyAmount, NativeCurrency, Percent } from '@uniswap/sdk-core'
import { TFunction } from 'react-i18next'
import { SWAP_NO_ROUTE_ERROR } from 'src/features/routing/routingApi'
import { DerivedSwapInfo } from 'src/features/transactions/swap/hooks'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { hasSufficientFundsIncludingGas } from 'src/features/transactions/utils'
import { Theme } from 'src/styles/theme'
import { formatPriceImpact } from 'src/utils/format'

const PRICE_IMPACT_THRESHOLD_MEDIUM = new Percent(3, 100) // 3%
const PRICE_IMPACT_THRESHOLD_HIGH = new Percent(5, 100) // 5%

export enum SwapWarningLabel {
  InsufficientFunds = 'insufficient_funds',
  InsufficientGasFunds = 'insufficient_gas_funds',
  FormIncomplete = 'form_incomplete',
  UnsupportedNetwork = 'unsupported_network',
  PriceImpactMedium = 'price_impact_medium',
  PriceImpactHigh = 'price_impact_high',
  LowLiquidity = 'low_liquidity',
  SwapRouterError = 'swap_router_error',
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
  | 'currencyBalances'
  | 'currencyAmounts'
  | 'currencies'
  | 'exactCurrencyField'
  | 'trade'
  | 'nativeCurrencyBalance'
> & {
  gasFee?: string
}

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
  const {
    currencyBalances,
    currencyAmounts,
    currencies,
    exactCurrencyField,
    trade,
    nativeCurrencyBalance,
    gasFee,
  } = state

  const warnings: SwapWarning[] = []
  const priceImpact = trade.trade?.priceImpact

  // insufficient balance for swap
  const currencyBalanceIn = currencyBalances[CurrencyField.INPUT]
  const currencyAmountIn = currencyAmounts[CurrencyField.INPUT]
  const swapBalanceInsufficient = currencyAmountIn && currencyBalanceIn?.lessThan(currencyAmountIn)
  if (swapBalanceInsufficient) {
    warnings.push({
      type: SwapWarningLabel.InsufficientFunds,
      severity: SwapWarningSeverity.None,
      action: SwapWarningAction.DisableSwapReview,
      title: t('You don’t have enough {{ symbol }}.', {
        symbol: currencyAmountIn.currency?.symbol,
      }),
    })
  }

  // low liquidity and other swap errors
  if (trade.error) {
    // cast as any here because rtk-query recommends not typing error objects
    // https://github.com/reduxjs/redux-toolkit/issues/1591
    const errorData = trade.error as any
    // assume swaps with no routes available are due to low liquidity
    if (errorData?.data?.errorCode === SWAP_NO_ROUTE_ERROR) {
      warnings.push({
        type: SwapWarningLabel.LowLiquidity,
        severity: SwapWarningSeverity.Medium,
        action: SwapWarningAction.DisableSwapReview,
        title: t('Not enough liquidity'),
        message: t(
          'There isn’t currently enough liquidity available between these tokens to perform a swap. Please try again later or select another token.'
        ),
      })
    } else {
      // catch all other router errors in a generic swap router error message
      warnings.push({
        type: SwapWarningLabel.SwapRouterError,
        severity: SwapWarningSeverity.Medium,
        action: SwapWarningAction.DisableSwapReview,
        title: t('Swap router error'),
        message: t('The Uniswap router is experiencing issues—please try again later.'),
      })
    }
  }

  // insufficient funds for gas
  const nativeAmountIn = currencyAmountIn?.currency.isNative
    ? (currencyAmountIn as CurrencyAmount<NativeCurrency>)
    : undefined
  const hasGasFunds = hasSufficientFundsIncludingGas({
    transactionAmount: nativeAmountIn,
    gasFee,
    nativeCurrencyBalance,
  })
  if (
    // if input balance is already insufficient for swap, don't show balance warning for gas
    !swapBalanceInsufficient &&
    nativeCurrencyBalance &&
    !hasGasFunds
  ) {
    warnings.push({
      type: SwapWarningLabel.InsufficientGasFunds,
      severity: SwapWarningSeverity.Medium,
      action: SwapWarningAction.DisableSwapSubmit,
      title: t('Not enough {{ nativeCurrency }} to pay network fee', {
        nativeCurrency: nativeCurrencyBalance.currency.symbol,
      }),
      message: t('Network fees are paid in the native token. Buy more {{ nativeCurrency }}.', {
        nativeCurrency: nativeCurrencyBalance.currency.symbol,
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
