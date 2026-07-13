import { useMemo } from 'react'
import {
  type MultichainTokenEntry,
  useOrderedMultichainEntries,
} from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { getNativeAddress } from 'uniswap/src/constants/addresses'
import { useFeatureFlaggedChainIds } from 'uniswap/src/features/chains/hooks/useFeatureFlaggedChainIds'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'
import type { MultiChainMap } from '~/pages/TokenDetails/context/TDPContext'

/** Maps TDP `multiChainMap` to ordered multichain entries (same ordering as balances / address dropdown). */
export function useMultichainTokenEntries(multiChainMap: MultiChainMap): MultichainTokenEntry[] {
  const featureFlaggedChainIds = useFeatureFlaggedChainIds()
  const entries = useMemo(() => {
    const result: MultichainTokenEntry[] = []
    for (const [graphqlChain, data] of Object.entries(multiChainMap)) {
      // oxlint-disable-next-line typescript/no-unnecessary-condition -- biome-parity: oxlint is stricter here
      if (!data) {
        continue
      }

      const chainId = fromGraphQLChain(graphqlChain)
      // Exclude feature-gated chains (e.g. unlaunched Arc/Robinhood) so they don't appear in the network selector.
      if (!chainId || !featureFlaggedChainIds.includes(chainId)) {
        continue
      }

      const rawAddress = data.address
      const isNative = !rawAddress || isNativeCurrencyAddress(chainId, rawAddress)

      result.push({
        chainId,
        address: isNative ? getNativeAddress(chainId) : rawAddress,
        isNative,
      })
    }
    return result
  }, [multiChainMap, featureFlaggedChainIds])
  return useOrderedMultichainEntries(entries)
}
