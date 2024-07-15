import Fuse from 'fuse.js'
import { unique } from 'utilities/src/primitives/array'
import { SearchableRecipient } from 'wallet/src/features/address/types'

export type AutocompleteOption<T> = { data: T; key: string }

const defaultOptions: Fuse.IFuseOptions<AutocompleteOption<SearchableRecipient>> = {
  includeMatches: true,
  isCaseSensitive: false,
  shouldSort: false, // search list is already sorted by preference
}

const searchAddressOptions: Fuse.IFuseOptions<AutocompleteOption<SearchableRecipient>> = {
  ...defaultOptions,
  threshold: 0,
  location: 0,
  keys: ['data.address'],
}

const searchNameOptions: Fuse.IFuseOptions<AutocompleteOption<SearchableRecipient>> = {
  ...defaultOptions,
  threshold: 0.5,
  keys: ['data.name'],
}

export function filterRecipientsByName(
  searchPattern: string | null,
  list: AutocompleteOption<SearchableRecipient>[]
): AutocompleteOption<SearchableRecipient>[] {
  if (!searchPattern) {
    return []
  }

  const fuse = new Fuse(list, searchNameOptions)

  const r = fuse.search(searchPattern)

  return r.map((result) => ({ data: result.item.data, key: result.item.key }))
}

export function filterRecipientsByAddress(
  searchPattern: string | null,
  list: AutocompleteOption<SearchableRecipient>[]
): AutocompleteOption<SearchableRecipient>[] {
  if (!searchPattern) {
    return []
  }

  const fuse = new Fuse(list, searchAddressOptions)

  const r = fuse.search(searchPattern)

  return r.map((result) => ({ data: result.item.data, key: result.item.key }))
}

export function filterRecipientByNameAndAddress(
  searchPattern: string | null,
  list: AutocompleteOption<SearchableRecipient>[]
): AutocompleteOption<SearchableRecipient>[] {
  if (!searchPattern) {
    return []
  }

  // run both fuses and remove dupes
  return unique(
    [
      ...filterRecipientsByAddress(searchPattern, list),
      ...filterRecipientsByName(searchPattern, list),
    ],
    (v, i, a) => a.findIndex((v2) => v2.data.address === v.data.address) === i
  )
}
