import { useCallback, useEffect } from 'react'
import { CONNECTION_PROVIDER_NAMES } from 'uniswap/src/constants/web3'
import { CONVERSION_EVENTS } from 'uniswap/src/data/rest/conversionTracking/constants'
import { useConversionTracking } from 'uniswap/src/data/rest/conversionTracking/useConversionTracking'
import { reportBalancesForAnalytics } from 'uniswap/src/features/accounts/reportBalancesForAnalytics'
import { usePortfolioTotalBalancesUsdPerChain } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { useTotalBalancesUsdForAnalytics } from '~/appGraphql/data/apollo/useTotalBalancesUsdForAnalytics'

export function useReportTotalBalancesUsdForAnalytics() {
  const { evmAccount, svmAccount } = useWallet()
  const evmAddress = evmAccount?.address

  const totalBalancesUsd = useTotalBalancesUsdForAnalytics()
  const totalBalancesUsdPerChain = usePortfolioTotalBalancesUsdPerChain({
    evmAddress,
    svmAddress: svmAccount?.address,
  })

  const { trackConversions } = useConversionTracking(evmAddress)

  const sendBalancesReport = useCallback(async () => {
    reportBalancesForAnalytics({
      balances: totalBalancesUsd ? [totalBalancesUsd] : [],
      totalBalancesUsd,
      totalBalancesUsdPerChain,
      wallet: evmAddress,
      wallets: evmAddress ? [evmAddress] : [],
    })

    if (evmAccount?.walletMeta.name === CONNECTION_PROVIDER_NAMES.UNISWAP_EXTENSION) {
      trackConversions(CONVERSION_EVENTS.Extension.WalletFunded)
    }

    trackConversions(CONVERSION_EVENTS.Web.WalletFunded)
  }, [totalBalancesUsd, totalBalancesUsdPerChain, trackConversions, evmAccount?.walletMeta.name, evmAddress])

  useEffect(() => {
    if (totalBalancesUsd !== undefined && totalBalancesUsdPerChain !== undefined) {
      sendBalancesReport()
    }
  }, [totalBalancesUsd, totalBalancesUsdPerChain, sendBalancesReport])
}
