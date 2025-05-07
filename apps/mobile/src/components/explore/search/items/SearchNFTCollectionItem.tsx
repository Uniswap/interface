import { default as React } from 'react'
import { useDispatch } from 'react-redux'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { SEARCH_ITEM_ICON_SIZE, SEARCH_ITEM_PX, SEARCH_ITEM_PY } from 'src/components/explore/search/constants'
import { Flex, Text, TouchableArea } from 'ui/src'
import { Verified } from 'ui/src/components/icons'
import { SearchContext } from 'uniswap/src/features/search/SearchContext'
import { NFTCollectionSearchResult, SearchResultType } from 'uniswap/src/features/search/SearchResult'
import { addToSearchHistory } from 'uniswap/src/features/search/searchHistorySlice'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { NFTViewer } from 'wallet/src/features/images/NFTViewer'

type NFTCollectionItemProps = {
  collection: NFTCollectionSearchResult
  searchContext?: SearchContext
}

export function SearchNFTCollectionItem({ collection, searchContext }: NFTCollectionItemProps): JSX.Element {
  const { name, address, chainId, isVerified, imageUrl } = collection
  const dispatch = useDispatch()
  const navigation = useAppStackNavigation()

  const onPress = (): void => {
    navigation.navigate(MobileScreens.NFTCollection, {
      collectionAddress: address,
    })

    if (searchContext) {
      sendAnalyticsEvent(MobileEventName.ExploreSearchResultClicked, {
        query: searchContext.query,
        name,
        chain: chainId,
        address,
        type: 'collection',
        suggestion_count: searchContext.suggestionCount,
        position: searchContext.position,
        isHistory: searchContext.isHistory,
      })
    }

    dispatch(
      addToSearchHistory({
        searchResult: {
          type: SearchResultType.NFTCollection,
          chainId,
          address,
          name,
          imageUrl,
          isVerified,
        },
      }),
    )
  }

  return (
    <TouchableArea testID={TestID.SearchNFTCollectionItem} onPress={onPress}>
      <Flex row alignItems="center" gap="$spacing8" justifyContent="flex-start" px={SEARCH_ITEM_PX} py={SEARCH_ITEM_PY}>
        <Flex
          centered
          borderRadius="$roundedFull"
          height={SEARCH_ITEM_ICON_SIZE}
          mr="$spacing4"
          overflow="hidden"
          width={SEARCH_ITEM_ICON_SIZE}
        >
          {imageUrl ? (
            <NFTViewer uri={imageUrl} />
          ) : (
            <Text color="$neutral1" numberOfLines={1} textAlign="center">
              {name.slice(0, 1)}
            </Text>
          )}
        </Flex>
        <Flex shrink>
          <Text color="$neutral1" numberOfLines={1} variant="body1">
            {name}
          </Text>
        </Flex>
        <Flex grow alignItems="flex-start" width="$spacing36">
          {isVerified ? <Verified color="$accent1" size="$icon.16" /> : null}
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
