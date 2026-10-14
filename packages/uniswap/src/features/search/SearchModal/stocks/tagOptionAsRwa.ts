import { OnchainItemListOptionType, type SearchModalOption } from 'uniswap/src/components/lists/items/types'
import { getRwaTagCategory } from 'uniswap/src/data/apiClients/dataApiService/rwa/getRwaTagCategory'
import type { RWAIssuerDisplay } from 'uniswap/src/features/rwa/types'
import type { RwaSearchIndexEntry } from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'

/** The option's own v2 `TokenIssuerInfo`, when its payload carried one; absent on v1-built options. */
function getOptionIssuer(option: SearchModalOption): RWAIssuerDisplay | undefined {
  switch (option.type) {
    case OnchainItemListOptionType.Token:
      return option.currencyInfo.issuer
    case OnchainItemListOptionType.MultichainToken:
      return option.primaryCurrencyInfo.issuer ?? option.multichainResult.tokens.find((t) => t.issuer)?.issuer
    default:
      return undefined
  }
}

/**
 * Stamps the RWA display fields a matched tokenized-stock row needs to render like its Token Detail Page: the
 * category, the clean asset name, and the issuer branding (labelled at render via getIssuerTokenLabel). Carries raw
 * data only, no presentation. Shared by live-search grouping, recents tagging, and token-selector tagging so the
 * three paths can't drift.
 *
 * `plainTokenNames` (token categories on) leaves `rwaName` unset so the row keeps the token's own name.
 *
 * Generic over the option type so callers keep their narrow type. Only reached after a successful `findRwaForToken`
 * match, which only `Token`/`MultichainToken` options produce, so the `as T` re-applies the input subtype safely.
 */
export function tagOptionAsRwa<T extends SearchModalOption>({
  option,
  match,
  plainTokenNames,
}: {
  option: T
  match: RwaSearchIndexEntry
  plainTokenNames: boolean
}): T {
  // The v1 ListRwas index carries only the issuer slug; a v2-built option brings the backend display name and logo.
  const optionIssuer = getOptionIssuer(option)
  return {
    ...option,
    rwaCategory: getRwaTagCategory({ categories: match.rwa.categories }),
    // Coalesce '' → undefined: name/issuer are non-optional proto3 scalars (unset = ''), and the render sites fall
    // back to the on-chain name/symbol only on undefined, not '' — so an empty string would blank the row instead.
    rwaName: plainTokenNames ? undefined : match.rwa.name || undefined,
    rwaIssuer: match.issuer.issuer
      ? {
          issuer: match.issuer.issuer,
          issuerDisplayName: match.issuer.issuerDisplayName ?? optionIssuer?.issuerDisplayName,
          issuerLogoUrl: match.issuer.issuerLogoUrl ?? optionIssuer?.issuerLogoUrl,
        }
      : undefined,
  } as T
}
