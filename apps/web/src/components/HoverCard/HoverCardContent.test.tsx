import type { UTCTimestamp } from 'lightweight-charts'
import { MAX_PLOTTABLE_VALUE } from '~/components/Charts/PriceChart'
import {
  fitHoverCardChartData,
  hasHoverCardChartData,
  HoverCardBody,
  HoverCardStatsRow,
  isHoverCardNoData,
} from '~/components/HoverCard/HoverCardContent'
import { fireEvent, render, screen } from '~/test-utils/render'

const point = (time: number, value: number) => ({
  time: time as UTCTimestamp,
  value,
  open: value,
  high: value,
  low: value,
  close: value,
})

describe(hasHoverCardChartData, () => {
  it('accepts a series of two or more ordinary points', () => {
    expect(hasHoverCardChartData([point(1, 10), point(2, 12)])).toBe(true)
  })

  it('rejects an absent or too-short series', () => {
    expect(hasHoverCardChartData(undefined)).toBe(false)
    expect(hasHoverCardChartData([])).toBe(false)
    expect(hasHoverCardChartData([point(1, 10)])).toBe(false)
  })

  // Oversized values are fitted before drawing, so only non-finite ones (which no divisor can fix) fall through.
  it('accepts an oversized series and rejects a non-finite one', () => {
    expect(hasHoverCardChartData([point(1, 10), point(2, 1_241_520_381_914_924)])).toBe(true)
    expect(hasHoverCardChartData([point(1, 10), point(2, -1_241_520_381_914_924)])).toBe(true)
    expect(hasHoverCardChartData([point(1, 10), point(2, Number.POSITIVE_INFINITY)])).toBe(false)
    expect(hasHoverCardChartData([point(1, 10), point(2, Number.NaN)])).toBe(false)
  })
})

describe(fitHoverCardChartData, () => {
  const max = MAX_PLOTTABLE_VALUE

  it('returns a series that already fits untouched', () => {
    const data = [point(1, 10), point(2, max)]
    expect(fitHoverCardChartData(data)).toBe(data)
  })

  // lightweight-charts asserts on out-of-range values and the throw escapes render, blanking the app.
  // Token prices derive from creator-supplied metadata that is sometimes garbage.
  it('divides an oversized series by a power of ten shared across all points', () => {
    // ratio to the limit is ~13.8, so the divisor is 100
    const fitted = fitHoverCardChartData([point(1, 10), point(2, 1_242_520_381_914_924), point(3, 20)])
    expect(fitted.map((entry) => entry.value)).toEqual([0.1, 12_425_203_819_149.24, 0.2])
    expect(fitted.every((entry) => Math.abs(entry.value) <= max)).toBe(true)
  })

  it('scales the candlestick fields alongside value', () => {
    // ratio to the limit is ~11,000, so the divisor is 100_000
    const [fitted] = fitHoverCardChartData([point(1, 1e18), point(2, 1e18)])
    expect(fitted).toEqual({ time: 1, value: 1e13, open: 1e13, high: 1e13, low: 1e13, close: 1e13 })
  })

  it('fits a series whose magnitude is negative and preserves its shape', () => {
    const fitted = fitHoverCardChartData([point(1, -1e18), point(2, 1e17)])
    expect(fitted.every((entry) => Math.abs(entry.value) <= max)).toBe(true)
    expect(fitted[0].value).toBeLessThan(fitted[1].value)
  })

  it('lands strictly inside the limit when the ratio is an exact power of ten', () => {
    const fitted = fitHoverCardChartData([point(1, max * 10), point(2, 10)])
    expect(fitted[0].value).toBeLessThan(max)
  })
})

describe(isHoverCardNoData, () => {
  it('is false while loading, whatever has arrived', () => {
    expect(isHoverCardNoData({ loading: true })).toBe(false)
  })

  it('is true once settled with no headline, change, or chartable series', () => {
    expect(isHoverCardNoData({ loading: false })).toBe(true)
    expect(isHoverCardNoData({ loading: false, headline: null, change: null, data: [] })).toBe(true)
    expect(isHoverCardNoData({ loading: false, data: [point(1, 10)] })).toBe(true)
  })

  it('is false when any one of the three is present', () => {
    expect(isHoverCardNoData({ loading: false, headline: 0 })).toBe(false)
    expect(isHoverCardNoData({ loading: false, change: -1.5 })).toBe(false)
    expect(isHoverCardNoData({ loading: false, data: [point(1, 10), point(2, 12)] })).toBe(false)
  })
})

describe(HoverCardBody, () => {
  it('renders the identity row with header actions above the data section', () => {
    const onCopy = vi.fn()
    const onExpand = vi.fn()
    render(
      <HoverCardBody identity={<span>identity</span>} onCopy={onCopy} onExpand={onExpand}>
        <span>data</span>
      </HoverCardBody>,
    )

    expect(screen.getByText('identity')).toBeInTheDocument()
    expect(screen.getByText('data')).toBeInTheDocument()
    const buttons = screen.getAllByRole('button')
    expect(buttons).toHaveLength(2)
    fireEvent.click(buttons[0])
    fireEvent.click(buttons[1])
    expect(onCopy).toHaveBeenCalledTimes(1)
    expect(onExpand).toHaveBeenCalledTimes(1)
  })

  it('swaps the data section for the no-data treatment', () => {
    render(
      <HoverCardBody identity={<span>identity</span>} isNoData>
        <span>data</span>
      </HoverCardBody>,
    )

    expect(screen.getByText('identity')).toBeInTheDocument()
    expect(screen.queryByText('data')).not.toBeInTheDocument()
    expect(screen.getByText('Token data unavailable')).toBeInTheDocument()
  })

  it('omits the identity row entirely when no identity is given', () => {
    render(
      <HoverCardBody isNoData>
        <span>data</span>
      </HoverCardBody>,
    )

    expect(screen.queryByRole('button')).not.toBeInTheDocument()
    expect(screen.getByText('Token data unavailable')).toBeInTheDocument()
  })
})

describe(HoverCardStatsRow, () => {
  it('renders every present stat and drops the absent ones', () => {
    render(
      <HoverCardStatsRow
        loading={false}
        loadingPlaceholderText="…"
        stats={['$1.2M 24H vol', undefined, '$3.4M TVL']}
      />,
    )

    expect(screen.getByText('$1.2M 24H vol')).toBeInTheDocument()
    expect(screen.getByText('$3.4M TVL')).toBeInTheDocument()
  })

  it('renders nothing once settled with no stats', () => {
    const { container } = render(<HoverCardStatsRow loading={false} loadingPlaceholderText="…" stats={[undefined]} />)

    expect(container).toBeEmptyDOMElement()
  })

  it('shows the placeholder instead of the stats while loading', () => {
    render(<HoverCardStatsRow loading loadingPlaceholderText="…" stats={['$1.2M 24H vol']} />)

    expect(screen.queryByText('$1.2M 24H vol')).not.toBeInTheDocument()
  })
})
