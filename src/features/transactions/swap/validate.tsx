import { CurrencyAmount, NativeCurrency, Percent } from '@uniswap/sdk-core'
import { TFunction } from 'react-i18next'
import {
  Warning,
  WarningAction,
  WarningLabel,
  WarningSeverity,
} from 'src/components/warnings/types'
import { SWAP_NO_ROUTE_ERROR } from 'src/features/routing/routingApi'
import { DerivedSwapInfo } from 'src/features/transactions/swap/hooks'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { hasSufficientFundsIncludingGas } from 'src/features/transactions/utils'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { formatPriceImpact } from 'src/utils/format'

const PRICE_IMPACT_THRESHOLD_MEDIUM = new Percent(3, 100) // 3%
const PRICE_IMPACT_THRESHOLD_HIGH = new Percent(5, 100) // 5%

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
  account?: Account
}

export function showWarningInPanel(warning: Warning) {
  // this will return true for WarningSeverity.Medium and WarningSeverity.High
  return warning.severity >= WarningSeverity.Medium
}

export function getSwapWarnings(t: TFunction, state: PartialDerivedSwapInfo) {
  const {
    account,
    currencyBalances,
    currencyAmounts,
    currencies,
    exactCurrencyField,
    trade,
    nativeCurrencyBalance,
    gasFee,
  } = state

  const warnings: Warning[] = []
  const priceImpact = trade.trade?.priceImpact

  // insufficient balance for swap
  const currencyBalanceIn = currencyBalances[CurrencyField.INPUT]
  const currencyAmountIn = currencyAmounts[CurrencyField.INPUT]
  const swapBalanceInsufficient = currencyAmountIn && currencyBalanceIn?.lessThan(currencyAmountIn)
  if (swapBalanceInsufficient) {
    warnings.push({
      type: WarningLabel.InsufficientFunds,
      severity: WarningSeverity.None,
      action: WarningAction.DisableReview,
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
      const currencyOut = currencies[CurrencyField.OUTPUT]
      warnings.push({
        type: WarningLabel.LowLiquidity,
        severity: WarningSeverity.Medium,
        action: WarningAction.DisableReview,
        title: t('Not enough {{ tokenOut }} liquidity', {
          tokenOut: currencyOut?.symbol,
        }),
        message: t(
          'There isn’t currently enough liquidity available between these tokens to perform a swap. Please try again later or select another token.'
        ),
      })
    } else {
      // catch all other router errors in a generic swap router error message
      warnings.push({
        type: WarningLabel.SwapRouterError,
        severity: WarningSeverity.Medium,
        action: WarningAction.DisableReview,
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
      type: WarningLabel.InsufficientGasFunds,
      severity: WarningSeverity.Medium,
      action: WarningAction.DisableSubmit,
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
      type: WarningLabel.FormIncomplete,
      severity: WarningSeverity.None,
      action: WarningAction.DisableReview,
    })
  }

  if (
    priceImpact?.greaterThan(PRICE_IMPACT_THRESHOLD_MEDIUM) &&
    priceImpact?.lessThan(PRICE_IMPACT_THRESHOLD_HIGH)
  ) {
    warnings.push({
      type: WarningLabel.PriceImpactMedium,
      severity: WarningSeverity.Medium,
      action: WarningAction.WarnBeforeSubmit,
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
      type: WarningLabel.PriceImpactHigh,
      severity: WarningSeverity.High,
      action: WarningAction.WarnBeforeSubmit,
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

  if (account?.type === AccountType.Readonly) {
    warnings.push({
      type: WarningLabel.ViewOnlyAccount,
      severity: WarningSeverity.Medium,
      action: WarningAction.DisableSubmit,
      title: t('This wallet is view-only'),
      message: t('You need to import this wallet via recovery phrase to swap tokens.'),
    })
  }

  return warnings
}
