import React, { ReactElement } from 'react'
import { DataProvider, GridLayoutProvider, RecyclerListView } from 'recyclerlistview'
import { Box } from 'src/components/layout/Box'
import {
  TabViewScrollProps,
  TAB_VIEW_SCROLL_THROTTLE,
} from 'src/components/layout/screens/TabbedScrollScreen'
import { dimensions } from 'src/styles/sizing'

interface GridRecyclerListProps<T> {
  data: T[]
  getKey: (item: T) => string
  renderItem: (item: T) => ReactElement
  height?: number
  tabViewScrollProps?: TabViewScrollProps
}

const COLUMN_COUNT = 2
const GRID_CELL_SPAN = 1
const NFT_VIEW_TYPE = 'NFT'

const ESTIMATED_NFT_METADATA_HEIGHT = 40
const FOOTER_HEIGHT = 300

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
}: GridRecyclerListProps<T>) {
  const dataProvider = new DataProvider((row1: T, row2: T) => {
    return getKey(row1) !== getKey(row2)
  })

  return (
    /**
     * Perf optimizations:
     * renderAheadOffset: represents pixels that are rendered ahead, smaller is better for performance but adds more blanks
     * forceNonDeterministicRendering: updates layout after layout provider, it is ideal to have the best dimensions beforehand for perf reasons
     */
    <RecyclerListView
      ref={tabViewScrollProps?.ref}
      canChangeSize={false}
      dataProvider={dataProvider.cloneWithRows(data)}
      forceNonDeterministicRendering={true}
      layoutProvider={layoutProvider}
      renderAheadOffset={300}
      renderFooter={() => <Box height={FOOTER_HEIGHT} width="100%" />}
      rowRenderer={(_type: string | number, item: T) => renderItem(item)}
      scrollThrottle={TAB_VIEW_SCROLL_THROTTLE}
      scrollViewProps={{ showsVerticalScrollIndicator: false }}
      style={tabViewScrollProps?.contentContainerStyle}
      onScroll={tabViewScrollProps?.onScroll} // TODO (Thomas) Implement better onScroll
    />
  )
}
