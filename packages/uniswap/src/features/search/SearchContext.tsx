import { OnchainItemSectionName } from 'uniswap/src/components/TokenSelector/types'

export interface SearchContext {
  category?: OnchainItemSectionName
  query?: string
  position?: number
  suggestionCount?: number
  isHistory?: boolean // history item click
}
