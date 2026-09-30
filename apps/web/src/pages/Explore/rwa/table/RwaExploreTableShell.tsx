import type { Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { type OrderDirection } from '~/data/util'
import { ExpandableAssetTable } from '~/pages/Explore/rwa/table/ExpandableAssetTable'
import { useRwaExploreTableShell } from '~/pages/Explore/rwa/table/hooks/useRwaExploreTableShell'
import { useRwaTableFilterEmptyState } from '~/pages/Explore/rwa/table/hooks/useRwaTableFilterEmptyState'
import type { StocksSortMethod } from '~/pages/Explore/rwa/table/stocksTableSortStore'

export function RwaExploreTableShell({
  rows,
  rowsKey,
  isLoading,
  isError,
  hasNextPage,
  isFetchingNextPage,
  fetchNextPage,
  isSortedByServer = false,
  enableSorting = false,
  sortMethod,
  sortAscending,
  orderDirection,
}: {
  rows: Rwa[]
  /** Identity of the query serving `rows`; the row window restarts when it changes. */
  rowsKey: string
  isLoading: boolean
  isError: boolean
  hasNextPage: boolean
  isFetchingNextPage: boolean
  fetchNextPage: () => void
  /** Rows already arrive in `sortMethod` order, so only the header indicators are needed. */
  isSortedByServer?: boolean
  enableSorting?: boolean
  sortMethod?: StocksSortMethod
  sortAscending?: boolean
  orderDirection?: OrderDirection
}): JSX.Element {
  const sortOnClient = enableSorting && !isSortedByServer
  const { visibleRows, rankByAsset, loadMore } = useRwaExploreTableShell({
    rows,
    rowsKey,
    sortMethod: sortOnClient ? sortMethod : undefined,
    sortAscending: sortOnClient ? sortAscending : undefined,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
  })

  const emptyState = useRwaTableFilterEmptyState(visibleRows.length === 0 && !isLoading && !isError)

  return (
    <ExpandableAssetTable
      assets={visibleRows}
      rankByAsset={rankByAsset}
      isLoading={isLoading}
      isError={isError}
      loadMore={loadMore}
      enableSorting={enableSorting}
      sortMethod={enableSorting ? sortMethod : undefined}
      orderDirection={enableSorting ? orderDirection : undefined}
      emptyState={emptyState}
    />
  )
}
