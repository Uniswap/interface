import React, { ReactElement, useMemo } from 'react'
import { DataProvider, GridLayoutProvider, RecyclerListView } from 'recyclerlistview'
import { Box } from 'src/components/layout/Box'
import {
  TabViewScrollProps,
  TAB_VIEW_SCROLL_THROTTLE,
} from 'src/components/layout/screens/TabbedScrollScreen'
import { Loading } from 'src/components/loading'
import { dimensions } from 'src/styles/sizing'

interface GridRecyclerListProps<T> {
  data: T[]
  getKey: (item: T) => string
  renderItem: (item: T) => ReactElement
  height?: number
  tabViewScrollProps?: TabViewScrollProps
  onEndReached: () => void
  isLoadingNext: boolean
}

const COLUMN_COUNT = 2
const GRID_CELL_SPAN = 1
const NFT_VIEW_TYPE = 'NFT'
const LOADING_TYPE = 'loading'

const ESTIMATED_NFT_METADATA_HEIGHT = 70
const PREFETCH_ITEMS_THRESHOLD = 5

const layoutProvider = new GridLayoutProvider(
  COLUMN_COUNT,
  () => NFT_VIEW_TYPE,
  () => GRID_CELL_SPAN,
  () => dimensions.fullWidth / COLUMN_COUNT + ESTIMATED_NFT_METADATA_HEIGHT // used as a heuristic
)

export function GridRecyclerList<T>({
  data,
  getKey,
  renderItem,
  tabViewScrollProps,
  onEndReached,
  isLoadingNext,
}: GridRecyclerListProps<T>) {
  // We need to manually add in an extra grid item for loading state if the number of elements is odd
  const shouldAddInLoadingItem = isLoadingNext && data.length % 2 === 1

  const dataProvider = useMemo(() => {
    const provider = new DataProvider((row1: T, row2: T) => {
      return getKey(row1) !== getKey(row2)
    })
    return shouldAddInLoadingItem
      ? provider.cloneWithRows([...data, LOADING_TYPE])
      : provider.cloneWithRows(data)
  }, [data, getKey, shouldAddInLoadingItem])

  return (
    /**
     * Perf optimizations:
     * renderAheadOffset: represents pixels that are rendered ahead, smaller is better for performance but adds more blanks
     * forceNonDeterministicRendering:  updates layout after layout provider, it is ideal to have the best dimensions beforehand for perf reasons
     **/
    <RecyclerListView
      ref={tabViewScrollProps?.ref}
      canChangeSize={false}
      dataProvider={dataProvider}
      forceNonDeterministicRendering={true}
      layoutProvider={layoutProvider}
      renderAheadOffset={300}
      renderFooter={() => (
        <Box opacity={isLoadingNext ? 1 : 0}>
          <Loading repeat={4} type="nft" />
        </Box>
      )}
      rowRenderer={(_type: string | number, item: T) => {
        // _type does not work reliably here with so we use a string type
        return typeof item === typeof LOADING_TYPE ? (
          <Loading repeat={1} type="nft" />
        ) : (
          renderItem(item)
        )
      }}
      scrollThrottle={TAB_VIEW_SCROLL_THROTTLE}
      scrollViewProps={{ showsVerticalScrollIndicator: false }}
      style={tabViewScrollProps?.contentContainerStyle}
      onEndReached={onEndReached}
      onEndReachedThreshold={PREFETCH_ITEMS_THRESHOLD}
      onScroll={tabViewScrollProps?.onScroll} // TODO (Thomas) Implement better onScroll
    />
  )
}
