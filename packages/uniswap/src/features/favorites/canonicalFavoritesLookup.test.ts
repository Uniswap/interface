import {
  ChainToken,
  TokenRankingsList,
  TokenRankingsResponse,
  TokenRankingsStat,
} from '@uniswap/client-explore/dist/uniswap/explore/v1/service_pb'
import { buildFavoritesCanonicalLookup, buildLookupKey } from 'uniswap/src/features/favorites/canonicalFavoritesLookup'

function makeChainToken(chainId: number, address: string): ChainToken {
  return { chainId, address, decimals: 18 } as unknown as ChainToken
}

function makeStat(chain: string, address: string, chainTokens: ChainToken[]): TokenRankingsStat {
  return { chain, address, chainTokens } as unknown as TokenRankingsStat
}

function makeResponse(tokens: TokenRankingsStat[]): TokenRankingsResponse {
  return {
    tokenRankings: {
      VOLUME: { tokens } as unknown as TokenRankingsList,
    },
  } as unknown as TokenRankingsResponse
}

describe(buildFavoritesCanonicalLookup, () => {
  it('returns empty maps when data is undefined', () => {
    const { canonicalByKey, networkCountByKey } = buildFavoritesCanonicalLookup(undefined)
    expect(canonicalByKey.size).toBe(0)
    expect(networkCountByKey.size).toBe(0)
  })

  it('maps every chain-specific key to the canonical mainnet CurrencyId', () => {
    // Use the placeholder short-address convention — normalization preserves case for non-EVM addrs.
    const response = makeResponse([
      makeStat('ETHEREUM', '0xAAA', [
        makeChainToken(1, '0xAAA'),
        makeChainToken(42161, '0xAAA'),
        makeChainToken(8453, '0xAAA'),
      ]),
    ])

    const { canonicalByKey } = buildFavoritesCanonicalLookup(response)
    expect(canonicalByKey.get(buildLookupKey({ chainId: 1, address: '0xAAA' }))).toBe('1-0xAAA')
    expect(canonicalByKey.get(buildLookupKey({ chainId: 42161, address: '0xAAA' }))).toBe('1-0xAAA')
    expect(canonicalByKey.get(buildLookupKey({ chainId: 8453, address: '0xAAA' }))).toBe('1-0xAAA')
  })

  it('handles USDC with different addresses across chains', () => {
    const response = makeResponse([
      makeStat('ETHEREUM', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', [
        makeChainToken(1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
        makeChainToken(42161, '0xaf88d065e77c8cC2239327C5EDb3A432268e5831'),
        makeChainToken(8453, '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913'),
      ]),
    ])

    const { canonicalByKey } = buildFavoritesCanonicalLookup(response)
    const expected = '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'

    expect(
      canonicalByKey.get(buildLookupKey({ chainId: 42161, address: '0xaf88d065e77c8cC2239327C5EDb3A432268e5831' })),
    ).toBe(expected)
    expect(
      canonicalByKey.get(buildLookupKey({ chainId: 8453, address: '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913' })),
    ).toBe(expected)
    expect(
      canonicalByKey.get(buildLookupKey({ chainId: 1, address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48' })),
    ).toBe(expected)
  })

  it('records the chainTokens count under every chain-specific key', () => {
    const response = makeResponse([
      makeStat('ETHEREUM', '0xAAA', [
        makeChainToken(1, '0xAAA'),
        makeChainToken(42161, '0xAAA'),
        makeChainToken(8453, '0xAAA'),
      ]),
    ])

    const { networkCountByKey } = buildFavoritesCanonicalLookup(response)
    expect(networkCountByKey.get(buildLookupKey({ chainId: 1, address: '0xAAA' }))).toBe(3)
    expect(networkCountByKey.get(buildLookupKey({ chainId: 42161, address: '0xAAA' }))).toBe(3)
    expect(networkCountByKey.get(buildLookupKey({ chainId: 8453, address: '0xAAA' }))).toBe(3)
  })

  it('records count of 1 for single-chain tokens', () => {
    const response = makeResponse([makeStat('ETHEREUM', '0xWBTC', [makeChainToken(1, '0xWBTC')])])

    const { networkCountByKey } = buildFavoritesCanonicalLookup(response)
    expect(networkCountByKey.get(buildLookupKey({ chainId: 1, address: '0xWBTC' }))).toBe(1)
  })

  it('omits unknown tokens from both maps', () => {
    const response = makeResponse([makeStat('ETHEREUM', '0xAAA', [makeChainToken(1, '0xAAA')])])

    const { canonicalByKey, networkCountByKey } = buildFavoritesCanonicalLookup(response)
    const unknownKey = buildLookupKey({ chainId: 1, address: '0xUNKNOWN' })
    expect(canonicalByKey.has(unknownKey)).toBe(false)
    expect(networkCountByKey.has(unknownKey)).toBe(false)
  })

  it('normalizes real 40-char EVM addresses to lowercase canonical ids', () => {
    const response = makeResponse([
      makeStat('ETHEREUM', '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', [
        makeChainToken(1, '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'),
        makeChainToken(42161, '0xAF88D065E77C8CC2239327C5EDB3A432268E5831'),
      ]),
    ])

    const { canonicalByKey } = buildFavoritesCanonicalLookup(response)
    const canonical = '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
    expect(
      canonicalByKey.get(buildLookupKey({ chainId: 1, address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' })),
    ).toBe(canonical)
    expect(
      canonicalByKey.get(buildLookupKey({ chainId: 42161, address: '0xAF88D065E77C8CC2239327C5EDB3A432268E5831' })),
    ).toBe(canonical)
  })

  it('skips tokens with undefined chainTokens without crashing', () => {
    const response = makeResponse([
      { chain: 'ETHEREUM', address: '0xAAA', chainTokens: undefined } as unknown as TokenRankingsStat,
      makeStat('ETHEREUM', '0xBBB', [makeChainToken(1, '0xBBB')]),
    ])

    const { canonicalByKey, networkCountByKey } = buildFavoritesCanonicalLookup(response)
    // 0xAAA has no chainTokens so it's only mapped via the top-level fallback
    expect(canonicalByKey.get(buildLookupKey({ chainId: 1, address: '0xAAA' }))).toBe('1-0xAAA')
    expect(networkCountByKey.has(buildLookupKey({ chainId: 1, address: '0xAAA' }))).toBe(false)
    // 0xBBB has chainTokens
    expect(canonicalByKey.get(buildLookupKey({ chainId: 1, address: '0xBBB' }))).toBe('1-0xBBB')
    expect(networkCountByKey.get(buildLookupKey({ chainId: 1, address: '0xBBB' }))).toBe(1)
  })
})
