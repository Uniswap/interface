import { useCallback, useEffect, useMemo } from 'react'
import { CONNECTION_PROVIDER_NAMES } from 'uniswap/src/constants/web3'
import { calculateTotalBalancesUsdPerChainRest } from 'uniswap/src/data/balances/utils'
import { CONVERSION_EVENTS } from 'uniswap/src/data/rest/conversionTracking/constants'
import { useConversionTracking } from 'uniswap/src/data/rest/conversionTracking/useConversionTracking'
import { useGetPortfolioQuery } from 'uniswap/src/data/rest/getPortfolio'
import { reportBalancesForAnalytics } from 'uniswap/src/features/accounts/reportBalancesForAnalytics'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useRestPortfolioValueModifier } from 'uniswap/src/features/dataApi/balances/balancesRest'
import { useWallet } from 'uniswap/src/features/wallet/hooks/useWallet'
import { useTotalBalancesUsdForAnalytics } from '~/appGraphql/data/apollo/useTotalBalancesUsdForAnalytics'

export function useReportTotalBalancesUsdForAnalytics() {
  const { evmAccount } = useWallet()
  const evmAddress = evmAccount?.address
  const { chains: chainIds } = useEnabledChains()
  const modifier = useRestPortfolioValueModifier(evmAddress)

  const portfolioQuery = useGetPortfolioQuery({
    input: { evmAddress, chainIds, modifier },
    enabled: false, // ensures we only read from cache
  })

  const totalBalancesUsd = useTotalBalancesUsdForAnalytics()

  const totalBalancesUsdPerChain = useMemo(
    () => calculateTotalBalancesUsdPerChainRest(portfolioQuery.data),
    [portfolioQuery.data],
  )

  const { trackConversions } = useConversionTracking(evmAccount?.address)

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
