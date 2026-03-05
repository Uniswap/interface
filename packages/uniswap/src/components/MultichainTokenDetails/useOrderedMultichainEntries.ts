import { useMemo } from 'react'
// biome-ignore lint/style/noRestrictedImports: we need raw chain ordering without enabled filtering
import { useOrderedChainIds } from 'uniswap/src/features/chains/hooks/useOrderedChainIds'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export interface MultichainTokenEntry {
  chainId: UniverseChainId
  address: string
}

/**
 * Sorts multichain token entries to match the network selector dropdown order.
 * Shared by web and mobile to ensure consistent chain ordering.
 */
export function useOrderedMultichainEntries(entries: MultichainTokenEntry[]): MultichainTokenEntry[] {
  const orderedChainIds = useOrderedChainIds(entries.map((e) => e.chainId))

  return useMemo(() => {
    const orderMap = new Map(orderedChainIds.map((id, index) => [id, index]))
    return [...entries].sort((a, b) => (orderMap.get(a.chainId) ?? 0) - (orderMap.get(b.chainId) ?? 0))
  }, [entries, orderedChainIds])
}
