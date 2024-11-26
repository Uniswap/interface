import { Currency, TradeType } from '@uniswap/sdk-core'
import { TFunction } from 'i18next'
import { Warning, WarningAction, WarningLabel, WarningSeverity } from 'uniswap/src/components/modals/WarningModal/types'
import { FetchError, isRateLimitFetchError } from 'uniswap/src/data/apiClients/FetchError'
import { Err404 } from 'uniswap/src/data/tradingApi/__generated__'
import { NoRoutesError, SWAP_QUOTE_ERROR } from 'uniswap/src/features/transactions/swap/hooks/useTrade'
import { Trade, TradeWithStatus } from 'uniswap/src/features/transactions/swap/types/trade'

export const getSwapWarningDetails = (
  trade: TradeWithStatus<Trade<Currency, Currency, TradeType>>,
  t: TFunction,
): Warning[] => {
  const warnings: Warning[] = []
  const { error } = trade

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
    } else if (error instanceof FetchError && error?.data?.errorCode === Err404.errorCode.RESOURCE_NOT_FOUND) {
      warnings.push({
        type: WarningLabel.EnterLargerAmount,
        severity: WarningSeverity.Low,
        action: WarningAction.DisableReview,
        title: t('swap.warning.noRoutesFound.title'),
        message: t('swap.warning.noRoutesFound.message'),
      })
    } else {
      warnings.push({
        type: WarningLabel.SwapRouterError,
        severity: WarningSeverity.Low,
        action: WarningAction.DisableReview,
        title: t('swap.warning.router.title'),
        message: t('swap.warning.router.message'),
      })
    }
  }

  return warnings
}
