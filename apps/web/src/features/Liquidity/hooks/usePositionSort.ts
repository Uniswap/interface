import { PositionSortBy } from '@uniswap/client-liquidity/dist/uniswap/liquidity/v2/types_pb'
import { useCallback, useState } from 'react'
import { type PositionSort, type PositionSortField } from '~/features/Liquidity/PositionsTableColumns'

const SORT_FIELD_TO_REQUEST: Record<PositionSortField, PositionSortBy> = {
  created_at: PositionSortBy.CREATED_AT,
  distribution: PositionSortBy.DISTRIBUTION,
  liquidity: PositionSortBy.LIQUIDITY,
  apr: PositionSortBy.APR,
}

// Maps the table sort to the GetWalletPositions request fields. Returns empty when no column is
// active so the request omits sort_by and the backend applies its default order.
export function positionSortToRequest(sort: PositionSort | undefined): {
  sortBy?: PositionSortBy
  ascending?: boolean
} {
  if (!sort) {
    return {}
  }
  return { sortBy: SORT_FIELD_TO_REQUEST[sort.field], ascending: sort.direction === 'asc' }
}

export interface UsePositionSortResult {
  sort: PositionSort | undefined
  onSort: (field: PositionSortField) => void
}

// Toggles a column's sort: a new field starts descending; re-selecting the active field flips
// direction.
export function usePositionSort(): UsePositionSortResult {
  const [sort, setSort] = useState<PositionSort | undefined>({ field: 'liquidity', direction: 'desc' })

  const onSort = useCallback((field: PositionSortField) => {
    setSort((prev) =>
      prev?.field === field
        ? { field, direction: prev.direction === 'desc' ? 'asc' : 'desc' }
        : { field, direction: 'desc' },
    )
  }, [])

  return { sort, onSort }
}
