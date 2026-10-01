import type { CurrencyInfo, SafetyInfo } from 'uniswap/src/features/dataApi/types'
import type { TokenSafetyAnalyticsProperties } from 'uniswap/src/features/telemetry/types'

/** `is_suppressed` stays undefined when the token didn't come through search, so "unknown" has one encoding. */
export function getTokenSafetyAnalytics({
  safetyInfo,
  isSuppressed,
}: {
  safetyInfo?: Maybe<SafetyInfo>
  isSuppressed?: boolean
}): TokenSafetyAnalyticsProperties {
  return { blockaid_status: safetyInfo?.protectionResult, is_suppressed: isSuppressed }
}

/** Per-chain rows carry the suppressed flag on their shared search parent, not on the row itself. */
export function getCurrencyInfoSafetyAnalytics(currencyInfo: CurrencyInfo): TokenSafetyAnalyticsProperties {
  return getTokenSafetyAnalytics({
    safetyInfo: currencyInfo.safetyInfo,
    isSuppressed: currencyInfo.searchMultichainParent?.isSuppressed,
  })
}
