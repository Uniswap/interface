import type { MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { describe, expect, it } from 'vitest'
import { MARGIN_CHAIN_ID } from '~/constants/margin'
import type { MarginMarket, MarginTokenInfo } from '~/constants/margin'
import {
  extrapolateAccrued,
  positionEconomics,
  type PositionEconomics,
} from '~/pages/Swap/Margin/chart/marginChartMath'

// 1e18-scaled wire price string, drift-free.
const X18 = (n: number): string => (BigInt(Math.round(n * 1e6)) * 10n ** 12n).toString()
// Raw integer token units at a leg's decimals (all fixture amounts are whole numbers).
const raw = (whole: number, decimals: number): string => (BigInt(whole) * 10n ** BigInt(decimals)).toString()

const WETH: MarginTokenInfo = { address: '0xC02aaA39b223FE8D0A0e5C4F27eAD9083C756Cc2', symbol: 'WETH', decimals: 18 }
const USDC: MarginTokenInfo = { address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48', symbol: 'USDC', decimals: 6 }

// LONG market: collateral WETH (18dp, volatile), debt USDC (6dp, stable).
const longMarket: MarginMarket = {
  key: 'weth-usdc-morpho',
  asset: 'ETH',
  name: 'Ethereum',
  displaySymbol: 'ETH',
  collateral: WETH,
  debt: USDC,
  venue: 'MORPHO',
  direction: 'LONG',
  lltvWad: X18(0.86),
  shouldUseNativeEquity: true,
}
// SHORT market: collateral USDC (6dp, stable), debt WETH (18dp, volatile).
const shortMarket: MarginMarket = {
  ...longMarket,
  key: 'usdc-weth-morpho',
  collateral: USDC,
  debt: WETH,
  direction: 'SHORT',
}

// LONG position fixture: 2 WETH collateral (= size, the exposure leg), 1786 USDC debt, 1 WETH equity,
// entry 1712.
const mkPos = (over?: Partial<MarginActivePosition>): MarginActivePosition => ({
  positionId: 'pos-1',
  direction: 'LONG',
  exposureToken: { address: WETH.address, chainId: MARGIN_CHAIN_ID, decimals: WETH.decimals },
  counterToken: { address: USDC.address, chainId: MARGIN_CHAIN_ID, decimals: USDC.decimals },
  size: raw(2, 18),
  entryPrice: X18(1712),
  openedAt: '100',
  openTxHash: '0xtx',
  legs: [{ venue: 'MORPHO', subId: 'sub-1', account: '0xacc', debt: raw(1786, 6) }],
  isTradable: true,
  status: 'ACTIVE',
  equity: raw(1, 18),
  oraclePrice: X18(2000),
  liquidationPrice: X18(1500),
  buffer: X18(0.25),
  healthFactor: X18(2),
  maxWithdrawable: '0',
  openedLeverage: '2',
  collateralAtOpen: raw(2, 18),
  ...over,
})

describe('extrapolateAccrued', () => {
  it('1yr at 400bps on 1786 debt → +71.44 (apyBps/1e4 and dt/31_536_000 normalization)', () => {
    expect(extrapolateAccrued({ accruedWire: 0, debt: 1786, apyBps: 400, dtSeconds: 31_536_000 })).toBeCloseTo(71.44)
  })

  it('dt=0 → accruedWire unchanged', () => {
    expect(extrapolateAccrued({ accruedWire: 5, debt: 1786, apyBps: 400, dtSeconds: 0 })).toBe(5)
  })

  it('half a year at 400bps on 1786 debt → half the accrual', () => {
    expect(extrapolateAccrued({ accruedWire: 5, debt: 1786, apyBps: 400, dtSeconds: 31_536_000 / 2 })).toBeCloseTo(
      40.72,
    )
  })
})

describe('positionEconomics (X18 + raw-decimals fixtures, both directions)', () => {
  it('LONG: each leg normalized with the correct decimals + direction', () => {
    const econ = positionEconomics({ position: mkPos(), market: longMarket })
    expect(econ?.collateral).toBeCloseTo(2, 8) // 2 WETH / 1e18 (size, the LONG's exposure leg)
    expect(econ?.collateralAtOpen).toBeCloseTo(2, 8) // collateralAtOpen 2 WETH / 1e18
    expect(econ?.debt).toBeCloseTo(1786, 6) // 1786 USDC / 1e6
    expect(econ?.direction).toBe('LONG')
  })

  it('SHORT: collateral USDC 6dp, debt WETH 18dp', () => {
    const shortPos = mkPos({
      direction: 'SHORT',
      // Same pair, opposite venue legs: SHORT borrows the exposure token against counter collateral.
      size: raw(1, 18), // 1 WETH exposure — a SHORT's exposure leg IS its debt leg
      legs: [{ venue: 'MORPHO', subId: 'sub-1', account: '0xacc', debt: raw(1, 18) }],
      entryPrice: X18(1800),
      // oraclePrice stays the mkPos default 2000: 1600 USDC equity + 1 WETH debt @ 2000 = 3600 USDC.
      equity: raw(1600, 6),
      collateralAtOpen: raw(3600, 6), // 3600 USDC at open (collateral units, 6dp)
    })
    const econ = positionEconomics({ position: shortPos, market: shortMarket })
    // A SHORT's collateral leg has no raw balance on the wire — solved from equity at the oracle price.
    expect(econ?.collateral).toBeCloseTo(3600, 6)
    expect(econ?.collateralAtOpen).toBeCloseTo(3600, 6) // USDC 6dp normalization, not the 18dp default
    expect(econ?.debt).toBeCloseTo(1, 8)
    expect(econ?.direction).toBe('SHORT')
  })

  it('undefined without an attributable basis', () => {
    expect(
      positionEconomics({ position: mkPos({ entryPrice: '0', openedAt: '0' }), market: longMarket }),
    ).toBeUndefined()
  })

  // The mark is load-bearing only on the SHORT solve (`equity + exposure x mark`), and the wire's '0'
  // is a designed absent-price sentinel. Passing it through collapses the collateral to equity alone —
  // 1,600 USDC where the position holds 3,600 — which the opened-marker tooltip then reports as the
  // position's size whenever `collateralAtOpen` is unattributed. Same refusal as marginUsdBasis, which
  // this function's comment says it mirrors.
  it('undefined for a SHORT at the zero-price sentinel, rather than a collateral short by the debt leg', () => {
    const shortPos = mkPos({
      direction: 'SHORT',
      size: raw(1, 18),
      legs: [{ venue: 'MORPHO', subId: 'sub-1', account: '0xacc', debt: raw(1, 18) }],
      entryPrice: X18(1800),
      equity: raw(1600, 6),
      collateralAtOpen: raw(3600, 6),
      oraclePrice: '0',
    })
    expect(positionEconomics({ position: shortPos, market: shortMarket })).toBeUndefined()
  })

  // A LONG's collateral IS its exposure leg and reads no mark, so it must keep working.
  it('still reports a LONG at the zero-price sentinel', () => {
    expect(positionEconomics({ position: mkPos({ oraclePrice: '0' }), market: longMarket })?.collateral).toBeCloseTo(
      2,
      8,
    )
  })

  it('defaults direction to LONG when the market omits it', () => {
    const econ = positionEconomics({ position: mkPos(), market: { ...longMarket, direction: undefined } })
    expect(econ?.direction).toBe('LONG')
  })

  it('carries no basis of its own — valuation lives in marginUsdPnl', () => {
    const econ = positionEconomics({ position: mkPos(), market: longMarket }) as PositionEconomics
    expect(Object.keys(econ).sort()).toEqual(['collateral', 'collateralAtOpen', 'debt', 'direction'])
  })
})
