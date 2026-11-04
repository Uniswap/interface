import type { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { useLocation, useSearchParams } from 'react-router'
import { currencyForSelectedMultichainDeployment } from '~/pages/TokenDetails/components/header/currencyForSelectedMultichainDeployment'
import { getCurrentTDPUrlState } from '~/pages/TokenDetails/context/tdpUrlUtils'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { getHighestBalanceChain } from '~/pages/TokenDetails/hooks/getHighestBalanceChain'
import { getHighestVolumeChain } from '~/pages/TokenDetails/hooks/getHighestVolumeChain'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'
import { useTDPPerChainVolume } from '~/pages/TokenDetails/hooks/useTDPPerChainVolume'
import { getTDPChainSearchParam } from '~/utils/params/chainQueryParam'

/**
 * Currency for the TDP swap widget. Follows the network filter when set. In the all-networks view
 * (`?chain=multichain`) it targets the chain where the user holds the highest balance, falling back
 * to highest 24h volume; otherwise it uses the URL-path currency.
 */
export function useTDPSwapCurrency(): Currency {
  const { currency, multiChainMap, selectedMultichainChainId } = useTDPStore((s) => ({
    currency: s.currency!,
    multiChainMap: s.multiChainMap,
    selectedMultichainChainId: s.selectedMultichainChainId,
  }))
  const location = useLocation()
  const [routerSearchParams] = useSearchParams()

  const multichainEntries = useMultichainTokenEntries(multiChainMap)
  const isMultiChainAsset = multichainEntries.length > 1
  const volumeByChainId = useTDPPerChainVolume({ enabled: isMultiChainAsset })

  // An undefined filter is also the transient state between a store reset (token navigation) and
  // TDPChainSearchParamSync selecting the path chain; auto-targeting there flips the widget's chain.
  const isAllNetworksView =
    getTDPChainSearchParam(
      getCurrentTDPUrlState({ routerPathname: location.pathname, routerSearchParams }).searchParams,
    ).type === 'multichain'

  const targetEntry = useMemo(() => {
    if (!isMultiChainAsset) {
      return undefined
    }

    // Network filter applied → use that chain's deployment
    if (selectedMultichainChainId !== undefined) {
      return multichainEntries.find((e) => e.chainId === selectedMultichainChainId)
    }

    if (!isAllNetworksView) {
      return undefined
    }

    // All networks → prefer the chain where the user holds the highest balance, fall back to highest 24h volume
    return (
      getHighestBalanceChain(multiChainMap, multichainEntries) ??
      getHighestVolumeChain(volumeByChainId, multichainEntries)
    )
  }, [
    isMultiChainAsset,
    selectedMultichainChainId,
    isAllNetworksView,
    multichainEntries,
    multiChainMap,
    volumeByChainId,
  ])

  return useMemo(() => currencyForSelectedMultichainDeployment(currency, targetEntry), [currency, targetEntry])
}
