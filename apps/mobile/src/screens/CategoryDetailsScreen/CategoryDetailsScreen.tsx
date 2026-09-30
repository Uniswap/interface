import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { TokensOrderBy } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { RankingType } from '@universe/api'
import type { UniverseChainId } from '@universe/chains'
import {
  Flex,
  spacing,
  UniversalList,
  type UniversalListRef,
  type UniversalListRenderItemInfo,
  type UniversalListScrollEvent,
  type UniversalListStyle,
} from '@universe/mycelium'
import React, { useCallback, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { useWindowDimensions } from 'react-native'
import { useSharedValue } from 'react-native-reanimated'
import type { AppStackScreenProp } from 'src/app/navigation/types'
import {
  EXPLORE_SKELETON_LIST_ITEMS,
  EXPLORE_TOKEN_CONTAINER_PROPS,
  EXPLORE_TOKEN_ROW_HEIGHT,
  exploreListItemsAreEqual,
  tokenItemDataKey,
  WINDOW_MULTIPLIER,
  type ExploreListItem,
} from 'src/components/explore/ExploreSections/exploreListItems'
import { NetworkPills } from 'src/components/explore/ExploreSections/NetworkPillsRow'
import { useExploreTokenItems } from 'src/components/explore/ExploreSections/useExploreTokenItems'
import { TokenItem } from 'src/components/explore/TokenItem'
import { Screen } from 'src/components/layout/Screen'
import { ScrollHeader } from 'src/components/layout/screens/ScrollHeader'
import {
  CategoryDetailsHeader,
  CategoryDetailsHeaderSkeleton,
} from 'src/screens/CategoryDetailsScreen/CategoryDetailsHeader'
import { CategoryGroupingRow } from 'src/screens/CategoryDetailsScreen/CategoryGroupingRow'
import { CategoryHeaderTitleElement } from 'src/screens/CategoryDetailsScreen/CategoryHeaderTitleElement'
import { Loader } from 'ui/src'
import { NoTokens } from 'ui/src/components/icons'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { useListCategoriesQuery } from 'uniswap/src/data/apiClients/dataApiService/categories/useListCategoriesQuery'
import type { Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { useExploreRwaRows } from 'uniswap/src/data/apiClients/dataApiService/rwa/useExploreRwaRows'
import { getExpandableSearchRowHeightPx } from 'uniswap/src/features/expandableAsset/expandableAssetLayout'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import Trace from 'uniswap/src/features/telemetry/Trace'
import { getGroupedRwaCategory } from 'uniswap/src/features/tokenCategories/groupedCategory'
import type { TokenCategory } from 'uniswap/src/features/tokenCategories/types'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { useEvent } from 'utilities/src/react/hooks'

const SHOW_HEADER_SCROLL_Y_DISTANCE = 50
// ~60fps scroll events so the collapsing header tracks the drag rather than stepping.
const SCROLL_EVENT_THROTTLE = 16

type GroupingListItem = {
  rowType: 'grouping'
  key: string
  grouping: Rwa
  isExpanded: boolean
}

type CategoryListItem = ExploreListItem | GroupingListItem

export function CategoryDetailsScreen({ route }: AppStackScreenProp<MobileScreens.CategoryDetails>): JSX.Element {
  const { categoryId } = route.params
  const { data: categories, isLoading } = useListCategoriesQuery()
  const category = categories?.find((tokenCategory) => tokenCategory.id === categoryId)

  // Trace only wraps the real page: an unknown id shows the fallback and must not count as a category view.
  if (!category) {
    return <CategoryDetailsFallback isLoading={isLoading} />
  }

  return (
    <Trace directFromPage logImpression properties={{ categoryId }} screen={MobileScreens.CategoryDetails}>
      <CategoryDetailsContent category={category} />
    </Trace>
  )
}

/** Loading and unknown-category states share the screen chrome so back navigation always works. */
function CategoryDetailsFallback({ isLoading }: { isLoading: boolean }): JSX.Element {
  const { t } = useTranslation()
  const scrollY = useSharedValue(0)
  const listRef = useRef<UniversalListRef>(null)

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScrollHeader listRef={listRef} scrollY={scrollY} showHeaderScrollYDistance={SHOW_HEADER_SCROLL_Y_DISTANCE} />
      {isLoading ? (
        <CategoryDetailsHeaderSkeleton />
      ) : (
        <Flex fill pb="$spacing60">
          <BaseCard.EmptyState description={t('explore.tokens.error')} />
        </Flex>
      )}
    </Screen>
  )
}

function CategoryDetailsContent({ category }: { category: TokenCategory }): JSX.Element {
  const { t } = useTranslation()
  const insets = useAppInsets()
  const dimensions = useWindowDimensions()
  const scrollY = useSharedValue(0)
  const listRef = useRef<UniversalListRef>(null)
  const [selectedNetwork, setSelectedNetwork] = useState<UniverseChainId | null>(null)

  // BE-grouped categories (Stocks/ETFs) render expandable token-grouping rows, matching the web category page;
  // everything else lists ranked tokens.
  const rwaCategory = getGroupedRwaCategory(category)
  const isGroupedCategory = rwaCategory !== RwaCategory.UNSPECIFIED

  const { topTokenItems, isLoading, isFetching, fetchNextPage, hasNextPage, error, refetch } = useExploreTokenItems({
    selectedNetwork,
    orderBy: RankingType.Volume,
    categoryId: category.id,
    skip: isGroupedCategory,
  })

  const groupingChainIds = useMemo(() => (selectedNetwork ? [selectedNetwork] : []), [selectedNetwork])
  const {
    rows: groupings,
    isLoading: isGroupingsLoading,
    isError: isGroupingsError,
    refetch: refetchGroupings,
    fetchNextPage: fetchNextGroupingsPage,
    hasNextPage: hasNextGroupingsPage,
    isFetchingNextPage: isFetchingNextGroupingsPage,
  } = useExploreRwaRows({
    category: rwaCategory,
    chainIds: groupingChainIds,
    volumeOrderBy: TokensOrderBy.VOLUME_1D,
    enabled: isGroupedCategory,
  })

  const [expandedGroupingKeys, setExpandedGroupingKeys] = useState<string[]>([])
  const onToggleGroupingRow = useEvent((key: string) => {
    setExpandedGroupingKeys((prev) => (prev.includes(key) ? prev.filter((k) => k !== key) : [...prev, key]))
  })

  const onScroll = useEvent((event: UniversalListScrollEvent) => {
    scrollY.value = event.nativeEvent.contentOffset.y
  })

  const onSelectNetwork = useEvent((network: UniverseChainId | null) => {
    setSelectedNetwork(network)
  })

  const onEndReached = useEvent(() => {
    if (isGroupedCategory) {
      if (hasNextGroupingsPage && !isFetchingNextGroupingsPage) {
        fetchNextGroupingsPage()
      }
    } else if (hasNextPage && !isFetching) {
      fetchNextPage()
    }
  })

  const onRetry = useCallback(async () => {
    await (isGroupedCategory ? refetchGroupings() : refetch())
  }, [isGroupedCategory, refetchGroupings, refetch])

  const listEmptyComponent = useMemo(() => {
    // Each branch gates on its own hook's loading — the other hook is skipped and its state is meaningless.
    if (isGroupedCategory ? isGroupingsLoading : isLoading) {
      return null
    }
    if (isGroupedCategory ? isGroupingsError : error) {
      return (
        <Flex centered pt="$spacing48" px="$spacing36">
          <BaseCard.ErrorState
            retryButtonLabel={t('common.button.retry')}
            title={t('explore.tokens.error')}
            onRetry={onRetry}
          />
        </Flex>
      )
    }
    return (
      <Flex centered pt="$spacing48" px="$spacing36">
        <BaseCard.EmptyState
          description={t('explore.tokens.empty.description')}
          icon={<NoTokens color="$neutral3" size="$icon.70" />}
          title={t('explore.tokens.empty.title')}
        />
      </Flex>
    )
  }, [isLoading, isGroupingsLoading, isGroupedCategory, isGroupingsError, error, onRetry, t])

  const listData: CategoryListItem[] = useMemo(() => {
    if (isGroupedCategory) {
      if (isGroupingsLoading) {
        return EXPLORE_SKELETON_LIST_ITEMS
      }
      // Groups are keyed by ticker per the ListRankedRwas grouping contract, but de-dupe like the
      // token branch anyway — a collision would corrupt recycled cells and gang expansion toggles.
      const seenGroupingCounts = new Map<string, number>()
      return groupings.map((grouping): GroupingListItem => {
        const count = seenGroupingCounts.get(grouping.symbol) ?? 0
        seenGroupingCounts.set(grouping.symbol, count + 1)
        const key = count === 0 ? grouping.symbol : `${grouping.symbol}-${count}`
        return {
          rowType: 'grouping',
          key,
          grouping,
          // Gate on expandability, not just the key set: a network-filter change can shrink a ticker
          // to one issuer while its key lingers in expandedGroupingKeys, which would force-size the
          // cell to expanded height with no way to collapse it.
          isExpanded: grouping.issuerTokens.length > 1 && expandedGroupingKeys.includes(key),
        }
      })
    }
    if (isLoading) {
      return EXPLORE_SKELETON_LIST_ITEMS
    }
    const seenCounts = new Map<string, number>()
    return topTokenItems.map((item): ExploreListItem => {
      const baseKey = tokenItemDataKey(item.tokenItemData)
      const count = seenCounts.get(baseKey) ?? 0
      seenCounts.set(baseKey, count + 1)
      return {
        rowType: 'token',
        key: count === 0 ? baseKey : `${baseKey}-${count}`,
        ...item,
      }
    })
  }, [isGroupedCategory, isGroupingsLoading, groupings, expandedGroupingKeys, isLoading, topTokenItems])

  const renderItem = useCallback(
    ({ item, index }: UniversalListRenderItemInfo<CategoryListItem>): JSX.Element => {
      if (item.rowType === 'skeleton') {
        return (
          <Flex height={EXPLORE_TOKEN_ROW_HEIGHT} justifyContent="center" px="$spacing24">
            <Loader.Token />
          </Flex>
        )
      }

      if (item.rowType === 'grouping') {
        return (
          <CategoryGroupingRow
            grouping={item.grouping}
            itemKey={item.key}
            isExpanded={item.isExpanded}
            onToggle={onToggleGroupingRow}
          />
        )
      }

      return (
        <TokenItem
          hideNumberedList
          eventName={MobileEventName.ExploreTokenItemSelected}
          index={index}
          metadataDisplayType={item.tokenMetadataDisplayType}
          rowKey={item.key}
          tokenItemData={item.tokenItemData}
          containerProps={EXPLORE_TOKEN_CONTAINER_PROPS}
        />
      )
    },
    [onToggleGroupingRow],
  )

  const listHeader = useMemo(
    () => (
      <Flex gap="$spacing8">
        <CategoryDetailsHeader category={category} />
        <Flex pb="$spacing8">
          <NetworkPills selectedNetwork={selectedNetwork} onSelectNetwork={onSelectNetwork} />
        </Flex>
      </Flex>
    ),
    [category, selectedNetwork, onSelectNetwork],
  )

  const contentContainerStyle = useMemo<UniversalListStyle>(
    () => ({ style: { paddingBottom: insets.bottom + spacing.spacing32 } }),
    [insets.bottom],
  )

  const keyExtractor = useCallback((item: CategoryListItem): string => item.key, [])
  const getItemType = useCallback((item: CategoryListItem): string => item.rowType, [])
  // Expanded grouping rows grow to fit their issuer panel; `getFixedItemSize` force-sizes cells, so the height
  // must be exact. getExpandableSearchRowHeightPx is the search modal's layout contract — a padding change made
  // for search resizes these cells too, and force-sizing means no visual self-correction here.
  const getItemSize = useCallback((item: CategoryListItem): number => {
    if (item.rowType === 'grouping') {
      return getExpandableSearchRowHeightPx({
        issuerCount: item.grouping.issuerTokens.length,
        expanded: item.isExpanded,
      })
    }
    return EXPLORE_TOKEN_ROW_HEIGHT
  }, [])
  const itemsAreEqual = useCallback((prev: CategoryListItem, next: CategoryListItem): boolean => {
    if (prev.rowType === 'grouping' || next.rowType === 'grouping') {
      return (
        prev.rowType === 'grouping' &&
        next.rowType === 'grouping' &&
        prev.grouping === next.grouping &&
        prev.isExpanded === next.isExpanded
      )
    }
    return exploreListItemsAreEqual(prev, next)
  }, [])

  return (
    <Screen edges={['top', 'left', 'right']}>
      <ScrollHeader
        centerElement={<CategoryHeaderTitleElement category={category} />}
        listRef={listRef}
        scrollY={scrollY}
        showHeaderScrollYDistance={SHOW_HEADER_SCROLL_Y_DISTANCE}
      />
      <UniversalList
        ref={listRef}
        recycleItems
        trackRowViewability
        contentContainerStyle={contentContainerStyle}
        data={listData}
        drawDistance={dimensions.height * WINDOW_MULTIPLIER}
        estimatedItemSize={EXPLORE_TOKEN_ROW_HEIGHT}
        estimatedListSize={dimensions}
        getFixedItemSize={getItemSize}
        getItemType={getItemType}
        itemsAreEqual={itemsAreEqual}
        keyExtractor={keyExtractor}
        ListEmptyComponent={listEmptyComponent}
        ListHeaderComponent={listHeader}
        renderItem={renderItem}
        scrollEventThrottle={SCROLL_EVENT_THROTTLE}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        onScroll={onScroll}
      />
    </Screen>
  )
}
