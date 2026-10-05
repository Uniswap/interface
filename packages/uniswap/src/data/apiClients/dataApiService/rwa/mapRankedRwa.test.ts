import { ListRankedRwasResponse, RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { UniverseChainId } from '@universe/chains'
import { mapRankedRwa, mapRankedRwaList } from 'uniswap/src/data/apiClients/dataApiService/rwa/mapRankedRwa'
import { makeRankedRwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/rankedRwaTestHelpers'

describe('mapRankedRwa', () => {
  it('maps ranked RWA fields and issuer chain tokens', () => {
    const rwa = mapRankedRwa({ token: makeRankedRwa(), category: RwaCategory.STOCKS })
    expect(rwa).toMatchObject({
      symbol: 'TSLA',
      name: 'Tesla',
      priceUsd: 248.42,
      volume24hUsd: 12_400_000,
      issuerTokens: [
        expect.objectContaining({
          symbol: 'TSLAON',
          issuer: 'ondo',
          chainTokens: [{ chainId: UniverseChainId.Mainnet, address: '0xondo1' }],
        }),
      ],
    })
    expect(rwa?.sparkline1d.points[0]?.timestampS).toBe(1_700_000_000)
  })

  it('returns null when no issuer chain tokens are present', () => {
    expect(
      mapRankedRwa({
        token: makeRankedRwa({
          issuerTokens: [{ symbol: 'X', name: 'X', issuer: 'ondo', chainTokens: [] }],
        }),
        category: RwaCategory.STOCKS,
      }),
    ).toBeNull()
  })

  it('maps priceDeviationPct from ranked rows', () => {
    const rwa = mapRankedRwa({
      token: makeRankedRwa({ priceDeviationPct: 0.42 }),
      category: RwaCategory.STOCKS,
    })
    expect(rwa?.priceDeviationPct).toBe(0.42)
  })

  it('stamps the request category onto the mapped Rwa', () => {
    expect(mapRankedRwa({ token: makeRankedRwa(), category: RwaCategory.STOCKS })?.categories).toEqual([
      RwaCategory.STOCKS,
    ])
    expect(mapRankedRwa({ token: makeRankedRwa(), category: RwaCategory.ETFS })?.categories).toEqual([RwaCategory.ETFS])
  })

  it('sorts each issuer chainTokens mainnet-first then by ascending chainId (matches the search path)', () => {
    const OPTIMISM_CHAIN_ID = 10
    const BNB_CHAIN_ID = 56
    const rwa = mapRankedRwa({
      token: makeRankedRwa({
        issuerTokens: [
          {
            symbol: 'TSLAON',
            name: 'Tesla (Ondo)',
            issuer: 'ondo',
            // Out of order, with two non-mainnet chains so the ascending-chainId tiebreaker is exercised.
            chainTokens: [
              { chainId: BNB_CHAIN_ID, address: '0xbnb' },
              { chainId: UniverseChainId.Mainnet, address: '0xmainnet' },
              { chainId: OPTIMISM_CHAIN_ID, address: '0xop' },
            ],
          },
        ],
      }),
      category: RwaCategory.STOCKS,
    })
    expect(rwa?.issuerTokens[0]?.chainTokens).toEqual([
      { chainId: UniverseChainId.Mainnet, address: '0xmainnet' },
      { chainId: OPTIMISM_CHAIN_ID, address: '0xop' },
      { chainId: BNB_CHAIN_ID, address: '0xbnb' },
    ])
  })
})

describe('mapRankedRwa issuer FDV', () => {
  function issuerFdv(marketCapUsd: number | undefined): number | undefined {
    const rwa = mapRankedRwa({
      token: makeRankedRwa({
        issuerTokens: [
          {
            symbol: 'SPCXD',
            name: 'SpaceX (Dinari)',
            issuer: 'dinari',
            priceUsd: 164.57,
            volume24hUsd: 621_699,
            marketCapUsd,
            fdvUsd: 30_358_350_709_685,
            chainTokens: [{ chainId: UniverseChainId.Mainnet, address: '0xdinari' }],
          },
        ],
      }),
      category: RwaCategory.STOCKS,
    })
    return rwa?.issuerTokens[0]?.fdvUsd
  }

  it('keeps the issuer FDV when its market cap is positive or not served', () => {
    expect(issuerFdv(48_761_950)).toBe(30_358_350_709_685)
    expect(issuerFdv(undefined)).toBe(30_358_350_709_685)
  })

  it('drops the issuer FDV when its market cap is zero, since the backend then serves a bogus value', () => {
    expect(issuerFdv(0)).toBeUndefined()
  })
})

describe('mapRankedRwaList', () => {
  it('maps all ranked rows from the response', () => {
    const response = new ListRankedRwasResponse({
      rwas: [makeRankedRwa(), makeRankedRwa({ symbol: 'AAPL', name: 'Apple' })],
    })
    const rows = mapRankedRwaList({ response, category: RwaCategory.STOCKS })
    expect(rows).toHaveLength(2)
    expect(rows.map((row) => row.symbol)).toEqual(['TSLA', 'AAPL'])
  })

  it('stamps the category on every row of the list', () => {
    const response = new ListRankedRwasResponse({ rwas: [makeRankedRwa(), makeRankedRwa()] })
    const rwas = mapRankedRwaList({ response, category: RwaCategory.ETFS })
    expect(rwas.every((r) => r.categories?.[0] === RwaCategory.ETFS)).toBe(true)
  })
})
