import { useScrollToTop } from '@react-navigation/native'
import type { UniverseChainId } from '@universe/chains'
import { useIsTokenCategoriesEnabled } from '@universe/gating'
import {
  Flex,
  Loader,
  Text,
  UniversalList,
  type UniversalListRef,
  type UniversalListScrollEvent,
  type UniversalListStyle,
} from '@universe/mycelium'
import React, { memo, useCallback, useEffect, useMemo, useRef, useState } from 'react'
import { useTranslation } from 'react-i18next'
import { ScrollView, StyleSheet, useWindowDimensions } from 'react-native'
import type { AnimatedRef } from 'react-native-reanimated'
import Sortable from 'react-native-sortables'
import { useDispatch, useSelector } from 'react-redux'
import { ESTIMATED_BOTTOM_TABS_HEIGHT } from 'src/app/navigation/tabs/CustomTabBar/constants'
import { ExploreScreenParams } from 'src/app/navigation/types'
import { StartEarningSection } from 'src/components/earn/StartEarningSection'
import { CollectionsSection } from 'src/components/explore/ExploreSections/CollectionsSection'
import {
  EXPLORE_LIST_TRAILING_SKELETON_COUNT,
  EXPLORE_SKELETON_LIST_ITEMS,
  EXPLORE_TOKEN_CONTAINER_PROPS,
  EXPLORE_TOKEN_ROW_HEIGHT,
  exploreListItemKey,
  exploreListItemsAreEqual,
  getExploreListItemSize,
  getExploreListItemType,
  scheduleAfterPaint,
  tokenItemDataKey,
  WINDOW_MULTIPLIER,
  type ExploreListItem,
} from 'src/components/explore/ExploreSections/exploreListItems'
import { ExploreSectionHeader } from 'src/components/explore/ExploreSections/ExploreSectionHeader'
import { FavoritesSection } from 'src/components/explore/ExploreSections/FavoritesSection'
import { NetworkPills, NetworkPillsProps } from 'src/components/explore/ExploreSections/NetworkPillsRow'
import { TrendingSection } from 'src/components/explore/ExploreSections/TrendingSection'
import { useExploreTokenItems } from 'src/components/explore/ExploreSections/useExploreTokenItems'
import { FavoritesSortingStoreProvider, useIsSortingFavorites } from 'src/components/explore/favoritesSortingStore'
import { SortButton } from 'src/components/explore/SortButton'
import { TokenItem } from 'src/components/explore/TokenItem'
import { NoTokens } from 'ui/src/components/icons'
import { spacing } from 'ui/src/theme'
import { BaseCard } from 'uniswap/src/components/BaseCard/BaseCard'
import { useMultichainExploreMetricsAnalytics } from 'uniswap/src/features/explore/useMultichainExploreMetricsAnalytics'
import { MobileEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { DDRumManualTiming } from 'utilities/src/logger/datadog/datadogEvents'
import { usePerformanceLogger } from 'utilities/src/logger/usePerformanceLogger'
import { useEvent } from 'utilities/src/react/hooks'
import { useInitialLoadingState } from 'utilities/src/react/useInitialLoadingState'
import { selectTokensOrderBy } from 'wallet/src/features/wallet/selectors'
import { setTokensOrderBy } from 'wallet/src/features/wallet/slice'
import { ExploreOrderBy } from 'wallet/src/features/wallet/types'

type ExploreSectionsProps = ExploreScreenParams & {
  listRef: AnimatedRef<ScrollView>
  setIsAtTopOnScroll?: (isAtTop: boolean) => void
  onScrollToTopReady?: (scrollToTop: () => void) => void
}

function ExploreSectionsInner({
  listRef,
  showFavorites = true,
  orderByMetric,
  chainId,
  setIsAtTopOnScroll,
  onScrollToTopReady,
}: ExploreSectionsProps): JSX.Element {
  const { t } = useTranslation()
  const insets = useAppInsets()
  const dimensions = useWindowDimensions()
  // Top tokens sorting
  const { uiOrderBy, orderBy, onOrderByChange } = useOrderBy()

  // Network filtering
  const [selectedNetwork, setSelectedNetwork] = useState<UniverseChainId | null>(null)

  const [hasPaintedSkeleton, setHasPaintedSkeleton] = useState(false)

  // Track scroll position for double-tap behavior
  const handleScroll = useEvent((event: UniversalListScrollEvent) => {
    if (!setIsAtTopOnScroll) {
      return
    }
    const yOffset = event.nativeEvent.contentOffset.y
    setIsAtTopOnScroll(yOffset <= 0)
  })

  // Update selectedNetwork and orderBy when chainId prop changes (e.g., from deep links)
  useEffect(() => {
    setSelectedNetwork(chainId ?? null)
    if (orderByMetric) {
      onOrderByChange(orderByMetric)
    }
  }, [chainId, onOrderByChange, orderByMetric])

  const { topTokenItems, hasData, isLoading, error, refetch, isFetching, fetchNextPage, hasNextPage } =
    useExploreTokenItems({ selectedNetwork, orderBy })

  const isInitialLoading = useInitialLoadingState(isLoading)
  const isSortingFavorites = useIsSortingFavorites()

  const exploreRowChainCounts = useMemo(
    () => topTokenItems.map(({ tokenItemData }) => tokenItemData.networkCount ?? 1),
    [topTokenItems],
  )

  useMultichainExploreMetricsAnalytics({
    rowChainCounts: exploreRowChainCounts,
    isExploreTokensLoading: isLoading,
  })

  usePerformanceLogger(DDRumManualTiming.RenderExploreSections, [selectedNetwork, orderBy])

  const universalListRef = useRef<UniversalListRef>(null)

  const scrollToTop = useEvent(() => {
    universalListRef.current?.scrollToOffset({ offset: 0, animated: true })
  })

  useScrollToTop(universalListRef)

  useEffect(() => {
    onScrollToTopReady?.(scrollToTop)
  }, [onScrollToTopReady, scrollToTop])

  const onRetry = useCallback(async () => {
    await refetch()
  }, [refetch])

  const onSelectNetwork = useCallback((network: UniverseChainId | null) => {
    sendAnalyticsEvent(MobileEventName.ExploreNetworkSelected, {
      networkChainId: network ?? 'all',
    })
    setSelectedNetwork(network)
  }, [])

  // Display a skeleton instead of freezing during list render when returning from search. 2 frames are required on Android
  useEffect(() => {
    return scheduleAfterPaint(() => setHasPaintedSkeleton(true))
  }, [])

  const isLoadingOrFetching = isLoading || isFetching
  const showFullScreenLoadingState =
    !hasPaintedSkeleton || (!hasData && isLoadingOrFetching) || (!!error && isLoadingOrFetching)

  const onEndReached = useEvent((): void => {
    if (showFullScreenLoadingState) {
      return
    }
    // v1's hasNextPage is always false, so this only ever fires under v2 ListTokens' real pagination.
    if (hasNextPage && !isFetching) {
      fetchNextPage()
    }
  })

  const listData: ExploreListItem[] = useMemo(() => {
    if (showFullScreenLoadingState) {
      return EXPLORE_SKELETON_LIST_ITEMS
    }

    // Generate unique key; using an index in it causes recycling state bugs.
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
  }, [showFullScreenLoadingState, topTokenItems])

  // Memoized at the wrapper, not its contents: the prop receives this object, so memoizing only the
  // inner style would hand `UniversalList` a fresh identity every render anyway.
  const contentContainerStyle = useMemo<UniversalListStyle>(
    () => ({ style: { paddingBottom: ESTIMATED_BOTTOM_TABS_HEIGHT + spacing.spacing32 + insets.bottom } }),
    [insets.bottom],
  )

  const listEmptyComponent = useMemo(() => {
    if (showFullScreenLoadingState || topTokenItems.length > 0) {
      return null
    }

    return <TokenListEmptyComponent />
  }, [showFullScreenLoadingState, topTokenItems.length])

  // Trailing skeletons while v2 is fetching the next page
  const listFooter = useMemo(() => {
    if (showFullScreenLoadingState || !hasNextPage || !isFetching) {
      return null
    }

    return (
      <Flex>
        {Array.from({ length: EXPLORE_LIST_TRAILING_SKELETON_COUNT }, (_, index) => (
          <Flex key={index} height={EXPLORE_TOKEN_ROW_HEIGHT} justifyContent="center" px="$spacing24">
            <Loader.Token />
          </Flex>
        ))}
      </Flex>
    )
  }, [showFullScreenLoadingState, hasNextPage, isFetching])

  const renderItem = useCallback(({ item, index }: { item: ExploreListItem; index: number }): JSX.Element => {
    if (item.rowType === 'skeleton') {
      return (
        <Flex height={EXPLORE_TOKEN_ROW_HEIGHT} justifyContent="center" px={24}>
          <Loader.Token />
        </Flex>
      )
    }

    return (
      <TokenItem
        eventName={MobileEventName.ExploreTokenItemSelected}
        index={index}
        metadataDisplayType={item.tokenMetadataDisplayType}
        rowKey={item.key}
        tokenItemData={item.tokenItemData}
        containerProps={EXPLORE_TOKEN_CONTAINER_PROPS}
      />
    )
  }, [])

  const listHeader = useMemo(
    () => (
      <ListHeaderComponent
        listRef={listRef}
        orderBy={uiOrderBy}
        showFavorites={showFavorites}
        showLoading={isInitialLoading}
        selectedNetwork={selectedNetwork}
        onSelectNetwork={onSelectNetwork}
        onOrderByChange={onOrderByChange}
      />
    ),
    [listRef, uiOrderBy, showFavorites, isInitialLoading, selectedNetwork, onSelectNetwork, onOrderByChange],
  )

  if (!hasData && error) {
    return (
      <Flex height="100%" pb="$spacing60">
        <BaseCard.ErrorState
          retryButtonLabel={t('common.button.retry')}
          title={t('explore.tokens.error')}
          onRetry={onRetry}
        />
      </Flex>
    )
  }

  return (
    <Flex fill animation="100ms">
      <UniversalList
        ref={universalListRef}
        recycleItems
        trackRowViewability
        contentContainerStyle={contentContainerStyle}
        data={listData}
        drawDistance={dimensions.height * WINDOW_MULTIPLIER}
        estimatedItemSize={EXPLORE_TOKEN_ROW_HEIGHT}
        estimatedListSize={dimensions}
        getFixedItemSize={getExploreListItemSize}
        getItemType={getExploreListItemType}
        itemsAreEqual={exploreListItemsAreEqual}
        keyExtractor={exploreListItemKey}
        ListEmptyComponent={listEmptyComponent}
        ListFooterComponent={listFooter}
        ListHeaderComponent={listHeader}
        ListHeaderComponentStyle={LIST_HEADER_STYLE}
        refScrollView={listRef}
        renderItem={renderItem}
        scrollEnabled={!isSortingFavorites}
        showsHorizontalScrollIndicator={false}
        showsVerticalScrollIndicator={false}
        onEndReached={onEndReached}
        onEndReachedThreshold={0.3}
        onScroll={handleScroll}
      />
    </Flex>
  )
}

const styles = StyleSheet.create({
  foreground: {
    zIndex: 1,
  },
})

/** Module-level so the prop identity is fixed for the process — nothing in it depends on render state. */
const LIST_HEADER_STYLE: UniversalListStyle = { style: styles.foreground }

type ListHeaderProps = {
  listRef: AnimatedRef<ScrollView>
  orderBy: ExploreOrderBy
  showLoading: boolean
  showFavorites: boolean
  onOrderByChange: (orderBy: ExploreOrderBy) => void
}

const ListHeader = memo(function ListHeader({
  listRef,
  orderBy,
  showLoading,
  showFavorites,
  onOrderByChange,
}: ListHeaderProps): JSX.Element {
  const { t } = useTranslation()
  // Flag off preserves today's exact section layout; on switches to the standardized
  // Favorites / Trending / Collections / Top tokens order and header treatment.
  const tokenCategoriesEnabled = useIsTokenCategoriesEnabled()

  return (
    <Sortable.Layer>
      {showFavorites && <FavoritesSection showLoading={showLoading} listRef={listRef} />}
      <StartEarningSection />
      <TrendingSection />
      <CollectionsSection />
      {tokenCategoriesEnabled ? (
        <ExploreSectionHeader
          title={t('explore.tokens.top.title')}
          rightElement={
            <Flex flexShrink={1}>
              <SortButton orderBy={orderBy} onOrderByChange={onOrderByChange} />
            </Flex>
          }
        />
      ) : (
        <Flex row alignItems="center" justifyContent="space-between" px="$spacing12">
          <Text color="$neutral2" flexShrink={0} paddingEnd="$spacing8" variant="subheading1">
            {t('explore.tokens.top.title')}
          </Text>
          <Flex flexShrink={1}>
            <SortButton orderBy={orderBy} onOrderByChange={onOrderByChange} />
          </Flex>
        </Flex>
      )}
    </Sortable.Layer>
  )
})

const ListHeaderComponent = memo(function ListHeaderComponent({
  listRef,
  onSelectNetwork,
  orderBy,
  selectedNetwork,
  showLoading,
  showFavorites,
  onOrderByChange,
}: ListHeaderProps & NetworkPillsProps): JSX.Element {
  return (
    <>
      <ListHeader
        listRef={listRef}
        orderBy={orderBy}
        showLoading={showLoading}
        showFavorites={showFavorites}
        onOrderByChange={onOrderByChange}
      />
      <NetworkPills selectedNetwork={selectedNetwork} onSelectNetwork={onSelectNetwork} />
    </>
  )
})

const TokenListEmptyComponent = memo(function TokenListEmptyComponent(): JSX.Element {
  const { t } = useTranslation()

  return (
    <Flex centered pt="$spacing48" px="$spacing36">
      <BaseCard.EmptyState
        description={t('explore.tokens.empty.description')}
        icon={<NoTokens color="$neutral3" size="$icon.70" />}
        title={t('explore.tokens.empty.title')}
      />
    </Flex>
  )
})

function useOrderBy(): {
  uiOrderBy: ExploreOrderBy
  orderBy: ExploreOrderBy
  onOrderByChange: (orderBy: ExploreOrderBy) => void
} {
  const dispatch = useDispatch()
  const orderBy = useSelector(selectTokensOrderBy)

  // local state for immediate UI feedback
  const [uiOrderBy, setUiOrderBy] = useState<ExploreOrderBy>(orderBy)

  // When Redux orderBy changes, sync UI
  useEffect(() => {
    setUiOrderBy(orderBy)
  }, [orderBy])

  const onOrderByChange = useCallback(
    (newTokensOrderBy: ExploreOrderBy) => {
      setUiOrderBy(newTokensOrderBy)
      requestAnimationFrame(() => {
        dispatch(setTokensOrderBy({ newTokensOrderBy }))
      })
    },
    [dispatch],
  )

  return { uiOrderBy, orderBy, onOrderByChange }
}

function ExploreSectionsWithFavoritesSortingStore(props: ExploreSectionsProps): JSX.Element {
  return (
    <FavoritesSortingStoreProvider>
      <ExploreSectionsInner {...props} />
    </FavoritesSortingStoreProvider>
  )
}

export const ExploreSections = memo(ExploreSectionsWithFavoritesSortingStore)
