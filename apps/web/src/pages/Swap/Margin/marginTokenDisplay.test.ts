import type { CurrencyInfo } from 'uniswap/src/features/dataApi/types'
import { buildCurrencyId, buildNativeCurrencyId, normalizeCurrencyIdForMapLookup } from 'uniswap/src/utils/currencyId'
import { shortenAddress } from 'utilities/src/addresses'
import { describe, expect, it } from 'vitest'
import { MARGIN_CHAIN_ID, type MarginTokenInfo } from '~/constants/margin'
import {
  isMarginWrappedNative,
  marginExposureLeg,
  marginFallbackPairLabel,
  marginMarketDirection,
  marginPairLabel,
  marginPairLegs,
  marginUnwrapName,
  marginUnwrapSymbol,
} from '~/pages/Swap/Margin/marginTokenDisplay'

const WETH = '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2'
const USDC = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'

describe('isMarginWrappedNative', () => {
  it('is true for the WETH address in any casing', () => {
    expect(isMarginWrappedNative({ address: WETH })).toBe(true)
    expect(isMarginWrappedNative({ address: WETH.toLowerCase() })).toBe(true)
  })
  it('is false for a non-wrapped token', () => {
    expect(isMarginWrappedNative({ address: USDC })).toBe(false)
  })
})

describe('marginUnwrapSymbol', () => {
  it('maps WETH → ETH', () => {
    expect(marginUnwrapSymbol({ address: WETH, symbol: 'WETH' })).toBe('ETH')
  })
  it('passes a non-wrapped symbol through', () => {
    expect(marginUnwrapSymbol({ address: USDC, symbol: 'USDC' })).toBe('USDC')
  })
})

describe('marginUnwrapName', () => {
  it('maps Wrapped Ether → Ethereum', () => {
    expect(marginUnwrapName({ address: WETH, name: 'Wrapped Ether' })).toBe('Ethereum')
  })
  it('passes a non-wrapped name through', () => {
    expect(marginUnwrapName({ address: USDC, name: 'USD Coin' })).toBe('USD Coin')
  })
})

const WETH_T: MarginTokenInfo = { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 }
const USDC_T: MarginTokenInfo = { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 }
const USDT_T: MarginTokenInfo = { address: '0xdAC17F958D2ee523a2206206994597C13D831ec7', symbol: 'USDT', decimals: 6 }
const XAUT_T: MarginTokenInfo = { address: '0x68749665FF8D2d112Fa859AA293F07A622782F38', symbol: 'XAUt', decimals: 6 }
const CBBTC_T: MarginTokenInfo = { address: '0xcbB7C0000aB88B473b1f5aFd9ef808440eed33Bf', symbol: 'cbBTC', decimals: 8 }

describe('marginPairLabel', () => {
  it('renders a short as BASE / QUOTE, unwrapping WETH', () => {
    expect(marginPairLabel({ market: { collateral: USDC_T, debt: WETH_T } })).toBe('ETH / USDC')
  })
  it('renders a long as BASE / QUOTE, unwrapping WETH', () => {
    expect(marginPairLabel({ market: { collateral: WETH_T, debt: USDC_T } })).toBe('ETH / USDC')
  })
  it('keeps a USDT-quoted long in place', () => {
    expect(marginPairLabel({ market: { collateral: XAUT_T, debt: USDT_T } })).toBe('XAUt / USDT')
  })
  it('renders a short whose base is neither WETH nor the collateral', () => {
    // the only case where base is neither the wrapped native nor the collateral
    expect(marginPairLabel({ market: { collateral: USDC_T, debt: CBBTC_T } })).toBe('cbBTC / USDC')
  })
})

describe('marginPairLegs', () => {
  it('puts the stable leg second for a long', () => {
    const { base, quote } = marginPairLegs({ collateral: WETH_T, debt: USDC_T })
    expect(base.symbol).toBe('WETH')
    expect(quote.symbol).toBe('USDC')
  })
  it('puts the stable leg second for a short (collateral is the stable)', () => {
    const { base, quote } = marginPairLegs({ collateral: USDC_T, debt: WETH_T })
    expect(base.symbol).toBe('WETH')
    expect(quote.symbol).toBe('USDC')
  })
  it('treats USDT as a quote token', () => {
    expect(marginPairLegs({ collateral: XAUT_T, debt: USDT_T }).quote.symbol).toBe('USDT')
    expect(marginPairLegs({ collateral: USDT_T, debt: XAUT_T }).base.symbol).toBe('XAUt')
  })
  it('falls back to direction when neither leg is a known quote token', () => {
    const dai: MarginTokenInfo = { address: '0x6B175474E89094C44Da98b954EedeAC495271d0F', symbol: 'DAI', decimals: 18 }
    expect(marginPairLegs({ collateral: WETH_T, debt: dai, direction: 'LONG' }).quote.symbol).toBe('DAI')
    expect(marginPairLegs({ collateral: dai, debt: WETH_T, direction: 'SHORT' }).quote.symbol).toBe('DAI')
  })
  it('falls back to collateral-first when both legs are quote tokens and no direction is given', () => {
    const { base, quote } = marginPairLegs({ collateral: USDT_T, debt: USDC_T })
    expect(base.symbol).toBe('USDT')
    expect(quote.symbol).toBe('USDC')
  })
})

