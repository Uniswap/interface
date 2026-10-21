import { describe, expect, it } from 'vitest'
import { findMarginMarketByTokens } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'

const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

describe('findMarginMarketByTokens', () => {
  it('resolves the Morpho WETH/USDC market', () => {
    expect(findMarginMarketByTokens({ collateralToken: WETH, debtToken: USDC, venue: 'MORPHO' })?.venue).toBe('MORPHO')
  })

  it('returns undefined for a venue absent from the fixture catalog (Aave is server-only)', () => {
    expect(findMarginMarketByTokens({ collateralToken: WETH, debtToken: USDC, venue: 'AAVE_V3' })).toBeUndefined()
  })
})
