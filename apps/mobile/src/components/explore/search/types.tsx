import { SearchResult } from 'src/features/explore/SearchResult'
import { SEARCH_RESULT_HEADER_KEY } from './constants'

// Header type used to render header text instead of SearchResult item

export type SearchResultOrHeader =
  | SearchResult
  | { type: typeof SEARCH_RESULT_HEADER_KEY; title: string }
