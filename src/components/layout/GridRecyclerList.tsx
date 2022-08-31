import React, { ReactElement } from 'react'
import { DataProvider, GridLayoutProvider, RecyclerListView } from 'recyclerlistview'
import { Box } from 'src/components/layout/Box'
import { dimensions } from 'src/styles/sizing'

interface GridRecyclerListProps<T> {
  data: T[]
  getKey: (data: T) => string
  renderItem: (data: T) => ReactElement
  height: number
}

const COLUMN_COUNT = 2
const GRID_CELL_SPAN = 1
const NFT_VIEW_TYPE = 'NFT'

const layoutProvider = new GridLayoutProvider(
  COLUMN_COUNT,
  () => NFT_VIEW_TYPE,
  () => GRID_CELL_SPAN,
  () => dimensions.fullWidth / COLUMN_COUNT // used as a heuristic
)

export function GridRecyclerList<T>({
  data,
  getKey,
  renderItem,
  height,
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
      canChangeSize={false}
      dataProvider={dataProvider.cloneWithRows(data)}
      forceNonDeterministicRendering={false}
      layoutProvider={layoutProvider}
      renderAheadOffset={300}
      rowRenderer={(_type: string | number, item: T) => {
        return (
          <Box
            borderColor="backgroundBackdrop"
            borderWidth={2}
            height={dimensions.fullWidth / 2}
            width={dimensions.fullWidth / 2}>
            {renderItem(item)}
          </Box>
        )
      }}
      scrollViewProps={{
        showsVerticalScrollIndicator: false,
      }}
      style={{ height: height }}
    />
  )
}
