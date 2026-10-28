import { screen } from '@testing-library/react'
import type { UTCTimestamp } from 'lightweight-charts'
import { MarginDirection } from 'uniswap/src/features/transactions/margin/types'
import type { PositionEconomics } from '~/pages/Swap/Margin/chart/marginChartMath'
import { MarginChartTooltip, type MarginTooltipData } from '~/pages/Swap/Margin/chart/MarginChartTooltip'
import type { MarginUsdBasis } from '~/pages/Swap/Margin/marginUsdPnl'
import { render } from '~/test-utils/render'

const ts = (n: number): UTCTimestamp => n as UTCTimestamp

// LONG: 2 WETH collateral, 1786 USDC debt.
const econ: PositionEconomics = {
  collateral: 2,
  collateralAtOpen: 3, // distinct from current collateral so the open marker asserts the at-open size
  debt: 1786,
  direction: MarginDirection.LONG,
}
// $1700 of margin went in, so at a close of 2000 equity is 2·2000 − 1786 = 2214 → +$514 (+30.24%).
const usdBasis: MarginUsdBasis = { direction: MarginDirection.LONG, collateral: 2, debt: 1786, costBasisUsd: 1700 }

function mkData(over?: Partial<MarginTooltipData>): MarginTooltipData {
  return { time: ts(1_700_000_000), value: 2000, open: 1990, high: 2010, low: 1985, close: 2000, ...over }
}

function renderTooltip({
  data = mkData(),
  withEcon = false,
  direction = MarginDirection.LONG,
}: {
  data?: MarginTooltipData
  withEcon?: boolean
  direction?: MarginDirection
} = {}): void {
  render(
    <MarginChartTooltip
      data={data}
      econ={withEcon ? econ : undefined}
      usdBasis={withEcon ? usdBasis : undefined}
      direction={direction}
      leverage={withEcon ? '2x' : undefined}
      collateralSymbol="WETH"
    />,
  )
}

describe('MarginChartTooltip', () => {
  it('renders the four OHLC rows', () => {
    renderTooltip()
    expect(screen.getByText('Open')).toBeInTheDocument()
    expect(screen.getByText('High')).toBeInTheDocument()
    expect(screen.getByText('Low')).toBeInTheDocument()
    expect(screen.getByText('Close')).toBeInTheDocument()
    expect(screen.getByText(/1,990/)).toBeInTheDocument() // open
    expect(screen.getByText(/2,010/)).toBeInTheDocument() // high
  })

  it('renders the PnL-at-price row when a primary position exists', () => {
    renderTooltip({ withEcon: true })
    const row = screen.getByText(/If price/)
    expect(row).toHaveTextContent('514') // +$514.00
    expect(row).toHaveTextContent('30.24%')
  })

  it('omits the PnL row without a valued basis', () => {
    renderTooltip()
    expect(screen.queryByText(/If price/)).not.toBeInTheDocument()
  })

  it('omits the PnL row on a zero-close candle rather than printing a fabricated total loss', () => {
    renderTooltip({ withEcon: true, data: mkData({ close: 0 }) })
    expect(screen.queryByText(/If price/)).not.toBeInTheDocument()
  })

  it('marks a floored percent with "≤" — past liquidation the loss is at least all of the margin', () => {
    // equity = 2·800 − 1786 = −186 against a 1700 basis: −110.9%, floored to −100%.
    renderTooltip({ withEcon: true, data: mkData({ close: 800 }) })
    expect(screen.getByText(/If price/)).toHaveTextContent('≤-100%')
  })

  it('shows the explainer only after the dwell elapsed', () => {
    renderTooltip({
      withEcon: true,
      data: mkData({ nearOverlay: { role: 'liq', id: 'liq', price: 1500, dwellElapsed: false } }),
    })
    expect(screen.queryByText(/can be liquidated/)).not.toBeInTheDocument()
  })

  it('renders the liq explainer with direction + price (falls for LONG)', () => {
    renderTooltip({
      withEcon: true,
      data: mkData({ nearOverlay: { role: 'liq', id: 'liq', price: 1500, dwellElapsed: true } }),
    })
    const explainer = screen.getByText(/can be liquidated/)
    expect(explainer).toHaveTextContent('falls')
    expect(explainer).toHaveTextContent('1,500')
  })

  it('renders the liq explainer with "rises" for SHORT', () => {
    renderTooltip({
      withEcon: true,
      direction: MarginDirection.SHORT,
      data: mkData({ nearOverlay: { role: 'liq', id: 'liq', price: 2500, dwellElapsed: true } }),
    })
    expect(screen.getByText(/can be liquidated/)).toHaveTextContent('rises')
  })

  it('interpolates the leverage into the entry explainer', () => {
    renderTooltip({
      withEcon: true,
      data: mkData({ nearOverlay: { role: 'entry', id: 'entry', price: 1712, dwellElapsed: true } }),
    })
    expect(screen.getByText(/The price you opened at/)).toHaveTextContent('2x leverage')
  })

  it('suppresses the entry explainer for a ghost (non-primary) entry line', () => {
    renderTooltip({
      withEcon: true,
      data: mkData({ nearOverlay: { role: 'entry', id: 'entry-2', price: 1900, dwellElapsed: true } }),
    })
    // A ghost hit must not borrow the primary's leverage copy.
    expect(screen.queryByText(/The price you opened at/)).not.toBeInTheDocument()
  })

  it('suppresses the liq explainer for a ghost (non-primary) liq line', () => {
    renderTooltip({
      withEcon: true,
      data: mkData({ nearOverlay: { role: 'liq', id: 'liq-2', price: 1200, dwellElapsed: true } }),
    })
    expect(screen.queryByText(/can be liquidated/)).not.toBeInTheDocument()
  })

  it('renders the zone explainer', () => {
    renderTooltip({
      withEcon: true,
      data: mkData({ nearOverlay: { role: 'zone', price: 1500, dwellElapsed: true } }),
    })
    expect(screen.getByText(/Liquidation zone/)).toBeInTheDocument()
  })

  it('formats the open-marker copy with the at-open size, price and date', () => {
    renderTooltip({
      withEcon: true,
      data: mkData({
        nearOverlay: {
          role: 'marker',
          price: 1712,
          dwellElapsed: true,
          marker: { kind: 'open', time: ts(1_700_000_000), price: 1712 },
        },
      }),
    })
    const label = screen.getByText(/Opened/)
    expect(label).toHaveTextContent('3.00 WETH') // at-open size (collateralAtOpen 3), not current collateral (2)
    expect(label).not.toHaveTextContent('2.00 WETH')
    expect(label).toHaveTextContent('1,712')
  })

  it('formats the open-marker date via the localized formatter', () => {
    renderTooltip({
      withEcon: true,
      data: mkData({
        nearOverlay: {
          role: 'marker',
          price: 1712,
          dwellElapsed: true,
          marker: { kind: 'open', time: ts(1_700_000_000), price: 1712 },
        },
      }),
    })
    // FORMAT_DATE_MEDIUM → "Nov 14, 2023"; 'Nov' discriminates vs the old numeric format (both contain "2023").
    expect(screen.getByText(/Opened/)).toHaveTextContent('Nov')
  })

  it('formats the decrease-marker copy without a size', () => {
    renderTooltip({
      withEcon: true,
      data: mkData({
        nearOverlay: {
          role: 'marker',
          price: 1900,
          dwellElapsed: true,
          marker: { kind: 'decrease', time: ts(1_700_000_000), price: 1900 },
        },
      }),
    })
    expect(screen.getByText(/Partial close/)).toHaveTextContent('1,900')
  })
})
