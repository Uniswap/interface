import { marginPairKey } from 'uniswap/src/features/transactions/margin/marginPairKey'
import { DEFAULT_MARGIN_FORM_STATE } from 'uniswap/src/features/transactions/margin/stores/marginFormStore/createMarginFormStore'
import type { MarginVenue } from 'uniswap/src/features/transactions/margin/types'
import { describe, expect, it } from 'vitest'
import { DEFAULT_MARGIN_PAIR_KEY, MARGIN_QUOTE_TOKEN_ADDRESSES, marginMarketKey } from '~/constants/margin'
import { findMarginMarketByTokens } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import { marginMarketDirection } from '~/pages/Swap/Margin/marginTokenDisplay'

const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

describe('marginMarketKey', () => {
  it('appends the venue and lowercases the tokens', () => {
    expect(marginMarketKey({ collateralToken: WETH, debtToken: USDC, venue: 'AAVE_V3' })).toBe(
      `${WETH.toLowerCase()}-${USDC.toLowerCase()}-AAVE_V3`,
    )
  })

  it('does not collide across venues for the same pair', () => {
    expect(marginMarketKey({ collateralToken: WETH, debtToken: USDC, venue: 'MORPHO' })).not.toBe(
      marginMarketKey({ collateralToken: WETH, debtToken: USDC, venue: 'AAVE_V3' }),
    )
  })

  it('is the pair key plus the venue, so form identity is a prefix of it', () => {
    expect(marginMarketKey({ collateralToken: WETH, debtToken: USDC, venue: 'MORPHO' })).toBe(
      `${marginPairKey({ collateralToken: WETH, debtToken: USDC })}-MORPHO`,
    )
  })
})

describe('default pair key', () => {
  it('matches the hand-written form-store literal (casing pinned)', () => {
    expect(DEFAULT_MARGIN_FORM_STATE.pairKey).toBe(DEFAULT_MARGIN_PAIR_KEY)
  })

  it('names no venue', () => {
    expect(DEFAULT_MARGIN_PAIR_KEY).not.toContain('MORPHO')
    expect(DEFAULT_MARGIN_PAIR_KEY).toBe(`${WETH.toLowerCase()}-${USDC.toLowerCase()}`)
  })

  it('is WETH/USDC, long', () => {
    const market = findMarginMarketByTokens({ collateralToken: WETH, debtToken: USDC, venue: 'MORPHO' })
    expect(market?.key).toBe(`${DEFAULT_MARGIN_PAIR_KEY}-MORPHO`)
    expect(market?.venue).toBe('MORPHO')
    expect(marginMarketDirection({ collateralToken: WETH, debtToken: USDC })).toBe('LONG')
  })
})

// These mirror backend config the wire never tells us about, so drift is silent. Pinning them turns
// a backend rename or a new venue into a failing test rather than a market that resolves to nothing.
describe('backend-mirrored value sets', () => {
  it('pins the venue union', () => {
    const venues: Record<MarginVenue, true> = {
      MORPHO: true,
      AAVE_V3: true,
      AAVE_V4: true,
      COMPOUND_V3: true,
    }
    expect(Object.keys(venues).sort()).toEqual(['AAVE_V3', 'AAVE_V4', 'COMPOUND_V3', 'MORPHO'])
  })

  it('pins the quote-token allowlist to the backend stable set', () => {
    expect([...MARGIN_QUOTE_TOKEN_ADDRESSES].sort()).toEqual(
      [
        USDC.toLowerCase(), // USDC
        '0xdac17f958d2ee523a2206206994597c13d831ec7', // USDT
      ].sort(),
    )
  })
})
