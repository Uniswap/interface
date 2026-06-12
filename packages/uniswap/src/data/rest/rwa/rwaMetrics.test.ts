import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { mapRankedRwa } from 'uniswap/src/data/rest/rwa/mapRankedRwa'
import { makeRankedRwa } from 'uniswap/src/data/rest/rwa/rankedRwaTestHelpers'
import {
  deriveRwaAggregates,
  getIssuerCount,
  getIssuerPriceDisplay,
  getNetworkCount,
  getRwaPriceDisplay,
  getRwaPriceSortValue,
} from 'uniswap/src/data/rest/rwa/rwaMetrics'
import { UniverseChainId } from 'uniswap/src/features/chains/types'

function makeMappedRwa() {
  const rwa = mapRankedRwa({
    token: makeRankedRwa({
      issuerTokens: [
        {
          symbol: 'TSLAON',
          name: 'Tesla (Ondo)',
          issuer: 'ondo',
          priceUsd: 248.42,
          volume24hUsd: 8_000_000,
          marketCapUsd: 22_000_000,
          chainTokens: [
            { chainId: UniverseChainId.Mainnet, address: '0xondo1' },
            { chainId: UniverseChainId.Base, address: '0xondo2' },
          ],
        },
        {
          symbol: 'TSLAb',
          name: 'Tesla (Backed)',
          issuer: 'backed',
          priceUsd: 247.9,
          volume24hUsd: 3_000_000,
          marketCapUsd: 12_200_000,
          chainTokens: [{ chainId: UniverseChainId.Mainnet, address: '0xbacked1' }],
        },
        {
          symbol: 'TSLAx',
          name: 'Tesla (xStocks)',
          issuer: 'xstocks',
          priceUsd: 248.1,
          volume24hUsd: 1_400_000,
          marketCapUsd: 10_000_000,
          chainTokens: [{ chainId: UniverseChainId.ArbitrumOne, address: '0xxstocks1' }],
        },
      ],
    }),
    category: RwaCategory.STOCKS,
  })
  if (!rwa) {
    throw new Error('expected mapped rwa')
  }
  return rwa
}

describe('deriveRwaAggregates', () => {
  it('uses the first issuer for price, change, and sparkline', () => {
    const rwa = makeMappedRwa()
    const aggregates = deriveRwaAggregates(rwa)

    expect(aggregates.priceUsd).toBe(rwa.issuerTokens[0]?.priceUsd)
    expect(aggregates.priceChange1hPct).toBe(rwa.issuerTokens[0]?.priceChange1hPct)
    expect(aggregates.priceChange24hPct).toBe(rwa.issuerTokens[0]?.priceChange24hPct)
    expect(aggregates.sparkline1d).toBe(rwa.issuerTokens[0]?.sparkline1d)
  })

  it('sums market cap and volume across issuers', () => {
    const rwa = makeMappedRwa()
    const aggregates = deriveRwaAggregates(rwa)

    expect(aggregates.marketCapUsd).toBe(44_200_000)
    expect(aggregates.volume24hUsd).toBe(12_400_000)
  })
})

describe('getIssuerCount', () => {
  it('returns issuer token count', () => {
    expect(getIssuerCount(makeMappedRwa())).toBe(3)
  })
})

describe('getNetworkCount', () => {
  it('returns chain token count', () => {
    const ondo = makeMappedRwa().issuerTokens.find((issuer) => issuer.issuer === 'ondo')!
    expect(getNetworkCount(ondo)).toBe(2)
  })
})

describe('getRwaPriceDisplay', () => {
  it('returns a range when priceDeviationPct is positive and multiple issuers exist', () => {
    const rwa = makeMappedRwa()
    rwa.priceDeviationPct = 0.21

    expect(getRwaPriceDisplay(rwa)).toEqual({
      kind: 'range',
      priceUsd: rwa.priceUsd,
      minPriceUsd: 247.9,
      maxPriceUsd: 248.42,
      priceDeviationPct: 0.21,
    })
  })

  it('returns a scalar price when priceDeviationPct is zero', () => {
    const rwa = makeMappedRwa()
    rwa.priceDeviationPct = 0

    expect(getRwaPriceDisplay(rwa)).toEqual({
      kind: 'single',
      priceUsd: rwa.priceUsd,
    })
  })

  it('returns a scalar price for single-issuer assets even when deviation is set', () => {
    const rwa = mapRankedRwa({
      token: makeRankedRwa({ priceDeviationPct: 1.5 }),
      category: RwaCategory.STOCKS,
    })
    if (!rwa) {
      throw new Error('expected mapped rwa')
    }

    expect(getRwaPriceDisplay(rwa)).toEqual({
      kind: 'single',
      priceUsd: rwa.priceUsd,
    })
  })
})

describe('getIssuerPriceDisplay', () => {
  it('always returns a scalar issuer price', () => {
    const issuer = makeMappedRwa().issuerTokens[0]!
    expect(getIssuerPriceDisplay(issuer)).toEqual({
      kind: 'single',
      priceUsd: issuer.priceUsd,
    })
  })
})

describe('getRwaPriceSortValue', () => {
  it('uses the minimum issuer price when a range applies', () => {
    const rwa = makeMappedRwa()
    rwa.priceDeviationPct = 0.21

    expect(getRwaPriceSortValue(rwa)).toBe(247.9)
  })
})
