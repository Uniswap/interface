import type { Currency } from '@uniswap/sdk-core'
import { useMemo } from 'react'
import { currencyForSelectedMultichainDeployment } from '~/pages/TokenDetails/components/header/currencyForSelectedMultichainDeployment'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'

/**
 * Currency for UI that should follow the multichain network filter (spot, stats, explorer, copy).
 * Store `currency` remains the URL/path token; overwriting it on selection would race context sync from `useCreateTDPContext`.
 */
export function useTDPEffectiveCurrency(): Currency {
  const { currency, multiChainMap, selectedMultichainChainId } = useTDPStore((s) => ({
    currency: s.currency!,
    multiChainMap: s.multiChainMap,
    selectedMultichainChainId: s.selectedMultichainChainId,
  }))

  const multichainEntries = useMultichainTokenEntries(multiChainMap)
  const isMultiChainAsset = multichainEntries.length > 1

  const selectedMultichainEntry = useMemo(() => {
    if (!isMultiChainAsset || selectedMultichainChainId === undefined) {
      return undefined
    }
    return multichainEntries.find((e) => e.chainId === selectedMultichainChainId)
  }, [isMultiChainAsset, selectedMultichainChainId, multichainEntries])

  return useMemo(
    () => currencyForSelectedMultichainDeployment(currency, selectedMultichainEntry),
    [currency, selectedMultichainEntry],
  )
}
