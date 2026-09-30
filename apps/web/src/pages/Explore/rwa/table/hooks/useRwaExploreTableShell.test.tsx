import { renderHook } from '@testing-library/react'
import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { ReactNode } from 'react'
import { mapRankedRwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/mapRankedRwa'
import { makeRankedRwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/rankedRwaTestHelpers'
import type { Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { describe, expect, it, vi } from 'vitest'
import { ExploreTablesFilterStoreContextProvider } from '~/features/Explore/state/exploreTablesFilterStore'
import { useRwaExploreTableShell } from '~/pages/Explore/rwa/table/hooks/useRwaExploreTableShell'
import { StocksSortMethod } from '~/pages/Explore/rwa/table/stocksTableSortStore'

function makeStock(symbol: string, priceUsd: number): Rwa {
  const rwa = mapRankedRwa({
    token: makeRankedRwa({
      symbol,
      priceUsd,
      issuerTokens: [
        {
          symbol,
          name: symbol,
          issuer: 'issuer',
          priceUsd,
          volume24hUsd: 1,
          chainTokens: [{ chainId: 1, address: `0x${symbol}` }],
        },
      ],
    }),
    category: RwaCategory.STOCKS,
  })
  if (!rwa) {
    throw new Error(`fixture failed for ${symbol}`)
  }
  return rwa
}

function wrapper({ children }: { children: ReactNode }): JSX.Element {
  return <ExploreTablesFilterStoreContextProvider>{children}</ExploreTablesFilterStoreContextProvider>
}

const paging = { hasNextPage: false, isFetchingNextPage: false, fetchNextPage: vi.fn() }
const rows = [makeStock('LOW', 1), makeStock('HIGH', 3), makeStock('MID', 2)]

describe('useRwaExploreTableShell', () => {
  it('sorts on the client when a sort method is given', () => {
    const { result } = renderHook(
      () =>
        useRwaExploreTableShell({
          rows,
          rowsKey: 'stocks',
          sortMethod: StocksSortMethod.PRICE,
          sortAscending: false,
          ...paging,
        }),
      { wrapper },
    )

    expect(result.current.visibleRows.map((row) => row.symbol)).toEqual(['HIGH', 'MID', 'LOW'])
    expect(result.current.rankByAsset.get(rows[1]!)).toBe(1)
  })

  it('keeps server order and ranks when no client sort is given', () => {
    const { result } = renderHook(() => useRwaExploreTableShell({ rows, rowsKey: 'stocks', ...paging }), {
      wrapper,
    })

    expect(result.current.visibleRows.map((row) => row.symbol)).toEqual(['LOW', 'HIGH', 'MID'])
    expect(result.current.rankByAsset.get(rows[2]!)).toBe(3)
  })
})
