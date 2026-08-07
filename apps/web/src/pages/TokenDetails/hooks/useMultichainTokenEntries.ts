import { useMemo } from 'react'
import { getMultichainTokenEntry } from 'uniswap/src/components/MultichainTokenDetails/getMultichainTokenEntry'
import {
  type MultichainTokenEntry,
  useOrderedMultichainEntries,
} from 'uniswap/src/components/MultichainTokenDetails/useOrderedMultichainEntries'
import { useFeatureFlaggedChainIds } from 'uniswap/src/features/chains/hooks/useFeatureFlaggedChainIds'
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

      const entry = getMultichainTokenEntry({ chain: graphqlChain, address: data.address }, featureFlaggedChainIds)
      if (entry) {
        result.push(entry)
      }
    }
    return result
  }, [multiChainMap, featureFlaggedChainIds])
  return useOrderedMultichainEntries(entries)
}
