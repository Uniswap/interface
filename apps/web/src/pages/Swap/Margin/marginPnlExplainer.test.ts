import type { MarginActivePosition } from 'uniswap/src/data/apiClients/tradingApi/MarginApiClient'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import { describe, expect, it } from 'vitest'
import { getDefaultMarginMarket } from '~/pages/Swap/Margin/__fixtures__/marginCatalog'
import {
  buildMarginBasisBreakdown,
  buildMarginDrawerPnlRows,
  buildMarginEstPnlBreakdown,
  buildMarginPnlBreakdown,
  buildMarginRealizedLines,
  MARGIN_PNL_DEFINITION_LINES,
  marginPnlSuppression,
} from '~/pages/Swap/Margin/marginPnlExplainer'
import type { MarginUsdBasis, MarginUsdPnl } from '~/pages/Swap/Margin/marginUsdPnl'

const MARKET = getDefaultMarginMarket()

// A plain formatter: the module must never reach for a locale context of its own.
const fiat = (value: number): string => `$${value.toFixed(2)}`

function makePosition(overrides: Partial<MarginActivePosition> = {}): MarginActivePosition {
  return {
    status: 'ACTIVE',
    positionId: 'pos-1',
    direction: MarginDirection.LONG,
    exposureToken: { address: MARKET.collateral.address, chainId: 1, decimals: MARKET.collateral.decimals },
    counterToken: { address: MARKET.debt.address, chainId: 1, decimals: MARKET.debt.decimals },
    size: '20000000000000000',
    entryPrice: '0',
    openedAt: '0',
    legs: [
      { venue: MARKET.venue, subId: '1', account: '0x1111111111111111111111111111111111111111', debt: '18400000' },
    ],
    isTradable: true,
    equity: '25000000',
    oraclePrice: '2201400000000000000000',
    liquidationPrice: '1600000000000000000000',
    buffer: '0',
    healthFactor: '1237000000000000000',
    maxWithdrawable: '0',
    costBasisUsd: '25000000',
    ...overrides,
  }
}

function makeBasis(overrides: Partial<MarginUsdBasis> = {}): MarginUsdBasis {
  return { direction: MarginDirection.LONG, collateral: 0.02, debt: 18.4, costBasisUsd: 25, ...overrides }
}

function makePnl(overrides: Partial<MarginUsdPnl> = {}): MarginUsdPnl {
  return { equityUsd: 30.66, pnlUsd: 5.66, pnlPct: 22.65, pnlPctRaw: 22.65, floored: false, ...overrides }
}

describe('marginPnlSuppression', () => {
  it('reports untradable ahead of unvalued when both hold', () => {
    const position = makePosition({ isTradable: false, costBasisUsd: undefined })
    expect(marginPnlSuppression({ position, market: MARKET })).toBe('untradable')
  })

  it('reports unvalued when the server could not value the log', () => {
    expect(marginPnlSuppression({ position: makePosition({ costBasisUsd: undefined }), market: MARKET })).toBe(
      'unvalued',
    )
  })

  // A present-but-non-positive basis is indistinguishable from absence downstream.
  it('reports unvalued for a zero basis', () => {
    expect(marginPnlSuppression({ position: makePosition({ costBasisUsd: '0' }), market: MARKET })).toBe('unvalued')
  })

  it('reports noPrice when the mark is the absent sentinel', () => {
    expect(marginPnlSuppression({ position: makePosition({ oraclePrice: '0' }), market: MARKET })).toBe('noPrice')
  })

  it('reports nothing for a healthy position', () => {
    expect(marginPnlSuppression({ position: makePosition(), market: MARKET })).toBeUndefined()
  })
})

describe('MARGIN_PNL_DEFINITION_LINES', () => {
  it('leads with the definition and ends with both worked examples', () => {
    expect(MARGIN_PNL_DEFINITION_LINES).toEqual([
      'lead',
      'basis',
      'frozen',
      'withdrawals',
      'moves',
      'excludes',
      'leverage',
      'roe',
      'exampleLong',
      'exampleShort',
    ])
  })

  // No direction argument by design: a column header cannot know which row the reader means, so the
  // card is the same every time rather than varying with whatever the table happens to hold.
  it('carries no direction-dependent branch', () => {
    expect(MARGIN_PNL_DEFINITION_LINES).toHaveLength(10)
  })
})

