import Fuse from 'fuse.js'
import { AutocompleteOption } from 'src/components/autocomplete/Autocomplete'

const searchOptions: Fuse.IFuseOptions<AutocompleteOption<string>> = {
  includeMatches: true,
  isCaseSensitive: false,
  threshold: 0.5,
  // search list is already sorted by preference
  shouldSort: false,
  keys: ['data'],
}

export function filterRecipients(
  searchPattern: string | null,
  list: AutocompleteOption<string>[]
): AutocompleteOption<string>[] {
  if (!searchPattern) return []

  const fuse = new Fuse(list, searchOptions)

  const r = fuse.search(searchPattern)

  return r.map((result) => ({ data: result.item.data, key: result.item.key }))
}
