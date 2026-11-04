import { describe, expect, it } from 'vitest'
import { buildMarginEstPnlBreakdown, buildMarginRealizedLines } from '~/pages/Swap/Margin/marginPnlExplainer'

// A plain formatter: the module must never reach for a locale context of its own.
const fiat = (value: number): string => `$${value.toFixed(2)}`

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
