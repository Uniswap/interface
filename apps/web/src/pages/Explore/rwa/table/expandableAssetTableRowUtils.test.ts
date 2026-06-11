import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { mapRankedRwa } from 'uniswap/src/data/rest/rwa/mapRankedRwa'
import { makeRankedRwa } from 'uniswap/src/data/rest/rwa/rankedRwaTestHelpers'
import { deriveRwaAggregates } from 'uniswap/src/data/rest/rwa/rwaMetrics'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  buildExpandableAssetTableRows,
  getExpandableAssetRowMetrics,
  getExpandableAssetSubRows,
} from '~/pages/Explore/rwa/table/expandableAssetTableRowUtils'

const enabledChains = [UniverseChainId.Mainnet, UniverseChainId.Base]

function makeMultiIssuerRows() {
  const tsla =
    mapRankedRwa({
      token: makeRankedRwa({
        symbol: 'TSLA',
        issuerTokens: [
          {
            symbol: 'TSLAON',
            name: 'Tesla (Ondo)',
            issuer: 'ondo',
            priceUsd: 248.42,
            volume24hUsd: 8_000_000,
            chainTokens: [{ chainId: UniverseChainId.Mainnet, address: '0xondo1' }],
          },
          {
            symbol: 'TSLAb',
            name: 'Tesla (Backed)',
            issuer: 'backed',
            priceUsd: 247.9,
            volume24hUsd: 3_000_000,
            chainTokens: [{ chainId: UniverseChainId.Base, address: '0xbacked1' }],
          },
          {
            symbol: 'TSLAx',
            name: 'Tesla (xStocks)',
            issuer: 'xstocks',
            priceUsd: 248.1,
            volume24hUsd: 1_400_000,
            chainTokens: [{ chainId: UniverseChainId.ArbitrumOne, address: '0xxstocks1' }],
          },
        ],
      }),
      category: RwaCategory.STOCKS,
    }) ??
    (() => {
      throw new Error('expected tsla')
    })()

  const aapl =
    mapRankedRwa({
      token: makeRankedRwa({
        symbol: 'AAPL',
        name: 'Apple',
        issuerTokens: [
          {
            symbol: 'AAPLon',
            name: 'Apple (Ondo)',
            issuer: 'ondo',
            priceUsd: 190,
            volume24hUsd: 5_000_000,
            chainTokens: [{ chainId: UniverseChainId.Mainnet, address: '0xaapl1' }],
          },
        ],
      }),
      category: RwaCategory.STOCKS,
    }) ??
    (() => {
      throw new Error('expected aapl')
    })()

  return buildExpandableAssetTableRows([tsla, aapl], enabledChains)
}

describe('buildExpandableAssetTableRows', () => {
  it('adds issuer subRows when multiple issuers exist', () => {
    const rows = makeMultiIssuerRows()
    const tsla = rows.find((row) => row.type === 'parent' && row.asset.symbol === 'TSLA')
    expect(tsla?.type === 'parent' && tsla.subRows).toHaveLength(3)
  })

  it('omits subRows for single-issuer assets', () => {
    const rows = makeMultiIssuerRows()
    const aapl = rows.find((row) => row.type === 'parent' && row.asset.symbol === 'AAPL')
    expect(aapl?.type === 'parent' && aapl.subRows).toBeUndefined()
    expect(aapl?.type === 'parent' && aapl.link).toBeDefined()
  })

  it('getExpandableAssetSubRows returns issuer children for parent rows only', () => {
    const rows = makeMultiIssuerRows()
    const tsla = rows.find((row) => row.type === 'parent' && row.asset.symbol === 'TSLA')
    if (tsla?.type !== 'parent') {
      throw new Error('expected tsla parent row')
    }
    expect(getExpandableAssetSubRows(tsla)).toHaveLength(3)
    expect(getExpandableAssetSubRows(tsla.subRows![0])).toBeUndefined()
  })
})

describe('getExpandableAssetRowMetrics', () => {
  it('derives parent metrics from primary issuer and issuer roll-ups', () => {
    const rows = makeMultiIssuerRows()
    const tsla = rows.find((row) => row.type === 'parent' && row.asset.symbol === 'TSLA')
    if (tsla?.type !== 'parent') {
      throw new Error('expected tsla parent row')
    }

    const aggregates = deriveRwaAggregates(tsla.asset)
    const metrics = getExpandableAssetRowMetrics(tsla)

    expect(metrics.priceUsd).toBe(aggregates.priceUsd)
    expect(metrics.priceChange1hPct).toBe(aggregates.priceChange1hPct)
    expect(metrics.priceChange24hPct).toBe(aggregates.priceChange24hPct)
    expect(metrics.marketCapUsd).toBe(aggregates.marketCapUsd)
    expect(metrics.volume24hUsd).toBe(aggregates.volume24hUsd)
    expect(metrics.sparkline).toBe(aggregates.sparkline1d)
  })

  it('uses issuer fields for issuer sub-rows', () => {
    const rows = makeMultiIssuerRows()
    const tsla = rows.find((row) => row.type === 'parent' && row.asset.symbol === 'TSLA')
    if (tsla?.type !== 'parent' || !tsla.subRows?.[0]) {
      throw new Error('expected tsla issuer sub-row')
    }

    const issuerRow = tsla.subRows[0]
    if (issuerRow.type !== 'issuer') {
      throw new Error('expected issuer row')
    }

    const metrics = getExpandableAssetRowMetrics(issuerRow)
    expect(metrics.priceUsd).toBe(issuerRow.issuer.priceUsd)
    expect(metrics.priceChange1hPct).toBe(issuerRow.issuer.priceChange1hPct)
    expect(metrics.marketCapUsd).toBe(issuerRow.issuer.marketCapUsd)
  })

  it('matches primary issuer price on parent row', () => {
    const rows = makeMultiIssuerRows()
    const parent = rows.find((row) => row.type === 'parent' && row.asset.symbol === 'TSLA')
    if (parent?.type !== 'parent') {
      throw new Error('expected parent row')
    }

    const primaryIssuer = parent.asset.issuerTokens[0]!
    expect(getExpandableAssetRowMetrics(parent).priceUsd).toBe(primaryIssuer.priceUsd)
    expect(getExpandableAssetRowMetrics(parent).priceChange1hPct).toBe(primaryIssuer.priceChange1hPct)
  })
})
