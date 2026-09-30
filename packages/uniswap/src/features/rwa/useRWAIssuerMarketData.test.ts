import { HistoryDuration } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { UniverseChainId } from '@universe/chains'
import type { RWAToken } from 'uniswap/src/features/rwa/types'
import { buildRWAIssuerMarketDataMap, rwaTokenMarketDataKey } from 'uniswap/src/features/rwa/useRWAIssuerMarketData'

const MAINNET_CHAIN_ID = UniverseChainId.Mainnet
const SOLANA_CHAIN_ID = UniverseChainId.Solana
const EVM_ADDRESS_CHECKSUMMED = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const EVM_ADDRESS_LOWERCASE = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const SOLANA_ADDRESS = 'XsDoVfqeBukxuZHWhdvWHBhgEHjGNst4MLodqsJHzoB'

describe(buildRWAIssuerMarketDataMap, () => {
  it('merges price and market stats for an EVM token regardless of address checksum casing', () => {
    const map = buildRWAIssuerMarketDataMap({
      tokens: [{ chainId: MAINNET_CHAIN_ID, address: EVM_ADDRESS_LOWERCASE, price: { spotUsd: 437.9 } }],
      markets: [
        {
          chainId: MAINNET_CHAIN_ID,
          address: EVM_ADDRESS_CHECKSUMMED,
          stats: { marketCapUsd: 162_730_000, volumeUsd: 15_410_000, volumeDuration: HistoryDuration.DAY },
        },
      ],
    })

    expect(map.get(rwaTokenMarketDataKey(createToken({ chainId: MAINNET_CHAIN_ID })))).toEqual({
      priceUsd: 437.9,
      marketCapUsd: 162_730_000,
      volume24hUsd: 15_410_000,
    })
  })

  it('matches case-sensitive Solana addresses and omits missing metrics', () => {
    const map = buildRWAIssuerMarketDataMap({
      tokens: [{ chainId: SOLANA_CHAIN_ID, address: SOLANA_ADDRESS, price: { spotUsd: 1.23 } }],
      markets: [],
    })

    expect(map.get(rwaTokenMarketDataKey(createToken({ chainId: SOLANA_CHAIN_ID, address: SOLANA_ADDRESS })))).toEqual({
      priceUsd: 1.23,
      marketCapUsd: undefined,
      volume24hUsd: undefined,
    })
  })

  it('keeps market stats for a token GetTokens omitted', () => {
    const map = buildRWAIssuerMarketDataMap({
      tokens: [],
      markets: [
        {
          chainId: MAINNET_CHAIN_ID,
          address: EVM_ADDRESS_LOWERCASE,
          stats: { marketCapUsd: 100, volumeUsd: 10, volumeDuration: HistoryDuration.DAY },
        },
      ],
    })

    expect(map.get(rwaTokenMarketDataKey(createToken()))).toEqual({
      priceUsd: undefined,
      marketCapUsd: 100,
      volume24hUsd: 10,
    })
  })

  it('uses the empty fallback for a token absent from both responses', () => {
    const map = buildRWAIssuerMarketDataMap({ tokens: [], markets: [] })

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
