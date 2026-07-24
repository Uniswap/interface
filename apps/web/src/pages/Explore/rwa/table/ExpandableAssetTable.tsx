import { useMemo } from 'react'
import type { Rwa } from 'uniswap/src/data/rest/rwa/types'
import { useEnabledChains } from 'uniswap/src/features/chains/hooks/useEnabledChains'
import type { OrderDirection } from '~/appGraphql/data/util'
import { Table } from '~/components/Table'
import { EXPANDABLE_ASSET_TABLE_ROW_HEIGHT } from '~/pages/Explore/rwa/table/expandableAssetTableConstants'
import {
  buildExpandableAssetTableRows,
  getExpandableAssetSubRows,
  getExpandableAssetTableRowId,
  type ExpandableAssetTableRow,
} from '~/pages/Explore/rwa/table/expandableAssetTableRowUtils'
import type { StocksSortMethod } from '~/pages/Explore/rwa/table/stocksTableSortStore'
import { useExpandableAssetTableColumns } from '~/pages/Explore/rwa/table/useExpandableAssetTableColumns'
import { useExpandableAssetTableExpandableRow } from '~/pages/Explore/rwa/table/useExpandableAssetTableExpandableRow'
import { useChainIdFromUrlParam } from '~/utils/params/chainParams'

export type ExpandableAssetTableProps = {
  assets: Rwa[]
  isLoading: boolean
  isError: boolean
  loadMore?: (params: { onComplete?: () => void }) => void
  enableSorting?: boolean
  sortMethod?: StocksSortMethod
  orderDirection?: OrderDirection
}

/** Expandable asset table — parent rows expand to per-issuer breakdown.
 * Ranked RWA list is small enough to render without row virtualization. */
export function ExpandableAssetTable({
  assets,
  isLoading,
  isError,
  loadMore,
  enableSorting = false,
  sortMethod,
  orderDirection,
}: ExpandableAssetTableProps): JSX.Element {
  const { chains: enabledChainIds } = useEnabledChains()
  const chainFilter = useChainIdFromUrlParam()

  const showLoadingSkeleton = isLoading

  const data = useMemo(
    () => buildExpandableAssetTableRows({ assets, enabledChainIds, chainFilter }),
    [assets, enabledChainIds, chainFilter],
  )

  const columns = useExpandableAssetTableColumns({
    showLoadingSkeleton,
    enabledChainIds,
    enableSorting,
    sortMethod: enableSorting ? sortMethod : undefined,
    orderDirection: enableSorting ? orderDirection : undefined,
  })

  const { rowWrapper, renderUnifiedExpandableRow } = useExpandableAssetTableExpandableRow()

  return (
    <Table<ExpandableAssetTableRow>
      columns={columns}
      data={data}
      loading={isLoading}
      error={isError}
      loadMore={loadMore}
      rowHeight={EXPANDABLE_ASSET_TABLE_ROW_HEIGHT}
      compactRowHeight={EXPANDABLE_ASSET_TABLE_ROW_HEIGHT}
      maxWidth={1200}
      defaultPinnedColumns={['tokenDescription']}
      getRowId={getExpandableAssetTableRowId}
      getSubRows={getExpandableAssetSubRows}
      singleExpandedRow
      rowWrapper={rowWrapper}
      renderUnifiedExpandableRow={renderUnifiedExpandableRow}
    />
  )
}
