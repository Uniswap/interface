import { useMemo } from 'react'
import { fromGraphQLChain } from 'uniswap/src/features/chains/utils'
import { findRWAMatch, type RWACandidate, type RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import { useRWAWhitelist } from 'uniswap/src/features/rwa/useRWAWhitelist'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'

export function useTDPRWAMatch({ enabled = true }: { enabled?: boolean } = {}): RWAMatch | undefined {
  const rwaWhitelist = useRWAWhitelist(enabled)
  const { currency, tokenQuery } = useTDPStore((s) => ({
    currency: s.currency,
    tokenQuery: s.tokenQuery,
  }))

  const rwaCandidates = useMemo<RWACandidate[]>(() => {
    const candidates: RWACandidate[] = []
    if (currency && !currency.isNative) {
      candidates.push({ chainId: currency.chainId, address: currency.address })
    }

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

  return useMemo(
    () => (enabled ? findRWAMatch({ rwaWhitelist, candidates: rwaCandidates }) : undefined),
    [enabled, rwaCandidates, rwaWhitelist],
  )
}
