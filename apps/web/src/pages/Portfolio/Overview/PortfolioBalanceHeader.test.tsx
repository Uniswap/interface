import { ChartPeriod } from '@uniswap/client-data-api/dist/data/v1/api_pb'
import { UTCTimestamp } from 'lightweight-charts'
import type { PortfolioTotalValue } from 'uniswap/src/features/dataApi/balances/buildPortfolioBalance'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import type { PriceChartData } from '~/components/Charts/PriceChart'
import { PortfolioChartCategory } from '~/pages/Portfolio/Overview/hooks/usePortfolioChartSeries'
import { PortfolioBalanceHeader } from '~/pages/Portfolio/Overview/PortfolioBalanceHeader'
import { render, screen } from '~/test-utils/render'

const tokensWithBalance: PortfolioTotalValue = { balanceUSD: 8368.94, percentChange: -6.09, absoluteChangeUSD: -510 }
const poolsWithBalance: PortfolioTotalValue = { balanceUSD: 7373.05, percentChange: 1.02, absoluteChangeUSD: 75 }

const mockPriceChartDelta = vi.hoisted(() => vi.fn())

vi.mock('~/components/Charts/PriceChart/PriceChartDelta', () => ({
  PriceChartDelta: ({
    endingPrice,
    hidePercent,
    isHovering,
    pricePercentChange,
    shouldTreatAsStablecoin,
  }: {
    endingPrice: number
    hidePercent?: boolean
    isHovering?: boolean
    pricePercentChange?: number
    shouldTreatAsStablecoin?: boolean
  }) => {
    mockPriceChartDelta({ endingPrice, hidePercent, isHovering, pricePercentChange, shouldTreatAsStablecoin })

    return <div data-testid="price-chart-delta">{pricePercentChange ?? 'no-change'}</div>
  },
}))

