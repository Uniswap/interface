import type { TokenGroupMember } from 'uniswap/src/data/apiClients/dataApiService/tokenGroups/useGetTokenGroupQuery'
import type { RWAMatch } from 'uniswap/src/features/rwa/rwaMatch'
import { useRwaTokenGroup } from 'uniswap/src/features/rwa/useRwaTokenGroup'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'

/**
 * The TDP's v2 GetTokenGroup match. Only tokens in a grouped category (stocks, ETFs) are looked up;
 * flat categories such as commodities are not groups and render as plain tokens. `isLoading` covers
 * the categories and the group so the header can hold instead of painting the plain token and flipping.
 */
export function useRwaGroupMatch({
  subject,
  categories,
  isCategoriesLoading,
  enabled,
}: {
  subject: TokenGroupMember | undefined
  categories: readonly TokenCategory[]
  isCategoriesLoading: boolean
  enabled: boolean
}): { rwaMatch: RWAMatch | undefined; isLoading: boolean } {
  const isGroupedToken = categories.some((category) => category.grouped)
  const { tokenGroup, isLoading: isGroupLoading } = useRwaTokenGroup({ subject, enabled: enabled && isGroupedToken })

  return {
    rwaMatch: tokenGroup?.rwaMatch,
    isLoading: enabled && (isCategoriesLoading || (isGroupedToken && isGroupLoading)),
  }
}
