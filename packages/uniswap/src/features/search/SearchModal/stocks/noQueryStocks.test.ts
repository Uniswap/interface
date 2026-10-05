import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { OnchainItemListOptionType } from 'uniswap/src/components/lists/items/types'
import { getRwaTagCategory } from 'uniswap/src/data/apiClients/dataApiService/rwa/getRwaTagCategory'
import type { IssuerToken, Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { buildNoQueryRwaCollectionOptions } from 'uniswap/src/features/search/SearchModal/stocks/noQueryStocks'

function issuer(name: string): IssuerToken {
  return {
    symbol: name,
    name,
    logoUrl: '',
    issuer: name.toLowerCase(),
    priceUsd: 1,
    volume24hUsd: 1,
    fdvUsd: 1,
    sparkline1d: { points: [] },
    chainTokens: [{ chainId: 1, address: `0x${name}` }],
  }
}

function rwa(symbol: string, issuerCount = 1): Rwa {
  return {
    symbol,
    name: symbol,
    logoUrl: '',
    priceUsd: 1,
    volume24hUsd: 1,
    fdvUsd: 1,
    sparkline1d: { points: [] },
    issuerTokens: Array.from({ length: issuerCount }, (_, i) => issuer(`${symbol}${i}`)),
  }
}

describe('buildNoQueryRwaCollectionOptions', () => {
  it('wraps the top N rwas as RwaCollection options preserving order', () => {
    const options = buildNoQueryRwaCollectionOptions({ rwas: [rwa('A'), rwa('B'), rwa('C'), rwa('D')], limit: 3 })
    expect(options).toHaveLength(3)
    expect(options.map((o) => o.type)).toEqual([
      OnchainItemListOptionType.RwaCollection,
      OnchainItemListOptionType.RwaCollection,
      OnchainItemListOptionType.RwaCollection,
    ])
    expect(options.map((o) => o.rwa.symbol)).toEqual(['A', 'B', 'C'])
  })

  it('shows the Stocks tag only for single-issuer entries', () => {
    const options = buildNoQueryRwaCollectionOptions({ rwas: [rwa('SOLO', 1), rwa('MULTI', 3)] })
    // Single-issuer → tagged token row; multi-issuer → expandable ticker (header conveys the category).
    expect(options.map((o) => o.showCategoryTag)).toEqual([true, false])
  })

  it('a single-issuer shelf row carries a renderable category tag', () => {
    const stock: Rwa = { ...rwa('SOLO', 1), categories: [RwaCategory.STOCKS] }
    const options = buildNoQueryRwaCollectionOptions({ rwas: [stock] })
    const single = options.find((o) => o.showCategoryTag)
    expect(single).toBeDefined()
    expect(getRwaTagCategory({ categories: single!.rwa.categories })).toBe(RwaCategory.STOCKS)
  })

  it('derives parent-row stats from the lowest-priced issuer, summing FDV and volume', () => {
    const multi = rwa('TSLA', 2)
    multi.issuerTokens[0]!.priceUsd = 250
    multi.issuerTokens[0]!.priceChange24hPct = 1.2
    multi.issuerTokens[1]!.priceUsd = 248.42
    multi.issuerTokens[1]!.priceChange24hPct = -0.5
    const [option] = buildNoQueryRwaCollectionOptions({ rwas: [multi] })
    // Each fixture issuer carries volume24hUsd: 1 and fdvUsd: 1.
    expect(option?.searchStats).toEqual({ priceUsd: 248.42, pricePercentChange1d: -0.5, fdvUsd: 2, volume1dUsd: 2 })
  })
})
