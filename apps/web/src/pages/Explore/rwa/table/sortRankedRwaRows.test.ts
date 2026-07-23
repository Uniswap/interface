import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { mapRankedRwa } from 'uniswap/src/data/rest/rwa/mapRankedRwa'
import { makeRankedRwa } from 'uniswap/src/data/rest/rwa/rankedRwaTestHelpers'
import type { Rwa } from 'uniswap/src/data/rest/rwa/types'
import { sortRankedRwaRows } from '~/pages/Explore/rwa/table/sortRankedRwaRows'
import { StocksSortMethod } from '~/pages/Explore/rwa/table/stocksTableSortStore'

function makeStock(
  symbol: string,
  {
    volume24hUsd,
    priceUsd = 1,
    priceChange1hPct,
    priceDeviationPct,
    issuerTokens,
  }: {
    volume24hUsd: number
    priceUsd?: number
    priceChange1hPct?: number
    priceDeviationPct?: number
    issuerTokens?: Array<{
      symbol: string
      name: string
      issuer: string
      priceUsd: number
      volume24hUsd: number
      priceChange1hPct?: number
      chainTokens: Array<{ chainId: number; address: string }>
    }>
  },
): Rwa {
  const rwa = mapRankedRwa({
    token: makeRankedRwa({
      symbol,
      priceUsd,
      priceChange1hPct,
      priceDeviationPct,
      issuerTokens: issuerTokens ?? [
        {
          symbol,
          name: symbol,
          logoUrl: '',
          issuer: 'xstocks',
          priceUsd,
          volume24hUsd,
          marketCapUsd: volume24hUsd,
          priceChange1hPct,
          chainTokens: [{ chainId: 8453, address: `0x${symbol}` }],
        },
      ],
    }),
    category: RwaCategory.STOCKS,
  })
  if (!rwa) {
    throw new Error('failed to build Rwa test fixture')
  }
  return rwa
}

describe('sortRankedRwaRows', () => {
  it('sorts parent rows by volume descending by default', () => {
    const rows = [
      makeStock('AAPL', { volume24hUsd: 100 }),
      makeStock('TSLA', { volume24hUsd: 300 }),
      makeStock('NVDA', { volume24hUsd: 200 }),
    ]
    const sorted = sortRankedRwaRows(rows, { sortMethod: StocksSortMethod.VOLUME, sortAscending: false })
    expect(sorted.map((row) => row.symbol)).toEqual(['TSLA', 'NVDA', 'AAPL'])
  })

  it('sorts parent rows ascending when requested', () => {
    const rows = [makeStock('AAPL', { volume24hUsd: 100 }), makeStock('TSLA', { volume24hUsd: 300 })]
    const sorted = sortRankedRwaRows(rows, { sortMethod: StocksSortMethod.VOLUME, sortAscending: true })
    expect(sorted.map((row) => row.symbol)).toEqual(['AAPL', 'TSLA'])
  })

  it('keeps rows with missing optional metrics at the end when sorting descending', () => {
    const rows = [
      makeStock('AAPL', { volume24hUsd: 100, priceChange1hPct: 0.5 }),
      makeStock('TSLA', { volume24hUsd: 100, priceChange1hPct: undefined }),
      makeStock('NVDA', { volume24hUsd: 100, priceChange1hPct: 2 }),
    ]
    const sorted = sortRankedRwaRows(rows, { sortMethod: StocksSortMethod.HOUR_CHANGE, sortAscending: false })
    expect(sorted.map((row) => row.symbol)).toEqual(['NVDA', 'AAPL', 'TSLA'])
  })

  it('keeps rows with missing optional metrics at the end when sorting ascending', () => {
    const rows = [
      makeStock('AAPL', { volume24hUsd: 100, priceChange1hPct: 0.5 }),
      makeStock('TSLA', { volume24hUsd: 100, priceChange1hPct: undefined }),
      makeStock('NVDA', { volume24hUsd: 100, priceChange1hPct: 2 }),
    ]
    const sorted = sortRankedRwaRows(rows, { sortMethod: StocksSortMethod.HOUR_CHANGE, sortAscending: true })
    expect(sorted.map((row) => row.symbol)).toEqual(['AAPL', 'NVDA', 'TSLA'])
  })

  it('sorts multi-issuer price ranges by the minimum issuer price', () => {
    const rows = [
      makeStock('TSLA', {
        volume24hUsd: 100,
        priceUsd: 250,
        priceDeviationPct: 0.5,
        issuerTokens: [
          {
            symbol: 'TSLAON',
            name: 'Tesla (Ondo)',
            issuer: 'ondo',
            priceUsd: 250,
            volume24hUsd: 60,
            chainTokens: [{ chainId: 8453, address: '0xondo' }],
          },
          {
            symbol: 'TSLAb',
            name: 'Tesla (Backed)',
            issuer: 'backed',
            priceUsd: 248,
            volume24hUsd: 40,
            chainTokens: [{ chainId: 8453, address: '0xbacked' }],
          },
        ],
      }),
      makeStock('AAPL', { volume24hUsd: 100, priceUsd: 249 }),
    ]
    const sorted = sortRankedRwaRows(rows, { sortMethod: StocksSortMethod.PRICE, sortAscending: true })
    expect(sorted.map((row) => row.symbol)).toEqual(['TSLA', 'AAPL'])
  })
})
