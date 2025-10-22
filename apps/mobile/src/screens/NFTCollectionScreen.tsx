import { NetworkStatus } from '@apollo/client'
import { useScrollToTop } from '@react-navigation/native'
import { GraphQLApi, isError } from '@universe/api'
import React, { type ReactElement, useCallback, useMemo, useRef } from 'react'
import { useTranslation } from 'react-i18next'
import { type ListRenderItemInfo } from 'react-native'
import { useAnimatedScrollHandler, useSharedValue, withTiming } from 'react-native-reanimated'
import { type AppStackScreenProp, useAppStackNavigation } from 'src/app/navigation/types'
import { Screen } from 'src/components/layout/Screen'
import { ScrollHeader } from 'src/components/layout/screens/ScrollHeader'
import { Loader } from 'src/components/loading/loaders'
import { ListPriceBadge } from 'src/features/nfts/collection/ListPriceCard'
import { NFTCollectionContextMenu } from 'src/features/nfts/collection/NFTCollectionContextMenu'
import { NFT_BANNER_HEIGHT, NFTCollectionHeader } from 'src/features/nfts/collection/NFTCollectionHeader'
import { ExploreModalAwareView } from 'src/screens/ModalAwareView'
import { Flex, Text, TouchableArea } from 'ui/src'
import { AnimatedBottomSheetFlashList, AnimatedFlashList } from 'ui/src/components/AnimatedFlashList/AnimatedFlashList'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { iconSizes, spacing } from 'ui/src/theme'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { NFTViewer } from 'uniswap/src/components/nfts/images/NFTViewer'
import { type NFTItem } from 'uniswap/src/features/nfts/types'
import { getNFTAssetKey } from 'uniswap/src/features/nfts/utils'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { isIOS } from 'utilities/src/platform'

const PREFETCH_ITEMS_THRESHOLD = 0.5
const ASSET_FETCH_PAGE_SIZE = 30
const ESTIMATED_ITEM_SIZE = 104 // heuristic provided by FlashList

const LOADING_ITEM = 'loading'
const LOADING_BUFFER_AMOUNT = 9
const LOADING_ITEMS_ARRAY: NFTItem[] = Array(LOADING_BUFFER_AMOUNT).fill(LOADING_ITEM)

const keyExtractor = (item: NFTItem | string, index: number): string =>
  typeof item === 'string' ? `${LOADING_ITEM}-${index}` : getNFTAssetKey(item.contractAddress ?? '', item.tokenId ?? '')

function gqlNFTAssetToNFTItem(data: GraphQLApi.NftCollectionScreenQuery | undefined): NFTItem[] | undefined {
  const items = data?.nftAssets?.edges.flatMap((item) => item.node)
  if (!items) {
    return undefined
  }

  return items.map((item): NFTItem => {
    return {
      name: item.name ?? undefined,
      contractAddress: item.nftContract?.address ?? undefined,
      tokenId: item.tokenId,
      imageUrl: item.image?.url ?? undefined,
      collectionName: item.collection?.name ?? undefined,
      ownerAddress: item.ownerAddress ?? undefined,
      imageDimensions:
        item.image?.dimensions?.height && item.image.dimensions.width
          ? { width: item.image.dimensions.width, height: item.image.dimensions.height }
          : undefined,
      listPrice: item.listings?.edges[0]?.node.price ?? undefined,
    }
  })
}

type NFTCollectionScreenProps = AppStackScreenProp<MobileScreens.NFTCollection> & {
  renderedInModal?: boolean
}

