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

export function reportBalancesForAnalytics({
  balances,
  totalBalancesUsd,
  totalBalancesUsdPerChain,
  wallet,
  wallets,
  isViewOnly = false,
}: ReportBalancesParams): void {
  // Note: We should still log zero balances, but we should skip if there's no wallet or balance values
  if (totalBalancesUsd === undefined || totalBalancesUsdPerChain === undefined || !wallets.length || !wallet) {
    return
  }

  sendAnalyticsEvent(UniswapEventName.BalancesReport, {
    total_balances_usd: totalBalancesUsd,
    wallets,
    balances,
  })

  sendAnalyticsEvent(UniswapEventName.BalancesReportPerChain, {
    total_balances_usd_per_chain: totalBalancesUsdPerChain,
    wallet,
    view_only: isViewOnly,
  })
}
