import { screen } from '@testing-library/react'
import type { UTCTimestamp } from 'lightweight-charts'
import { MarginChartTooltip, type MarginTooltipData } from '~/pages/Swap/Margin/chart/MarginChartTooltip'
import { render } from '~/test-utils/render'

const ts = (n: number): UTCTimestamp => n as UTCTimestamp

function mkData(over?: Partial<MarginTooltipData>): MarginTooltipData {
  return { time: ts(1_700_000_000), value: 2000, open: 1990, high: 2010, low: 1985, close: 2000, ...over }
}

describe('MarginChartTooltip', () => {
  // OHLC reads off the legend above the chart; a hover with no explainer draws no tooltip at all.
  it('renders nothing for a candle with no explainer', () => {
    render(<MarginChartTooltip data={mkData()} />)
    expect(document.body.textContent).toBe('')
  })

  it('shows the explainer only after the dwell elapsed', () => {
    render(
      <MarginChartTooltip data={mkData({ nearOverlay: { role: 'previewLiq', price: 1500, dwellElapsed: false } })} />,
    )
    expect(screen.queryByText(/would liquidate/)).not.toBeInTheDocument()
  })

  it.each([
    ['mark', /the venue’s oracle price/],
    ['previewEntry', /would enter/],
    ['previewLiq', /would liquidate/],
  ] as const)('renders the %s explainer', (role, copy) => {
    render(<MarginChartTooltip data={mkData({ nearOverlay: { role, price: 1500, dwellElapsed: true } })} />)
    expect(screen.getByText(copy)).toBeInTheDocument()
  })
})
