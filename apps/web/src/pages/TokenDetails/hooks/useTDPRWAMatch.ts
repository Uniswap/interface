import { useMemo } from 'react'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { getRWACandidatesFromCurrency } from 'uniswap/src/features/rwa/rwaCandidates'
import type { RWACandidate, RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import { useRWAMatch } from 'uniswap/src/features/rwa/useRWAMatch'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'

export function useTDPRWACandidates(): RWACandidate[] {
  const { currency, tokenQuery } = useTDPStore((s) => ({
    currency: s.currency,
    tokenQuery: s.tokenQuery,
  }))

  return useMemo<RWACandidate[]>(() => {
    const candidates: RWACandidate[] = currency ? getRWACandidatesFromCurrency(currency) : []

    // The URL token is most specific. Project tokens let a non-canonical chain still match the canonical
    // whitelist token for the same issuer, e.g. a BNB route matching the mainnet whitelist entry.
    for (const token of tokenQuery.data?.token?.project?.tokens ?? []) {
      const chainId = fromGraphQLChain(token.chain)
      if (chainId && token.address) {
        candidates.push({ chainId, address: token.address })
      }
    }

    return candidates
  }, [currency, tokenQuery.data?.token?.project?.tokens])
}

export function useTDPRWAMatch({ enabled = true }: { enabled?: boolean } = {}): RWAMatch | undefined {
  const candidates = useTDPRWACandidates()

  return useRWAMatch({ candidates, enabled })
}
