import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { useMemo } from 'react'
import type { TokenGroupMember } from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/useGetTokenGroupQuery'
import { isUniverseChainId } from 'uniswap/src/features/chains/utils'
import { useRwaGroupMatch } from 'uniswap/src/features/rwa/hooks/useRwaGroupMatch'
import { getRWACandidatesFromCurrency } from 'uniswap/src/features/rwa/rwaCandidates'
import type { RWACandidate, RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import { useRWAMatch } from 'uniswap/src/features/rwa/useRWAMatch'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useTDPTokenCategories } from '~/pages/TokenDetails/hooks/useTDPTokenCategories'

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

/** The page token as a GetTokenGroup member selector; undefined for natives, which have no group. */
export function useTDPRWASubject(): TokenGroupMember | undefined {
  const { currency, currencyChainId } = useTDPStore((s) => ({
    currency: s.currency,
    currencyChainId: s.currencyChainId,
  }))

  return useMemo(
    () => (currency && !currency.isNative ? { chainId: currencyChainId, address: currency.address } : undefined),
    [currency, currencyChainId],
  )
}

/** v2 GetTokenGroup match when token categories are on, otherwise the v1 whitelist match. */
function useTDPRWAMatchState(): { rwaMatch: RWAMatch | undefined; isLoading: boolean } {
  const isTokenGroupsSource = useIsTokenCategoriesEnabled()
  const candidates = useTDPRWACandidates()
  const whitelistMatch = useRWAMatch({ candidates, enabled: !isTokenGroupsSource })
  const subject = useTDPRWASubject()
  const { categories, isLoading: isCategoriesLoading } = useTDPTokenCategories()
  const groupMatch = useRwaGroupMatch({ subject, categories, isCategoriesLoading, enabled: isTokenGroupsSource })

  return isTokenGroupsSource ? groupMatch : { rwaMatch: whitelistMatch, isLoading: false }
}

export function useTDPRWAMatch(): RWAMatch | undefined {
  return useTDPRWAMatchState().rwaMatch
}

/** True while the v2 identity is unresolved, so the header can hold instead of painting the plain token and flipping. */
export function useIsTDPRWAMatchLoading(): boolean {
  return useTDPRWAMatchState().isLoading
}
