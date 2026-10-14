import { canonicalizeFavorites } from 'uniswap/src/features/favorites/hooks/useCanonicalFavoritesMigration'
import { normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'

/** Builds a canonical lookup keyed the way `buildFavoritesCanonicalLookup` keys it: normalized `${chainId}-${address}`. */
function makeLookup(entries: Array<[currencyId: string, canonical: string]>): Map<string, string> {
  return new Map(
    entries.map(([currencyId, canonical]) => [
      normalizeCurrencyIdForMapLookup(currencyId),
      normalizeCurrencyIdForMapLookup(canonical),
    ]),
  )
}

describe(canonicalizeFavorites, () => {
  it('dedupes same-address tokens across chains', () => {
    const lookup = makeLookup([
      ['1-0xAAA', '1-0xAAA'],
      ['42161-0xAAA', '1-0xAAA'],
      ['8453-0xAAA', '1-0xAAA'],
    ])

    const result = canonicalizeFavorites(['1-0xAAA', '42161-0xAAA', '8453-0xAAA'], lookup)
    expect(result).toEqual(['1-0xAAA'])
  })

  it('dedupes different-address tokens that share the same project (e.g. USDC)', () => {
    const mainnetUsdc = '1-0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
    const lookup = makeLookup([
      [mainnetUsdc, mainnetUsdc],
      ['42161-0xaf88d065e77c8cC2239327C5EDb3A432268e5831', mainnetUsdc],
      ['8453-0x833589fCD6eDb6E08f4c7C32D4f71b54bdA02913', mainnetUsdc],
    ])

    const result = canonicalizeFavorites(['42161-0xaf88d065e77c8cC2239327C5EDb3A432268e5831', mainnetUsdc], lookup)

    // Both map to the same canonical mainnet entry. Canonical ids are normalized to lowercase.
    expect(result).toEqual(['1-0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'])
  })

  it('canonicalizes non-mainnet favorite to mainnet', () => {
    const lookup = makeLookup([
      ['1-0xAAA', '1-0xAAA'],
      ['42161-0xAAA', '1-0xAAA'],
    ])

    expect(canonicalizeFavorites(['42161-0xAAA'], lookup)).toEqual(['1-0xAAA'])
  })

  it('keeps favorites not found in the lookup as-is', () => {
    const lookup = makeLookup([['1-0xAAA', '1-0xAAA']])

    expect(canonicalizeFavorites(['1-0xAAA', '1-0xUnknown'], lookup)).toEqual(['1-0xAAA', '1-0xUnknown'])
  })

  it('handles multiple distinct tokens', () => {
    const lookup = makeLookup([
      ['1-0xUSDC', '1-0xUSDC'],
      ['42161-0xUSDC_ARB', '1-0xUSDC'],
      ['1-0xWBTC', '1-0xWBTC'],
    ])

    const result = canonicalizeFavorites(['42161-0xUSDC_ARB', '1-0xWBTC', '1-0xUSDC'], lookup)

    // USDC_ARB → canonical 0xUSDC, then 0xUSDC deduped. WBTC kept.
    expect(result).toEqual(['1-0xUSDC', '1-0xWBTC'])
  })

  it('handles empty favorites', () => {
    expect(canonicalizeFavorites([], makeLookup([]))).toEqual([])
  })

  it('handles an empty lookup', () => {
    expect(canonicalizeFavorites(['1-0xAAA', '42161-0xBBB'], makeLookup([]))).toEqual(['1-0xAAA', '42161-0xBBB'])
  })

  it('matches addresses case-insensitively', () => {
    // Placeholder short addresses keep their case through normalization, so the lookup is keyed on
    // the exact casing the favorite uses; the canonical id itself is what gets lowercased.
    const lookup = makeLookup([
      ['1-0xaaa', '1-0xaaa'],
      ['42161-0xAAA', '1-0xaaa'],
    ])

    expect(canonicalizeFavorites(['42161-0xAAA', '1-0xaaa'], lookup)).toEqual(['1-0xaaa'])
  })
})
