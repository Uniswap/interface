import { Percent } from '@uniswap/sdk-core'
import { TFunction } from 'i18next'
import isEqual from 'lodash/isEqual'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { isWeb } from 'ui/src'
import { Warning, WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { FetchError, isRateLimitFetchError } from 'uniswap/src/data/apiClients/FetchError'
import { Err404 } from 'uniswap/src/data/tradingApi/__generated__'
import { selectHasDismissedBridgingWarning } from 'uniswap/src/features/behaviorHistory/selectors'
import { useTransactionGasWarning } from 'uniswap/src/features/gas/hooks'
import { LocalizationContextState, useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import {
  getNetworkWarning,
  useFormattedWarnings,
} from 'uniswap/src/features/transactions/hooks/useParsedTransactionWarnings'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useSwapTxContext } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import { NoRoutesError, SWAP_QUOTE_ERROR } from 'uniswap/src/features/transactions/swap/hooks/useTrade'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { isBridge } from 'uniswap/src/features/transactions/swap/utils/routing'
import { ParsedWarnings } from 'uniswap/src/features/transactions/types/transactionDetails'
import { CurrencyField } from 'uniswap/src/types/currency'
import { useIsOffline } from 'utilities/src/connection/useIsOffline'
import { normalizePriceImpact } from 'utilities/src/format/normalizePriceImpact'
import { useMemoCompare } from 'utilities/src/react/hooks'

const PRICE_IMPACT_THRESHOLD_MEDIUM = new Percent(3, 100) // 3%
const PRICE_IMPACT_THRESHOLD_HIGH = new Percent(5, 100) // 5%

export function getSwapWarnings(
  t: TFunction,
  formatPercent: LocalizationContextState['formatPercent'],
  derivedSwapInfo: DerivedSwapInfo,
  offline: boolean,
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
        ? t('common.insufficientTokenBalance.error.simple', {
            tokenSymbol: currencyAmountIn.currency?.symbol,
          })
        : undefined,
      currency: currencyAmountIn.currency,
    })
  }

  const { error } = trade

  // low liquidity and other swap errors
  if (error) {
    if (
      error instanceof NoRoutesError ||
      (error instanceof FetchError && error?.data?.errorCode === SWAP_QUOTE_ERROR)
    ) {
      warnings.push({
        type: WarningLabel.LowLiquidity,
        severity: WarningSeverity.Medium,
        action: WarningAction.DisableReview,
        title: t('swap.warning.lowLiquidity.title'),
        message: t('swap.warning.lowLiquidity.message'),
      })
    } else if (isRateLimitFetchError(error)) {
      warnings.push({
        type: WarningLabel.RateLimit,
        severity: WarningSeverity.Medium,
        action: WarningAction.DisableReview,
        title: t('swap.warning.rateLimit.title'),
        message: t('swap.warning.rateLimit.message'),
      })
    } else if (error instanceof FetchError && error?.data?.errorCode === Err404.errorCode.QUOTE_AMOUNT_TOO_LOW_ERROR) {
      warnings.push({
        type: WarningLabel.EnterLargerAmount,
        severity: WarningSeverity.Low,
        action: WarningAction.DisableReview,
        title: t('swap.warning.enterLargerAmount.title'),
        message: '',
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
  const priceImpactValue = priceImpact ? formatPercent(normalizePriceImpact(priceImpact)) : undefined
  if (priceImpact?.greaterThan(PRICE_IMPACT_THRESHOLD_MEDIUM)) {
    const highImpact = !priceImpact.lessThan(PRICE_IMPACT_THRESHOLD_HIGH)
    warnings.push({
      type: highImpact ? WarningLabel.PriceImpactHigh : WarningLabel.PriceImpactMedium,
      severity: highImpact ? WarningSeverity.High : WarningSeverity.Medium,
      action: WarningAction.WarnBeforeSubmit,
      title: highImpact
        ? t('swap.warning.priceImpact.title.veryHigh', {
            priceImpactValue,
          })
        : t('swap.warning.priceImpact.title', {
            priceImpactValue,
          }),
      message: highImpact
        ? t('swap.warning.priceImpact.message.veryHigh', { priceImpactValue })
        : t('swap.warning.priceImpact.message', {
            outputCurrencySymbol: currencies[CurrencyField.OUTPUT]?.currency.symbol,
            inputCurrencySymbol: currencies[CurrencyField.INPUT]?.currency.symbol,
          }),
      link: uniswapUrls.helpArticleUrls.priceImpact,
    })
  }

  return warnings
}

function useSwapWarnings(derivedSwapInfo: DerivedSwapInfo): Warning[] {
  const { t } = useTranslation()
  const { formatPercent } = useLocalizationContext()
  const offline = useIsOffline()

  return useMemoCompare(() => getSwapWarnings(t, formatPercent, derivedSwapInfo, offline), isEqual)
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

export function useNeedsBridgingWarning(derivedSwapInfo: DerivedSwapInfo): boolean {
  const isBridgeTrade = derivedSwapInfo.trade.trade !== null && isBridge(derivedSwapInfo.trade.trade)
  const hasDismissedBridgingWarning = useSelector(selectHasDismissedBridgingWarning)
  return isBridgeTrade && !hasDismissedBridgingWarning
}

export function useParsedSwapWarnings(): ParsedWarnings {
  const account = useAccountMeta()
  const { derivedSwapInfo } = useSwapFormContext()
  const { gasFee } = useSwapTxContext()

  const swapWarnings = useSwapWarnings(derivedSwapInfo)

  const gasWarning = useTransactionGasWarning({
    account,
    derivedInfo: derivedSwapInfo,
    gasFee: gasFee.value,
  })

  const allWarnings = useMemo(() => {
    return !gasWarning ? swapWarnings : [...swapWarnings, gasWarning]
  }, [gasWarning, swapWarnings])

  return useFormattedWarnings(allWarnings)
}
