import { ReactNavigationPerformanceView } from '@shopify/react-native-performance-navigation'
import { SharedEventName } from '@uniswap/analytics-events'
import { isAndroid } from '@universe/environment'
import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { memo, useCallback, useEffect, useMemo, useState } from 'react'
import type { LayoutChangeEvent, ListRenderItem } from 'react-native'
import { RefreshControl, View } from 'react-native'
import Animated, { runOnJS, useAnimatedReaction } from 'react-native-reanimated'
import { Screen } from 'src/components/layout/Screen'
import { TAB_BAR_HEIGHT, TAB_VIEW_SCROLL_THROTTLE } from 'src/components/layout/TabHelpers'
import { useHideSplashScreen } from 'src/features/splashScreen/useHideSplashScreen'
import { useHomeScreenPortfolioScroll } from 'src/screens/HomeScreen/portfolio/context/HomeScreenPortfolioScrollContext'
import { HomeScreenPortfolioStatusBar } from 'src/screens/HomeScreen/portfolio/feedScroll/HomeScreenPortfolioStatusBar'
import { HomeScreenPortfolioStickyTabBar } from 'src/screens/HomeScreen/portfolio/feedScroll/HomeScreenPortfolioStickyTabBar'
import { useFeedScrollContentContainerStyle } from 'src/screens/HomeScreen/portfolio/feedScroll/useFeedScrollContentContainerStyle'
import { useHomeScreenPortfolioHeader } from 'src/screens/HomeScreen/portfolio/header/useHomeScreenPortfolioHeader'
import { useHomeScreenHeartbeatCoordinator } from 'src/screens/HomeScreen/portfolio/hooks/useHomeScreenHeartbeatCoordinator'
import { useHomeScreenPortfolioRefresh } from 'src/screens/HomeScreen/portfolio/hooks/useHomeScreenPortfolioRefresh'
import { useHomeScreenPortfolioRoutes } from 'src/screens/HomeScreen/portfolio/tabs/common/hooks/useHomeScreenPortfolioRoutes'
import { useHomeScreenPortfolioTabState } from 'src/screens/HomeScreen/portfolio/tabs/common/hooks/useHomeScreenPortfolioTabState'
import { TabViewBody } from 'src/screens/HomeScreen/portfolio/tabs/common/TabViewBody'
import { usePoolsListRenderData } from 'src/screens/HomeScreen/portfolio/tabs/pools/hooks/usePoolsListRenderData'
import { EmptyWalletTokensTab } from 'src/screens/HomeScreen/portfolio/tabs/tokens/empty/EmptyWalletTokensTab'
import {
  HOME_TAB_SECTION_NAME,
  HomeTab,
  type FeedListRow,
  type HomeScreenPortfolioProps,
} from 'src/screens/HomeScreen/portfolio/types'
import { useHomeScreenState } from 'src/screens/HomeScreen/useHomeScreenState'
import { Flex, useSporeColors } from 'ui/src'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import { useNftListRenderData } from 'uniswap/src/components/nfts/hooks/useNftListRenderData'
import {
  PositionStatusFilterButton,
  PositionStatusFilterValue,
} from 'uniswap/src/features/positions/components/PositionStatusFilter'
import { usePoolsPositionsReport } from 'uniswap/src/features/positions/hooks/usePoolsPositionsReport'
import { usePoolsTabVisibility } from 'uniswap/src/features/positions/hooks/usePoolsTabVisibility'
import { WalletEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { useAppInsets } from 'uniswap/src/hooks/useAppInsets'
import { MobileScreens } from 'uniswap/src/types/screens/mobile'
import { useActiveAccountWithThrow } from 'wallet/src/features/wallet/hooks'

/** Initial portfolio header height before first layout measurement. */
const CONTENT_HEADER_HEIGHT_ESTIMATE = 270
const NFT_END_REACHED_THRESHOLD = 0.5
const FEED_LIST_ROW_PORTFOLIO: FeedListRow = { id: 'portfolio' }
/** Portfolio header, sticky tab bar, and tab content (each tab owns loading UI). */
const FEED_LIST_ROWS: FeedListRow[] = [FEED_LIST_ROW_PORTFOLIO, { id: 'tabBar' }, { id: 'tabBody' }]

function HomeScreenPortfolioContent({ setIsLayoutReady }: HomeScreenPortfolioProps): JSX.Element {
  const hideSplashScreen = useHideSplashScreen()
  const activeAccount = useActiveAccountWithThrow()
  const { showEmptyWalletState: hasNoWalletActivity } = useHomeScreenState()
  const { header: portfolio, shouldShowWrappedBanner, outageModal } = useHomeScreenPortfolioHeader()
  const { shouldShowPoolsTab } = usePoolsTabVisibility(activeAccount.address)
  // A pools-only wallet (positions but no tokens/NFTs/activity) should still see its tabs.
  const showEmptyWalletState = hasNoWalletActivity && !shouldShowPoolsTab
  const routes = useHomeScreenPortfolioRoutes(showEmptyWalletState, shouldShowPoolsTab)
  const { tabIndex: rawTabIndex, onTabIndexChange } = useHomeScreenPortfolioTabState(showEmptyWalletState)
  // Pools is a conditional middle tab, so display indices are dynamic; clamp the stored index
  // before resolving the active tab via route.key.
  const tabIndex = Math.max(0, Math.min(rawTabIndex, routes.length - 1))
  const activeKey = routes[tabIndex]?.key
  const isDataLivelinessEnabled = useFeatureFlag(FeatureFlags.DataLivelinessUI)
  useHomeScreenHeartbeatCoordinator({ enabled: isDataLivelinessEnabled, activeTab: activeKey })
  const { feedScrollValue, feedScrollHandler, feedScrollRef } = useHomeScreenPortfolioScroll()
  const [headerHeight, setHeaderHeight] = useState(CONTENT_HEADER_HEIGHT_ESTIMATE)

  const onPortfolioLayout = useCallback(
    (event: LayoutChangeEvent) => {
      setHeaderHeight(event.nativeEvent.layout.height)
      setIsLayoutReady(true)
    },
    [setIsLayoutReady],
  )
  const insets = useAppInsets()
  const colors = useSporeColors()
  const feedScrollContentContainerStyle = useFeedScrollContentContainerStyle()
  const { fullHeight } = useDeviceDimensions()
  const [isScrolledPastDetachThreshold, setIsScrolledPastDetachThreshold] = useState(false)
  const [hasInteractionAttachedTabs, setHasInteractionAttachedTabs] = useState(false)
  const [hasVisitedNfts, setHasVisitedNfts] = useState(activeKey === HomeTab.NFTs)
  const [hasVisitedPools, setHasVisitedPools] = useState(activeKey === HomeTab.Pools)
  const [poolsStatusFilter, setPoolsStatusFilter] = useState<PositionStatusFilterValue>(PositionStatusFilterValue.Open)

  useEffect(() => {
    if (activeKey === HomeTab.NFTs) {
      setHasVisitedNfts(true)
    }
    if (activeKey === HomeTab.Pools) {
      setHasVisitedPools(true)
    }
  }, [activeKey])

  const shouldLoadNfts = hasVisitedNfts && !showEmptyWalletState
  const shouldLoadPools = hasVisitedPools && !showEmptyWalletState && shouldShowPoolsTab

  const { refreshing, onRefresh } = useHomeScreenPortfolioRefresh({ shouldLoadNfts })

  const {
    onListEndReached: onNftListEndReached,
    numShown,
    ...nftListRenderData
  } = useNftListRenderData({
    owner: activeAccount.address,
    skip: !shouldLoadNfts,
  })

  const { onListEndReached: onPoolsListEndReached, ...poolsListRenderData } = usePoolsListRenderData({
    owner: activeAccount.address,
    skip: !shouldLoadPools,
  })
  const poolsHasErrorWithoutData = poolsListRenderData.hasErrorWithoutData

  usePoolsPositionsReport({
    positions: poolsListRenderData.positions,
    pagesLoaded: poolsListRenderData.pagesLoaded,
    hasMore: poolsListRenderData.hasNextPage,
    isLoading: poolsListRenderData.isLoadingFirstPage,
    enabled: activeKey === HomeTab.Pools,
  })

  useEffect(() => {
    if (!shouldLoadNfts) {
      return
    }

    sendAnalyticsEvent(WalletEventName.NFTsLoaded, {
      shown: numShown,
      hidden: nftListRenderData.numHidden,
    })
  }, [shouldLoadNfts, numShown, nftListRenderData.numHidden])
  const listData = FEED_LIST_ROWS
  const stickyHeaderIndices = [1]
  const shouldDetachInactiveTabs = isScrolledPastDetachThreshold && !hasInteractionAttachedTabs

  const updateIsScrolledPastDetachThreshold = useCallback((next: boolean): void => {
    setIsScrolledPastDetachThreshold(next)
  }, [])

  useAnimatedReaction(
    () => feedScrollValue.value > fullHeight,
    (isPastThreshold, wasPastThreshold) => {
      if (isPastThreshold !== wasPastThreshold) {
        runOnJS(updateIsScrolledPastDetachThreshold)(isPastThreshold)
      }
    },
    [fullHeight, updateIsScrolledPastDetachThreshold],
  )

  useEffect(() => {
    if (!isScrolledPastDetachThreshold) {
      setHasInteractionAttachedTabs(false)
    }
  }, [isScrolledPastDetachThreshold])

  const refreshControl = useMemo(
    () => (
      <RefreshControl
        progressViewOffset={isAndroid ? insets.top : 0}
        refreshing={refreshing}
        tintColor={colors.neutral3.get()}
        onRefresh={onRefresh}
      />
    ),
    [colors.neutral3, insets.top, onRefresh, refreshing],
  )

  const onEndReached = useCallback(() => {
    if (activeKey === HomeTab.NFTs && shouldLoadNfts) {
      void onNftListEndReached()
    } else if (activeKey === HomeTab.Pools && shouldLoadPools) {
      onPoolsListEndReached()
    }
  }, [activeKey, shouldLoadNfts, onNftListEndReached, shouldLoadPools, onPoolsListEndReached])

  const attachInactiveTabs = useCallback(() => {
    if (isScrolledPastDetachThreshold) {
      setHasInteractionAttachedTabs(true)
    }
  }, [isScrolledPastDetachThreshold])

  const scrollToTabStartIfNeeded = useCallback(() => {
    if (!isScrolledPastDetachThreshold) {
      return
    }

    setHasInteractionAttachedTabs(true)
    feedScrollRef.current?.scrollToOffset({ offset: headerHeight, animated: false })
  }, [headerHeight, isScrolledPastDetachThreshold, feedScrollRef])

  const handleTabIndexChange = useCallback(
    (index: number) => {
      if (index !== tabIndex) {
        const route = routes[index]
        if (route) {
          sendAnalyticsEvent(SharedEventName.PAGE_VIEWED, {
            section: HOME_TAB_SECTION_NAME[route.key],
            screen: MobileScreens.Home,
          })
        }
        scrollToTabStartIfNeeded()
      }
      onTabIndexChange(index)
    },
    [scrollToTabStartIfNeeded, onTabIndexChange, routes, tabIndex],
  )

  const renderItem = useCallback<ListRenderItem<FeedListRow>>(
    ({ item }) => {
      switch (item.id) {
        case 'portfolio':
          return (
            <View collapsable={false} onLayout={onPortfolioLayout}>
              {portfolio}
            </View>
          )
        case 'tabBar':
          return (
            <HomeScreenPortfolioStickyTabBar
              routes={routes}
              tabIndex={tabIndex}
              rightAccessory={
                activeKey === HomeTab.Pools && shouldShowPoolsTab ? (
                  <PositionStatusFilterButton
                    value={poolsStatusFilter}
                    disabled={poolsHasErrorWithoutData}
                    onChange={setPoolsStatusFilter}
                  />
                ) : null
              }
              onTabIndexChange={handleTabIndexChange}
            />
          )
        case 'tabBody':
          return showEmptyWalletState ? (
            <EmptyWalletTokensTab />
          ) : (
            <TabViewBody
              bodyOffsetY={headerHeight + TAB_BAR_HEIGHT}
              nftListRenderData={nftListRenderData}
              owner={activeAccount.address}
              routes={routes}
              feedScrollValue={feedScrollValue}
              shouldDetachInactiveTabs={shouldDetachInactiveTabs}
              shouldLoadNfts={shouldLoadNfts}
              shouldLoadPools={shouldLoadPools}
              poolsListRenderData={poolsListRenderData}
              poolsStatusFilter={poolsStatusFilter}
              tabIndex={tabIndex}
              onPoolsStatusFilterChange={setPoolsStatusFilter}
              onTabIndexChange={handleTabIndexChange}
              onTabInteractionStart={attachInactiveTabs}
            />
          )
        default:
          return null
      }
    },
    [
      headerHeight,
      handleTabIndexChange,
      attachInactiveTabs,
      onPortfolioLayout,
      activeAccount.address,
      portfolio,
      routes,
      feedScrollValue,
      shouldDetachInactiveTabs,
      showEmptyWalletState,
      tabIndex,
      activeKey,
      shouldShowPoolsTab,
      poolsStatusFilter,
      poolsHasErrorWithoutData,
      nftListRenderData,
      shouldLoadNfts,
      shouldLoadPools,
      poolsListRenderData,
    ],
  )

  const keyExtractor = useCallback((item: FeedListRow) => item.id, [])

  return (
    <Screen edges={['left', 'right']} onLayout={hideSplashScreen}>
      <HomeScreenPortfolioStatusBar
        heightCollapsed={insets.top}
        heightExpanded={headerHeight}
        shouldShowWrappedBanner={shouldShowWrappedBanner}
      />
      <Flex fill style={{ paddingTop: insets.top }}>
        <ReactNavigationPerformanceView interactive screenName={MobileScreens.Home}>
          <Animated.FlatList
            ref={feedScrollRef}
            contentContainerStyle={feedScrollContentContainerStyle}
            data={listData}
            keyboardShouldPersistTaps="handled"
            keyExtractor={keyExtractor}
            refreshControl={refreshControl}
            renderItem={renderItem}
            scrollEventThrottle={TAB_VIEW_SCROLL_THROTTLE}
            showsVerticalScrollIndicator={false}
            stickyHeaderIndices={stickyHeaderIndices}
            onEndReached={onEndReached}
            onEndReachedThreshold={NFT_END_REACHED_THRESHOLD}
            onScroll={feedScrollHandler}
          />
        </ReactNavigationPerformanceView>
      </Flex>
      {outageModal}
    </Screen>
  )
}

export const HomeScreenPortfolio = memo(HomeScreenPortfolioContent)
