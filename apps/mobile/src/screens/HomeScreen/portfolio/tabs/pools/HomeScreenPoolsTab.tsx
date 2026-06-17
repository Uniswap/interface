import { memo } from 'react'
import type { ViewStyle } from 'react-native'
import { View } from 'react-native'
import type { SharedValue } from 'react-native-reanimated'
import { useScrollWindow } from 'src/screens/HomeScreen/portfolio/tabs/common/hooks/useScrollWindow'
import { TabMeasuredLayout } from 'src/screens/HomeScreen/portfolio/tabs/common/TabMeasuredLayout'
import type { PoolsTabRenderData } from 'src/screens/HomeScreen/portfolio/tabs/pools/hooks/usePoolsListRenderData'
import { Flex, Loader } from 'ui/src'
import { PositionItem } from 'uniswap/src/components/portfolio/PositionItem/PositionItem'
import { getPositionKey } from 'uniswap/src/features/positions/utils'

const FIRST_PAGE_LOADER_ROW_COUNT = 6
const NEXT_PAGE_LOADER_ROW_COUNT = 2
/** Estimated PositionItem row height for placeholder sizing + windowing math. */
const POOL_POSITION_ROW_HEIGHT = 64
const poolPlaceholderStyle: ViewStyle = { height: POOL_POSITION_ROW_HEIGHT, width: '100%' }

interface HomeScreenPoolsTabProps {
  testID?: string
  shouldLoadPools: boolean
  poolsListRenderData: PoolsTabRenderData
  onHeightChange: (height: number) => void
  /** Outer FlatList scroll offset; used to derive which rows are within the visible window. */
  feedScrollValue: SharedValue<number>
  /** Outer FlatList viewport height, approximately device height. */
  viewportHeight: number
  /** Y-offset of the Pools tab's first row inside the outer FlatList content. */
  bodyOffsetY: number
}

export const HomeScreenPoolsTab = memo(function HomeScreenPoolsTabInner({
  testID,
  shouldLoadPools,
  poolsListRenderData,
  onHeightChange,
  feedScrollValue,
  viewportHeight,
  bodyOffsetY,
}: HomeScreenPoolsTabProps): JSX.Element {
  const { positions, hasData, isFetching, isFetchingNextPage } = poolsListRenderData
  const isLoadingFirstPage = isFetching && !hasData

  const isRowVisible = useScrollWindow({
    feedScrollValue,
    viewportHeight,
    bodyOffsetY,
    numRows: positions.length,
    rowHeight: POOL_POSITION_ROW_HEIGHT,
  })

  if (!shouldLoadPools) {
    return (
      <TabMeasuredLayout testID={testID} onHeightChange={onHeightChange}>
        <Flex />
      </TabMeasuredLayout>
    )
  }

  if (isLoadingFirstPage) {
    return (
      <TabMeasuredLayout testID={testID} onHeightChange={onHeightChange}>
        <Flex px="$spacing24" testID="pools-loading-skeleton">
          <Loader.Token withPrice repeat={FIRST_PAGE_LOADER_ROW_COUNT} />
        </Flex>
      </TabMeasuredLayout>
    )
  }

  return (
    <TabMeasuredLayout testID={testID} onHeightChange={onHeightChange}>
      {positions.map((position, i) => {
        if (!isRowVisible(i)) {
          return <View key={getPositionKey(position)} style={poolPlaceholderStyle} />
        }
        return <PositionItem key={getPositionKey(position)} hasOuterPadding positionInfo={position} />
      })}
      {isFetchingNextPage && (
        <Flex px="$spacing24">
          <Loader.Token withPrice repeat={NEXT_PAGE_LOADER_ROW_COUNT} />
        </Flex>
      )}
    </TabMeasuredLayout>
  )
})
