import type { PlainMessage } from '@bufbuild/protobuf'
import { useQuery } from '@tanstack/react-query'
import type { GetTokenResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { useMemo } from 'react'
import { useResolveTokenCategories } from 'uniswap/src/data/apiClients/dataApiService/categories/useResolveTokenCategories'
import { getGetTokenQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import type { CurrencyId } from 'uniswap/src/types/currency'

function selectCategoryIds(data: PlainMessage<GetTokenResponse> | undefined): string[] | undefined {
  return data?.token?.categoryIds
}

/** The token's GetToken `category_ids` tags, without resolving them to categories. */
export function getTokenCategoryIdsQueryOptions(
  currencyId: CurrencyId,
): ReturnType<typeof getGetTokenQueryOptions<string[] | undefined>> {
  return getGetTokenQueryOptions({
    params: currencyIdToRestContractInput(currencyId),
    keepPreviousData: false,
    select: selectCategoryIds,
  })
}

/** Categories the token belongs to, in canonical order, resolved from the GetToken `category_ids` tags. */
export function useTokenCategories(currencyId: CurrencyId): { categories: TokenCategory[]; isLoading: boolean } {
  const params = useMemo(() => currencyIdToRestContractInput(currencyId), [currencyId])
  const { data: categoryIds, isLoading } = useQuery(getGetTokenQueryOptions({ params, select: selectCategoryIds }))

  return useResolveTokenCategories({ categoryIds, isLoading })
}
