import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import type { RWAToken } from 'uniswap/src/features/rwa/types'
import { buildRWAIssuerMarketDataMap, rwaTokenMarketDataKey } from '~/pages/TokenDetails/hooks/useRWAIssuerMarketData'

const EVM_ADDRESS_CHECKSUMMED = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const EVM_ADDRESS_LOWERCASE = EVM_ADDRESS_CHECKSUMMED.toLowerCase()
const SOLANA_ADDRESS = 'XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB'

describe('buildRWAIssuerMarketDataMap', () => {
  it('resolves market data for an EVM token regardless of address checksum casing', () => {
    // graphql echoes the address lowercased; the lookup token is checksummed
    const map = buildRWAIssuerMarketDataMap([
      {
        chain: toGraphQLChain(UniverseChainId.Mainnet),
        address: EVM_ADDRESS_LOWERCASE,
        project: {
          markets: [{ price: { value: 437.9 }, marketCap: { value: 162_730_000 }, volume24H: { value: 15_410_000 } }],
        },
      },
    ])

    const token: RWAToken = {
      chainId: UniverseChainId.Mainnet,
      address: EVM_ADDRESS_CHECKSUMMED,
      issuer: 'ondo',
      name: 'Ondo',
      symbol: 'RWA.on',
      logoUrl: 'https://example.com/ondo.png',
    }

    expect(map.get(rwaTokenMarketDataKey(token))).toEqual({
      priceUsd: 437.9,
      marketCapUsd: 162_730_000,
      volume24hUsd: 15_410_000,
    })
  })

  it('matches case-sensitive Solana addresses and omits missing metrics', () => {
    const map = buildRWAIssuerMarketDataMap([
      {
        chain: toGraphQLChain(UniverseChainId.Solana),
        address: SOLANA_ADDRESS,
        project: { markets: [{ price: { value: 1.23 } }] },
      },
    ])

    const token: RWAToken = {
      chainId: UniverseChainId.Solana,
      address: SOLANA_ADDRESS,
      issuer: 'xstock',
      name: 'XStock',
      symbol: 'RWA.x',
      logoUrl: 'https://example.com/xstock.png',
    }

    expect(map.get(rwaTokenMarketDataKey(token))).toEqual({
      priceUsd: 1.23,
      marketCapUsd: undefined,
      volume24hUsd: undefined,
    })
  })

  it('returns the empty fallback for a token absent from the response', () => {
    const map = buildRWAIssuerMarketDataMap([])
    const token: RWAToken = {
      chainId: UniverseChainId.Mainnet,
      address: EVM_ADDRESS_CHECKSUMMED,
      issuer: 'ondo',
      name: 'Ondo',
      symbol: 'RWA.on',
      logoUrl: 'https://example.com/ondo.png',
    }

    expect(map.get(rwaTokenMarketDataKey(token)) ?? {}).toEqual({})
  })
})
