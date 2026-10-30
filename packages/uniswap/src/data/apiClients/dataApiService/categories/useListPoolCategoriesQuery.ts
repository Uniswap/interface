import { keepPreviousData, useQuery, type UseQueryResult } from '@tanstack/react-query'
import { CategoryKind } from '@uniswap/client-data-api/dist/data/v2/categories_pb'
import type { UniverseChainId } from '@universe/chains'
import { useIsPoolCategoriesEnabled } from '@universe/gating'
import { useCallback } from 'react'
import {
  localizeCategory,
  rankedPoolCategoryToPoolCategory,
} from 'uniswap/src/data/apiClients/dataApiService/categories/categoryMappers'
import { dataApiServiceClientV2 } from 'uniswap/src/data/apiClients/dataApiService/clients/DataApiClientV2'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import { useCurrentLanguage } from 'uniswap/src/features/language/hooks'
import type { PoolCategory } from 'uniswap/src/features/tokenCategories/types'
import { ReactQueryCacheKey } from 'utilities/src/reactQuery/cache'
import { ONE_MINUTE_MS } from 'utilities/src/time/time'

export function useListPoolCategoriesQuery({
  chainIds: chainIdsOverride,
  enabled = true,
}: { chainIds?: UniverseChainId[]; enabled?: boolean } = {}): UseQueryResult<PoolCategory[]> {
  const poolCategoriesEnabled = useIsPoolCategoriesEnabled()
  const { chains: enabledChainIds } = useEnabledChains()
  const chainIds = chainIdsOverride ?? enabledChainIds
  const language = useCurrentLanguage()

  return useQuery({
    queryKey: [ReactQueryCacheKey.DataApiService, 'listCategories', 'pool', chainIds],
    queryFn: async (): Promise<PoolCategory[]> => {
      const response = await dataApiServiceClientV2.listCategories({ chainIds, kind: CategoryKind.POOL })
      return response.poolCategories
        .map(rankedPoolCategoryToPoolCategory)
        .filter((category): category is PoolCategory => category !== undefined)
    },
    select: useCallback(
      (categories: PoolCategory[]) => categories.map((category) => localizeCategory(category, language)),
      [language],
    ),
    enabled: enabled && poolCategoriesEnabled,
    // The key includes chainIds, so a testnet-mode toggle would otherwise drop data mid-session.
    placeholderData: keepPreviousData,
    staleTime: 5 * ONE_MINUTE_MS,
    gcTime: 30 * ONE_MINUTE_MS,
  })
}
