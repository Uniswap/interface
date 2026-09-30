import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { memo, useMemo } from 'react'
import { useTranslation } from 'react-i18next'
import { useListCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListCategoriesQuery'
import {
  findTokenCategoryForRwaCategory,
  RWA_CATEGORY_IDS,
} from 'uniswap/src/features/tokenCategories/rwaCategoryBridge'
import { TokenCategoryTag } from 'uniswap/src/features/tokenCategories/TokenCategoryTag'
import { TokenCategory, TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'

/**
 * Static stand-in mirroring the backend category identity. These tags are live prod UI while
 * ListCategories is still gated behind the token categories flag, so rendering must not
 * depend on the rollout — the fallback dies with the flag cleanup (M9).
 */
function useFallbackTokenCategory(rwaCategory: RwaCategory): TokenCategory | undefined {
  const { t } = useTranslation()

  return useMemo(() => {
    const id = RWA_CATEGORY_IDS[rwaCategory]
    if (!id) {
      return undefined
    }
    const nameByRwaCategory: Partial<Record<RwaCategory, string>> = {
      [RwaCategory.STOCKS]: t('common.stocks'),
      [RwaCategory.ETFS]: t('common.etfs'),
      [RwaCategory.COMMODITIES]: t('common.commodities'),
    }
    const name = nameByRwaCategory[rwaCategory]
    if (!name) {
      return undefined
    }
    return {
      id,
      name,
      description: '',
      categoryClass: TokenCategoryClass.Asset,
      // Inert here: the tag only reads id + name. Table routing must come from the BE flag, never this stand-in.
      grouped: rwaCategory !== RwaCategory.COMMODITIES,
      topTokens: [],
    }
  }, [rwaCategory, t])
}

export const CategoryTag = memo(function CategoryTag({ category }: { category: RwaCategory }): JSX.Element | null {
  const { data: categories } = useListCategoriesQuery()
  const fallback = useFallbackTokenCategory(category)

  const tokenCategory =
    (categories && findTokenCategoryForRwaCategory({ categories, rwaCategory: category })) ?? fallback

  if (!tokenCategory) {
    return null
  }

  return <TokenCategoryTag category={tokenCategory} />
})
