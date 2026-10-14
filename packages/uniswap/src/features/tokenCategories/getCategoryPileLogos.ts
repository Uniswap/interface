import type { TokenCategory, TokenCategoryPileLogo } from 'uniswap/src/features/tokenCategories/types'

/** The top groups when the backend serves them (grouped categories), else the top tokens. */
export function getCategoryPileLogos(category: TokenCategory): TokenCategoryPileLogo[] {
  if (category.topGroups.length > 0) {
    return category.topGroups.map((group) => ({
      key: group.id,
      name: group.displayName,
      symbol: group.ticker,
      logoUrl: group.logoUrl,
    }))
  }
  return category.topTokens.map((token) => ({
    key: `${token.chainId}-${token.address}`,
    name: token.symbol,
    symbol: token.symbol,
    logoUrl: token.logoUrl,
  }))
}
