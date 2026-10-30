import type { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import {
  type ExploreRwaRowsResult,
  type ExploreRwaRowsSort,
  useExploreRwaRows,
} from 'uniswap/src/data/apiClients/dataApiService/rwa/useExploreRwaRows'
import { RWA_CATEGORY_IDS } from 'uniswap/src/features/tokenCategories/rwaCategoryBridge'
import { useSelectedVolumeOrderBy } from '~/features/Explore/hooks/useSelectedVolumeOrderBy'
import { useExploreTablesFilterStore } from '~/features/Explore/state/exploreTablesFilterStore'
import { toSearchQueryParam } from '~/features/Explore/utils/toSearchQueryParam'
import { RwaExploreTableShell } from '~/pages/Explore/rwa/table/RwaExploreTableShell'
import { stocksSortMethodToOrderBy } from '~/pages/Explore/rwa/table/stocksSortMethodToOrderBy'
import {
  StocksTableSortStoreContextProvider,
  useStocksTableSortSelection,
} from '~/pages/Explore/rwa/table/stocksTableSortStore'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

/**
 * Chain scope for hosts without a chain URL param (e.g. category details). Presence of the object
 * is the override signal, so `{ chainId: undefined }` means all networks — distinct from omitting
 * the prop, which defers to the Explore URL param.
 */
export interface RwaChainScope {
  chainId: UniverseChainId | undefined
}

interface RwaCategoryTableProps {
  category: RwaCategory
  enableSorting?: boolean
  chainScope?: RwaChainScope
  /** Show an empty or failed result as loading, for a host about to replace this table. */
  holdEmptyResult?: boolean
}

function useRwaCategoryTableRows({
  category,
  chainScope,
  sort,
  holdEmptyResult = false,
}: {
  category: RwaCategory
  chainScope?: RwaChainScope
  sort?: ExploreRwaRowsSort
  holdEmptyResult?: boolean
}): Omit<ExploreRwaRowsResult, 'refetch'> & { rowsKey: string } {
  const urlChainId = useChainIdFromUrlParam()
  const chainId = chainScope ? chainScope.chainId : urlChainId
  const chainIds = useMemo(() => (chainId ? [chainId] : []), [chainId])
  const volumeOrderBy = useSelectedVolumeOrderBy()
  const filterString = useExploreTablesFilterStore((s) => s.filterString)
  const searchQuery = toSearchQueryParam(filterString)
  const result = useExploreRwaRows({ category, chainIds, volumeOrderBy, sort, searchQuery })
  // Mirrors the dimensions of the query key: the timeframe only changes the query when it is the ranking.
  const rowsKey = [category, chainId, sort?.orderBy ?? volumeOrderBy, sort?.ascending ?? false, searchQuery ?? ''].join(
    ':',
  )
  const held = holdEmptyResult && (result.isError || result.rows.length === 0)
  return { ...result, isLoading: result.isLoading || held, isError: result.isError && !held, rowsKey }
}

function SortableRwaCategoryTable(props: Omit<RwaCategoryTableProps, 'enableSorting'>): JSX.Element {
  const { sortMethod, sortAscending, orderDirection } = useStocksTableSortSelection()
  const volumeOrderBy = useSelectedVolumeOrderBy()
  const sort = useMemo(
    () => ({ orderBy: stocksSortMethodToOrderBy({ sortMethod, volumeOrderBy }), ascending: sortAscending }),
    [sortMethod, sortAscending, volumeOrderBy],
  )
  const {
    rows,
    rowsKey,
    isLoading,
    isError,
    hasNextPage,
    isFetchingNextPage,
    fetchNextPage,
    isSortedByServer,
    isSearchedByServer,
  } = useRwaCategoryTableRows({ ...props, sort })

  return (
    <RwaExploreTableShell
      rows={rows}
      rowsKey={rowsKey}
      isLoading={isLoading}
      isError={isError}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      categoryId={RWA_CATEGORY_IDS[props.category]}
      isSortedByServer={isSortedByServer}
      isSearchedByServer={isSearchedByServer}
      enableSorting
      sortMethod={sortMethod}
      sortAscending={sortAscending}
      orderDirection={orderDirection}
    />
  )
}

function NonSortableRwaCategoryTable(props: Omit<RwaCategoryTableProps, 'enableSorting'>): JSX.Element {
  const { rows, rowsKey, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage, isSearchedByServer } =
    useRwaCategoryTableRows(props)

  return (
    <RwaExploreTableShell
      rows={rows}
      rowsKey={rowsKey}
      isLoading={isLoading}
      isError={isError}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      categoryId={RWA_CATEGORY_IDS[props.category]}
      isSearchedByServer={isSearchedByServer}
    />
  )
}

/** RWA category table — parent asset rows expand to per-issuer breakdown. */
export function RwaCategoryTable({ enableSorting = false, ...props }: RwaCategoryTableProps): JSX.Element {
  if (enableSorting) {
    return (
      <StocksTableSortStoreContextProvider>
        <SortableRwaCategoryTable {...props} />
      </StocksTableSortStoreContextProvider>
    )
  }

  return <NonSortableRwaCategoryTable {...props} />
}
