import { useTokenBalancesQuery } from 'appGraphql/data/apollo/AdaptiveTokenBalancesProvider'
import { useTotalBalancesUsdForAnalytics } from 'appGraphql/data/apollo/useTotalBalancesUsdForAnalytics'
import { UNISWAP_EXTENSION_CONNECTOR_NAME } from 'components/Web3Provider/constants'
import { useAccount } from 'hooks/useAccount'
import { useCallback, useEffect } from 'react'
import { useTotalBalancesUsdPerChain } from 'uniswap/src/data/balances/utils'
import { CONVERSION_EVENTS } from 'uniswap/src/data/rest/conversionTracking/constants'
import { useConversionTracking } from 'uniswap/src/data/rest/conversionTracking/useConversionTracking'
import { reportBalancesForAnalytics } from 'uniswap/src/features/accounts/reportBalancesForAnalytics'

export function useReportTotalBalancesUsdForAnalytics() {
  const account = useAccount()
  const totalBalancesUsd = useTotalBalancesUsdForAnalytics()
  const totalBalancesUsdPerChain = useTotalBalancesUsdPerChain(useTokenBalancesQuery({ cacheOnly: true }))
  const { trackConversions } = useConversionTracking(account.address)

  const sendBalancesReport = useCallback(async () => {
    reportBalancesForAnalytics({
      balances: totalBalancesUsd ? [totalBalancesUsd] : [],
      totalBalancesUsd,
      totalBalancesUsdPerChain,
      wallet: account.address,
      wallets: account.address ? [account.address] : [],
    })

    if (account.connector?.name === UNISWAP_EXTENSION_CONNECTOR_NAME) {
      trackConversions(CONVERSION_EVENTS.Extension.WalletFunded)
    }

    trackConversions(CONVERSION_EVENTS.Web.WalletFunded)
  }, [totalBalancesUsd, totalBalancesUsdPerChain, account.address, account.connector?.name, trackConversions])

  useEffect(() => {
    if (totalBalancesUsd !== undefined && totalBalancesUsdPerChain !== undefined) {
      sendBalancesReport()
    }
  }, [totalBalancesUsd, totalBalancesUsdPerChain, sendBalancesReport])
}
