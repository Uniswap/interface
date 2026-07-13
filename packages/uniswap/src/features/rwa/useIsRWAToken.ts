import type { Currency } from '@uniswap/sdk-core'
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
 * Returns true when the given currency is a real-world asset (RWA), matched against the `ListRwas`
 * registry. This is region-agnostic — it answers "is this an RWA?", not "is it tradable here". Pair
 * it with a region check (e.g. compliance `useIsFeatureGated(GatedFeature.ISSUER_SPECIFIC_RWA)`) to
 * decide whether trading is geo-blocked.
 *
 * `enabled` gates the underlying `ListRwas` fetch (and the result) so callers pay for it only when
 * the region check says RWAs are blocked.
 */
export function useIsRWAToken(currency: Maybe<Currency>, { enabled = true }: { enabled?: boolean } = {}): boolean {
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
    enabled: enabled && chainIds.length > 0,
  })

  return useMemo(() => enabled && hasRWATokenMatch({ rwas: data?.rwas, candidates }), [enabled, data?.rwas, candidates])
}
