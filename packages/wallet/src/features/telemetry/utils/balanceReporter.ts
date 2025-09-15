import { hasRequiredDataForBalancesReport } from 'uniswap/src/features/accounts/reportBalancesForAnalytics'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

/**
 * Pure business logic for balance reporting timing and validation
 */

const BALANCE_REPORT_INTERVAL = ONE_MINUTE_MS * 5 // 5 minutes

export interface BalanceReportingParams {
  lastReport?: number
  lastValue?: number
  totalBalance: number
  accountBalances: number[]
  totalBalancesUsdPerChain?: Record<string, number>
  wallets: string[]
  wallet?: string
}

/**
 * Determines if a balance report should be sent based on timing and data validation
 * @param params - The parameters for determining if a report should be sent
 * @returns true if a report should be sent, false otherwise
 */
export function shouldSendBalanceReport(params: BalanceReportingParams): boolean {
  const { lastReport, lastValue, totalBalance, totalBalancesUsdPerChain, wallets, wallet } = params

  // Check if wallet was just funded (balance went from 0 to positive)
  const wasJustFunded = totalBalance > 0 && (lastValue === 0 || lastValue === undefined)

  // Check if enough time has passed since last report
  const isReportDue = (lastReport ?? 0) + BALANCE_REPORT_INTERVAL < Date.now()

  // Validate that we have all required data
  const hasValidData = hasRequiredDataForBalancesReport({
    totalBalancesUsd: totalBalance,
    totalBalancesUsdPerChain,
    wallets,
    wallet,
  })

  return Boolean(hasValidData) && (wasJustFunded || isReportDue)
}
