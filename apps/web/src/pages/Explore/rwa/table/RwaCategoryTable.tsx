import type { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useMemo } from 'react'
import { useExploreRwaRows } from 'uniswap/src/data/rest/rwa/useExploreRwaRows'
import { RwaExploreTableShell } from '~/pages/Explore/rwa/table/RwaExploreTableShell'
import {
  StocksTableSortStoreContextProvider,
  useStocksTableSortSelection,
} from '~/pages/Explore/rwa/table/stocksTableSortStore'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

function useRwaCategoryTableRows(category: RwaCategory): {
  rows: ReturnType<typeof useExploreRwaRows>['rows']
  isLoading: boolean
  isError: boolean
} {
  const chainId = useChainIdFromUrlParam()
  const chainIds = useMemo(() => (chainId ? [chainId] : []), [chainId])
  return useExploreRwaRows({ category, chainIds })
}

function SortableRwaCategoryTable({ category }: { category: RwaCategory }): JSX.Element {
  const { rows, isLoading, isError } = useRwaCategoryTableRows(category)
  const { sortMethod, sortAscending, orderDirection } = useStocksTableSortSelection()

  return (
    <RwaExploreTableShell
      rows={rows}
      isLoading={isLoading}
      isError={isError}
      enableSorting
      sortMethod={sortMethod}
      sortAscending={sortAscending}
      orderDirection={orderDirection}
    />
  )
}

function NonSortableRwaCategoryTable({ category }: { category: RwaCategory }): JSX.Element {
  const { rows, isLoading, isError } = useRwaCategoryTableRows(category)

  return <RwaExploreTableShell rows={rows} isLoading={isLoading} isError={isError} />
}

/** RWA category table — parent asset rows expand to per-issuer breakdown. */
export function RwaCategoryTable({
  category,
  enableSorting = false,
}: {
  category: RwaCategory
  enableSorting?: boolean
}): JSX.Element {
  if (enableSorting) {
    return (
      <StocksTableSortStoreContextProvider>
        <SortableRwaCategoryTable category={category} />
      </StocksTableSortStoreContextProvider>
    )
  }

  return <NonSortableRwaCategoryTable category={category} />
}
