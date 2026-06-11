import { ListRankedRwasResponse, RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { mapRankedRwa, mapRankedRwaList } from 'uniswap/src/data/rest/rwa/mapRankedRwa'
import { makeRankedRwa } from 'uniswap/src/data/rest/rwa/rankedRwaTestHelpers'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

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
