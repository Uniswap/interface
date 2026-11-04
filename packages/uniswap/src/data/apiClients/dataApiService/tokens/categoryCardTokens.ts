import type { PlainMessage } from '@bufbuild/protobuf'
import type { ListTokensResponse } from '@uniswap/client-data-api/dist/data/v2/api_pb'
import { HistoryDuration, TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import type { UniverseChainId } from '@universe/chains'
import { getListTokensQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import {
  rankedTokenToCardItem,
  type RankedTokenCardItem,
} from 'uniswap/src/data/apiClients/dataApiService/utils/rankedTokenCardItem'
import type { TokenCategoryDefaultSort } from 'uniswap/src/features/tokenCategories/types'

export const CATEGORY_CARD_TOKEN_COUNT = 12

const VOLUME_1D_SORT: TokenCategoryDefaultSort = { orderBy: TokensOrderBy.VOLUME_1D, ascending: false }

function selectCategoryCardItems(data: PlainMessage<ListTokensResponse> | undefined): RankedTokenCardItem[] {
  return (data?.multichainTokens ?? []).flatMap((token) => rankedTokenToCardItem(token) ?? [])
}

/**
 * Every surface showing a category's cards must use this so they share one cache entry.
 * Disabled until `categoryId` is known.
 */
export function getCategoryCardTokensQueryOptions({
  categoryId,
  chainIds,
  sort = VOLUME_1D_SORT,
}: {
  categoryId: string | undefined
  chainIds: UniverseChainId[]
  sort?: TokenCategoryDefaultSort
}): ReturnType<typeof getListTokensQueryOptions<RankedTokenCardItem[]>> {
  return getListTokensQueryOptions({
    params:
      categoryId === undefined
        ? undefined
        : {
            chainIds,
            page: { pageSize: CATEGORY_CARD_TOKEN_COUNT },
            sort,
            sparklineDuration: HistoryDuration.DAY,
            filter: { categoryIds: [categoryId] },
          },
    select: selectCategoryCardItems,
  })
}
