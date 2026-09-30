import type { TFunction } from 'i18next'
import { isKnownTokenCategoryId } from 'uniswap/src/features/tokenCategories/knownTokenCategoryIds'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'

/**
 * Section title for a single-category related-tokens list ("More stock tokens"). BE has no
 * singular name field, so the singular forms live here as literal keys per backend id — keep them
 * literal, `i18n:extract` prunes keys it can't see statically. Unknown ids fall back to the plural name;
 * the switch is exhaustive over the known ids so a new one fails to compile until it gets a key.
 */
export function getRelatedTokensTitle({ t, category }: { t: TFunction; category: TokenCategory }): string {
  if (!isKnownTokenCategoryId(category.id)) {
    return t('tdp.relatedTokens.single.fallback', { category: category.name })
  }
  switch (category.id) {
    case 'stocks':
      return t('tdp.relatedTokens.single.stocks')
    case 'etfs':
      return t('tdp.relatedTokens.single.etfs')
    case 'commodities':
      return t('tdp.relatedTokens.single.commodities')
    case 'stablecoins':
      return t('tdp.relatedTokens.single.stablecoins')
    case 'defi':
      return t('tdp.relatedTokens.single.defi')
    case 'gaming':
      return t('tdp.relatedTokens.single.gaming')
    case 'ai-infra':
      return t('tdp.relatedTokens.single.aiInfra')
    case 'ai-agents':
      return t('tdp.relatedTokens.single.aiAgents')
    case 'majors':
      return t('tdp.relatedTokens.single.majors')
    case 'top-gainers':
      return t('tdp.relatedTokens.single.topGainers')
    case 'top-losers':
      return t('tdp.relatedTokens.single.topLosers')
    case 'trending':
      return t('tdp.relatedTokens.single.trending')
    case 'recently-launched':
      return t('tdp.relatedTokens.single.recentlyLaunched')
    case 'high-volatility':
      return t('tdp.relatedTokens.single.highVolatility')
    case 'low-volatility':
      return t('tdp.relatedTokens.single.lowVolatility')
    default: {
      const unhandled: never = category.id
      return t('tdp.relatedTokens.single.fallback', { category: String(unhandled) })
    }
  }
}
