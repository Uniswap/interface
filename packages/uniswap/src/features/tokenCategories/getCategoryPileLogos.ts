import type { Category, CategoryPileLogo, PoolCategoryTopPool } from 'uniswap/src/features/tokenCategories/types'

function toPairLogo(pool: PoolCategoryTopPool): CategoryPileLogo {
  return {
    key: `${pool.chainId}-${pool.poolId}`,
    token0: { key: pool.token0Symbol, name: pool.token0Symbol, symbol: pool.token0Symbol, logoUrl: pool.token0LogoUrl },
    token1: { key: pool.token1Symbol, name: pool.token1Symbol, symbol: pool.token1Symbol, logoUrl: pool.token1LogoUrl },
  }
}

/**
 * Tokens: the top groups when the backend serves them (grouped categories), else the top tokens.
 * Pools: the top pools, each as a split pair circle.
 */
export function getCategoryPileLogos(category: Category): CategoryPileLogo[] {
  if (category.kind === 'pool') {
    return category.topPools.map(toPairLogo)
  }
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