describe('marginExposureLeg', () => {
  it('is the collateral leg for a long', () => {
    expect(marginExposureLeg({ market: { collateral: WETH_T, debt: USDC_T }, direction: 'LONG' }).symbol).toBe('WETH')
  })
  // The decimals are the point: a short sized in 18-dec WETH but scaled by the stable's 6 renders 1e12.
  it('is the debt leg — and its decimals — for a short', () => {
    const leg = marginExposureLeg({ market: { collateral: USDC_T, debt: WETH_T }, direction: 'SHORT' })
    expect(leg.symbol).toBe('WETH')
    expect(leg.decimals).toBe(18)
  })
})

describe('marginMarketDirection', () => {
  it('is LONG for stable debt against volatile collateral', () => {
    expect(marginMarketDirection({ collateralToken: WETH_T.address, debtToken: USDC_T.address })).toBe('LONG')
  })
  it('is SHORT for stable collateral against volatile debt', () => {
    expect(marginMarketDirection({ collateralToken: USDC_T.address, debtToken: WETH_T.address })).toBe('SHORT')
  })
  it('is case-insensitive on addresses', () => {
    expect(
      marginMarketDirection({
        collateralToken: WETH_T.address.toLowerCase(),
        debtToken: USDC_T.address.toLowerCase(),
      }),
    ).toBe('LONG')
  })
})

// Fake CurrencyInfo keyed the same way marginFallbackPairLabel resolves an address — WETH under
// the native currencyId (its real symbol there is 'ETH', never 'WETH').
function fakeCurrencyInfos(entries: Array<{ address: string; symbol: string }>): Map<string, CurrencyInfo> {
  const map = new Map<string, CurrencyInfo>()
  for (const { address, symbol } of entries) {
    const currencyId = isMarginWrappedNative({ address })
      ? buildNativeCurrencyId(MARGIN_CHAIN_ID)
      : buildCurrencyId(MARGIN_CHAIN_ID, address)
    map.set(normalizeCurrencyIdForMapLookup(currencyId), { currency: { symbol } } as CurrencyInfo)
  }
  return map
}

describe('marginFallbackPairLabel', () => {
  it('renders resolved symbols in base/quote order for a long', () => {
    const currencyInfos = fakeCurrencyInfos([
      { address: WETH, symbol: 'ETH' },
      { address: USDC, symbol: 'USDC' },
    ])
    expect(marginFallbackPairLabel({ collateralToken: WETH, debtToken: USDC, currencyInfos })).toBe('ETH / USDC')
  })

  it('renders resolved symbols in base/quote order for a short (collateral is the stable leg)', () => {
    const currencyInfos = fakeCurrencyInfos([
      { address: WETH, symbol: 'ETH' },
      { address: USDC, symbol: 'USDC' },
    ])
    expect(marginFallbackPairLabel({ collateralToken: USDC, debtToken: WETH, currencyInfos })).toBe('ETH / USDC')
  })

  it('truncates BOTH legs when only one symbol is unresolved', () => {
    const currencyInfos = fakeCurrencyInfos([{ address: WETH, symbol: 'ETH' }]) // USDC missing
    const label = marginFallbackPairLabel({ collateralToken: WETH, debtToken: USDC, currencyInfos })
    expect(label).toBe(`${shortenAddress({ address: WETH })} / ${shortenAddress({ address: USDC })}`)
  })

  it('truncates both legs when neither symbol resolves', () => {
    const label = marginFallbackPairLabel({ collateralToken: WETH, debtToken: USDC, currencyInfos: new Map() })
    expect(label).toBe(`${shortenAddress({ address: WETH })} / ${shortenAddress({ address: USDC })}`)
  })
})
