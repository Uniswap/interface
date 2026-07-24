import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { mapRankedRwa } from 'uniswap/src/data/rest/rwa/mapRankedRwa'
import { makeRankedRwa } from 'uniswap/src/data/rest/rwa/rankedRwaTestHelpers'
import { deriveRwaAggregates } from 'uniswap/src/data/rest/rwa/rwaMetrics'
import type { IssuerToken } from 'uniswap/src/data/rest/rwa/types'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import {
  buildExpandableAssetTableRows,
  getExpandableAssetRowMetrics,
  getExpandableAssetSubRows,
  linkForIssuer,
} from '~/pages/Explore/rwa/table/expandableAssetTableRowUtils'
import { TDP_MULTICHAIN_CHAIN_QUERY_VALUE } from '~/utils/params/chainQueryParam'

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

  return buildExpandableAssetTableRows({ assets: [tsla, aapl], enabledChainIds: enabledChains })
}

describe('buildExpandableAssetTableRows', () => {
  it('adds issuer subRows when multiple issuers exist', () => {
    const rows = makeMultiIssuerRows()
    const tsla = rows.find((row) => row.type === 'parent' && row.asset.symbol === 'TSLA')
    expect(tsla?.type === 'parent' && tsla.subRows).toHaveLength(3)
  })

  it('emits a flat issuer row for single-issuer assets', () => {
    const rows = makeMultiIssuerRows()
    const aapl = rows.find((row) => row.type === 'issuer' && row.asset.symbol === 'AAPL')
    expect(aapl?.type).toBe('issuer')
    expect(aapl?.type === 'issuer' && aapl.link).toBeDefined()
    expect(rows.some((row) => row.type === 'parent' && row.asset.symbol === 'AAPL')).toBe(false)
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

  describe('row link chain scoping (CONS-2795)', () => {
    const singleIssuerAapl = () => [
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
      })!,
    ]

    it('flat single-issuer row links to the multichain TDP when no network filter is active', () => {
      const rows = buildExpandableAssetTableRows({ assets: singleIssuerAapl(), enabledChainIds: enabledChains })
      const aapl = rows.find((row) => row.type === 'issuer' && row.asset.symbol === 'AAPL')
      expect(aapl?.type === 'issuer' && aapl.link).toContain(`chain=${TDP_MULTICHAIN_CHAIN_QUERY_VALUE}`)
    })

    it('issuer subRow links to the multichain TDP when no network filter is active', () => {
      const rows = makeMultiIssuerRows()
      const tsla = rows.find((row) => row.type === 'parent' && row.asset.symbol === 'TSLA')
      if (tsla?.type !== 'parent') {
        throw new Error('expected tsla parent row')
      }
      // TSLAx (xStocks) is only on Arbitrum, which isn't in `enabledChains`, so it has no link — skip it.
      const linkedSubRows = tsla.subRows!.filter((subRow) => subRow.type === 'issuer' && subRow.link)
      expect(linkedSubRows).toHaveLength(2)
      for (const subRow of linkedSubRows) {
        expect(subRow.type === 'issuer' && subRow.link).toContain(`chain=${TDP_MULTICHAIN_CHAIN_QUERY_VALUE}`)
      }
    })

    it('scopes the link to the active network filter instead of the multichain TDP', () => {
      const rows = buildExpandableAssetTableRows({
        assets: singleIssuerAapl(),
        enabledChainIds: enabledChains,
        chainFilter: UniverseChainId.Mainnet,
      })
      const aapl = rows.find((row) => row.type === 'issuer' && row.asset.symbol === 'AAPL')
      expect(aapl?.type === 'issuer' && aapl.link).not.toContain('chain=')
    })
  })
})

describe('linkForIssuer', () => {
  const issuer: IssuerToken = {
    symbol: 'AAPLon',
    name: 'Apple (Ondo)',
    logoUrl: 'https://example.com/aaplon.png',
    issuer: 'ondo',
    priceUsd: 190,
    volume24hUsd: 5_000_000,
    sparkline1d: { points: [] },
    chainTokens: [{ chainId: UniverseChainId.Mainnet, address: '0xaapl1' }],
  }

  it('returns undefined when the issuer has no enabled-chain deployment', () => {
    expect(linkForIssuer({ issuer, enabledChainIds: [UniverseChainId.Base] })).toBeUndefined()
  })

  it('defaults to the multichain TDP with no chain filter', () => {
    const link = linkForIssuer({ issuer, enabledChainIds: enabledChains })
    expect(link).toBe(`/explore/tokens/ethereum/0xaapl1?chain=${TDP_MULTICHAIN_CHAIN_QUERY_VALUE}`)
  })

  it('links to a single-chain TDP when a network filter is active', () => {
    const link = linkForIssuer({ issuer, enabledChainIds: enabledChains, chainFilter: UniverseChainId.Mainnet })
    expect(link).toBe('/explore/tokens/ethereum/0xaapl1')
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
