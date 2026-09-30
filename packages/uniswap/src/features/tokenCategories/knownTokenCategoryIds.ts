/**
 * Backend ListCategories ids the FE special-cases (singular titles, icons). Ids outside this list
 * still render, with generic fallbacks. Adding an id here forces every exhaustive switch to handle it.
 */
export const KNOWN_TOKEN_CATEGORY_IDS = [
  'trending',
  'recently-launched',
  'top-gainers',
  'top-losers',
  'high-volatility',
  'low-volatility',
  'majors',
  'stablecoins',
  'stocks',
  'etfs',
  'commodities',
  'defi',
  'gaming',
  'ai-infra',
  'ai-agents',
] as const

export type KnownTokenCategoryId = (typeof KNOWN_TOKEN_CATEGORY_IDS)[number]

export function isKnownTokenCategoryId(id: string): id is KnownTokenCategoryId {
  return (KNOWN_TOKEN_CATEGORY_IDS as readonly string[]).includes(id)
}
