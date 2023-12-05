import React, { useMemo } from 'react'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { SearchNFTCollectionItem } from 'src/components/explore/search/items/SearchNFTCollectionItem'
import {
  getSearchResultId,
  gqlNFTToNFTCollectionSearchResult,
} from 'src/components/explore/search/utils'
import { Loader } from 'src/components/loading'
import { NFTCollectionSearchResult, SearchResultType } from 'src/features/explore/SearchResult'
import { Inset } from 'ui/src'
import { useSearchPopularNftCollectionsQuery } from 'wallet/src/data/__generated__/types-and-hooks'

function isNFTCollectionSearchResult(
  result: NFTCollectionSearchResult | null
): result is NFTCollectionSearchResult {
  return (result as NFTCollectionSearchResult).type === SearchResultType.NFTCollection
}

export function SearchPopularNFTCollections(): JSX.Element {
  // Load popular NFTs by top trading volume
  const { data, loading } = useSearchPopularNftCollectionsQuery()

  const formattedItems = useMemo(() => {
    if (!data?.topCollections?.edges) return

    const searchResults = data.topCollections.edges.map(({ node }) =>
      gqlNFTToNFTCollectionSearchResult(node)
    )
    return searchResults.filter(isNFTCollectionSearchResult)
  }, [data])

  if (loading) {
    return (
      <Inset all="$spacing8">
        <Loader.Token repeat={2} />
      </Inset>
    )
  }

  return (
    <FlatList
      data={formattedItems}
      keyExtractor={getSearchResultId}
      renderItem={renderNFTCollectionItem}
    />
  )
}

const renderNFTCollectionItem = ({
  item,
}: ListRenderItemInfo<NFTCollectionSearchResult>): JSX.Element => (
  <SearchNFTCollectionItem collection={item} />
)
