import type { RwaCollectionOption } from 'uniswap/src/components/lists/items/types'
import type { Rwa } from 'uniswap/src/data/rest/rwa/types'
import { buildRwaCollectionOption } from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'

export const NO_QUERY_STOCKS_LIMIT = 3

export function buildNoQueryRwaCollectionOptions({
  rwas,
  limit = NO_QUERY_STOCKS_LIMIT,
}: {
  rwas: Rwa[]
  limit?: number
}): RwaCollectionOption[] {
  return rwas.slice(0, limit).map((rwa) =>
    buildRwaCollectionOption({
      rwa,
      // A single-issuer stock renders as a token row, so it carries its category tag; multi-issuer rows are
      // expandable tickers whose category is conveyed by the section header.
      showCategoryTag: rwa.issuerTokens.length === 1,
    }),
  )
}
