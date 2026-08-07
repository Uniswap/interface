import { useMemo } from 'react'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { getRWACandidatesFromCurrency } from 'uniswap/src/features/rwa/rwaCandidates'
import type { RWACandidate, RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import { useRWAMatch } from 'uniswap/src/features/rwa/useRWAMatch'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'

export function useTDPRWACandidates(): RWACandidate[] {
  const { currency, multichainToken } = useTDPStore((s) => ({
    currency: s.currency,
    multichainToken: s.multichainToken,
  }))

  return useMemo<RWACandidate[]>(() => {
    const candidates: RWACandidate[] = currency ? getRWACandidatesFromCurrency(currency) : []

    // The URL token is most specific. Cross-chain deployments let a non-canonical chain still match the
    // canonical whitelist token for the same issuer, e.g. a BNB route matching the mainnet whitelist entry.
    for (const [chainIdKey, address] of Object.entries(multichainToken?.addresses ?? {})) {
      const chainId = Number(chainIdKey)
      if (isUniverseChainId(chainId)) {
        candidates.push({ chainId, address })
      }
    }

    return candidates
  }, [currency, multichainToken?.addresses])
}

export function useTDPRWAMatch({ enabled = true }: { enabled?: boolean } = {}): RWAMatch | undefined {
  const candidates = useTDPRWACandidates()

  return useRWAMatch({ candidates, enabled })
}
