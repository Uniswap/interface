import { memo, useCallback, useMemo, useState } from 'react'
import { Freeze } from 'react-freeze'
import type { SharedValue } from 'react-native-reanimated'
import { HomeFeedPager, type HomeFeedPagerPage } from 'src/screens/HomeScreen/HomeFeedPager'
import { HomeScreenNftsTab } from 'src/screens/HomeScreen/portfolio/tabs/nfts/HomeScreenNftsTab'
import { computeNftPairRowHeight } from 'src/screens/HomeScreen/portfolio/tabs/nfts/NftRows'
import { HomeScreenPoolsTab } from 'src/screens/HomeScreen/portfolio/tabs/pools/HomeScreenPoolsTab'
import type { PoolsTabRenderData } from 'src/screens/HomeScreen/portfolio/tabs/pools/hooks/usePoolsListRenderData'
import { HomeScreenTokensTab } from 'src/screens/HomeScreen/portfolio/tabs/tokens/HomeScreenTokensTab'
import { HomeTab, type HomeRoute, type NftTabRenderData } from 'src/screens/HomeScreen/portfolio/types'
import { useDeviceDimensions } from 'ui/src/hooks/useDeviceDimensions'
import type { PositionStatusFilterValue } from 'uniswap/src/features/positions/components/PositionStatusFilter'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'

interface TabViewBodyProps {
  routes: HomeRoute[]
  tabIndex: number
  onTabIndexChange: (index: number) => void
  owner: string
  feedScrollValue: SharedValue<number>
  bodyOffsetY: number
  shouldDetachInactiveTabs: boolean
  shouldLoadNfts: boolean
  nftListRenderData: NftTabRenderData
  shouldLoadPools: boolean
  poolsListRenderData: PoolsTabRenderData
  poolsStatusFilter: PositionStatusFilterValue
  onPoolsStatusFilterChange: (value: PositionStatusFilterValue) => void
  onTabInteractionStart: () => void
}

export const TabViewBody = memo(function TabViewBodyInner({
  routes,
  tabIndex,
  onTabIndexChange,
  owner,
  feedScrollValue,
  bodyOffsetY,
  shouldDetachInactiveTabs,
  shouldLoadNfts,
  nftListRenderData,
  shouldLoadPools,
  poolsListRenderData,
  poolsStatusFilter,
  onPoolsStatusFilterChange,
  onTabInteractionStart,
}: TabViewBodyProps): JSX.Element {
  const { fullWidth, fullHeight } = useDeviceDimensions()
  const [tokensHeight, setTokensHeight] = useState(0)
  const [nftsHeight, setNftsHeight] = useState(0)
  const [poolsHeight, setPoolsHeight] = useState(0)

  const pairRowHeight = useMemo(() => computeNftPairRowHeight(fullWidth), [fullWidth])

  const onTokensHeightChange = useCallback((h: number) => {
    setTokensHeight((prev) => (Math.abs(prev - h) < 4 ? prev : h))
  }, [])

  const onNftsHeightChange = useCallback((h: number) => {
    setNftsHeight((prev) => (Math.abs(prev - h) < 4 ? prev : h))
  }, [])

  const onPoolsHeightChange = useCallback((h: number) => {
    setPoolsHeight((prev) => (Math.abs(prev - h) < 4 ? prev : h))
  }, [])

  const pages = useMemo<HomeFeedPagerPage[]>(
    () =>
      routes.map((route, routeIndex) => {
        const isActive = routeIndex === tabIndex
        const freeze = shouldDetachInactiveTabs && !isActive
        if (route.key === HomeTab.Tokens) {
          return {
            key: route.key,
            height: tokensHeight,
            content: (
              <Freeze freeze={freeze}>
                <HomeScreenTokensTab
                  testID={TestID.TokensTab}
                  bodyOffsetY={bodyOffsetY}
                  feedScrollValue={feedScrollValue}
                  viewportHeight={fullHeight}
                  onHeightChange={onTokensHeightChange}
                />
              </Freeze>
            ),
          }
        }
        if (route.key === HomeTab.NFTs) {
          return {
            key: route.key,
            height: nftsHeight,
            content: (
              <Freeze freeze={freeze}>
                <HomeScreenNftsTab
                  testID={TestID.NFTsTab}
                  bodyOffsetY={bodyOffsetY}
                  nftListRenderData={nftListRenderData}
                  owner={owner}
                  pairRowHeight={pairRowHeight}
                  feedScrollValue={feedScrollValue}
                  shouldLoadNfts={shouldLoadNfts}
                  viewportHeight={fullHeight}
                  onHeightChange={onNftsHeightChange}
                />
              </Freeze>
            ),
          }
        }
        if (route.key === HomeTab.Pools) {
          return {
            key: route.key,
            height: poolsHeight,
            content: (
              <Freeze freeze={freeze}>
                <HomeScreenPoolsTab
                  testID={TestID.PoolsTab}
                  owner={owner}
                  bodyOffsetY={bodyOffsetY}
                  poolsListRenderData={poolsListRenderData}
                  statusFilter={poolsStatusFilter}
                  feedScrollValue={feedScrollValue}
                  shouldLoadPools={shouldLoadPools}
                  viewportHeight={fullHeight}
                  onStatusFilterChange={onPoolsStatusFilterChange}
                  onHeightChange={onPoolsHeightChange}
                />
              </Freeze>
            ),
          }
        }
        return { key: route.key, height: 0, content: null }
      }),
    [
      routes,
      tokensHeight,
      nftsHeight,
      poolsHeight,
      owner,
      onTokensHeightChange,
      onNftsHeightChange,
      onPoolsHeightChange,
      bodyOffsetY,
      fullHeight,
      feedScrollValue,
      pairRowHeight,
      shouldDetachInactiveTabs,
      shouldLoadNfts,
      nftListRenderData,
      shouldLoadPools,
      poolsListRenderData,
      poolsStatusFilter,
      onPoolsStatusFilterChange,
      tabIndex,
    ],
  )

  return (
    <HomeFeedPager
      fallbackHeight={fullHeight}
      index={tabIndex}
      pageWidth={fullWidth}
      pages={pages}
      onIndexChange={onTabIndexChange}
      onSwipeStart={onTabInteractionStart}
    />
  )
})
