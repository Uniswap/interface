import type { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { UniverseChainId } from '@universe/chains'
import { useMemo } from 'react'
import {
  type ExploreRwaRowsResult,
  type ExploreRwaRowsSort,
  useExploreRwaRows,
} from 'uniswap/src/data/apiClients/dataApiService/rwa/useExploreRwaRows'
import { useSelectedVolumeOrderBy } from '~/features/Explore/hooks/useSelectedVolumeOrderBy'
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
}

function useRwaCategoryTableRows({
  category,
  chainScope,
  sort,
}: {
  category: RwaCategory
  chainScope?: RwaChainScope
  sort?: ExploreRwaRowsSort
}): Omit<ExploreRwaRowsResult, 'refetch'> & { rowsKey: string } {
  const urlChainId = useChainIdFromUrlParam()
  const chainId = chainScope ? chainScope.chainId : urlChainId
  const chainIds = useMemo(() => (chainId ? [chainId] : []), [chainId])
  const volumeOrderBy = useSelectedVolumeOrderBy()
  const result = useExploreRwaRows({ category, chainIds, volumeOrderBy, sort })
  // Mirrors the dimensions of the query key: the timeframe only changes the query when it is the ranking.
  const rowsKey = [category, chainId, sort?.orderBy ?? volumeOrderBy, sort?.ascending ?? false].join(':')
  return { ...result, rowsKey }
}

function SortableRwaCategoryTable({ category, chainScope }: Omit<RwaCategoryTableProps, 'enableSorting'>): JSX.Element {
  const { sortMethod, sortAscending, orderDirection } = useStocksTableSortSelection()
  const volumeOrderBy = useSelectedVolumeOrderBy()
  const sort = useMemo(
    () => ({ orderBy: stocksSortMethodToOrderBy({ sortMethod, volumeOrderBy }), ascending: sortAscending }),
    [sortMethod, sortAscending, volumeOrderBy],
  )
  const { rows, rowsKey, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage, isSortedByServer } =
    useRwaCategoryTableRows({ category, chainScope, sort })

  return (
    <RwaExploreTableShell
      rows={rows}
      rowsKey={rowsKey}
      isLoading={isLoading}
      isError={isError}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
      isSortedByServer={isSortedByServer}
      enableSorting
      sortMethod={sortMethod}
      sortAscending={sortAscending}
      orderDirection={orderDirection}
    />
  )
}

function NonSortableRwaCategoryTable({
  category,
  chainScope,
}: Omit<RwaCategoryTableProps, 'enableSorting'>): JSX.Element {
  const { rows, rowsKey, isLoading, isError, hasNextPage, isFetchingNextPage, fetchNextPage } = useRwaCategoryTableRows(
    { category, chainScope },
  )

  return (
    <RwaExploreTableShell
      rows={rows}
      rowsKey={rowsKey}
      isLoading={isLoading}
      isError={isError}
      hasNextPage={hasNextPage}
      isFetchingNextPage={isFetchingNextPage}
      fetchNextPage={fetchNextPage}
    />
  )
}

/** RWA category table — parent asset rows expand to per-issuer breakdown. */
export function RwaCategoryTable({ category, enableSorting = false, chainScope }: RwaCategoryTableProps): JSX.Element {
  if (enableSorting) {
    return (
      <StocksTableSortStoreContextProvider>
        <SortableRwaCategoryTable category={category} chainScope={chainScope} />
      </StocksTableSortStoreContextProvider>
    )
  }

  return <NonSortableRwaCategoryTable category={category} chainScope={chainScope} />
}
