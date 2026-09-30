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
  const rwaWhitelist = useRWAWhitelist({ enabled })

  return useMemo(() => findRWAMatch({ rwaWhitelist, candidates }), [candidates, rwaWhitelist])
}
