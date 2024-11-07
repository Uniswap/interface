import React from 'react'
import { NFTHeaderItem, TokenHeaderItem, WalletHeaderItem } from 'src/components/explore/search/constants'
import { SectionHeaderText } from 'src/components/explore/search/SearchSectionHeader'
import { SearchHeader } from 'src/components/explore/search/types'
import { Flex, Loader } from 'ui/src'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

function SectionLoader({ searchHeader, repeat = 1 }: { searchHeader: SearchHeader; repeat?: number }): JSX.Element {
  return (
    <Flex gap="$spacing12">
      <SectionHeaderText icon={searchHeader.icon} title={searchHeader.title} />
      <Flex mx="$spacing24">
        <Loader.SearchResult repeat={repeat} />
      </Flex>
    </Flex>
  )
}

/**
 * Placeholder component used while a search is loading.
 */
export function SearchResultsLoader({ selectedChain }: { selectedChain: UniverseChainId | null }): JSX.Element {
  // Only mainnet or "all" networks support nfts, hide loader otherwise
  const hideNftLoading = selectedChain !== null && selectedChain !== UniverseChainId.Mainnet
  return (
    <Flex gap="$spacing16">
      <SectionLoader searchHeader={TokenHeaderItem} repeat={2} />
      <SectionLoader searchHeader={WalletHeaderItem} />
      {!hideNftLoading && <SectionLoader searchHeader={NFTHeaderItem} repeat={2} />}
    </Flex>
  )
}
