import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { logger } from 'utilities/src/logger/logger'

/** Backend category ids for the RWA asset categories — ids are the ListCategories contract. */
export const RWA_CATEGORY_IDS: Partial<Record<RwaCategory, string>> = {
  [RwaCategory.STOCKS]: 'stocks',
  [RwaCategory.ETFS]: 'etfs',
  [RwaCategory.COMMODITIES]: 'commodities',
}

const RWA_CATEGORY_BY_ID = new Map(
  Object.entries(RWA_CATEGORY_IDS).map(([rwaCategory, id]) => [id, Number(rwaCategory) as RwaCategory]),
)

export function getRwaCategoryForCategoryId(categoryId: string): RwaCategory {
  return RWA_CATEGORY_BY_ID.get(categoryId) ?? RwaCategory.UNSPECIFIED
}

export function getRwaCategoryForTokenCategory(category: TokenCategory): RwaCategory {
  return getRwaCategoryForCategoryId(category.id)
}

// The resolver runs per RWA row per render — warn once per category, not once per call.
const warnedMissingCategories = new Set<RwaCategory>()

export function findTokenCategoryForRwaCategory({
  categories,
  rwaCategory,
}: {
  categories: TokenCategory[]
  rwaCategory: RwaCategory
}): TokenCategory | undefined {
  const id = RWA_CATEGORY_IDS[rwaCategory]
  if (!id) {
    return undefined
  }
  const match = categories.find((category) => category.id === id)
  if (!match && categories.length > 0 && !warnedMissingCategories.has(rwaCategory)) {
    warnedMissingCategories.add(rwaCategory)
    logger.warn('rwaCategoryBridge', 'findTokenCategoryForRwaCategory', 'no taxonomy category matches RwaCategory', {
      rwaCategory,
    })
  }
  return match
}
