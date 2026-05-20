import { ChartPeriod } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { UTCTimestamp } from 'lightweight-charts'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import { PortfolioChart } from '~/pages/Portfolio/Overview/PortfolioChart'
import { fireEvent, render, screen } from '~/test-utils/render'

const mockPriceChartBodyCrosshairData = vi.hoisted(
  (): {
    data?: {
      time: UTCTimestamp
      value: number
      open: number
      high: number
      low: number
      close: number
    }
  } => ({ data: undefined }),
)

vi.mock('~/components/Charts/PriceChart', () => ({
  PriceChart: () => <div data-testid="legacy-price-chart" />,
  PriceChartBody: ({
    children,
    onCrosshairChange,
  }: {
    children?: (crosshairData?: PriceChartData) => JSX.Element | null
    onCrosshairChange?: (crosshairData?: PriceChartData) => void
  }) => {
    const crosshairData = mockPriceChartBodyCrosshairData.data as PriceChartData | undefined

    return (
      <div
        data-testid="chart-body"
        // Mock chart reports crosshair data on mouse move so tests can simulate scrubbing without rendering a canvas.
        onMouseMove={() => {
          onCrosshairChange?.(crosshairData)
        }}
      >
        {children?.(crosshairData)}
      </div>
    )
  },
}))

vi.mock('~/pages/Portfolio/hooks/useShowDemoView', () => ({
  useShowDemoView: () => false,
}))

function makeSeries(values: number[]): PriceChartData[] {
  return values.map((value, index) => ({
    time: (1700000000 + index * 3600) as UTCTimestamp,
    value,
    open: value,
    high: value,
    low: value,
    close: value,
  }))
}

const defaultProps = {
  isPortfolioZero: false,
  series: makeSeries([100, 110]),
  chartPercentChange: { percentChange: 10, absoluteChangeUSD: 10 },
  isLoading: false,
  isChartEmpty: false,
  error: null,
  selectedPeriod: ChartPeriod.DAY,
  setSelectedPeriod: vi.fn(),
  portfolioTotalBalanceUSD: 110,
  isTotalValueMatch: true,
}

describe('PortfolioChart', () => {
  beforeEach(() => {
    mockPriceChartBodyCrosshairData.data = undefined
  })

  it('renders the balance header before the chart body when the balance header row is enabled', () => {
    render(<PortfolioChart {...defaultProps} showBalanceHeaderRow />)

    const header = screen.getByTestId(TestID.PortfolioBalanceHeader)
    const chartBody = screen.getByTestId('chart-body')

    expect(header.compareDocumentPosition(chartBody) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.queryByTestId('legacy-price-chart')).not.toBeInTheDocument()
  })

  it('syncs chart crosshair data into the balance header while scrubbing', async () => {
    mockPriceChartBodyCrosshairData.data = {
      time: 1700001800 as UTCTimestamp,
      value: 105,
      open: 105,
      high: 105,
      low: 105,
      close: 105,
    }

    render(<PortfolioChart {...defaultProps} showBalanceHeaderRow />)

    fireEvent.mouseMove(screen.getByTestId('chart-body'))

    expect(await screen.findByText(/\$105/)).toBeInTheDocument()
  })

  it('clears hovered chart data when the selected period changes', async () => {
    mockPriceChartBodyCrosshairData.data = {
      time: 1700001800 as UTCTimestamp,
      value: 105,
      open: 105,
      high: 105,
      low: 105,
      close: 105,
    }

    const { rerender } = render(<PortfolioChart {...defaultProps} showBalanceHeaderRow />)

    fireEvent.mouseMove(screen.getByTestId('chart-body'))

    expect(await screen.findByText(/\$105/)).toBeInTheDocument()

    mockPriceChartBodyCrosshairData.data = undefined
    rerender(<PortfolioChart {...defaultProps} showBalanceHeaderRow selectedPeriod={ChartPeriod.WEEK} />)

    expect(screen.getByText(/\$110/)).toBeInTheDocument()
  })

  it('keeps the legacy empty balance styling when the portfolio is zero', () => {
    render(
      <PortfolioChart
        {...defaultProps}
        isPortfolioZero={true}
        series={makeSeries([0, 0])}
        isChartEmpty={true}
        chartPercentChange={undefined}
        portfolioTotalBalanceUSD={undefined}
        showBalanceHeaderRow
      />,
    )

    expect(screen.queryByTestId(TestID.PortfolioBalanceHeader)).not.toBeInTheDocument()
    expect(screen.getAllByText(/\$0/)).toHaveLength(1)
  })

  it('keeps the legacy in-chart empty balance when the external header is disabled', () => {
    render(
      <PortfolioChart
        {...defaultProps}
        isPortfolioZero={true}
        series={makeSeries([0, 0])}
        isChartEmpty={true}
        chartPercentChange={undefined}
        portfolioTotalBalanceUSD={undefined}
      />,
    )

    expect(screen.queryByTestId(TestID.PortfolioBalanceHeader)).not.toBeInTheDocument()
    expect(screen.getAllByText(/\$0/)).toHaveLength(1)
  })
})
