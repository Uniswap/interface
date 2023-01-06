import { NetInfoState, useNetInfo } from '@react-native-community/netinfo'
import { Percent } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { TFunction } from 'react-i18next'
import { useAppTheme } from 'src/app/hooks'
import Eye from 'src/assets/icons/eye.svg'
import { getNetworkWarning } from 'src/components/modals/WarningModal/constants'
import {
  Warning,
  WarningAction,
  WarningLabel,
  WarningSeverity,
} from 'src/components/modals/WarningModal/types'
import { API_RATE_LIMIT_ERROR, SWAP_NO_ROUTE_ERROR } from 'src/features/routing/routingApi'
import { DerivedSwapInfo } from 'src/features/transactions/swap/hooks'
import { CurrencyField } from 'src/features/transactions/transactionState/transactionState'
import { Account, AccountType } from 'src/features/wallet/accounts/types'
import { Theme } from 'src/styles/theme'
import { formatPriceImpact } from 'src/utils/format'

const PRICE_IMPACT_THRESHOLD_MEDIUM = new Percent(3, 100) // 3%
const PRICE_IMPACT_THRESHOLD_HIGH = new Percent(5, 100) // 5%

export function getSwapWarnings(
  t: TFunction,
  theme: Theme,
  account: Account,
  derivedSwapInfo: DerivedSwapInfo,
  networkStatus: NetInfoState
) {
  const warnings: Warning[] = []
  if (!networkStatus.isConnected) {
    warnings.push(getNetworkWarning(t))
  }

  const { currencyBalances, currencyAmounts, currencies, trade } = derivedSwapInfo

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
      title: t('Not enough {{ symbol }}.', {
        symbol: currencyAmountIn.currency?.symbol,
      }),
    })
  }

  // low liquidity and other swap errors
  if (trade.error) {
    // cast as any here because rtk-query recommends not typing error objects
    // https://github.com/reduxjs/redux-toolkit/issues/1591
    // eslint-disable-next-line @typescript-eslint/no-explicit-any
    const errorData = trade.error as any
    // assume swaps with no routes available are due to low liquidity
    if (errorData?.data?.errorCode === SWAP_NO_ROUTE_ERROR) {
      warnings.push({
        type: WarningLabel.LowLiquidity,
        severity: WarningSeverity.Medium,
        action: WarningAction.DisableReview,
        title: t('Not enough liquidity'),
        message: t(
          'There isn’t currently enough liquidity available between these tokens to perform a swap. Please try again later or select another token.'
        ),
      })
    } else if (errorData?.data?.errorCode === API_RATE_LIMIT_ERROR) {
      warnings.push({
        type: WarningLabel.RateLimit,
        severity: WarningSeverity.Medium,
        action: WarningAction.DisableReview,
        title: t('Rate limit exceeded'),
        message: t('Please try again in a few minutes.'),
      })
    } else {
      // catch all other router errors in a generic swap router error message
      warnings.push({
        type: WarningLabel.SwapRouterError,
        severity: WarningSeverity.Medium,
        action: WarningAction.DisableReview,
        title: t('This trade cannot be completed right now'),
        message: t(
          'You may have lost connection or the network may be down. If the problem persists, please try again later.'
        ),
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
  if (priceImpact?.greaterThan(PRICE_IMPACT_THRESHOLD_MEDIUM)) {
    const highImpact = !priceImpact.lessThan(PRICE_IMPACT_THRESHOLD_HIGH)
    warnings.push({
      type: highImpact ? WarningLabel.PriceImpactHigh : WarningLabel.PriceImpactMedium,
      severity: highImpact ? WarningSeverity.High : WarningSeverity.Medium,
      action: WarningAction.WarnBeforeSubmit,
      title: t('Rate impacted by swap size ({{ swapSize }})', {
        swapSize: formatPriceImpact(priceImpact),
      }),
      message: t(
        'Due to the amount of {{ currencyOut }} liquidity currently available, the more {{ currencyIn }} you try to swap, the less {{ currencyOut }} you will receive.',
        {
          currencyIn: currencies[CurrencyField.INPUT]?.currency.symbol,
          currencyOut: currencies[CurrencyField.OUTPUT]?.currency.symbol,
        }
      ),
    })
  }

  if (account?.type === AccountType.Readonly) {
    warnings.push({
      type: WarningLabel.ViewOnlyAccount,
      severity: WarningSeverity.Low,
      action: WarningAction.DisableSubmit,
      title: t('This wallet is view-only'),
      message: t('You need to import this wallet via recovery phrase to swap tokens.'),
      icon: Eye,
    })
  }

  return warnings
}

export function useSwapWarnings(t: TFunction, account: Account, derivedSwapInfo: DerivedSwapInfo) {
  const networkStatus = useNetInfo()
  const theme = useAppTheme()
  return useMemo(() => {
    return getSwapWarnings(t, theme, account, derivedSwapInfo, networkStatus)
  }, [account, derivedSwapInfo, t, networkStatus, theme])
}

const formIncomplete = (derivedSwapInfo: DerivedSwapInfo) => {
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

export function isPriceImpactWarning(warning: Warning) {
  return (
    warning.type === WarningLabel.PriceImpactMedium || warning.type === WarningLabel.PriceImpactHigh
  )
}
