import type { SearchModalOption } from 'uniswap/src/components/lists/items/types'
import type { Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import {
  normalizeWords,
  startsAWordOf,
} from 'uniswap/src/features/search/SearchModal/hooks/useSectionsForSearchResultsUtils'
import { optionChainAddresses } from 'uniswap/src/features/search/SearchModal/stocks/applyRwaGrouping'
import {
  buildRwaCollectionOption,
  buildRwaSearchIndexFromRwas,
  findRwaForToken,
  getRwaCollectionSearchStats,
  type RwaSearchIndex,
  type RwaSearchIndexEntry,
} from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'
import { tagOptionAsRwa } from 'uniswap/src/features/search/SearchModal/stocks/tagOptionAsRwa'

/** A group rolls up into one expandable row only when more than one issuer tokenizes it; a lone issuer reads as a single row. */
const MIN_ISSUERS_FOR_COLLECTION = 2

/**
 * Group rows lead the list only for groups the query names directly, and only this many. The server also matches
 * through member names and symbols and returns up to its cap, so a one-letter query would otherwise stack fifteen
 * piles above every token hit.
 */
const MAX_LEADING_GROUP_ROWS = 3

function isPile(rwa: Rwa): boolean {
  return rwa.issuerTokens.length >= MIN_ISSUERS_FOR_COLLECTION
}

function isNamedByQuery(rwa: Rwa, normalizedQuery: string): boolean {
  return [rwa.name, rwa.symbol].some((text) => startsAWordOf(normalizeWords(text), normalizedQuery))
}

function findGroupForOption(index: RwaSearchIndex, option: SearchModalOption): RwaSearchIndexEntry | undefined {
  return optionChainAddresses(option)
    .map((chainAddress) => findRwaForToken(index, chainAddress))
    .find(Boolean)
}

/**
 * Lays the server's matched stock / ETF groups over the token hits. Every hit that belongs to a returned group is
 * tagged with it. Groups whose own name or ticker starts with the query lead the list, in the server's volume
 * order, up to MAX_LEADING_GROUP_ROWS: a multi-issuer group as one collection row, with the member tokens it covers
 * dropped from the hits (the server still returns them); a single-issuer group as a single row when no hit
 * carries it. Groups matched only through a member keep their tagged tokens in place and make no row. An address
 * search never rolls up, as the v1 fold does. Groups arrive scoped to the requested chains, so nothing is filtered
 * by chain here.
 */
export function applyServerTokenGroupsToSearchOptions({
  options,
  groups,
  searchQuery,
  isAddressSearch,
  plainTokenNames,
}: {
  options: SearchModalOption[]
  groups: Rwa[]
  searchQuery: string
  isAddressSearch: boolean
  plainTokenNames: boolean
}): SearchModalOption[] {
  if (groups.length === 0) {
    return options
  }

  const index = buildRwaSearchIndexFromRwas(groups)
  const taggedOptions = options.map((option) => {
    const match = findGroupForOption(index, option)
    return { option: match ? tagOptionAsRwa({ option, match, plainTokenNames }) : option, match }
  })

  if (isAddressSearch) {
    return taggedOptions.map(({ option }) => option)
  }

  const normalizedQuery = normalizeWords(searchQuery)
  const groupsCarriedByAHit = new Set<Rwa>(taggedOptions.flatMap(({ match }) => (match ? [match.rwa] : [])))
  const leadingGroups = normalizedQuery
    ? groups
        .filter((rwa) => isNamedByQuery(rwa, normalizedQuery) && (isPile(rwa) || !groupsCarriedByAHit.has(rwa)))
        .slice(0, MAX_LEADING_GROUP_ROWS)
    : []
  const groupRows = leadingGroups.map((rwa) =>
    buildRwaCollectionOption({ rwa, showCategoryTag: true, searchStats: getRwaCollectionSearchStats(rwa) }),
  )
  const rolledUp = new Set<Rwa>(leadingGroups.filter(isPile))
  const remainingOptions = taggedOptions
    .filter(({ match }) => !match || !rolledUp.has(match.rwa))
    .map(({ option }) => option)

  return [...groupRows, ...remainingOptions]
}
