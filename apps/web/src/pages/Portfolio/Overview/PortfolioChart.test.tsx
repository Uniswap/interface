import { ChartPeriod } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { UTCTimestamp } from 'lightweight-charts'
import type { PortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/buildPortfolioBalance'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import type { ChartHoverCoordinates } from '~/components/Charts/ChartModel'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import { PortfolioChartCategory } from '~/pages/Portfolio/Overview/hooks/usePortfolioChartSeries'
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
    children?: (crosshairData?: PriceChartData, hover?: ChartHoverCoordinates | null) => JSX.Element | null
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
        {children?.(crosshairData, crosshairData ? { x: 100, y: 50, plotRightEdge: 300 } : null)}
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
  tokensSeries: makeSeries([60, 65]),
  poolsSeries: makeSeries([40, 45]),
  earnSeries: [],
  chartPercentChange: { percentChange: 10, absoluteChangeUSD: 10 },
  tokensPercentChange: 8.33,
  poolsPercentChange: 12.5,
  earnPercentChange: undefined,
  isLoading: false,
  isChartEmpty: false,
  error: null,
  selectedPeriod: ChartPeriod.DAY,
  setSelectedPeriod: vi.fn(),
  portfolioTotalBalanceUSD: 110,
  isTotalValueMatch: true,
  selectedCategory: PortfolioChartCategory.Total,
  setSelectedCategory: vi.fn(),
  availableCategories: [PortfolioChartCategory.Tokens, PortfolioChartCategory.Pools],
  hasCategoryBreakdown: false,
}

const tokensWithBalance: PortfolioTotalValue = { balanceUSD: 8368.94, percentChange: -6.09, absoluteChangeUSD: -510 }
const poolsWithBalance: PortfolioTotalValue = { balanceUSD: 7373.05, percentChange: 1.02, absoluteChangeUSD: 75 }
const earnWithBalance: PortfolioTotalValue = { balanceUSD: 512.34, percentChange: 2.34, absoluteChangeUSD: 12 }

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

  it('passes balance breakdown values to the external balance header', () => {
    render(
      <PortfolioChart
        {...defaultProps}
        showBalanceHeaderRow
        tokensValue={tokensWithBalance}
        poolsValue={poolsWithBalance}
        earnValue={earnWithBalance}
      />,
    )

    expect(screen.getByTestId(TestID.BalanceBreakdownPopover)).toBeInTheDocument()
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

  it('shows the category selector when both tokens and pools have data', () => {
    render(<PortfolioChart {...defaultProps} showBalanceHeaderRow hasCategoryBreakdown />)

    expect(screen.getByTestId(TestID.PortfolioChartCategorySelector)).toBeInTheDocument()
  })

  it('hides the category selector when the breakdown is incomplete', () => {
    render(<PortfolioChart {...defaultProps} showBalanceHeaderRow hasCategoryBreakdown={false} />)

    expect(screen.queryByTestId(TestID.PortfolioChartCategorySelector)).not.toBeInTheDocument()
  })

  it('shows the tokens-first scrub breakdown while scrubbing the Total chart', () => {
    mockPriceChartBodyCrosshairData.data = {
      time: 1700003600 as UTCTimestamp,
      value: 150,
      open: 150,
      high: 150,
      low: 150,
      close: 150,
    }

    render(
      <PortfolioChart
        {...defaultProps}
        showBalanceHeaderRow
        hasCategoryBreakdown
        selectedCategory={PortfolioChartCategory.Total}
        tokensSeries={makeSeries([100, 90])}
        poolsSeries={makeSeries([50, 60])}
      />,
    )

    const tokensRow = screen.getByTestId(TestID.BalanceBreakdownRowTokens)
    const poolsRow = screen.getByTestId(TestID.BalanceBreakdownRowPools)
    expect(tokensRow).toBeInTheDocument()
    expect(poolsRow).toBeInTheDocument()
    // Tokens always listed first.
    expect(tokensRow.compareDocumentPosition(poolsRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    // Values are read at the scrubbed point.
    expect(screen.getByText(/\$90/)).toBeInTheDocument()
    expect(screen.getByText(/\$60/)).toBeInTheDocument()
  })

  it('inserts the earn scrub row between tokens and pools when earn has data', () => {
    mockPriceChartBodyCrosshairData.data = {
      time: 1700003600 as UTCTimestamp,
      value: 150,
      open: 150,
      high: 150,
      low: 150,
      close: 150,
    }

    render(
      <PortfolioChart
        {...defaultProps}
        showBalanceHeaderRow
        hasCategoryBreakdown
        selectedCategory={PortfolioChartCategory.Total}
        tokensSeries={makeSeries([100, 90])}
        earnSeries={makeSeries([30, 35])}
        poolsSeries={makeSeries([50, 60])}
      />,
    )

    const tokensRow = screen.getByTestId(TestID.BalanceBreakdownRowTokens)
    const earnRow = screen.getByTestId(TestID.BalanceBreakdownRowEarn)
    const poolsRow = screen.getByTestId(TestID.BalanceBreakdownRowPools)
    expect(tokensRow.compareDocumentPosition(earnRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(earnRow.compareDocumentPosition(poolsRow) & Node.DOCUMENT_POSITION_FOLLOWING).toBeTruthy()
    expect(screen.getByText(/\$35/)).toBeInTheDocument()
  })

  it('lists the Earning option in the category selector when earn is available', () => {
    render(
      <PortfolioChart
        {...defaultProps}
        showBalanceHeaderRow
        hasCategoryBreakdown
        availableCategories={[PortfolioChartCategory.Tokens, PortfolioChartCategory.Earn, PortfolioChartCategory.Pools]}
      />,
    )

    expect(screen.getByTestId(TestID.PortfolioChartCategorySelector)).toBeInTheDocument()
  })

  it('does not show the scrub breakdown when a single category is selected', () => {
    mockPriceChartBodyCrosshairData.data = {
      time: 1700003600 as UTCTimestamp,
      value: 90,
      open: 90,
      high: 90,
      low: 90,
      close: 90,
    }

    render(
      <PortfolioChart
        {...defaultProps}
        showBalanceHeaderRow
        hasCategoryBreakdown
        selectedCategory={PortfolioChartCategory.Tokens}
        tokensSeries={makeSeries([100, 90])}
        poolsSeries={makeSeries([50, 60])}
      />,
    )

    expect(screen.queryByTestId(TestID.BalanceBreakdownRowTokens)).not.toBeInTheDocument()
  })

  it('does not show the scrub breakdown at rest (no crosshair)', () => {
    render(
      <PortfolioChart
        {...defaultProps}
        showBalanceHeaderRow
        hasCategoryBreakdown
        selectedCategory={PortfolioChartCategory.Total}
        tokensSeries={makeSeries([100, 90])}
        poolsSeries={makeSeries([50, 60])}
      />,
    )

    expect(screen.queryByTestId(TestID.BalanceBreakdownRowTokens)).not.toBeInTheDocument()
  })
})
