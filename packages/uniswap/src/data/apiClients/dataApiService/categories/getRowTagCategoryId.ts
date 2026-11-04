import { SharedQueryClient } from '@universe/api'
import { getGetTokenQueryOptions } from 'uniswap/src/data/apiClients/dataApiService/tokens/queries'
import { currencyIdToRestContractInput } from 'uniswap/src/features/dataApi/utils/currencyIdToContractInput'
import { selectRowCategoryTag } from 'uniswap/src/features/tokenCategories/selectRowCategoryTag'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import type { CurrencyId } from 'uniswap/src/types/currency'

function getCachedCategoryIds(currencyId: CurrencyId): string[] | undefined {
  const { queryKey } = getGetTokenQueryOptions({ params: currencyIdToRestContractInput(currencyId) })
  return SharedQueryClient.getQueryData(queryKey)?.token?.categoryIds
}

export function getRowTagCategoryId({
  currencyId,
  categoryIds,
  categories,
}: {
  currencyId: CurrencyId
  categoryIds?: string[]
  categories: TokenCategory[]
}): string | null {
  const ids = categoryIds?.length ? categoryIds : getCachedCategoryIds(currencyId)
  return selectRowCategoryTag({ categoryIds: ids, categories })?.id ?? null
}
