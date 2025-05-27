import { UNISWAP_EXTENSION_CONNECTOR_NAME } from 'components/Web3Provider/constants'
import { useTokenBalancesQuery } from 'graphql/data/apollo/AdaptiveTokenBalancesProvider'
import { useTotalBalancesUsdForAnalytics } from 'graphql/data/apollo/useTotalBalancesUsdForAnalytics'
import { useAccount } from 'hooks/useAccount'
import { useCallback, useEffect } from 'react'
import { useTotalBalancesUsdPerChain } from 'uniswap/src/data/balances/utils'
import { CONVERSION_EVENTS } from 'uniswap/src/data/rest/conversionTracking/constants'
import { useConversionTracking } from 'uniswap/src/data/rest/conversionTracking/useConversionTracking'
import { UniswapEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'

export function useReportTotalBalancesUsdForAnalytics() {
  const account = useAccount()
  const portfolioBalanceUsd = useTotalBalancesUsdForAnalytics()
  const totalBalancesUsdPerChain = useTotalBalancesUsdPerChain(useTokenBalancesQuery({ cacheOnly: true }))
  const { trackConversions } = useConversionTracking()

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
      view_only: false,
    })

    if (account.connector?.name === UNISWAP_EXTENSION_CONNECTOR_NAME) {
      trackConversions(CONVERSION_EVENTS.Extension.WalletFunded)
    }

    trackConversions(CONVERSION_EVENTS.Web.WalletFunded)
  }, [portfolioBalanceUsd, totalBalancesUsdPerChain, account.address, account.connector?.name, trackConversions])

  useEffect(() => {
    if (portfolioBalanceUsd !== undefined && totalBalancesUsdPerChain !== undefined) {
      sendBalancesReport()
    }
  }, [portfolioBalanceUsd, totalBalancesUsdPerChain, sendBalancesReport])
}
