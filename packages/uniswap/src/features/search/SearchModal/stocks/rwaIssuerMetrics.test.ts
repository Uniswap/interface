import { RwaCategory } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import type { Rwa } from 'uniswap/src/data/apiClients/dataApiService/rwa/types'
import {
  buildRwaIssuerMetricsIndex,
  withRwaIssuerMetrics,
} from 'uniswap/src/features/search/SearchModal/stocks/rwaIssuerMetrics'
import { buildRwaSearchIndex } from 'uniswap/src/features/search/SearchModal/stocks/rwaSearchGrouping'

const MAINNET = 1
const BNB = 56
const ONDO_BNB = '0xabcdef0000000000000000000000000000000001'

const { rwas } = buildRwaSearchIndex([
  {
    symbol: 'TSLA',
    name: 'Tesla',
    logoUrl: '',
    categories: [RwaCategory.STOCKS],
    issuerTokens: [
      { chainId: MAINNET, address: '0xa', issuer: 'ondo' },
      { chainId: BNB, address: ONDO_BNB, issuer: 'ondo' },
      { chainId: MAINNET, address: '0xc', issuer: 'xstocks' },
      { chainId: MAINNET, address: '0xd', issuer: 'backed' },
    ],
    issuerData: {
      ondo: { name: 'Ondo', symbol: 'TSLAON', logoUrl: '' },
      xstocks: { name: 'xStocks', symbol: 'TSLAX', logoUrl: '' },
      backed: { name: 'Backed', symbol: 'TSLAB', logoUrl: '' },
    },
  },
])
const listRwasTesla = rwas[0]!

const rankedTesla: Rwa = {
  symbol: 'TSLA',
  name: 'Tesla',
  logoUrl: '',
  priceUsd: 249,
  volume24hUsd: 175,
  sparkline1d: { points: [] },
  issuerTokens: [
    {
      symbol: 'TSLAON',
      name: 'Tesla (Ondo)',
      logoUrl: '',
      issuer: 'ondo',
      priceUsd: 249,
      priceChange24hPct: 0.8,
      fdvUsd: 2_000,
      volume24hUsd: 125,
      sparkline1d: { points: [] },
      // Ranked row omits ondo's Mainnet deployment.
      chainTokens: [{ chainId: BNB, address: ONDO_BNB.toUpperCase().replace('0X', '0x') }],
    },
    {
      symbol: 'TSLAX',
      name: 'Tesla (xStocks)',
      logoUrl: '',
      issuer: 'xstocks',
      priceUsd: 248.42,
      priceChange24hPct: -0.5,
      fdvUsd: 1_000,
      volume24hUsd: 50,
      sparkline1d: { points: [] },
      chainTokens: [{ chainId: MAINNET, address: '0xc' }],
    },
  ],
}

function issuerMetrics(rwa: Rwa): { issuer: string; priceUsd: number; fdvUsd?: number; volume24hUsd: number }[] {
  return rwa.issuerTokens.map(({ issuer, priceUsd, fdvUsd, volume24hUsd }) => ({
    issuer,
    priceUsd,
    fdvUsd,
    volume24hUsd,
  }))
}

describe(withRwaIssuerMetrics, () => {
  it('fills each issuer by any matching chain deployment, case-insensitively', () => {
    const filled = withRwaIssuerMetrics({ rwa: listRwasTesla, metricsIndex: buildRwaIssuerMetricsIndex([rankedTesla]) })
    expect(issuerMetrics(filled)).toEqual([
      { issuer: 'ondo', priceUsd: 249, fdvUsd: 2_000, volume24hUsd: 125 },
      { issuer: 'xstocks', priceUsd: 248.42, fdvUsd: 1_000, volume24hUsd: 50 },
      // No ranked match: keeps its zeroed ("no data") metrics.
      { issuer: 'backed', priceUsd: 0, volume24hUsd: 0 },
    ])
  })

  it('does not mutate the shared grouping-index entry', () => {
    withRwaIssuerMetrics({ rwa: listRwasTesla, metricsIndex: buildRwaIssuerMetricsIndex([rankedTesla]) })
    expect(listRwasTesla.issuerTokens.every((issuer) => issuer.priceUsd === 0 && issuer.volume24hUsd === 0)).toBe(true)
  })
})