export function NFTCollectionScreen({
  route: {
    params: { collectionAddress },
  },
  renderedInModal = false,
}: NFTCollectionScreenProps): ReactElement {
  const { t } = useTranslation()
  const insets = useAppInsets()
  const dimensions = useDeviceDimensions()
  const navigation = useAppStackNavigation()

  // Collection overview data and paginated grid items
  const { data, networkStatus, fetchMore, refetch } = GraphQLApi.useNftCollectionScreenQuery({
    variables: { contractAddress: collectionAddress, first: ASSET_FETCH_PAGE_SIZE },
    notifyOnNetworkStatusChange: true,
    fetchPolicy: 'cache-and-network',
  })

  // Parse response for overview data and collection grid data
  const collectionData = data?.nftCollections?.edges[0]?.node
  const collectionItems = useMemo(() => gqlNFTAssetToNFTItem(data), [data])

  // Fill in grid with loading boxes if we have incomplete data and are loading more
  const extraLoadingItemAmount =
    networkStatus === NetworkStatus.fetchMore || networkStatus === NetworkStatus.loading
      ? LOADING_BUFFER_AMOUNT + (3 - ((collectionItems ?? []).length % 3))
      : undefined

  const onListEndReached = useCallback(async () => {
    if (!data?.nftAssets?.pageInfo.hasNextPage) {
      return
    }
    await fetchMore({
      variables: {
        first: ASSET_FETCH_PAGE_SIZE,
        after: data.nftAssets.pageInfo.endCursor,
      },
    })
  }, [data?.nftAssets?.pageInfo.endCursor, data?.nftAssets?.pageInfo.hasNextPage, fetchMore])

  // Scroll behavior for fixed scroll header
  // biome-ignore lint/suspicious/noExplicitAny: FlashList ref type is complex and any is acceptable here
  const listRef = useRef<any>(null)
  useScrollToTop(listRef)
  const scrollY = useSharedValue(0)
  const scrollHandler = useAnimatedScrollHandler(
    {
      onScroll: (event) => {
        scrollY.value = event.contentOffset.y
      },
      onEndDrag: (event) => {
        scrollY.value = withTiming(event.contentOffset.y > 0 ? NFT_BANNER_HEIGHT : 0)
      },
    },
    [scrollY],
  )

  const onPressItem = (asset: NFTItem): void => {
    navigation.navigate(MobileScreens.NFTItem, {
      address: asset.contractAddress ?? '',
      tokenId: asset.tokenId ?? '',
      isSpam: asset.isSpam ?? false,
      fallbackData: asset,
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
      marginLeft: middle ? spacing.spacing8 : first ? spacing.spacing16 : 0,
      marginRight: middle ? spacing.spacing8 : last ? spacing.spacing16 : 0,
      marginBottom: spacing.spacing8,
    }
    const priceColor = isIOS ? '$white' : '$neutral1'

    return (
      <Flex
        fill
        aspectRatio={1}
        backgroundColor="$surface3"
        borderRadius="$rounded16"
        overflow="hidden"
        style={containerStyle}
      >
        {typeof item === 'string' ? (
          <Loader.Box height="100%" width="100%" />
        ) : (
          <TouchableArea activeOpacity={1} alignItems="center" flex={1} onPress={(): void => onPressItem(item)}>
            <NFTViewer
              autoplay
              svgRenderingDisabled
              squareGridView
              imageDimensions={item.imageDimensions}
              limitGIFSize={ESTIMATED_ITEM_SIZE}
              placeholderContent={item.name || item.collectionName}
              uri={item.imageUrl}
              thumbnailUrl={item.thumbnailUrl}
            />
            {item.listPrice && (
              <ListPriceBadge
                bottom={spacing.spacing4}
                iconColor={priceColor}
                iconSize={iconSizes.icon12}
                position="absolute"
                price={item.listPrice}
                right={spacing.spacing4}
                textColor={priceColor}
              />
            )}
          </TouchableArea>
        )}
      </Flex>
    )
  }

  // Only show loading UI if no data and first request, otherwise render cached data
  const headerDataLoading = networkStatus === NetworkStatus.loading && !collectionData
  const gridDataLoading = networkStatus === NetworkStatus.loading && !collectionItems

  const gridDataWithLoadingElements = useMemo(() => {
    if (gridDataLoading) {
      return LOADING_ITEMS_ARRAY
    }

    const extraLoadingItems: NFTItem[] = extraLoadingItemAmount ? Array(extraLoadingItemAmount).fill(LOADING_ITEM) : []

    return [...(collectionItems ?? []), ...extraLoadingItems]
  }, [collectionItems, extraLoadingItemAmount, gridDataLoading])

  const traceProperties = useMemo(
    () => (collectionData?.name ? { collectionAddress, collectionName: collectionData.name } : undefined),
    [collectionAddress, collectionData?.name],
  )

  if (isError(networkStatus, !!data)) {
    return (
      <Screen noInsets={true}>
        <Flex grow gap="$spacing16">
          <NFTCollectionHeader data={undefined} loading={true} />
          <BaseCard.ErrorState
            description={t('common.error.general')}
            retryButtonLabel={t('common.button.retry')}
            title={t('tokens.nfts.collection.error.load.title')}
            onRetry={refetch}
          />
        </Flex>
      </Screen>
    )
  }

  const List = renderedInModal ? AnimatedBottomSheetFlashList : AnimatedFlashList

  return (
    <ExploreModalAwareView>
      <Trace
        directFromPage
        logImpression={!!traceProperties}
        properties={traceProperties}
        screen={MobileScreens.NFTCollection}
      >
        <Screen noInsets={true}>
          <ScrollHeader
            fullScreen
            centerElement={collectionData?.name ? <Text variant="body1">{collectionData.name}</Text> : undefined}
            listRef={listRef}
            rightElement={<NFTCollectionContextMenu data={collectionData} />}
            scrollY={scrollY}
            showHeaderScrollYDistance={NFT_BANNER_HEIGHT}
          />
          <List
            ref={listRef}
            ListEmptyComponent={
              gridDataLoading ? null : <BaseCard.EmptyState description={t('tokens.nfts.empty.description')} />
            }
            ListHeaderComponent={<NFTCollectionHeader data={collectionData} loading={headerDataLoading} />}
            contentContainerStyle={{ paddingBottom: insets.bottom }}
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
