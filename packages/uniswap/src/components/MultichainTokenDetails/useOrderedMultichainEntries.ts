import { useMemo } from 'react'
// oxlint-disable-next-line no-restricted-imports -- we need raw chain ordering without enabled filtering
import { useOrderedChainIds } from 'uniswap/src/features/chains/hooks/useOrderedChainIds'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

export interface MultichainTokenEntry {
  chainId: UniverseChainId
  address: string
  isNative: boolean
}

/** Stable key for deployment identity (ignores array reference and `isNative` — derived from chain + address). */
function multichainFingerprint(entries: MultichainTokenEntry[]): string {
  return entries
    .map((e) => `${e.chainId}:${e.address.toLowerCase()}`)
    .sort((a, b) => a.localeCompare(b))
    .join('|')
}

/**
 * Sorts multichain token entries to match the network selector dropdown order.
 * Shared by web and mobile to ensure consistent chain ordering.
 *
 * Returned array reference is stable while deployment set (`chainId` + `address`) and ordered chain config
 * are unchanged, even if the parent passes a new `entries` array each render (e.g. TDP `multiChainMap` updates).
 */
export function useOrderedMultichainEntries(entries: MultichainTokenEntry[]): MultichainTokenEntry[] {
  const fingerprint = multichainFingerprint(entries)

  /* oxlint-disable-next-line react/exhaustive-deps -- chain IDs only change when fingerprint changes; `entries` reference often churns without multichain changes */
  const entryChainIds = useMemo(() => entries.map((e) => e.chainId), [fingerprint])

  const orderedChainIds = useOrderedChainIds(entryChainIds)

  return useMemo(() => {
    if (entries.length === 0) {
      return []
    }
    const orderMap = new Map(orderedChainIds.map((id, index) => [id, index]))
    return [...entries].sort((a, b) => (orderMap.get(a.chainId) ?? 0) - (orderMap.get(b.chainId) ?? 0))
    /* oxlint-disable-next-line react/exhaustive-deps -- sorted output only depends on deployment set + order; `entries` reference often churns without multichain changes */
  }, [fingerprint, orderedChainIds])
}
