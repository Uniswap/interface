import type { Currency } from '@uniswap/sdk-core'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useMemo } from 'react'
import { useListRwasQuery } from 'uniswap/src/data/rest/listRwas'
import { getRWACandidatesFromCurrency } from 'uniswap/src/features/rwa/rwaCandidates'
import { type RWACandidate, rwaTokenMatchesCandidate } from 'uniswap/src/features/rwa/rwaMatch'

type RWAListEntry = { issuerTokens: readonly RWACandidate[] }

function hasRWATokenMatch({
  rwas,
  candidates,
}: {
  rwas: readonly RWAListEntry[] | null | undefined
  candidates: readonly RWACandidate[]
}): boolean {
  for (const rwa of rwas ?? []) {
    for (const token of rwa.issuerTokens) {
      for (const candidate of candidates) {
        if (rwaTokenMatchesCandidate(token, candidate)) {
          return true
        }
      }
    }
  }

  return false
}

/**
 * Returns true when the given currency is a real-world asset (RWA) and the `rwa_geo_blocked` gate
 * is enabled (the user is in a region where RWAs are not tradable).
 */
export function useIsRWAGeoBlocked(currency: Maybe<Currency>): boolean {
  const isGeoblockEnabled = useFeatureFlag(FeatureFlags.RwaGeoblocked)

  const candidates = useMemo(() => (currency ? getRWACandidatesFromCurrency(currency) : []), [currency])
  const chainIds = useMemo(
    () =>
      Array.from(
        new Set(
          candidates
            .map((candidate) => candidate.chainId)
            .filter((chainId): chainId is number => chainId !== null && chainId !== undefined),
        ),
      ),
    [candidates],
  )

  const { data } = useListRwasQuery({
    chainIds,
    enabled: isGeoblockEnabled && chainIds.length > 0,
  })

  const isRWA = useMemo(() => hasRWATokenMatch({ rwas: data?.rwas, candidates }), [data?.rwas, candidates])

  return isGeoblockEnabled && isRWA
}
