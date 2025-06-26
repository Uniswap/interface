import { OnchainItemSectionName } from 'uniswap/src/components/lists/OnchainItemList/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { SearchTab } from 'uniswap/src/features/search/SearchModal/types'

export type SearchFilterContext = {
  query?: string
  searchChainFilter: UniverseChainId | null
  searchTabFilter: SearchTab
}

export type SearchContext = {
  category?: OnchainItemSectionName
  query?: string
  position?: number
  suggestionCount?: number
  isHistory?: boolean // history item click
} & Partial<SearchFilterContext>
