import { FetchError } from '@universe/api'
import type { AppTFunction } from 'ui/src/i18n/types'
import { isEarnNoRoutesQuoteError } from 'uniswap/src/features/earn/quoteError'

export enum EarnTradingApiErrorDetail {
  InsufficientRedeemableBalance = 'EARN_INSUFFICIENT_REDEEMABLE_BALANCE',
  InsufficientVaultLiquidity = 'EARN_INSUFFICIENT_VAULT_LIQUIDITY',
  ZeroRedeemableShares = 'EARN_ZERO_REDEEMABLE_SHARES',
}

export function getEarnTradingApiErrorDetail(error: unknown): EarnTradingApiErrorDetail | undefined {
  const details = getErrorDetails(error)

  if (details.includes(EarnTradingApiErrorDetail.InsufficientVaultLiquidity)) {
    return EarnTradingApiErrorDetail.InsufficientVaultLiquidity
  }
  if (details.includes(EarnTradingApiErrorDetail.InsufficientRedeemableBalance)) {
    return EarnTradingApiErrorDetail.InsufficientRedeemableBalance
  }
  if (details.includes(EarnTradingApiErrorDetail.ZeroRedeemableShares)) {
    return EarnTradingApiErrorDetail.ZeroRedeemableShares
  }
  return undefined
}

export function getEarnWithdrawErrorMessage({ error, t }: { error: unknown; t: AppTFunction }): string {
  switch (getEarnTradingApiErrorDetail(error)) {
    case EarnTradingApiErrorDetail.InsufficientVaultLiquidity:
      return t('explore.earn.withdraw.lowLiquidity.quoteError')
    case EarnTradingApiErrorDetail.InsufficientRedeemableBalance:
      return t('explore.earn.deposit.insufficientBalance')
    case EarnTradingApiErrorDetail.ZeroRedeemableShares:
      return t('explore.earn.withdraw.noRedeemableShares')
    default:
      if (isEarnNoRoutesQuoteError(error)) {
        return t('explore.earn.withdraw.noRoutes')
      }
      return t('explore.earn.review.quoteError')
  }
}

function getErrorDetails(error: unknown): string[] {
  const details = new Set<string>()
  let current: unknown = error

  while (current) {
    if (current instanceof FetchError) {
      addErrorDataDetails(details, current.data)
    }
    if (current instanceof Error) {
      details.add(current.message)
      current = current.cause
      continue
    }
    addErrorDataDetails(details, current)
    break
  }

  return [...details]
}

function addErrorDataDetails(details: Set<string>, data: unknown): void {
  if (!data || typeof data !== 'object') {
    return
  }
  const maybeData = data as { detail?: unknown; errorCode?: unknown; message?: unknown }
  for (const value of [maybeData.detail, maybeData.errorCode, maybeData.message]) {
    if (typeof value === 'string') {
      details.add(value)
    }
  }
}
