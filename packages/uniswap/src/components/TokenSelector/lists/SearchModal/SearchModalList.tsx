import { memo } from 'react'
import { SearchModalNoQueryList } from 'uniswap/src/components/TokenSelector/lists/SearchModal/SearchModalNoQueryList'
import { SearchModalResultsList } from 'uniswap/src/components/TokenSelector/lists/SearchModal/SearchModalResultsList'
import { OnSelectCurrency } from 'uniswap/src/components/TokenSelector/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

function _SearchModalList(props: {
  chainFilter: UniverseChainId | null
  parsedChainFilter: UniverseChainId | null
  searchFilter: string
  debouncedSearchFilter: string | null
  debouncedParsedSearchFilter: string | null
  onSelectCurrency: OnSelectCurrency
}): JSX.Element {
  const { chainFilter, searchFilter, onSelectCurrency } = props

  if (searchFilter.length === 0) {
    return <SearchModalNoQueryList chainFilter={chainFilter} onSelectCurrency={onSelectCurrency} />
  }
  return <SearchModalResultsList {...props} />
}

export const SearchModalList = memo(_SearchModalList)