vi.mock('~/components/Charts/hooks/useHeaderDateFormatter', () => ({
  useHeaderDateFormatter: () => (time?: UTCTimestamp) => (time ? `formatted-${time}` : '-'),
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

describe('PortfolioBalanceHeader', () => {
  beforeEach(() => {
    mockPriceChartDelta.mockClear()
  })

  it('renders the formatted balance, delta, and period label in the normal case', () => {
    render(
      <PortfolioBalanceHeader
        portfolioTotalBalanceUSD={15741.99}
        series={makeSeries([100, 110])}
        chartPercentChange={{ percentChange: 10, absoluteChangeUSD: 10 }}
        tokensPercentChange={undefined}
        poolsPercentChange={undefined}
        selectedPeriod={ChartPeriod.DAY}
        selectedCategory={PortfolioChartCategory.Total}
        isPortfolioZero={false}
        isLoading={false}
      />,
    )

    expect(screen.getByTestId(TestID.PortfolioBalanceHeader)).toBeInTheDocument()
    expect(screen.getByText(/15,741\.99/)).toBeInTheDocument()
    expect(screen.getByTestId('price-chart-delta')).toBeInTheDocument()
    expect(screen.getByText(/today/i)).toBeInTheDocument()
  })

  it('falls back to the latest chart value while the total balance is unavailable', () => {
    render(
      <PortfolioBalanceHeader
        portfolioTotalBalanceUSD={undefined}
        series={makeSeries([100, 110])}
        chartPercentChange={{ percentChange: 10, absoluteChangeUSD: 10 }}
        tokensPercentChange={undefined}
        poolsPercentChange={undefined}
        selectedPeriod={ChartPeriod.DAY}
        selectedCategory={PortfolioChartCategory.Total}
        isPortfolioZero={false}
        isLoading={false}
      />,
    )

    expect(screen.getByText(/\$110/)).toBeInTheDocument()
  })

  it('renders the hovered chart value and delta while scrubbing', () => {
    render(
      <PortfolioBalanceHeader
        portfolioTotalBalanceUSD={110}
        series={makeSeries([100, 110])}
        chartPercentChange={{ percentChange: 10, absoluteChangeUSD: 10 }}
        tokensPercentChange={undefined}
        poolsPercentChange={undefined}
        selectedPeriod={ChartPeriod.DAY}
        selectedCategory={PortfolioChartCategory.Total}
        isPortfolioZero={false}
        isLoading={false}
        hoveredData={makeSeries([105])[0]}
      />,
    )

    expect(screen.getByText(/\$105/)).toBeInTheDocument()
    expect(screen.queryByText(/today/i)).not.toBeInTheDocument()
    expect(screen.getByText('formatted-1700000000')).toBeInTheDocument()
    expect(mockPriceChartDelta).toHaveBeenCalledWith(
      expect.objectContaining({
        endingPrice: 105,
        isHovering: true,
      }),
    )
  })

  it('omits the delta row when the portfolio is zero', () => {
    render(
      <PortfolioBalanceHeader
        portfolioTotalBalanceUSD={0}
        series={makeSeries([0, 0])}
        chartPercentChange={undefined}
        tokensPercentChange={undefined}
        poolsPercentChange={undefined}
        selectedPeriod={ChartPeriod.DAY}
        selectedCategory={PortfolioChartCategory.Total}
        isPortfolioZero={true}
        isLoading={false}
      />,
    )

    expect(screen.queryByTestId('price-chart-delta')).not.toBeInTheDocument()
  })

  it('omits the delta row while loading', () => {
    render(
      <PortfolioBalanceHeader
        portfolioTotalBalanceUSD={undefined}
        series={[]}
        chartPercentChange={undefined}
        tokensPercentChange={undefined}
        poolsPercentChange={undefined}
        selectedPeriod={ChartPeriod.DAY}
        selectedCategory={PortfolioChartCategory.Total}
        isPortfolioZero={false}
        isLoading={true}
      />,
    )

    expect(screen.queryByTestId('price-chart-delta')).not.toBeInTheDocument()
  })

  it('renders the delta row with percent hidden when the selected period is MAX', () => {
    render(
      <PortfolioBalanceHeader
        portfolioTotalBalanceUSD={15741.99}
        series={makeSeries([100, 110])}
        chartPercentChange={undefined}
        tokensPercentChange={undefined}
        poolsPercentChange={undefined}
        selectedPeriod={ChartPeriod.MAX}
        selectedCategory={PortfolioChartCategory.Total}
        isPortfolioZero={false}
        isLoading={false}
      />,
    )

    expect(screen.getByTestId('price-chart-delta')).toBeInTheDocument()
    expect(mockPriceChartDelta).toHaveBeenCalledWith(
      expect.objectContaining({
        hidePercent: true,
      }),
    )
  })

  it('passes stablecoin formatting for low-variance chart data', () => {
    render(
      <PortfolioBalanceHeader
        portfolioTotalBalanceUSD={1.01}
        series={makeSeries([1, 1.01])}
        chartPercentChange={{ percentChange: 1, absoluteChangeUSD: 0.01 }}
        tokensPercentChange={undefined}
        poolsPercentChange={undefined}
        selectedPeriod={ChartPeriod.DAY}
        selectedCategory={PortfolioChartCategory.Total}
        isPortfolioZero={false}
        isLoading={false}
      />,
    )

    expect(mockPriceChartDelta).toHaveBeenCalledWith(
      expect.objectContaining({
        shouldTreatAsStablecoin: true,
      }),
    )
  })

  it('omits the delta row when the series has fewer than two points', () => {
    render(
      <PortfolioBalanceHeader
        portfolioTotalBalanceUSD={100}
        series={makeSeries([100])}
        chartPercentChange={undefined}
        tokensPercentChange={undefined}
        poolsPercentChange={undefined}
        selectedPeriod={ChartPeriod.DAY}
        selectedCategory={PortfolioChartCategory.Total}
        isPortfolioZero={false}
        isLoading={false}
      />,
    )

    expect(screen.queryByTestId('price-chart-delta')).not.toBeInTheDocument()
  })

  it('renders $0 when portfolio is zero and balance is unavailable', () => {
    render(
      <PortfolioBalanceHeader
        portfolioTotalBalanceUSD={undefined}
        series={[]}
        chartPercentChange={undefined}
        tokensPercentChange={undefined}
        poolsPercentChange={undefined}
        selectedPeriod={ChartPeriod.DAY}
        selectedCategory={PortfolioChartCategory.Total}
        isPortfolioZero={true}
        isLoading={false}
      />,
    )

    expect(screen.getByText(/\$0/)).toBeInTheDocument()
  })

  it('renders a placeholder when balance and chart values are unavailable for a non-zero portfolio', () => {
    render(
      <PortfolioBalanceHeader
        portfolioTotalBalanceUSD={undefined}
        series={[]}
        chartPercentChange={undefined}
        tokensPercentChange={undefined}
        poolsPercentChange={undefined}
        selectedPeriod={ChartPeriod.DAY}
        selectedCategory={PortfolioChartCategory.Total}
        isPortfolioZero={false}
        isLoading={true}
      />,
    )

    expect(screen.getByText('$00.00')).toBeInTheDocument()
  })

  it('does not render the BalanceBreakdownPopover when only one side has a balance', () => {
    render(
      <PortfolioBalanceHeader
        portfolioTotalBalanceUSD={8368.94}
        tokensValue={tokensWithBalance}
        poolsValue={undefined}
        series={makeSeries([100, 110])}
        chartPercentChange={{ percentChange: 10, absoluteChangeUSD: 10 }}
        tokensPercentChange={undefined}
        poolsPercentChange={undefined}
        selectedPeriod={ChartPeriod.DAY}
        selectedCategory={PortfolioChartCategory.Total}
        isPortfolioZero={false}
        isLoading={false}
      />,
    )

    expect(screen.queryByTestId(TestID.BalanceBreakdownPopover)).not.toBeInTheDocument()
  })

  it('renders the BalanceBreakdownPopover trigger around the headline value when both tokens and pools are positive', () => {
    render(
      <PortfolioBalanceHeader
        portfolioTotalBalanceUSD={15741.99}
        tokensValue={tokensWithBalance}
        poolsValue={poolsWithBalance}
        series={makeSeries([100, 110])}
        chartPercentChange={{ percentChange: 10, absoluteChangeUSD: 10 }}
        tokensPercentChange={undefined}
        poolsPercentChange={undefined}
        selectedPeriod={ChartPeriod.DAY}
        selectedCategory={PortfolioChartCategory.Total}
        isPortfolioZero={false}
        isLoading={false}
      />,
    )

    expect(screen.getByTestId(TestID.BalanceBreakdownPopover)).toBeInTheDocument()
    expect(screen.getByText(/15,741\.99/)).toBeInTheDocument()
  })

  it('shows the tokens balance and hides the breakdown popover when the tokens category is selected', () => {
    render(
      <PortfolioBalanceHeader
        portfolioTotalBalanceUSD={15741.99}
        tokensValue={tokensWithBalance}
        poolsValue={poolsWithBalance}
        series={makeSeries([100, 110])}
        chartPercentChange={{ percentChange: 10, absoluteChangeUSD: 10 }}
        tokensPercentChange={undefined}
        poolsPercentChange={undefined}
        selectedPeriod={ChartPeriod.DAY}
        selectedCategory={PortfolioChartCategory.Tokens}
        isPortfolioZero={false}
        isLoading={false}
      />,
    )

    expect(screen.getByText(/8,368\.94/)).toBeInTheDocument()
    expect(screen.queryByText(/15,741\.99/)).not.toBeInTheDocument()
    expect(screen.queryByTestId(TestID.BalanceBreakdownPopover)).not.toBeInTheDocument()
  })

  it('shows the pools balance and hides the breakdown popover when the pools category is selected', () => {
    render(
      <PortfolioBalanceHeader
        portfolioTotalBalanceUSD={15741.99}
        tokensValue={tokensWithBalance}
        poolsValue={poolsWithBalance}
        series={makeSeries([100, 110])}
        chartPercentChange={{ percentChange: 10, absoluteChangeUSD: 10 }}
        tokensPercentChange={undefined}
        poolsPercentChange={undefined}
        selectedPeriod={ChartPeriod.DAY}
        selectedCategory={PortfolioChartCategory.Pools}
        isPortfolioZero={false}
        isLoading={false}
      />,
    )

    expect(screen.getByText(/7,373\.05/)).toBeInTheDocument()
    expect(screen.queryByText(/15,741\.99/)).not.toBeInTheDocument()
    expect(screen.queryByTestId(TestID.BalanceBreakdownPopover)).not.toBeInTheDocument()
  })
})
