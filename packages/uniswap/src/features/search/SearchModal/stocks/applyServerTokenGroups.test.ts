import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import {
  OnchainItemListOptionType,
  type RwaCollectionOption,
  type TokenOption,
} from 'uniswap/src/components/lists/items/types'
import type { ChainToken, IssuerToken, Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import { applyServerTokenGroupsToSearchOptions } from 'uniswap/src/features/search/SearchModal/stocks/applyServerTokenGroups'

const MAINNET = 1
const BASE = 8453

function issuer({
  symbol,
  slug,
  chainTokens,
  priceUsd,
}: {
  symbol: string
  slug: string
  chainTokens: ChainToken[]
  priceUsd: number
}): IssuerToken {
  return {
    symbol,
    name: symbol,
    logoUrl: '',
    issuer: slug,
    issuerDisplayName: slug.toUpperCase(),
    priceUsd,
    priceChange24hPct: 1,
    volume24hUsd: 10,
    sparkline1d: { points: [] },
    chainTokens,
  }
}

function group(symbol: string, issuerTokens: IssuerToken[]): Rwa {
  return {
    symbol,
    name: symbol,
    logoUrl: '',
    categories: [RwaCategory.STOCKS],
    priceUsd: 100,
    volume24hUsd: 20,
    sparkline1d: { points: [] },
    issuerTokens,
  }
}

const tesla = group('TSLA', [
  issuer({ symbol: 'TSLAON', slug: 'ondo', chainTokens: [{ chainId: MAINNET, address: '0xa' }], priceUsd: 101 }),
  issuer({ symbol: 'TSLAX', slug: 'xstocks', chainTokens: [{ chainId: BASE, address: '0xc' }], priceUsd: 99 }),
])
const novo = group('NVO', [
  issuer({ symbol: 'NVOON', slug: 'ondo', chainTokens: [{ chainId: MAINNET, address: '0xn' }], priceUsd: 50 }),
])

function token(chainId: number, address: string, symbol: string): TokenOption {
  return {
    type: OnchainItemListOptionType.Token,
    currencyInfo: {
      currencyId: `${chainId}-${address}`,
      currency: { chainId, address, isNative: false, symbol },
    } as never,
    quantity: null,
    balanceUSD: undefined,
  }
}

function isCollection(option: { type: OnchainItemListOptionType }): option is RwaCollectionOption {
  return option.type === OnchainItemListOptionType.RwaCollection
}

describe('applyServerTokenGroupsToSearchOptions', () => {
  it('leads with the collection of a multi-issuer group the query names and drops the member tokens it covers', () => {
    const meme = token(MAINNET, '0xmeme', 'FTR')
    const out = applyServerTokenGroupsToSearchOptions({
      options: [meme, token(MAINNET, '0xa', 'TSLAON'), token(BASE, '0xc', 'TSLAX')],
      groups: [tesla],
      searchQuery: 'tsl',
      isAddressSearch: false,
      plainTokenNames: true,
    })

    expect(out).toHaveLength(2)
    const [collection, remaining] = out
    expect(collection && isCollection(collection) && collection.rwa).toBe(tesla)
    expect(collection && isCollection(collection) && collection.searchStats?.priceUsd).toBe(99)
    expect(remaining).toBe(meme)
  })

  it('tags the token of a single-issuer group instead of rolling it up', () => {
    const out = applyServerTokenGroupsToSearchOptions({
      options: [token(MAINNET, '0xn', 'NVOON')],
      groups: [novo],
      searchQuery: 'nvo',
      isAddressSearch: false,
      plainTokenNames: true,
    })

    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({
      type: OnchainItemListOptionType.Token,
      rwaCategory: RwaCategory.STOCKS,
      rwaIssuer: { issuer: 'ondo', issuerDisplayName: 'ONDO' },
    })
  })

  it('draws a single-issuer group the query names as its own row when no hit carries it', () => {
    const meme = token(MAINNET, '0xmeme', 'FTR')
    const out = applyServerTokenGroupsToSearchOptions({
      options: [meme],
      groups: [novo],
      searchQuery: 'nvo',
      isAddressSearch: false,
      plainTokenNames: true,
    })

    expect(out).toHaveLength(2)
    const [lone, remaining] = out
    expect(lone && isCollection(lone) && lone.rwa).toBe(novo)
    expect(lone && isCollection(lone) && lone.rowLayout?.dynamicHeight).toBe(false)
    expect(remaining).toBe(meme)
  })

  it('keeps the tagged tokens in place and makes no row for a group matched only through a member', () => {
    const meme = token(MAINNET, '0xmeme', 'FTR')
    const out = applyServerTokenGroupsToSearchOptions({
      options: [meme, token(MAINNET, '0xa', 'TSLAON')],
      groups: [tesla],
      searchQuery: 'ondo',
      isAddressSearch: false,
      plainTokenNames: true,
    })

    expect(out).toHaveLength(2)
    expect(out[0]).toBe(meme)
    expect(out[1]).toMatchObject({ type: OnchainItemListOptionType.Token, rwaIssuer: { issuer: 'ondo' } })
  })

  it('leads with at most three groups the query names, in server order', () => {
    const groups = ['AAPL', 'AMZN', 'AMD', 'ABNB'].map((symbol) =>
      group(symbol, [
        issuer({
          symbol: `${symbol}ON`,
          slug: 'ondo',
          chainTokens: [{ chainId: MAINNET, address: `0x${symbol}1` }],
          priceUsd: 1,
        }),
        issuer({
          symbol: `${symbol}X`,
          slug: 'xstocks',
          chainTokens: [{ chainId: BASE, address: `0x${symbol}2` }],
          priceUsd: 1,
        }),
      ]),
    )
    const out = applyServerTokenGroupsToSearchOptions({
      options: [],
      groups,
      searchQuery: 'a',
      isAddressSearch: false,
      plainTokenNames: true,
    })

    expect(out.map((option) => isCollection(option) && option.rwa.symbol)).toEqual(['AAPL', 'AMZN', 'AMD'])
  })

  it('never rolls up on an address search, only tags the matched token', () => {
    const out = applyServerTokenGroupsToSearchOptions({
      options: [token(MAINNET, '0xa', 'TSLAON')],
      groups: [tesla],
      searchQuery: '0xa',
      isAddressSearch: true,
      plainTokenNames: true,
    })

    expect(out).toHaveLength(1)
    expect(out[0]).toMatchObject({ type: OnchainItemListOptionType.Token, rwaIssuer: { issuer: 'ondo' } })
  })

  it('returns the hits untouched when the server matched no group', () => {
    const options = [token(MAINNET, '0xmeme', 'FTR')]

    expect(
      applyServerTokenGroupsToSearchOptions({
        options,
        groups: [],
        searchQuery: 'ftr',
        isAddressSearch: false,
        plainTokenNames: true,
      }),
    ).toBe(options)
  })
})