describe('buildMarginPnlBreakdown', () => {
  it('renders four rows in reading order for a plain position', () => {
    const out = buildMarginPnlBreakdown({ basis: makeBasis(), pnl: makePnl(), formatFiat: fiat })
    expect(out.rows.map((row) => row.id)).toEqual(['marginAtCost', 'marginNow', 'unrealized', 'roe'])
    expect(out.rows.map((row) => row.value)).toEqual(['$25.00', '$30.66', '+$5.66', '+22.65%'])
    expect(out.notes).toEqual([])
  })

  it('tones the signed rows so a loss reads critical', () => {
    const pnl = makePnl({ equityUsd: 20.88, pnlUsd: -4.12, pnlPct: -16.48, pnlPctRaw: -16.48 })
    const out = buildMarginPnlBreakdown({ basis: makeBasis(), pnl, formatFiat: fiat })
    expect(out.rows.find((row) => row.id === 'unrealized')?.tone).toBe('negative')
    expect(out.rows.find((row) => row.id === 'roe')?.tone).toBe('negative')
    expect(out.rows.find((row) => row.id === 'marginAtCost')?.tone).toBeUndefined()
  })

  // Conditionally-spread fields cannot be asserted with objectContaining — assert the row list.
  it('appends realized only when the wire sent a non-zero figure', () => {
    const withRealized = buildMarginPnlBreakdown({
      basis: makeBasis({ realizedPnlUsd: 6.25 }),
      pnl: makePnl(),
      formatFiat: fiat,
    })
    expect(withRealized.rows.map((row) => row.id)).toContain('realized')
    expect(withRealized.rows.find((row) => row.id === 'realized')?.value).toBe('+$6.25')

    const zeroRealized = buildMarginPnlBreakdown({
      basis: makeBasis({ realizedPnlUsd: 0 }),
      pnl: makePnl(),
      formatFiat: fiat,
    })
    expect(zeroRealized.rows.map((row) => row.id)).not.toContain('realized')
  })

  // Internally consistent: a $25 basis worth -$3.50 has lost $28.50, i.e. -114%, which the floor binds
  // to -100%. Equity exactly 0 would be exactly -100% and, under the strict `<`, NOT floored.
  it('notes the floor only when the floor bound the percent', () => {
    const floored = makePnl({ equityUsd: -3.5, pnlUsd: -28.5, pnlPct: -100, pnlPctRaw: -114, floored: true })
    expect(buildMarginPnlBreakdown({ basis: makeBasis(), pnl: floored, formatFiat: fiat }).notes).toEqual(['floored'])
    expect(buildMarginPnlBreakdown({ basis: makeBasis(), pnl: makePnl(), formatFiat: fiat }).notes).toEqual([])
  })

  // Unlike the cell, the tooltip row has no arrow to carry the sign, so it keeps it.
  it('keeps the sign on a loss, and bounds it on the floor', () => {
    const losing = makePnl({ equityUsd: 20.88, pnlUsd: -4.12, pnlPct: -16.48, pnlPctRaw: -16.48 })
    expect(
      buildMarginPnlBreakdown({ basis: makeBasis(), pnl: losing, formatFiat: fiat }).rows.find(
        (row) => row.id === 'roe',
      )?.value,
    ).toBe('-16.48%')

    const floored = makePnl({ equityUsd: -3.5, pnlUsd: -28.5, pnlPct: -100, pnlPctRaw: -114, floored: true })
    expect(
      buildMarginPnlBreakdown({ basis: makeBasis(), pnl: floored, formatFiat: fiat }).rows.find(
        (row) => row.id === 'roe',
      )?.value,
    ).toBe('≤-100.00%')
  })
})

describe('buildMarginBasisBreakdown', () => {
  it('drops RoE — the Margin column explains the basis, not the return', () => {
    const out = buildMarginBasisBreakdown({ basis: makeBasis(), pnl: makePnl(), formatFiat: fiat })
    expect(out.rows.map((row) => row.id)).toEqual(['marginAtCost', 'marginNow', 'unrealized'])
  })
})

describe('buildMarginRealizedLines', () => {
  it('explains a user-closed position', () => {
    expect(buildMarginRealizedLines({ row: { status: 'COMPLETED' } })).toEqual(['realizedLead', 'realizedBasis'])
  })

  it('replaces the proceeds line for a liquidation', () => {
    expect(buildMarginRealizedLines({ row: { status: 'LIQUIDATED' } })).toEqual(['realizedLead', 'liquidated'])
  })

  it('appends the partial line without replacing anything', () => {
    expect(buildMarginRealizedLines({ row: { status: 'PARTIALLY_LIQUIDATED' } })).toEqual([
      'realizedLead',
      'realizedBasis',
      'partialLiq',
    ])
  })
})

describe('buildMarginEstPnlBreakdown', () => {
  it('shows the basis, the proceeds and the difference', () => {
    const out = buildMarginEstPnlBreakdown({
      costBasisUsd: 25,
      proceedsUsd: 30.41,
      estPnlUsd: 5.41,
      formatFiat: fiat,
    })
    expect(out.rows.map((row) => row.id)).toEqual(['marginAtCost', 'proceeds', 'estRealized'])
    expect(out.rows.map((row) => row.value)).toEqual(['$25.00', '$30.41', '+$5.41'])
  })
})

describe('buildMarginDrawerPnlRows', () => {
  it('omits break-even when there is no honest one to show', () => {
    const rows = buildMarginDrawerPnlRows({
      basis: makeBasis({ collateral: 0 }),
      pnl: makePnl(),
      formatFiat: fiat,
      formatPrice: fiat,
    })
    expect(rows.map((row) => row.id)).not.toContain('breakEven')
  })

  it('shows break-even and the settled split when a withdrawal happened', () => {
    const rows = buildMarginDrawerPnlRows({
      basis: makeBasis({ netContributedUsd: 12.5, realizedPnlUsd: 6.25 }),
      pnl: makePnl(),
      formatFiat: fiat,
      formatPrice: fiat,
    })
    expect(rows.map((row) => row.id)).toEqual([
      'marginAtCost',
      'marginNow',
      'unrealized',
      'netDeposited',
      'realized',
      'breakEven',
    ])
  })

  it('omits the settled split on a position that was opened and left alone', () => {
    const rows = buildMarginDrawerPnlRows({
      basis: makeBasis(),
      pnl: makePnl(),
      formatFiat: fiat,
      formatPrice: fiat,
    })
    expect(rows.map((row) => row.id)).toEqual(['marginAtCost', 'marginNow', 'unrealized', 'breakEven'])
  })
})
