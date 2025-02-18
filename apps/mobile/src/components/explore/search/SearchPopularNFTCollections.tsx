import React, { useMemo } from 'react'
import { ListRenderItemInfo } from 'react-native'
import { FlatList } from 'react-native-gesture-handler'
import { SEARCH_ITEM_PX, SEARCH_ITEM_PY } from 'src/components/explore/search/constants'
import { SearchNFTCollectionItem } from 'src/components/explore/search/items/SearchNFTCollectionItem'
import { getSearchResultId, gqlNFTToNFTCollectionSearchResult } from 'src/components/explore/search/utils'
import { Flex, Loader } from 'ui/src'
import { useSearchPopularNftCollectionsQuery } from 'uniswap/src/data/graphql/uniswap-data-api/__generated__/types-and-hooks'
import { NFTCollectionSearchResult, SearchResultType } from 'uniswap/src/features/search/SearchResult'

function isNFTCollectionSearchResult(result: NFTCollectionSearchResult | null): result is NFTCollectionSearchResult {
  return (result as NFTCollectionSearchResult).type === SearchResultType.NFTCollection
}

export function SearchPopularNFTCollections(): JSX.Element {
  // Load popular NFTs by top trading volume
  const { data, loading } = useSearchPopularNftCollectionsQuery()

  const formattedItems = useMemo(() => {
    if (!data?.topCollections?.edges) {
      return undefined
    }

    const searchResults = data.topCollections.edges.map(({ node }) => gqlNFTToNFTCollectionSearchResult(node))
    return searchResults.filter(isNFTCollectionSearchResult)
  }, [data])

  if (loading) {
    return (
      <Flex px={SEARCH_ITEM_PX} py={SEARCH_ITEM_PY}>
        <Loader.Token repeat={2} />
      </Flex>
    )
  }

  return <FlatList data={formattedItems} keyExtractor={getSearchResultId} renderItem={renderNFTCollectionItem} />
}

const renderNFTCollectionItem = ({ item }: ListRenderItemInfo<NFTCollectionSearchResult>): JSX.Element => (
  <SearchNFTCollectionItem collection={item} />
)
