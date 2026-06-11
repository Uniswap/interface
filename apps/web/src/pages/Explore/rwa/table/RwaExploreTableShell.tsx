import type { Rwa } from 'uniswap/src/data/rest/rwa/types'
import type { OrderDirection } from '~/appGraphql/data/util'
import { ExpandableAssetTable } from '~/pages/Explore/rwa/table/ExpandableAssetTable'
import { RwaTableSearchEmptyState } from '~/pages/Explore/rwa/table/RwaTableSearchEmptyState'
import type { StocksSortMethod } from '~/pages/Explore/rwa/table/stocksTableSortStore'
import { useRwaExploreTableShell } from '~/pages/Explore/rwa/table/useRwaExploreTableShell'

export function RwaExploreTableShell({
  rows,
  isLoading,
  isError,
  enableSorting = false,
  sortMethod,
  sortAscending,
  orderDirection,
}: {
  rows: Rwa[]
  isLoading: boolean
  isError: boolean
  enableSorting?: boolean
  sortMethod?: StocksSortMethod
  sortAscending?: boolean
  orderDirection?: OrderDirection
}): JSX.Element {
  const { visibleRows, isSearchFilteredEmpty, loadMore } = useRwaExploreTableShell({
    rows,
    sortMethod: enableSorting ? sortMethod : undefined,
    sortAscending: enableSorting ? sortAscending : undefined,
  })

  if (isSearchFilteredEmpty) {
    return <RwaTableSearchEmptyState />
  }

  return (
    <ExpandableAssetTable
      assets={visibleRows}
      isLoading={isLoading}
      isError={isError}
      loadMore={loadMore}
      enableSorting={enableSorting}
      sortMethod={enableSorting ? sortMethod : undefined}
      orderDirection={enableSorting ? orderDirection : undefined}
    />
  )
}
