import type { SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { getRwaTagCategory } from 'uniswap/src/data/rest/rwa/getRwaTagCategory'
import type { RwaSearchIndexEntry } from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'

/**
 * Stamps the RWA display fields a matched tokenized-stock row needs to render like its Token Detail Page: the
 * category, the clean asset name, and the raw issuer slug (formatted at render via formatIssuerLabel). Carries raw
 * data only, no presentation. Shared by live-search grouping, recents tagging, and token-selector tagging so the
 * three paths can't drift.
 *
 * Generic over the option type so callers keep their narrow type. Only reached after a successful `findRwaForToken`
 * match, which only `Token`/`MultichainToken` options produce, so the `as T` re-applies the input subtype safely.
 */
export function tagOptionAsRwa<T extends SearchModalOption>({
  option,
  match,
}: {
  option: T
  match: RwaSearchIndexEntry
}): T {
  return {
    ...option,
    rwaCategory: getRwaTagCategory({ categories: match.rwa.categories }),
    // Coalesce '' → undefined: name/issuer are non-optional proto3 scalars (unset = ''), and the render sites fall
    // back to the on-chain name/symbol only on undefined, not '' — so an empty string would blank the row instead.
    rwaName: match.rwa.name || undefined,
    rwaIssuerSlug: match.issuer.issuer || undefined,
  } as T
}
