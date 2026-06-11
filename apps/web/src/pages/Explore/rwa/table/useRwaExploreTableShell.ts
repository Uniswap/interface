import { useMemo } from 'react'
import type { Rwa } from 'uniswap/src/data/rest/rwa/types'
import { useExploreTablesFilterStore } from '~/features/Explore/state/exploreTablesFilterStore'
import { filterRwaRowsBySearch } from '~/pages/Explore/rwa/table/filterRwaRowsBySearch'
import { sortRankedRwaRows } from '~/pages/Explore/rwa/table/sortRankedRwaRows'
import type { StocksSortMethod } from '~/pages/Explore/rwa/table/stocksTableSortStore'
import { useRwaTablePagination } from '~/pages/Explore/rwa/table/useRwaTablePagination'

export function useRwaExploreTableShell({
  rows,
  sortMethod,
  sortAscending,
}: {
  rows: Rwa[]
  sortMethod?: StocksSortMethod
  sortAscending?: boolean
}): {
  visibleRows: Rwa[]
  isSearchFilteredEmpty: boolean
  loadMore: ((params: { onComplete?: () => void }) => void) | undefined
} {
  const filterString = useExploreTablesFilterStore((s) => s.filterString)

  const sortedRows = useMemo(() => {
    if (sortMethod === undefined || sortAscending === undefined) {
      return rows
    }
    return sortRankedRwaRows(rows, { sortMethod, sortAscending })
  }, [rows, sortMethod, sortAscending])

  const filteredRows = useMemo(() => filterRwaRowsBySearch(sortedRows, filterString), [sortedRows, filterString])
  const isSearchFilteredEmpty = rows.length > 0 && filteredRows.length === 0 && filterString.trim().length > 0

  const { displayCount, loadMore } = useRwaTablePagination(filteredRows.length)
  const visibleRows = useMemo(() => filteredRows.slice(0, displayCount), [filteredRows, displayCount])

  return { visibleRows, isSearchFilteredEmpty, loadMore }
}
