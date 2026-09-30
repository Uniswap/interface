import { useIsTokenCategoriesEnabled } from '@universe/gating'
import { useMemo } from 'react'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { useTokenCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useTokenCategories'
import type { TokenGroupMember } from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/useGetTokenGroupQuery'
import { useRwaGroupMatch } from 'uniswap/src/features/rwa/hooks/useRwaGroupMatch'
import { findRWAMatch, type RWACandidate, type RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import { useRWAWhitelist } from 'uniswap/src/features/rwa/useRWAWhitelist'
import { isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'

/** The page token as a GetTokenGroup member selector; undefined for natives, which have no group. */
export function useTokenDetailsRWASubject(): TokenGroupMember | undefined {
  const { address, chainId } = useTokenDetailsContext()

  return useMemo(
    () => (isNativeCurrencyAddress(chainId, address) ? undefined : { chainId, address }),
    [chainId, address],
  )
}

/** v2 GetTokenGroup match when token categories are on, otherwise the v1 whitelist match. */
function useTokenDetailsRWAMatchState(): { rwaMatch: RWAMatch | undefined; isLoading: boolean } {
  const isTokenGroupsSource = useIsTokenCategoriesEnabled()
  const { currencyId } = useTokenDetailsContext()
  const subject = useTokenDetailsRWASubject()
  const { categories, isLoading: isCategoriesLoading } = useTokenCategories(currencyId)
  const groupMatch = useRwaGroupMatch({ subject, categories, isCategoriesLoading, enabled: isTokenGroupsSource })
  const whitelistMatch = useWhitelistRWAMatch({ enabled: !isTokenGroupsSource })

  return isTokenGroupsSource ? groupMatch : { rwaMatch: whitelistMatch, isLoading: false }
}

export function useTokenDetailsRWAMatch(): RWAMatch | undefined {
  return useTokenDetailsRWAMatchState().rwaMatch
}

/** True while the v2 identity is unresolved, so the header can hold instead of painting the plain token and flipping. */
export function useIsTokenDetailsRWAMatchLoading(): boolean {
  return useTokenDetailsRWAMatchState().isLoading
}

function useWhitelistRWAMatch({ enabled }: { enabled: boolean }): RWAMatch | undefined {
  const rwaWhitelist = useRWAWhitelist({ enabled })
  const { address, chainId, multichainTokens } = useTokenDetailsContext()

  const rwaCandidates = useMemo<RWACandidate[]>(() => {
    const candidates: RWACandidate[] = []
    if (!isNativeCurrencyAddress(chainId, address)) {
      candidates.push({ chainId, address })
    }
    return candidates.concat(multichainTokens)
  }, [address, chainId, multichainTokens])

  return useMemo(() => findRWAMatch({ rwaWhitelist, candidates: rwaCandidates }), [rwaCandidates, rwaWhitelist])
}
