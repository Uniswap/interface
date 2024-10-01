import { useTokenBalancesQuery } from 'graphql/data/apollo/AdaptiveTokenBalancesProvider'
import { useTotalBalancesUsdForAnalytics } from 'graphql/data/apollo/useTotalBalancesUsdForAnalytics'
import { useAccount } from 'hooks/useAccount'
import { useCallback, useEffect } from 'react'
import { useTotalBalancesUsdPerChain } from 'uniswap/src/data/balances/utils'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

export function useReportTotalBalancesUsdForAnalytics() {
  const account = useAccount()
  const portfolioBalanceUsd = useTotalBalancesUsdForAnalytics()
  const totalBalancesUsdPerChain = useTotalBalancesUsdPerChain(useTokenBalancesQuery({ cacheOnly: true }))

  const sendBalancesReport = useCallback(async () => {
    if (!portfolioBalanceUsd || !totalBalancesUsdPerChain || !account.address) {
      return
    }

    sendAnalyticsEvent(UniswapEventName.BalancesReport, {
      total_balances_usd: portfolioBalanceUsd,
      wallets: [account.address],
      balances: [portfolioBalanceUsd],
    })

    sendAnalyticsEvent(UniswapEventName.BalancesReportPerChain, {
      total_balances_usd_per_chain: totalBalancesUsdPerChain,
      wallet: account.address,
    })
  }, [portfolioBalanceUsd, totalBalancesUsdPerChain, account.address])

  useEffect(() => {
    if (portfolioBalanceUsd !== undefined && totalBalancesUsdPerChain !== undefined) {
      sendBalancesReport()
    }
  }, [portfolioBalanceUsd, totalBalancesUsdPerChain, sendBalancesReport])
}
