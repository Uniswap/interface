import { FetchError, isRateLimitFetchError, TradingApi } from '@universe/api'
import { TFunction } from 'i18next'
import { Warning, WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'

import { DerivedSwapInfo } from 'uniswap/src/features/transactions/swap/types/derivedSwapInfo'

export function getSwapWarningFromError({
  error,
  t,
  derivedSwapInfo,
}: {
  error: Error
  t: TFunction
  derivedSwapInfo: DerivedSwapInfo
}): Warning {
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
      case TradingApi.Err404.errorCode.QUOTE_AMOUNT_TOO_LOW_ERROR: {
        return {
          type: WarningLabel.EnterLargerAmount,
          severity: WarningSeverity.Low,
          action: WarningAction.DisableReview,
          title: t('swap.warning.enterLargerAmount.title'),
          message: undefined,
        }
      }

      case TradingApi.Err404.errorCode.RESOURCE_NOT_FOUND: {
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
