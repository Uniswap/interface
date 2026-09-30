import { useMemo } from 'react'
import type { Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { useExploreTablesFilterStore } from '~/features/Explore/state/exploreTablesFilterStore'
import { filterRwaRowsBySearch } from '~/pages/Explore/rwa/table/filterRwaRowsBySearch'
import { useRwaTablePagination } from '~/pages/Explore/rwa/table/hooks/useRwaTablePagination'
import { sortRankedRwaRows } from '~/pages/Explore/rwa/table/sortRankedRwaRows'
import type { StocksSortMethod } from '~/pages/Explore/rwa/table/stocksTableSortStore'

export function useRwaExploreTableShell({
  rows,
  rowsKey,
  sortMethod,
  sortAscending,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
}: {
  rows: Rwa[]
  rowsKey: string
  /** Client-side sort; leave undefined when the rows already arrive in server order. */
  sortMethod?: StocksSortMethod
  sortAscending?: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
}): {
  visibleRows: Rwa[]
  rankByAsset: ReadonlyMap<Rwa, number>
  loadMore: ((params: { onComplete?: () => void }) => void) | undefined
} {
  const filterString = useExploreTablesFilterStore((s) => s.filterString)

  const sortedRows = useMemo(() => {
    if (sortMethod === undefined || sortAscending === undefined) {
      return rows
    }
    return sortRankedRwaRows(rows, { sortMethod, sortAscending })
  }, [rows, sortMethod, sortAscending])

  // Ranks come from the sorted order before search filtering, so typing in the filter doesn't renumber rows.
  const rankByAsset = useMemo(
    () => new Map<Rwa, number>(sortedRows.map((row, index) => [row, index + 1])),
    [sortedRows],
  )

  const filteredRows = useMemo(() => filterRwaRowsBySearch(sortedRows, filterString), [sortedRows, filterString])

  const { displayCount, loadMore } = useRwaTablePagination({
    rowsKey,
    loadedRowCount: rows.length,
    filteredRowCount: filteredRows.length,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  })
  const visibleRows = useMemo(() => filteredRows.slice(0, displayCount), [filteredRows, displayCount])

  return { visibleRows, rankByAsset, loadMore }
}
