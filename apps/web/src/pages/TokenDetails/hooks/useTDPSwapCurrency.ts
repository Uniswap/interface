import type { Currency } from '@uniswap/sdk-core'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { currencyForSelectedMultichainDeployment } from '~/pages/TokenDetails/components/header/currencyForSelectedMultichainDeployment'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { getHighestBalanceChain } from '~/pages/TokenDetails/hooks/getHighestBalanceChain'
import { getHighestVolumeChain } from '~/pages/TokenDetails/hooks/getHighestVolumeChain'
import { useMultichainTokenEntries } from '~/pages/TokenDetails/hooks/useMultichainTokenEntries'

/**
 * Currency for the TDP swap widget. Follows the network filter when set, otherwise targets the
 * chain where the user holds the highest balance. Falls back to highest 24h volume when no
 * balances exist, then to the URL-path currency.
 */
export function useTDPSwapCurrency(): Currency {
  const isMultichainTokenUx = useFeatureFlag(FeatureFlags.MultichainTokenUx)
  const { currency, multiChainMap, selectedMultichainChainId, tokenQuery } = useTDPStore((s) => ({
    currency: s.currency!,
    multiChainMap: s.multiChainMap,
    selectedMultichainChainId: s.selectedMultichainChainId,
    tokenQuery: s.tokenQuery,
  }))

  const multichainEntries = useMultichainTokenEntries(multiChainMap)
  const isMultiChainAsset = multichainEntries.length > 1

  const targetEntry = useMemo(() => {
    if (!isMultichainTokenUx || !isMultiChainAsset) {
      return undefined
    }

    // Network filter applied → use that chain's deployment
    if (selectedMultichainChainId !== undefined) {
      return multichainEntries.find((e) => e.chainId === selectedMultichainChainId)
    }

    // No filter → prefer the chain where the user holds the highest balance, fall back to highest 24h volume
    return (
      getHighestBalanceChain(multiChainMap, multichainEntries) ??
      getHighestVolumeChain(tokenQuery.data?.token?.project?.tokens, multichainEntries)
    )
  }, [
    isMultichainTokenUx,
    isMultiChainAsset,
    selectedMultichainChainId,
    multichainEntries,
    multiChainMap,
    tokenQuery.data?.token?.project?.tokens,
  ])

  return useMemo(() => currencyForSelectedMultichainDeployment(currency, targetEntry), [currency, targetEntry])
}
