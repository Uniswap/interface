import type { TFunction } from 'i18next'
import { TokenCategoryClass } from 'uniswap/src/features/tokenCategories/types'

/**
 * Display label for a class bucket (mobile Categories page and web All dropdown). Fully keyed
 * (like TOKEN_CATEGORY_CLASS_ORDER) so a new TokenCategoryClass is a build error here.
 */
export function getTokenCategoryClassLabel(categoryClass: TokenCategoryClass, t: TFunction): string {
  const labels: Record<TokenCategoryClass, string> = {
    [TokenCategoryClass.Market]: t('explore.collections.class.market'),
    [TokenCategoryClass.Asset]: t('explore.collections.class.assets'),
    [TokenCategoryClass.Sector]: t('explore.collections.class.sectors'),
  }
  return labels[categoryClass]
}
