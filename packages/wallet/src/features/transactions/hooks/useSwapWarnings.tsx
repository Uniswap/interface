import { useNetInfo } from '@react-native-community/netinfo'
import { Percent } from '@uniswap/sdk-core'
import { TFunction } from 'i18next'
import _ from 'lodash'
import { isWeb } from 'ui/src'
import { formatPriceImpact } from 'utilities/src/format/formatPriceImpact'
import { useMemoCompare } from 'utilities/src/react/hooks'
import { getNetworkWarning } from 'wallet/src/features/transactions/WarningModal/getNetworkWarning'
import {
  Warning,
  WarningAction,
  WarningLabel,
  WarningSeverity,
} from 'wallet/src/features/transactions/WarningModal/types'
import {
  API_RATE_LIMIT_ERROR,
  NO_QUOTE_DATA,
  SWAP_QUOTE_ERROR,
} from 'wallet/src/features/transactions/swap/trade/legacy/api'
import { DerivedSwapInfo } from 'wallet/src/features/transactions/swap/types'
import { CurrencyField } from 'wallet/src/features/transactions/transactionState/types'
import { isOffline } from 'wallet/src/features/transactions/utils'

const PRICE_IMPACT_THRESHOLD_MEDIUM = new Percent(3, 100) // 3%
const PRICE_IMPACT_THRESHOLD_HIGH = new Percent(5, 100) // 5%

export function getSwapWarnings(
  t: TFunction,
  derivedSwapInfo: DerivedSwapInfo,
  offline: boolean
): Warning[] {
  const warnings: Warning[] = []

  if (offline) {
    warnings.push(getNetworkWarning(t))
  }

  const { currencyBalances, currencyAmounts, currencies, trade } = derivedSwapInfo

  // insufficient balance for swap
  const currencyBalanceIn = currencyBalances[CurrencyField.INPUT]
  const currencyAmountIn = currencyAmounts[CurrencyField.INPUT]
  const swapBalanceInsufficient = currencyAmountIn && currencyBalanceIn?.lessThan(currencyAmountIn)
  if (swapBalanceInsufficient) {
    warnings.push({
      type: WarningLabel.InsufficientFunds,
      severity: WarningSeverity.None,
      action: WarningAction.DisableReview,
      title: t('swap.warning.insufficientBalance.title', {
        currencySymbol: currencyAmountIn.currency?.symbol,
      }),
      buttonText: isWeb
        ? t('swap.warning.insufficientBalance.button', {
            currencySymbol: currencyAmountIn.currency?.symbol,
          })
        : undefined,
      currency: currencyAmountIn.currency,
    })
  }

  // low liquidity and other swap errors
  if (trade.error) {
    // cast as any here because rtk-query recommends not typing error objects
    // https://github.com/reduxjs/redux-toolkit/issues/1591
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorData = trade.error as any

    if (errorData?.data?.errorCode === SWAP_QUOTE_ERROR || errorData?.message === NO_QUOTE_DATA) {
      warnings.push({
        type: WarningLabel.LowLiquidity,
        severity: WarningSeverity.Medium,
        action: WarningAction.DisableReview,
        title: t('swap.warning.lowLiquidity.title'),
        message: t('swap.warning.lowLiquidity.message'),
      })
    } else if (errorData?.data?.errorCode === API_RATE_LIMIT_ERROR) {
      warnings.push({
        type: WarningLabel.RateLimit,
        severity: WarningSeverity.Medium,
        action: WarningAction.DisableReview,
        title: t('swap.warning.rateLimit.title'),
        message: t('swap.warning.rateLimit.message'),
      })
    } else {
      // catch all other router errors in a generic swap router error message
      warnings.push({
        type: WarningLabel.SwapRouterError,
        severity: WarningSeverity.Medium,
        action: WarningAction.DisableReview,
        title: t('swap.warning.router.title'),
        message: t('swap.warning.router.message'),
      })
    }
  }

  // swap form is missing input, output fields
  if (formIncomplete(derivedSwapInfo)) {
    warnings.push({
      type: WarningLabel.FormIncomplete,
      severity: WarningSeverity.None,
      action: WarningAction.DisableReview,
    })
  }

  // price impact warning
  const priceImpact = trade.trade?.priceImpact
  if (priceImpact?.greaterThan(PRICE_IMPACT_THRESHOLD_MEDIUM)) {
    const highImpact = !priceImpact.lessThan(PRICE_IMPACT_THRESHOLD_HIGH)
    warnings.push({
      type: highImpact ? WarningLabel.PriceImpactHigh : WarningLabel.PriceImpactMedium,
      severity: highImpact ? WarningSeverity.High : WarningSeverity.Medium,
      action: WarningAction.WarnBeforeSubmit,
      title: t('swap.warning.priceImpact.title', {
        priceImpactValue: formatPriceImpact(priceImpact),
      }),
      message: t('swap.warning.priceImpact.message', {
        outputCurrencySymbol: currencies[CurrencyField.INPUT]?.currency.symbol,
        inputCurrencySymbol: currencies[CurrencyField.OUTPUT]?.currency.symbol,
      }),
    })
  }

  return warnings
}

export function useSwapWarnings(t: TFunction, derivedSwapInfo: DerivedSwapInfo): Warning[] {
  const networkStatus = useNetInfo()
  // First `useNetInfo` call always results with unknown state,
  // which we want to ignore here until state is determined,
  // otherwise it leads to immediate re-renders of views dependent on useTransferWarnings.
  //
  // See for more here: https://github.com/react-native-netinfo/react-native-netinfo/pull/444
  const offline = isOffline(networkStatus)

  return useMemoCompare(() => getSwapWarnings(t, derivedSwapInfo, offline), _.isEqual)
}

const formIncomplete = (derivedSwapInfo: DerivedSwapInfo): boolean => {
  const { currencyAmounts, currencies, exactCurrencyField } = derivedSwapInfo

  if (
    !currencies[CurrencyField.INPUT] ||
    !currencies[CurrencyField.OUTPUT] ||
    (exactCurrencyField === CurrencyField.INPUT && !currencyAmounts[CurrencyField.INPUT]) ||
    (exactCurrencyField === CurrencyField.OUTPUT && !currencyAmounts[CurrencyField.OUTPUT])
  ) {
    return true
  }

  return false
}

export function isPriceImpactWarning(warning: Warning): boolean {
  return (
    warning.type === WarningLabel.PriceImpactMedium || warning.type === WarningLabel.PriceImpactHigh
  )
}
