import { SEARCH_RESULT_HEADER_KEY } from 'src/components/explore/search/constants'
import { SearchResult } from 'wallet/src/features/search/SearchResult'

// Header type used to render header text instead of SearchResult item

export type SearchResultOrHeader =
  | SearchResult
  | { type: typeof SEARCH_RESULT_HEADER_KEY; title: string; icon?: JSX.Element }
