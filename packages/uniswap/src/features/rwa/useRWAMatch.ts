import { useMemo } from 'react'
import { findRWAMatch, type RWACandidate, type RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import { useRWAWhitelist } from 'uniswap/src/features/rwa/useRWAWhitelist'

export function useRWAMatch({
  candidates,
  enabled = true,
}: {
  candidates: RWACandidate[]
  enabled?: boolean
}): RWAMatch | undefined {
  const rwaWhitelist = useRWAWhitelist(enabled)

  return useMemo(
    () => (enabled ? findRWAMatch({ rwaWhitelist, candidates }) : undefined),
    [enabled, candidates, rwaWhitelist],
  )
}
