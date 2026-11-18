import { useMemo } from 'react'
import { useTokenDetailsContext } from 'src/components/TokenDetails/TokenDetailsContext'
import { useTokenCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useTokenCategories'
import type { TokenGroupMember } from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/useGetTokenGroupQuery'
import { useRwaGroupMatch } from 'uniswap/src/features/rwa/hooks/useRwaGroupMatch'
import type { RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import { isNativeCurrencyAddress } from 'uniswap/src/utils/currencyId'

/** The page token as a GetTokenGroup member selector; undefined for natives, which have no group. */
export function useTokenDetailsRWASubject(): TokenGroupMember | undefined {
  const { address, chainId } = useTokenDetailsContext()

  return useMemo(
    () => (isNativeCurrencyAddress(chainId, address) ? undefined : { chainId, address }),
    [chainId, address],
  )
}

function useTokenDetailsRWAMatchState(): { rwaMatch: RWAMatch | undefined; isLoading: boolean } {
  const { currencyId } = useTokenDetailsContext()
  const subject = useTokenDetailsRWASubject()
  const { categories, isLoading: isCategoriesLoading } = useTokenCategories(currencyId)
  return useRwaGroupMatch({ subject, categories, isCategoriesLoading })
}

export function useTokenDetailsRWAMatch(): RWAMatch | undefined {
  return useTokenDetailsRWAMatchState().rwaMatch
}

/** True while the group identity is unresolved, so the header can hold instead of painting the plain token and flipping. */
export function useIsTokenDetailsRWAMatchLoading(): boolean {
  return useTokenDetailsRWAMatchState().isLoading
}
