import { ImpactFeedbackStyle } from 'expo-haptics'
import { default as React } from 'react'
import { useAppDispatch } from 'src/app/hooks'
import { useAppStackNavigation } from 'src/app/navigation/types'
import { sendMobileAnalyticsEvent } from 'src/features/telemetry'
import { MobileEventName } from 'src/features/telemetry/constants'
import { Screens } from 'src/screens/Screens'
import { Flex, Icons, Text, TouchableArea } from 'ui/src'
import { iconSizes } from 'ui/src/theme'
import { NFTViewer } from 'wallet/src/features/images/NFTViewer'
import { SearchContext } from 'wallet/src/features/search/SearchContext'
import { addToSearchHistory } from 'wallet/src/features/search/searchHistorySlice'
import {
  NFTCollectionSearchResult,
  SearchResultType,
} from 'wallet/src/features/search/SearchResult'
import { ElementName } from 'wallet/src/telemetry/constants'

type NFTCollectionItemProps = {
  collection: NFTCollectionSearchResult
  searchContext?: SearchContext
}

export function SearchNFTCollectionItem({
  collection,
  searchContext,
}: NFTCollectionItemProps): JSX.Element {
  const { name, address, chainId, isVerified, imageUrl } = collection
  const dispatch = useAppDispatch()
  const navigation = useAppStackNavigation()

  const onPress = (): void => {
    navigation.navigate(Screens.NFTCollection, {
      collectionAddress: address,
    })

    if (searchContext) {
      sendMobileAnalyticsEvent(MobileEventName.ExploreSearchResultClicked, {
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
      })
    )
  }

  return (
    <TouchableArea
      hapticFeedback
      hapticStyle={ImpactFeedbackStyle.Light}
      testID={ElementName.SearchNFTCollectionItem}
      onPress={onPress}>
      <Flex
        row
        alignItems="center"
        gap="$spacing8"
        justifyContent="flex-start"
        px="$spacing8"
        py="$spacing12">
        <Flex
          centered
          borderRadius="$roundedFull"
          height={iconSizes.icon40}
          mr="$spacing4"
          overflow="hidden"
          width={iconSizes.icon40}>
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
          {isVerified ? <Icons.Verified color="$accent1" size="$icon.16" /> : null}
        </Flex>
      </Flex>
    </TouchableArea>
  )
}
