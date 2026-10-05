import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { OnchainItemListOptionType } from 'uniswap/src/components/lists/items/types'
import type { IssuerToken, ListRwasAssetSource, Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import {
  buildRwaCollectionOption,
  buildRwaFromListRwasAsset,
  buildRwaSearchIndex,
  findRwaForToken,
  getRwaCollectionKey,
  aggregateRwaCollectionStats,
  getRwaCollectionSearchStats,
} from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'
import { logger } from 'utilities/src/logger/logger'

const MAINNET = 1
const BNB = 56

const ISSUER_BASE: IssuerToken = {
  symbol: 'TSLAX',
  name: 'Tesla',
  logoUrl: '',
  issuer: 'xstocks',
  priceUsd: 0,
  volume24hUsd: 0,
  sparkline1d: { points: [] },
  chainTokens: [{ chainId: MAINNET, address: '0xCCccCCccCCccCCccCCccCCccCCccCCccCCccCCcc' }],
}

const TSLA: ListRwasAssetSource = {
  symbol: 'TSLA',
  name: 'Tesla',
  logoUrl: 'https://example.com/tesla.png',
  issuerTokens: [
    { chainId: MAINNET, address: '0xAAaaAAaaAAaaAAaaAAaaAAaaAAaaAAaaAAaaAAaa', issuer: 'ondo' },
    { chainId: BNB, address: '0xBBbbBBbbBBbbBBbbBBbbBBbbBBbbBBbbBBbbBBbb', issuer: 'ondo' },
    { chainId: MAINNET, address: '0xCCccCCccCCccCCccCCccCCccCCccCCccCCccCCcc', issuer: 'xstocks' },
  ],
  issuerData: {
    ondo: { name: 'Ondo', symbol: 'TSLAON', logoUrl: 'https://example.com/ondo.png' },
    xstocks: { name: 'xStocks', symbol: 'TSLAX', logoUrl: 'https://example.com/xstocks.png' },
  },
}

describe('buildRwaSearchIndex', () => {
  it('builds one Rwa per asset, grouping flat issuerTokens by issuer with all chains', () => {
    const { rwas } = buildRwaSearchIndex([TSLA])
    expect(rwas).toHaveLength(1)
    const rwa = rwas[0]!
    expect(rwa.symbol).toBe('TSLA')
    expect(rwa.name).toBe('Tesla')
    expect(rwa.issuerTokens.map((i) => i.issuer)).toEqual(['ondo', 'xstocks'])
    const ondo = rwa.issuerTokens[0]!
    expect(ondo.name).toBe('Ondo')
    expect(ondo.symbol).toBe('TSLAON')
    expect(ondo.chainTokens).toEqual([
      { chainId: MAINNET, address: '0xAAaaAAaaAAaaAAaaAAaaAAaaAAaaAAaaAAaaAAaa' },
      { chainId: BNB, address: '0xBBbbBBbbBBbbBBbbBBbbBBbbBBbbBBbbBBbbBBbb' },
    ])
  })

  it('drops issuer tokens with no issuerData entry, and drops assets left empty', () => {
    const { rwas } = buildRwaSearchIndex([
      {
        symbol: 'X',
        name: 'X',
        logoUrl: '',
        issuerTokens: [{ chainId: MAINNET, address: '0xddd', issuer: 'mystery' }],
        issuerData: {},
      },
    ])
    expect(rwas).toEqual([])
  })

  it('indexes every chain/address and matches case-insensitively', () => {
    const index = buildRwaSearchIndex([TSLA])
    expect(
      findRwaForToken(index, { chainId: MAINNET, address: '0xaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaaa' })?.rwa.symbol,
    ).toBe('TSLA')
    expect(
      findRwaForToken(index, { chainId: BNB, address: '0xBBbbBBbbBBbbBBbbBBbbBBbbBBbbBBbbBBbbBBbb' })?.issuer.issuer,
    ).toBe('ondo')
    expect(
      findRwaForToken(index, { chainId: MAINNET, address: '0x0000000000000000000000000000000000000000' }),
    ).toBeUndefined()
    expect(findRwaForToken(index, { chainId: null, address: '0xAAaa' })).toBeUndefined()
  })
})

describe('buildRwaCollectionOption', () => {
  it('wraps a Rwa as a RwaCollection option', () => {
    const { rwas } = buildRwaSearchIndex([TSLA])
    const option = buildRwaCollectionOption({ rwa: rwas[0]!, showCategoryTag: true })
    expect(option.type).toBe(OnchainItemListOptionType.RwaCollection)
    expect(option.rwa.symbol).toBe('TSLA')
  })
})

describe('buildRwaFromListRwasAsset categories', () => {
  it('carries categories from the ListRwas asset onto the built Rwa', () => {
    const asset = {
      symbol: 'TSLA',
      name: 'Tesla',
      logoUrl: 'logo',
      categories: [RwaCategory.STOCKS],
      issuerTokens: [{ chainId: 1, address: '0xabc', issuer: 'ondo' }],
      issuerData: { ondo: { name: 'Ondo', symbol: 'oTSLA', logoUrl: 'l' } },
    }
    expect(buildRwaFromListRwasAsset(asset)?.categories).toEqual([RwaCategory.STOCKS])
  })

  it('leaves categories undefined when the asset omits them', () => {
    const asset = {
      symbol: 'TSLA',
      name: 'Tesla',
      logoUrl: 'logo',
      issuerTokens: [{ chainId: 1, address: '0xabc', issuer: 'ondo' }],
      issuerData: { ondo: { name: 'Ondo', symbol: 'oTSLA', logoUrl: 'l' } },
    }
    expect(buildRwaFromListRwasAsset(asset)?.categories).toBeUndefined()
  })
})

describe('getRwaCollectionKey', () => {
  // A refetch can reorder issuers; the collection key must stay identical regardless of issuer order.
  function nvdaWithIssuerOrder(issuerTokens: ListRwasAssetSource['issuerTokens']): ListRwasAssetSource {
    return {
      symbol: 'NVDA',
      name: 'Nvidia',
      logoUrl: '',
      issuerTokens,
      issuerData: {
        alpha: { name: 'Alpha', symbol: 'NVDAA', logoUrl: '' },
        beta: { name: 'Beta', symbol: 'NVDAB', logoUrl: '' },
      },
    }
  }
  const alphaToken = { chainId: MAINNET, address: '0xAAaaAAaaAAaaAAaaAAaaAAaaAAaaAAaaAAaaAAaa', issuer: 'alpha' }
  const betaToken = { chainId: MAINNET, address: '0xBBbbBBbbBBbbBBbbBBbbBBbbBBbbBBbbBBbbBBbb', issuer: 'beta' }

  it('is identical regardless of the order issuers arrive in from the API', () => {
    const order1 = buildRwaSearchIndex([nvdaWithIssuerOrder([alphaToken, betaToken])]).rwas[0]!
    const order2 = buildRwaSearchIndex([nvdaWithIssuerOrder([betaToken, alphaToken])]).rwas[0]!
    expect(getRwaCollectionKey({ rwa: order1 })).toBe(getRwaCollectionKey({ rwa: order2 }))
  })

  it('distinguishes two assets that share a display symbol but differ by anchor address', () => {
    const a = buildRwaSearchIndex([nvdaWithIssuerOrder([alphaToken])]).rwas[0]!
    const b = buildRwaSearchIndex([nvdaWithIssuerOrder([betaToken])]).rwas[0]!
    expect(getRwaCollectionKey({ rwa: a })).not.toBe(getRwaCollectionKey({ rwa: b }))
  })
})

describe('buildRwaFromListRwasAsset empty issuer (commodity)', () => {
  beforeEach(() => {
    vi.spyOn(logger, 'error').mockImplementation(() => undefined)
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('synthesizes an issuer from asset-level display for an empty-issuer token, without logging', () => {
    const rwa = buildRwaFromListRwasAsset({
      symbol: 'GOLD',
      name: 'Gold',
      logoUrl: 'https://example.com/gold.png',
      issuerTokens: [{ chainId: MAINNET, address: '0xGold', issuer: '' }],
      issuerData: {},
    })

    expect(rwa?.issuerTokens).toHaveLength(1)
    const issuer = rwa!.issuerTokens[0]!
    expect(issuer.issuer).toBe('')
    expect(issuer.name).toBe('Gold')
    expect(issuer.symbol).toBe('GOLD')
    expect(issuer.logoUrl).toBe('https://example.com/gold.png')
    expect(issuer.chainTokens).toEqual([{ chainId: MAINNET, address: '0xGold' }])
    expect(logger.error).not.toHaveBeenCalled()
  })

  it('logs an error and drops a non-empty issuer token with no issuerData entry', () => {
    buildRwaFromListRwasAsset({
      symbol: 'X',
      name: 'X',
      logoUrl: '',
      issuerTokens: [{ chainId: MAINNET, address: '0xddd', issuer: 'mystery' }],
      issuerData: {},
    })

    expect(logger.error).toHaveBeenCalledWith(
      expect.any(Error),
      expect.objectContaining({
        tags: { file: 'resolveRwaIssuerDisplay.ts', function: 'resolveRwaIssuerDisplay' },
      }),
    )
  })
})

describe('aggregateRwaCollectionStats', () => {
  it('takes price + change from the lowest-priced entry, ignoring entries without a price', () => {
    expect(
      aggregateRwaCollectionStats([
        { pricePercentChange1d: 9 },
        { priceUsd: 250, pricePercentChange1d: 1 },
        { priceUsd: 248.42, pricePercentChange1d: -2 },
      ]),
    ).toEqual({ priceUsd: 248.42, pricePercentChange1d: -2 })
  })

  it('sums 1d volume across entries, ignoring entries without one', () => {
    expect(
      aggregateRwaCollectionStats([{ priceUsd: 250, volume1dUsd: 100 }, { priceUsd: 248.42 }, { volume1dUsd: 50 }]),
    ).toEqual({ priceUsd: 248.42, volume1dUsd: 150 })
  })

  it('sums FDV across entries, ignoring entries without one or with zero', () => {
    expect(
      aggregateRwaCollectionStats([{ priceUsd: 250, fdvUsd: 100 }, { fdvUsd: 0 }, { fdvUsd: 50 }, { volume1dUsd: 5 }]),
    ).toEqual({ priceUsd: 250, fdvUsd: 150, volume1dUsd: 5 })
    expect(aggregateRwaCollectionStats([{ fdvUsd: 0 }])).toBeUndefined()
  })

  it('is undefined when no entry carries a price, FDV, or volume', () => {
    expect(aggregateRwaCollectionStats([{ pricePercentChange1d: 9 }])).toBeUndefined()
    expect(aggregateRwaCollectionStats([])).toBeUndefined()
  })

  it('treats zero price and zero volume as missing, so they never win the floor or pad the sum', () => {
    expect(
      aggregateRwaCollectionStats([
        { priceUsd: 0, pricePercentChange1d: 0, volume1dUsd: 0 },
        { priceUsd: 248.42, pricePercentChange1d: -2, volume1dUsd: 50 },
      ]),
    ).toEqual({ priceUsd: 248.42, pricePercentChange1d: -2, volume1dUsd: 50 })
    expect(aggregateRwaCollectionStats([{ priceUsd: 0, volume1dUsd: 0 }])).toBeUndefined()
  })
})

describe('getRwaCollectionSearchStats', () => {
  it('uses the lowest issuer price + that issuer’s 24h change, and the summed FDV and volume, on a ranked Rwa', () => {
    const rwa: Rwa = {
      symbol: 'TSLA',
      name: 'Tesla',
      logoUrl: '',
      priceUsd: 249,
      volume24hUsd: 0,
      sparkline1d: { points: [] },
      issuerTokens: [
        { ...ISSUER_BASE, issuer: 'xstocks', priceUsd: 250, priceChange24hPct: 1.2, fdvUsd: 1_000, volume24hUsd: 100 },
        { ...ISSUER_BASE, issuer: 'ondo', priceUsd: 248.42, priceChange24hPct: -0.5, fdvUsd: 500, volume24hUsd: 50 },
      ],
    }
    expect(getRwaCollectionSearchStats(rwa)).toEqual({
      priceUsd: 248.42,
      pricePercentChange1d: -0.5,
      fdvUsd: 1_500,
      volume1dUsd: 150,
    })
  })

  it('is undefined for a ListRwas-built Rwa (zeroed prices)', () => {
    const { rwas } = buildRwaSearchIndex([TSLA])
    expect(getRwaCollectionSearchStats(rwas[0]!)).toBeUndefined()
  })

  it('threads searchStats onto the built collection option', () => {
    const { rwas } = buildRwaSearchIndex([TSLA])
    const searchStats = { priceUsd: 1 }
    expect(buildRwaCollectionOption({ rwa: rwas[0]!, showCategoryTag: true, searchStats }).searchStats).toBe(
      searchStats,
    )
    expect(buildRwaCollectionOption({ rwa: rwas[0]!, showCategoryTag: true })).not.toHaveProperty('searchStats')
  })
})
