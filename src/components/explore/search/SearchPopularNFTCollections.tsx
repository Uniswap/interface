import React, { useMemo } from 'react'
import { FlatList, ListRenderItemInfo } from 'react-native'
import { SearchNFTCollectionItem } from 'src/components/explore/search/items/SearchNFTCollectionItem'
import {
  getSearchResultId,
  gqlNFTToNFTCollectionSearchResult,
} from 'src/components/explore/search/utils'
import { Inset } from 'src/components/layout'
import { Loader } from 'src/components/loading'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { useSearchPopularNftCollectionsQuery } from 'src/data/__generated__/types-and-hooks'
import { NFTCollectionSearchResult } from 'src/features/explore/searchHistorySlice'

export function SearchPopularNFTCollections(): JSX.Element {
  // Load popular NFTs by top trading volume
  const { data, loading } = useSearchPopularNftCollectionsQuery()

  const formattedItems = useMemo(() => {
    if (!data?.topCollections?.edges) return EMPTY_ARRAY
    return data.topCollections.edges.map(({ node }) => gqlNFTToNFTCollectionSearchResult(node))
  }, [data])

  if (loading) {
    return (
      <Inset all="spacing8">
        <Loader.Token repeat={2} />
      </Inset>
    )
  }

  return (
    <FlatList
      data={formattedItems}
      keyExtractor={getSearchResultId}
      listKey="collections"
      renderItem={renderNFTCollectionItem}
    />
  )
}

const renderNFTCollectionItem = ({
  item,
}: ListRenderItemInfo<NFTCollectionSearchResult>): JSX.Element => (
  <SearchNFTCollectionItem collection={item} />
)
