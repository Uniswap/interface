/**
 * Word-prefix search for the Command recipe (INFRA-3021 shadcn set): an
 * exact port of the legacy NetworkFilterV2 search semantics
 * (`uniswap/src/components/network/NetworkFilterV2/useNetworkFilterSearch.ts`
 * — normalizeNetworkSearchQuery + doesFieldMatchSearchPrefix), generalized
 * over label + keywords. Pure and platform-neutral; the option-list compat
 * layer re-exports it (single source of truth for the matcher).
 */

export interface SearchableOptionFields {
  label: string
  keywords?: string[]
}

export function normalizeOptionSearchQuery(query: string): string {
  return query.trim().replace(/\s+/g, ' ').toLowerCase()
}

function doesFieldMatchSearchPrefix(field: unknown, normalizedQuery: string): boolean {
  // Host option data is often loosely typed (labels/keywords from API payloads):
  // a non-string entry must not throw mid-keystroke — it simply never matches.
  if (typeof field !== 'string') {
    return false
  }

  const normalizedField = normalizeOptionSearchQuery(field)

  if (!normalizedField || !normalizedQuery) {
    return false
  }

  const fieldWords = normalizedField.split(' ')
  const queryWords = normalizedQuery.split(' ')

  return fieldWords.some((_, startIndex) =>
    queryWords.every((queryWord, queryIndex) => fieldWords[startIndex + queryIndex]?.startsWith(queryWord)),
  )
}

/** True when the option's label or any keyword word-prefix-matches the query (empty query matches all). */
export function optionMatchesSearchQuery(option: SearchableOptionFields, query: string): boolean {
  const normalizedQuery = normalizeOptionSearchQuery(query)
  if (!normalizedQuery) {
    return true
  }
  // Loose host data again: a non-array keywords container must not throw on
  // spread (a bare string would even spread into characters) — ignore it.
  const searchableFields = [option.label, ...(Array.isArray(option.keywords) ? option.keywords : [])]
  return searchableFields.some((field) => doesFieldMatchSearchPrefix(field, normalizedQuery))
}
