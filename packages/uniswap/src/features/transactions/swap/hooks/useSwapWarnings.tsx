/* eslint-disable complexity */
import { Percent } from '@uniswap/sdk-core'
import { TFunction } from 'i18next'
import isEqual from 'lodash/isEqual'
import { useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useSelector } from 'react-redux'
import { isWeb } from 'ui/src'
import {
  ParsedWarnings,
  Warning,
  WarningAction,
  WarningLabel,
  WarningSeverity,
} from 'uniswap/src/components/modals/WarningModal/types'
import { uniswapUrls } from 'uniswap/src/constants/urls'
import { useAccountMeta } from 'uniswap/src/contexts/UniswapContext'
import { FetchError, isRateLimitFetchError } from 'uniswap/src/data/apiClients/FetchError'
import { Err404 } from 'uniswap/src/data/tradingApi/__generated__'
import { TradeableAsset } from 'uniswap/src/entities/assets'
import {
  selectHasDismissedBridgingWarning,
  selectHasDismissedLowNetworkTokenWarning,
} from 'uniswap/src/features/behaviorHistory/selectors'
import { CurrencyInfo, TokenList } from 'uniswap/src/features/dataApi/types'
import { useTransactionGasWarning } from 'uniswap/src/features/gas/hooks'
import { LocalizationContextState, useLocalizationContext } from 'uniswap/src/features/language/LocalizationContext'
import { getTokenWarningSeverity } from 'uniswap/src/features/tokens/safetyUtils'
import { useDismissedTokenWarnings } from 'uniswap/src/features/tokens/slice/hooks'
import {
  getNetworkWarning,
  useFormattedWarnings,
} from 'uniswap/src/features/transactions/hooks/useParsedTransactionWarnings'
import { useSwapFormContext } from 'uniswap/src/features/transactions/swap/contexts/SwapFormContext'
import { useSwapTxContext } from 'uniswap/src/features/transactions/swap/contexts/SwapTxContext'
import { formatPriceImpact, getPriceImpact } from 'uniswap/src/features/transactions/swap/hooks/usePriceImpact'
import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'
import { isBridge } from 'uniswap/src/features/transactions/swap/utils/routing'
import { CurrencyField } from 'uniswap/src/types/currency'
import { currencyId } from 'uniswap/src/utils/currencyId'
import { useIsOffline } from 'utilities/src/connection/useIsOffline'
import { isInterface } from 'utilities/src/platform'
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

  // token is blocked
  const isInputTokenBlocked = currencies[CurrencyField.INPUT]?.safetyInfo?.tokenList === TokenList.Blocked
  const isOutputTokenBlocked = currencies[CurrencyField.OUTPUT]?.safetyInfo?.tokenList === TokenList.Blocked
  const inputTokenSymbol = currencies[CurrencyField.INPUT]?.currency.symbol
  const outputTokenSymbol = currencies[CurrencyField.OUTPUT]?.currency.symbol
  const buttonText = t('swap.warning.tokenBlocked.button', {
    tokenSymbol: (isInputTokenBlocked ? inputTokenSymbol : outputTokenSymbol) ?? '',
  })
  if (isInputTokenBlocked || isOutputTokenBlocked) {
    warnings.push({
      type: WarningLabel.BlockedToken,
      severity: WarningSeverity.Blocked,
      action: WarningAction.DisableReview,
      buttonText: !inputTokenSymbol || !outputTokenSymbol ? t('swap.warning.tokenBlockedFallback.button') : buttonText,
    })
  }

  // insufficient balance for swap
  const currencyBalanceIn = currencyBalances[CurrencyField.INPUT]
  const currencyAmountIn = currencyAmounts[CurrencyField.INPUT]
  const swapBalanceInsufficient = currencyAmountIn && currencyBalanceIn?.lessThan(currencyAmountIn)
  const currencySymbol = currencyAmountIn?.currency?.symbol ?? ''

  if (swapBalanceInsufficient) {
    warnings.push({
      type: WarningLabel.InsufficientFunds,
      severity: WarningSeverity.None,
      action: WarningAction.DisableReview,
      title: t('swap.warning.insufficientBalance.title', {
        currencySymbol,
      }),
      buttonText: isWeb
        ? t('common.insufficientTokenBalance.error.simple', {
            tokenSymbol: currencySymbol,
          })
        : undefined,
      currency: currencyAmountIn.currency,
    })
  }

  if (trade.error) {
    warnings.push(getSwapWarningFromError(trade.error, t, derivedSwapInfo))
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
  const priceImpact = getPriceImpact(derivedSwapInfo)
  const priceImpactValue = (priceImpact && formatPriceImpact(priceImpact, formatPercent)) ?? ''
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
            outputCurrencySymbol: currencies[CurrencyField.OUTPUT]?.currency.symbol ?? '',
            inputCurrencySymbol: currencies[CurrencyField.INPUT]?.currency.symbol ?? '',
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

function formIncomplete(derivedSwapInfo: DerivedSwapInfo): boolean {
  const { currencyAmounts, currencies, exactCurrencyField } = derivedSwapInfo

  return (
    !currencies[CurrencyField.INPUT] ||
    !currencies[CurrencyField.OUTPUT] ||
    (exactCurrencyField === CurrencyField.INPUT && !currencyAmounts[CurrencyField.INPUT]) ||
    (exactCurrencyField === CurrencyField.OUTPUT && !currencyAmounts[CurrencyField.OUTPUT])
  )
}

export function useNeedsBridgingWarning(derivedSwapInfo: DerivedSwapInfo): boolean {
  const isBridgeTrade = derivedSwapInfo.trade.trade !== null && isBridge(derivedSwapInfo.trade.trade)
  const hasDismissedBridgingWarning = useSelector(selectHasDismissedBridgingWarning)
  return isBridgeTrade && !hasDismissedBridgingWarning
}

export function useNeedsLowNativeBalanceWarning({
  derivedSwapInfo,
  isMax,
}: {
  derivedSwapInfo: DerivedSwapInfo
  isMax: boolean
}): boolean {
  const needsLowNativeBalanceWarning = isMax && derivedSwapInfo.currencyAmounts[CurrencyField.INPUT]?.currency.isNative
  const hasDismissedLowNetworkTokenWarning = useSelector(selectHasDismissedLowNetworkTokenWarning)
  return !!needsLowNativeBalanceWarning && !hasDismissedLowNetworkTokenWarning
}

/*
 * Display token protection warning modal on swap button click.
 * For **interface use only**, where the swap component might be prefilled with a token that has a protection warning.
 * i.e. via TDP swap component or URL /swap?inputCurrency=0x123
 * In mobile & extension, token protection warnings for prefilled tokens are already surfaced earlier on, on the previous Buy/Sell button click.
 */
export function usePrefilledNeedsTokenProtectionWarning(
  derivedSwapInfo: DerivedSwapInfo,
  prefilledCurrencies?: TradeableAsset[],
): {
  needsTokenProtectionWarning: boolean
  currenciesWithProtectionWarnings: CurrencyInfo[]
} {
  const inputCurrencyInfo = derivedSwapInfo.currencies.input
  const outputCurrencyInfo = derivedSwapInfo.currencies.output

  const { tokenWarningDismissed: inputTokenWarningPreviouslyDismissed } = useDismissedTokenWarnings(
    inputCurrencyInfo?.currency,
  )
  const { tokenWarningDismissed: outputTokenWarningPreviouslyDismissed } = useDismissedTokenWarnings(
    outputCurrencyInfo?.currency,
  )

  const currenciesWithProtectionWarnings: CurrencyInfo[] = useMemo(() => {
    const tokens: CurrencyInfo[] = []

    // We only display protection warnings for prefilled tokens on swap button click, bc users should have already seen warning if picked via token selector
    const inputCurrencyId = inputCurrencyInfo && currencyId(inputCurrencyInfo.currency)
    const outputCurrencyId = outputCurrencyInfo && currencyId(outputCurrencyInfo.currency)
    const isInputPrefilled =
      inputCurrencyId &&
      prefilledCurrencies?.some((currency) => currencyId(currency).toLowerCase() === inputCurrencyId.toLowerCase())
    const isOutputPrefilled =
      outputCurrencyId &&
      prefilledCurrencies?.some((currency) => currencyId(currency).toLowerCase() === outputCurrencyId.toLowerCase())

    if (
      inputCurrencyInfo &&
      !inputTokenWarningPreviouslyDismissed &&
      isInputPrefilled &&
      getTokenWarningSeverity(inputCurrencyInfo) !== WarningSeverity.None
    ) {
      tokens.push(inputCurrencyInfo)
    }
    if (
      outputCurrencyInfo &&
      !outputTokenWarningPreviouslyDismissed &&
      isOutputPrefilled &&
      getTokenWarningSeverity(outputCurrencyInfo) !== WarningSeverity.None
    ) {
      tokens.push(outputCurrencyInfo)
    }
    return tokens
  }, [
    inputCurrencyInfo,
    outputCurrencyInfo,
    prefilledCurrencies,
    inputTokenWarningPreviouslyDismissed,
    outputTokenWarningPreviouslyDismissed,
  ])

  if (!isInterface) {
    return {
      needsTokenProtectionWarning: false,
      currenciesWithProtectionWarnings: [],
    }
  }
  return {
    needsTokenProtectionWarning: currenciesWithProtectionWarnings.length >= 1,
    currenciesWithProtectionWarnings,
  }
}

export function useParsedSwapWarnings(): ParsedWarnings {
  const account = useAccountMeta()
  const { derivedSwapInfo } = useSwapFormContext()
  const { gasFee } = useSwapTxContext()

  const swapWarnings = useSwapWarnings(derivedSwapInfo)

  const gasWarning = useTransactionGasWarning({ account, derivedInfo: derivedSwapInfo, gasFee: gasFee.value })

  const allWarnings = useMemo(() => {
    return !gasWarning ? swapWarnings : [...swapWarnings, gasWarning]
  }, [gasWarning, swapWarnings])

  return useFormattedWarnings(allWarnings)
}

function getSwapWarningFromError(error: Error, t: TFunction, derivedSwapInfo: DerivedSwapInfo): Warning {
  // Trade object is null for quote not found case
  const isBridgeTrade =
    derivedSwapInfo.currencies.input?.currency.chainId !== derivedSwapInfo.currencies.output?.currency.chainId

  if (error instanceof FetchError) {
    // Special case: rate limit errors are not parsed by errorCode
    if (isRateLimitFetchError(error)) {
      return {
        type: WarningLabel.RateLimit,
        severity: WarningSeverity.Medium,
        action: WarningAction.DisableReview,
        title: t('swap.warning.rateLimit.title'),
        message: t('swap.warning.rateLimit.message'),
      }
    }

    // Map errorCode to Warning
    switch (error.data?.errorCode) {
      case Err404.errorCode.QUOTE_AMOUNT_TOO_LOW_ERROR: {
        return {
          type: WarningLabel.EnterLargerAmount,
          severity: WarningSeverity.Low,
          action: WarningAction.DisableReview,
          title: t('swap.warning.enterLargerAmount.title'),
          message: undefined,
        }
      }

      case Err404.errorCode.RESOURCE_NOT_FOUND: {
        if (isBridgeTrade) {
          return {
            type: WarningLabel.NoQuotesFound,
            severity: WarningSeverity.Low,
            action: WarningAction.DisableReview,
            title: t('swap.warning.noQuotesFound.title'),
            message: t('swap.warning.noQuotesFound.bridging.message'),
          }
        }
        return {
          type: WarningLabel.NoRoutesError,
          severity: WarningSeverity.Low,
          action: WarningAction.DisableReview,
          title: t('swap.warning.noRoutesFound.title'),
          message: t('swap.warning.noRoutesFound.message'),
        }
      }
    }
  }

  // Generic routing error if we can't parse a specific case
  return {
    type: WarningLabel.SwapRouterError,
    severity: WarningSeverity.Low,
    action: WarningAction.DisableReview,
    title: t('swap.warning.router.title'),
    message: t('swap.warning.router.message'),
  }
}
