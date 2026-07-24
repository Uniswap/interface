import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { toGraphQLChain } from 'uniswap/src/features/chains/utils'
import type { RWAToken } from 'uniswap/src/features/rwa/types'
import { buildRWAIssuerMarketDataMap, rwaTokenMarketDataKey } from 'uniswap/src/features/rwa/useRWAIssuerMarketData'

const MAINNET_CHAIN_ID = UniverseChainId.Mainnet
const SOLANA_CHAIN_ID = UniverseChainId.Solana
const EVM_ADDRESS_CHECKSUMMED = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const EVM_ADDRESS_LOWERCASE = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const SOLANA_ADDRESS = 'XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB'

describe(buildRWAIssuerMarketDataMap, () => {
  it('resolves market data for an EVM token regardless of address checksum casing', () => {
    const map = buildRWAIssuerMarketDataMap([
      {
        chain: toGraphQLChain(MAINNET_CHAIN_ID),
        address: EVM_ADDRESS_LOWERCASE,
        project: {
          markets: [{ price: { value: 437.9 }, marketCap: { value: 162_730_000 }, volume24H: { value: 15_410_000 } }],
        },
      },
    ])

    expect(map.get(rwaTokenMarketDataKey(createToken({ chainId: MAINNET_CHAIN_ID })))).toEqual({
      priceUsd: 437.9,
      marketCapUsd: 162_730_000,
      volume24hUsd: 15_410_000,
    })
  })

  it('matches case-sensitive Solana addresses and omits missing metrics', () => {
    const map = buildRWAIssuerMarketDataMap([
      {
        chain: toGraphQLChain(SOLANA_CHAIN_ID),
        address: SOLANA_ADDRESS,
        project: { markets: [{ price: { value: 1.23 } }] },
      },
    ])

    expect(map.get(rwaTokenMarketDataKey(createToken({ chainId: SOLANA_CHAIN_ID, address: SOLANA_ADDRESS })))).toEqual({
      priceUsd: 1.23,
      marketCapUsd: undefined,
      volume24hUsd: undefined,
    })
  })

  it('uses the empty fallback for a token absent from the response', () => {
    const map = buildRWAIssuerMarketDataMap([])

    expect(map.get(rwaTokenMarketDataKey(createToken())) ?? {}).toEqual({})
  })
})

function createToken({
  chainId = MAINNET_CHAIN_ID,
  address = EVM_ADDRESS_CHECKSUMMED,
}: {
  chainId?: number
  address?: string
} = {}): RWAToken {
  return {
    chainId,
    address,
    issuer: 'ondo',
    name: 'Ondo',
    symbol: 'RWA.on',
    logoUrl: 'https://example.com/ondo.png',
  }
}
