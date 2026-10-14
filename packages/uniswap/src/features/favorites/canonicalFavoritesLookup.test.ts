import { RankedMultichainToken } from '@uniswap/client-data-api/dist/data/v2/types_pb'
import { buildFavoritesCanonicalLookup, buildLookupKey } from 'uniswap/src/features/favorites/canonicalFavoritesLookup'

function makeRankedToken(addresses: Record<string, string>): RankedMultichainToken {
  return new RankedMultichainToken({ multichainToken: { addresses } })
}

describe(buildFavoritesCanonicalLookup, () => {
  it('returns empty maps when there are no tokens', () => {
    const { canonicalByKey, networkCountByKey } = buildFavoritesCanonicalLookup([])
    expect(canonicalByKey.size).toBe(0)
    expect(networkCountByKey.size).toBe(0)
  })

  it('maps every chain-specific key to the canonical mainnet CurrencyId', () => {
    // Use the placeholder short-address convention — normalization preserves case for non-EVM addrs.
    const { canonicalByKey } = buildFavoritesCanonicalLookup([
      makeRankedToken({ '1': '0xAAA', '42161': '0xAAA', '8453': '0xAAA' }),
    ])

    expect(canonicalByKey.get(buildLookupKey({ chainId: 1, address: '0xAAA' }))).toBe('1-0xAAA')
    expect(canonicalByKey.get(buildLookupKey({ chainId: 42161, address: '0xAAA' }))).toBe('1-0xAAA')
    expect(canonicalByKey.get(buildLookupKey({ chainId: 8453, address: '0xAAA' }))).toBe('1-0xAAA')
  })

  it('handles USDC with different addresses across chains', () => {
    const { canonicalByKey } = buildFavoritesCanonicalLookup([
      makeRankedToken({
        '1': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        '42161': '0xaf88d065e77c8cC2239327C5EDb3A432268e5831',
        '8453': '0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913',
      }),
    ])
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

  it('records the deployment count under every chain-specific key', () => {
    const { networkCountByKey } = buildFavoritesCanonicalLookup([
      makeRankedToken({ '1': '0xAAA', '42161': '0xAAA', '8453': '0xAAA' }),
    ])

    expect(networkCountByKey.get(buildLookupKey({ chainId: 1, address: '0xAAA' }))).toBe(3)
    expect(networkCountByKey.get(buildLookupKey({ chainId: 42161, address: '0xAAA' }))).toBe(3)
    expect(networkCountByKey.get(buildLookupKey({ chainId: 8453, address: '0xAAA' }))).toBe(3)
  })

  it('records count of 1 for single-chain tokens', () => {
    const { networkCountByKey } = buildFavoritesCanonicalLookup([makeRankedToken({ '1': '0xWBTC' })])
    expect(networkCountByKey.get(buildLookupKey({ chainId: 1, address: '0xWBTC' }))).toBe(1)
  })

  it('falls back to the lowest chainId when the token has no mainnet deployment', () => {
    const { canonicalByKey, networkCountByKey } = buildFavoritesCanonicalLookup([
      makeRankedToken({ '42161': '0xL2', '8453': '0xL2' }),
    ])

    expect(canonicalByKey.get(buildLookupKey({ chainId: 42161, address: '0xL2' }))).toBe('8453-0xL2')
    expect(canonicalByKey.get(buildLookupKey({ chainId: 8453, address: '0xL2' }))).toBe('8453-0xL2')
    expect(networkCountByKey.get(buildLookupKey({ chainId: 42161, address: '0xL2' }))).toBe(2)
  })

  it('normalizes backend native placeholders to the canonical native address', () => {
    const nativeAddress = '0xeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeeee'
    const { canonicalByKey, networkCountByKey } = buildFavoritesCanonicalLookup([
      makeRankedToken({ '1': '0x0000000000000000000000000000000000000000', '42161': 'ETH' }),
    ])

    expect(canonicalByKey.get(buildLookupKey({ chainId: 1, address: nativeAddress }))).toBe(`1-${nativeAddress}`)
    expect(canonicalByKey.get(buildLookupKey({ chainId: 42161, address: nativeAddress }))).toBe(`1-${nativeAddress}`)
    expect(networkCountByKey.get(buildLookupKey({ chainId: 42161, address: nativeAddress }))).toBe(2)
  })

  it('omits unknown tokens from both maps', () => {
    const { canonicalByKey, networkCountByKey } = buildFavoritesCanonicalLookup([makeRankedToken({ '1': '0xAAA' })])
    const unknownKey = buildLookupKey({ chainId: 1, address: '0xUNKNOWN' })

    expect(canonicalByKey.has(unknownKey)).toBe(false)
    expect(networkCountByKey.has(unknownKey)).toBe(false)
  })

  it('normalizes real 40-char EVM addresses to lowercase canonical ids', () => {
    const { canonicalByKey } = buildFavoritesCanonicalLookup([
      makeRankedToken({
        '1': '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
        '42161': '0xAF88D065E77C8CC2239327C5EDB3A432268E5831',
      }),
    ])
    const canonical = '1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'

    expect(
      canonicalByKey.get(buildLookupKey({ chainId: 1, address: '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48' })),
    ).toBe(canonical)
    expect(
      canonicalByKey.get(buildLookupKey({ chainId: 42161, address: '0xAF88D065E77C8CC2239327C5EDB3A432268E5831' })),
    ).toBe(canonical)
  })

  it('skips tokens without a multichainToken payload', () => {
    const { canonicalByKey, networkCountByKey } = buildFavoritesCanonicalLookup([
      new RankedMultichainToken({}),
      makeRankedToken({ '1': '0xBBB' }),
    ])

    expect(canonicalByKey.get(buildLookupKey({ chainId: 1, address: '0xBBB' }))).toBe('1-0xBBB')
    expect(networkCountByKey.get(buildLookupKey({ chainId: 1, address: '0xBBB' }))).toBe(1)
    expect(canonicalByKey.size).toBe(1)
  })
})
