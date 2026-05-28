import { SearchResult } from 'uniswap/src/features/search/SearchResult'

export type SearchHeaderKey = 'header'
export type SearchHeader = { type: SearchHeaderKey; title: string; icon?: JSX.Element }
export type SearchResultOrHeader = SearchResult | SearchHeader
