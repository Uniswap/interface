import { deriveRwaAggregates } from 'uniswap/src/data/rest/rwa/rwaMetrics'
import type { Rwa } from 'uniswap/src/data/rest/rwa/types'
import { StocksSortMethod } from '~/pages/Explore/rwa/table/stocksTableSortStore'

function getSortValue(rwa: Rwa, sortMethod: StocksSortMethod): number | undefined {
  const metrics = deriveRwaAggregates(rwa)
  switch (sortMethod) {
    case StocksSortMethod.PRICE:
      return metrics.priceUsd
    case StocksSortMethod.HOUR_CHANGE:
      return metrics.priceChange1hPct
    case StocksSortMethod.DAY_CHANGE:
      return metrics.priceChange24hPct
    case StocksSortMethod.MARKET_CAP:
      return metrics.marketCapUsd
    case StocksSortMethod.VOLUME:
      return metrics.volume24hUsd
    default:
      return metrics.volume24hUsd
  }
}

function isValidSortValue(value: number | undefined): value is number {
  return value !== undefined && !Number.isNaN(value)
}

/** Rows with missing metrics sort last regardless of ascending/descending direction. */
function compareSortValues({
  a,
  b,
  sortAscending,
}: {
  a: number | undefined
  b: number | undefined
  sortAscending: boolean
}): number {
  const aValid = isValidSortValue(a)
  const bValid = isValidSortValue(b)
  if (!aValid && !bValid) {
    return 0
  }
  if (!aValid) {
    return 1
  }
  if (!bValid) {
    return -1
  }
  const direction = sortAscending ? 1 : -1
  return (a - b) * direction
}

/** Client-side sort for parent Rwa rows; issuer sub-rows stay grouped under their parent. */
export function sortRankedRwaRows(
  rows: Rwa[],
  { sortMethod, sortAscending }: { sortMethod: StocksSortMethod; sortAscending: boolean },
): Rwa[] {
  return [...rows].sort((rowA, rowB) =>
    compareSortValues({
      a: getSortValue(rowA, sortMethod),
      b: getSortValue(rowB, sortMethod),
      sortAscending,
    }),
  )
}
