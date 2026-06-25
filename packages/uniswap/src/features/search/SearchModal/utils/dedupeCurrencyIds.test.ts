import { normalizeTokenAddressForCache } from 'uniswap/src/data/cache'
import { UniverseChainId } from 'uniswap/src/features/chains/types'
import { dedupeCurrencyIds } from 'uniswap/src/features/search/SearchModal/utils/dedupeCurrencyIds'
import { describe, expect, it } from 'vitest'

const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'

describe('dedupeCurrencyIds', () => {
  it('returns an empty array for empty input', () => {
    expect(dedupeCurrencyIds([])).toEqual([])
  })

  it('preserves input order when there are no duplicates', () => {
    const ids = [
      `${UniverseChainId.Mainnet}-${USDC}`,
      `${UniverseChainId.Mainnet}-${WETH}`,
      `${UniverseChainId.Polygon}-${USDC}`,
    ]
    expect(dedupeCurrencyIds(ids)).toEqual(ids)
  })

  it('collapses ids that normalize to the same key and keeps the first raw id', () => {
    const checksummed = `${UniverseChainId.Mainnet}-${USDC}`
    const lowercased = `${UniverseChainId.Mainnet}-${normalizeTokenAddressForCache(USDC)}`
    expect(dedupeCurrencyIds([checksummed, lowercased])).toEqual([checksummed])
  })

  it('drops later normalize-duplicates while preserving the order of survivors', () => {
    const usdcMainnet = `${UniverseChainId.Mainnet}-${USDC}`
    const wethMainnet = `${UniverseChainId.Mainnet}-${WETH}`
    const usdcMainnetLower = `${UniverseChainId.Mainnet}-${normalizeTokenAddressForCache(USDC)}`
    const usdcPolygon = `${UniverseChainId.Polygon}-${USDC}`
    expect(dedupeCurrencyIds([usdcMainnet, wethMainnet, usdcMainnetLower, usdcPolygon])).toEqual([
      usdcMainnet,
      wethMainnet,
      usdcPolygon,
    ])
  })

  it('treats native ids case-insensitively but keeps per-chain natives distinct', () => {
    const nativeMainnetUpper = `${UniverseChainId.Mainnet}-NATIVE`
    const nativeMainnetLower = `${UniverseChainId.Mainnet}-native`
    const nativePolygon = `${UniverseChainId.Polygon}-NATIVE`
    expect(dedupeCurrencyIds([nativeMainnetUpper, nativeMainnetLower, nativePolygon])).toEqual([
      nativeMainnetUpper,
      nativePolygon,
    ])
  })
})
