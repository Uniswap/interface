import { NetworkStatus } from '@apollo/client'
import { useScrollToTop } from '@react-navigation/native'
import { ImpactFeedbackStyle } from 'expo-haptics'
import React, { ReactElement, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { ListRenderItemInfo } from 'react-native'
import { useAnimatedScrollHandler, useSharedValue, withTiming } from 'react-native-reanimated'
import { AppStackScreenProp, useAppStackNavigation } from 'src/app/navigation/types'
import { TouchableArea } from 'src/components/buttons/TouchableArea'
import { NFTViewer } from 'src/components/images/NFTViewer'
import { Box, Flex } from 'src/components/layout'
import { AnimatedFlashList } from 'src/components/layout/AnimatedFlashList'
import { BaseCard } from 'src/components/layout/BaseCard'
import { Screen } from 'src/components/layout/Screen'
import { ScrollHeader } from 'src/components/layout/screens/ScrollHeader'
import { Loader } from 'src/components/loading'
import { Trace } from 'src/components/telemetry/Trace'
import { Text } from 'src/components/Text'
import { EMPTY_ARRAY } from 'src/constants/misc'
import { isError } from 'src/data/utils'
import {
  NftCollectionScreenQuery,
  useNftCollectionScreenQuery,
} from 'src/data/__generated__/types-and-hooks'
import { NFTCollectionContextMenu } from 'src/features/nfts/collection/NFTCollectionContextMenu'
import {
  NFTCollectionHeader,
  NFT_BANNER_HEIGHT,
} from 'src/features/nfts/collection/NFTCollectionHeader'
import { NFTItem } from 'src/features/nfts/types'
import { getNFTAssetKey } from 'src/features/nfts/utils'
import { ExploreModalAwareView } from 'src/screens/ModalAwareView'
import { Screens } from 'src/screens/Screens'
import { dimensions } from 'src/styles/sizing'
import { theme } from 'src/styles/theme'

const PREFETCH_ITEMS_THRESHOLD = 0.5
const ASSET_FETCH_PAGE_SIZE = 30
const ESTIMATED_ITEM_SIZE = 104 // heuristic provided by FlashList

const LOADING_ITEM = 'loading'
const LOADING_BUFFER_AMOUNT = 9
const LOADING_ITEMS_ARRAY = Array(LOADING_BUFFER_AMOUNT).fill(LOADING_ITEM)

const keyExtractor = (item: NFTItem | string, index: number): string =>
  typeof item === 'string'
    ? `${LOADING_ITEM}-${index}`
    : getNFTAssetKey(item.contractAddress ?? '', item.tokenId ?? '')

function gqlNFTAssetToNFTItem(data: NftCollectionScreenQuery | undefined): NFTItem[] {
  const items = data?.nftAssets?.edges?.flatMap((item) => item.node)
  if (!items) return EMPTY_ARRAY

  return items.map((item): NFTItem => {
    return {
      name: item?.name ?? undefined,
      contractAddress: item?.nftContract?.address ?? undefined,
      tokenId: item?.tokenId ?? undefined,
      imageUrl: item?.image?.url ?? undefined,
      collectionName: item?.collection?.name ?? undefined,
      ownerAddress: item.ownerAddress ?? undefined,
      imageDimensions:
        item?.image?.dimensions?.height && item?.image?.dimensions?.width
          ? { width: item.image.dimensions.width, height: item.image.dimensions.height }
          : undefined,
    }
  })
}

export function NFTCollectionScreen({
  route: {
    params: { collectionAddress },
  },
}: AppStackScreenProp<Screens.NFTCollection>): ReactElement {
  const { t } = useTranslation()
  const navigation = useAppStackNavigation()

  // Collection overview data and paginated grid items
  const { data, networkStatus, fetchMore, refetch } = useNftCollectionScreenQuery({
    variables: { contractAddress: collectionAddress, first: ASSET_FETCH_PAGE_SIZE },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-and-network',
  })

  // Parse response for overview data and collection grid data
  const collectionData = data?.nftCollections?.edges?.[0]?.node
  const collectionItems = useMemo(() => {
    return gqlNFTAssetToNFTItem(data)
  }, [data])

  // Fill in grid with loading boxes if we have incomplete data and are loading more
  const extraLoadingItemAmount =
    networkStatus === NetworkStatus.fetchMore || networkStatus === NetworkStatus.loading
      ? LOADING_BUFFER_AMOUNT + (3 - (collectionItems.length % 3))
      : undefined

  const onListEndReached = useCallback(() => {
    if (!data?.nftAssets?.pageInfo?.hasNextPage) return
    fetchMore({
      variables: {
        first: ASSET_FETCH_PAGE_SIZE,
        after: data?.nftAssets?.pageInfo?.endCursor,
      },
    })
  }, [data?.nftAssets?.pageInfo?.endCursor, data?.nftAssets?.pageInfo?.hasNextPage, fetchMore])

  // Scroll behavior for fixed scroll header
  // eslint-disable-next-line @typescript-eslint/no-explicit-any
  const listRef = useRef<any>(null)
  useScrollToTop(listRef)
  const scrollY = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler({
    onScroll: (event) => {
      scrollY.value = event.contentOffset.y
    },
    onEndDrag: (event) => {
      scrollY.value = withTiming(event.contentOffset.y > 0 ? NFT_BANNER_HEIGHT : 0)
    },
  })

  const onPressItem = (asset: NFTItem): void => {
    navigation.push(Screens.NFTItem, {
      owner: asset.ownerAddress ?? '',
      address: asset.contractAddress ?? '',
      tokenId: asset.tokenId ?? '',
      collectionName: asset.collectionName ?? '',
    })
  }

  /**
   * @TODO: @ianlapham We can remove these styles when FLashList supports
   * columnWrapperStyle prop (from FlatList). Until then, do this to preserve full width header,
   * but padded list.
   */
  const renderItem = ({ item, index }: ListRenderItemInfo<string | NFTItem>): JSX.Element => {
    const first = index % 3 === 0
    const last = index % 3 === 2
    const middle = !first && !last
    const containerStyle = {
      marginLeft: middle ? theme.spacing.spacing8 : first ? theme.spacing.spacing16 : 0,
      marginRight: middle ? theme.spacing.spacing8 : last ? theme.spacing.spacing16 : 0,
      marginBottom: theme.spacing.spacing8,
    }

    return (
      <Box
        aspectRatio={1}
        backgroundColor="backgroundOutline"
        borderRadius="rounded16"
        flex={1}
        overflow="hidden"
        style={containerStyle}>
        {typeof item === 'string' ? (
          <Loader.Box height="100%" width="100%" />
        ) : (
          <TouchableArea
            hapticFeedback
            activeOpacity={1}
            alignItems="center"
            flex={1}
            hapticStyle={ImpactFeedbackStyle.Light}
            onPress={(): void => onPressItem(item)}>
            <NFTViewer
              autoplay
              squareGridView
              imageDimensions={item.imageDimensions}
              limitGIFSize={ESTIMATED_ITEM_SIZE}
              placeholderContent={item.name || item.collectionName}
              uri={item.imageUrl}
            />
          </TouchableArea>
        )}
      </Box>
    )
  }

  // Only show loading UI if no data and first request, otherwise render cached data
  const headerDataLoading = networkStatus === NetworkStatus.loading && !collectionData
  const gridDataLoading = networkStatus === NetworkStatus.loading && !collectionItems

  const gridDataWithLoadingElements = useMemo(() => {
    if (gridDataLoading) {
      return LOADING_ITEMS_ARRAY
    }
    if (extraLoadingItemAmount) {
      return [...collectionItems, ...Array(extraLoadingItemAmount).fill(LOADING_ITEM)]
    }
    return collectionItems
  }, [collectionItems, extraLoadingItemAmount, gridDataLoading])

  const traceProperties = useMemo(
    () =>
      collectionData?.name
        ? { collectionAddress, collectionName: collectionData?.name }
        : undefined,
    [collectionAddress, collectionData?.name]
  )

  if (isError(networkStatus, !!data)) {
    return (
      <Screen edges={[]}>
        <Flex grow>
          <NFTCollectionHeader data={undefined} loading={true} />
          <BaseCard.ErrorState
            description={t('Something went wrong.')}
            retryButtonLabel={t('Retry')}
            title={t('Couldn’t load NFT collection')}
            onRetry={refetch}
          />
        </Flex>
      </Screen>
    )
  }

  return (
    <ExploreModalAwareView>
      <Trace
        directFromPage
        logImpression={!!traceProperties}
        properties={traceProperties}
        screen={Screens.NFTCollection}>
        <Screen edges={EMPTY_ARRAY}>
          <ScrollHeader
            fullScreen
            centerElement={
              collectionData?.name ? (
                <Text variant="bodyLarge">{collectionData.name}</Text>
              ) : undefined
            }
            listRef={listRef}
            rightElement={
              <NFTCollectionContextMenu
                collectionAddress={collectionAddress}
                data={collectionData}
              />
            }
            scrollY={scrollY}
            showHeaderScrollYDistance={NFT_BANNER_HEIGHT}
          />
          <AnimatedFlashList
            ref={listRef}
            ListEmptyComponent={
              gridDataLoading ? null : <BaseCard.EmptyState description={t('No NFTs found')} />
            }
            ListHeaderComponent={
              <NFTCollectionHeader
                collectionAddress={collectionAddress}
                data={collectionData}
                loading={headerDataLoading}
              />
            }
            data={gridDataWithLoadingElements}
            estimatedItemSize={ESTIMATED_ITEM_SIZE}
            estimatedListSize={{
              width: dimensions.fullWidth,
              height: dimensions.fullHeight,
            }}
            keyExtractor={keyExtractor}
            numColumns={3}
            renderItem={renderItem}
            showsVerticalScrollIndicator={false}
            onEndReached={onListEndReached}
            onEndReachedThreshold={PREFETCH_ITEMS_THRESHOLD}
            onScroll={scrollHandler}
          />
        </Screen>
      </Trace>
    </ExploreModalAwareView>
  )
}
