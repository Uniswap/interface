import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

interface ReportBalancesParams {
  balances: number[]
  totalBalancesUsd?: number
  totalBalancesUsdPerChain?: Record<string, number>
  wallet?: string
  wallets: string[]
  isViewOnly?: boolean
}

/**
 * Validates that all required data is present for balance reporting
 */
export function hasRequiredDataForBalancesReport(params: {
  totalBalancesUsd?: number
  totalBalancesUsdPerChain?: Record<string, number>
  wallets: string[]
  wallet?: string
}): params is {
  totalBalancesUsd: number
  totalBalancesUsdPerChain: Record<string, number>
  wallets: string[]
  wallet: string
} {
  return (
    params.totalBalancesUsd !== undefined &&
    params.totalBalancesUsdPerChain !== undefined &&
    params.wallets.length > 0 &&
    !!params.wallet
  )
}

export function reportBalancesForAnalytics({
  balances,
  totalBalancesUsd,
  totalBalancesUsdPerChain,
  wallet,
  wallets,
  isViewOnly = false,
}: ReportBalancesParams): void {
  // Note: We should still log zero balances, but we should skip if there's no wallet or balance values
  const requiredData = { totalBalancesUsd, totalBalancesUsdPerChain, wallets, wallet }
  if (!hasRequiredDataForBalancesReport(requiredData)) {
    return
  }

  sendAnalyticsEvent(UniswapEventName.BalancesReport, {
    total_balances_usd: requiredData.totalBalancesUsd,
    wallets,
    balances,
  })

  sendAnalyticsEvent(UniswapEventName.BalancesReportPerChain, {
    total_balances_usd_per_chain: requiredData.totalBalancesUsdPerChain,
    wallet: requiredData.wallet,
    view_only: isViewOnly,
  })
}
