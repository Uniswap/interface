import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { useMemo } from 'react'
import { deriveRwaAggregates } from 'uniswap/src/data/rest/rwa/rwaMetrics'
import type { ExploreStockShelfItem, Rwa } from 'uniswap/src/data/rest/rwa/types'
import { useExploreRwaRows } from 'uniswap/src/data/rest/rwa/useExploreRwaRows'

export const EXPLORE_STOCK_SHELF_COUNT = 12

export function useExploreStocks(
  chainIds: number[] = [],
  options: { excludeSymbol?: string; enabled?: boolean } = {},
): {
  rows: Rwa[]
  featured: ExploreStockShelfItem[]
  isLoading: boolean
  isError: boolean
} {
  const { excludeSymbol, enabled = true } = options
  const { rows, isLoading, isError } = useExploreRwaRows({ category: RwaCategory.STOCKS, chainIds, enabled })

  const featured = useMemo((): ExploreStockShelfItem[] => {
    return [...rows]
      .filter((rwa) => !excludeSymbol || rwa.symbol.toUpperCase() !== excludeSymbol.toUpperCase())
      .map((rwa) => ({ rwa, volume24hUsd: deriveRwaAggregates(rwa).volume24hUsd }))
      .sort((a, b) => b.volume24hUsd - a.volume24hUsd)
      .slice(0, EXPLORE_STOCK_SHELF_COUNT)
      .flatMap(({ rwa }) => {
        const issuer = rwa.issuerTokens[0]
        return issuer ? [{ rwa, issuer }] : []
      })
  }, [rows, excludeSymbol])

  return { rows, featured, isLoading, isError }
}
