import { hasRequiredDataForBalancesReport } from 'uniswap/src/features/accounts/reportBalancesForAnalytics'

interface BalanceReportParams {
  accountData: {
    addresses: string[]
    balances: number[]
    totalBalance: number
    currentAddress?: string
  }
  reportingState: {
    lastTimestamp?: number
    lastValue?: number
    frequency: number
  }
  chainBalances?: Record<string, number>
}

export function shouldReportBalances({ accountData, reportingState, chainBalances }: BalanceReportParams): boolean {
  const { addresses, balances, totalBalance, currentAddress } = accountData
  const { lastTimestamp, lastValue, frequency } = reportingState

  const didWalletGetFunded = totalBalance > 0 && (lastValue ?? 0) === 0
  const balanceReportDue = (lastTimestamp ?? 0) + frequency < Date.now()
  const validAccountInfo = addresses.length === balances.length
  const hasRequiredData = hasRequiredDataForBalancesReport({
    totalBalancesUsd: totalBalance,
    totalBalancesUsdPerChain: chainBalances,
    wallets: addresses,
    wallet: currentAddress,
  })

  return validAccountInfo && Boolean(hasRequiredData) && (didWalletGetFunded || balanceReportDue)
}
