import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { getRwaCategoryForTokenCategory } from 'uniswap/src/features/tokenCategories/rwaCategoryBridge'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { logger } from 'utilities/src/logger/logger'

export type GroupedRwaCategory = RwaCategory.STOCKS | RwaCategory.ETFS

/** The RWA categories the FE has a grouped (ListTokenGroups / ListRankedRwas) table for. */
export function isGroupedRwaCategory(rwaCategory: RwaCategory): rwaCategory is GroupedRwaCategory {
  return rwaCategory === RwaCategory.STOCKS || rwaCategory === RwaCategory.ETFS
}

const warnedUnsupported = new Set<string>()

/** Test-only: forget which ids already warned so a spec can assert the warn regardless of run order. */
export function resetGroupedCategoryWarnings(): void {
  warnedUnsupported.clear()
}

/**
 * The RwaCategory whose grouped (one row per underlying, issuers beneath) table this category renders, or
 * UNSPECIFIED for a flat token list. Whether a category groups is the BE's call (`category.grouped`); the RWA
 * mapping is what the grouped tables and ListTokenGroups key on, so a category the BE flags grouped that the FE
 * can't render grouped falls back to the flat list and warns once.
 */
export function getGroupedRwaCategory(category: TokenCategory): RwaCategory {
  if (!category.grouped) {
    return RwaCategory.UNSPECIFIED
  }
  const rwaCategory = getRwaCategoryForTokenCategory(category)
  if (isGroupedRwaCategory(rwaCategory)) {
    return rwaCategory
  }
  if (!warnedUnsupported.has(category.id)) {
    warnedUnsupported.add(category.id)
    logger.warn('groupedCategory', 'getGroupedRwaCategory', 'BE flagged a category grouped the FE renders flat', {
      id: category.id,
    })
  }
  return RwaCategory.UNSPECIFIED
}
