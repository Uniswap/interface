import { GraphQLApi } from '@universe/api'
import type { ReactNode } from 'react'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { ChartType, DataQuality, PriceChartType } from '~/components/Charts/utils'
import { TimePeriod } from '~/data/util'
import { AuctionDisplayPhase } from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { useTokenPriceChartPanel } from '~/hooks/useTokenPriceChartPanel'
import { TDPPriceChartPanel } from '~/pages/TokenDetails/components/chart/TDPPriceChartPanel'
import { render, screen } from '~/test-utils/render'

vi.mock('~/components/Charts/LoadingState', () => ({
  ChartSkeleton: function MockChartSkeleton({
    errorTitle,
    errorText,
  }: {
    errorTitle?: ReactNode
    errorText?: ReactNode
  }) {
    return (
      <div data-testid="mock-chart-skeleton">
        {errorText ? (
          <div data-cy="chart-error-view">
            <div data-testid="chart-error-title">{errorTitle}</div>
            <div data-testid="chart-error-text">{errorText}</div>
          </div>
        ) : null}
      </div>
    )
  },
}))

vi.mock('~/hooks/useTokenPriceChartPanel', () => ({
  useTokenPriceChartPanel: vi.fn(),
}))

vi.mock('~/components/Charts/PriceChart', () => ({
  PriceChart: function MockPriceChart() {
    return <div data-testid="tdp-price-chart" />
  },
}))

const variables = {
  chain: GraphQLApi.Chain.Ethereum,
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  duration: HistoryDuration.Day,
  multichain: false,
}

const mockedUseTokenPriceChartPanel = vi.mocked(useTokenPriceChartPanel)

const basePanel = {
  pricePercentChange: undefined as number | undefined,
  stale: false,
}

function mockInvalid({ isError, loading = false }: { isError: boolean; loading?: boolean }) {
  mockedUseTokenPriceChartPanel.mockReturnValue({
    ...basePanel,
    showInvalidSkeleton: true,
    isError,
    priceQuery: {
      chartType: ChartType.PRICE,
      entries: [],
      loading,
      dataQuality: DataQuality.INVALID,
      isError,
      disableCandlestickUI: false,
    },
  })
}

function renderPanel() {
  render(
    <TDPPriceChartPanel
      variables={variables}
      priceChartType={PriceChartType.LINE}
      displayPriceChartType={PriceChartType.LINE}
      setDisableCandlestickUI={vi.fn()}
      timePeriod={TimePeriod.DAY}
      currency={USDC_MAINNET}
    />,
  )
}

describe('TDPPriceChartPanel', () => {
  beforeEach(() => {
    mockedUseTokenPriceChartPanel.mockReturnValue({
      ...basePanel,
      showInvalidSkeleton: false,
      isError: false,
      priceQuery: {
        chartType: ChartType.PRICE,
        entries: [],
        loading: false,
        dataQuality: DataQuality.VALID,
        disableCandlestickUI: false,
      },
    })
  })

  it('renders PriceChart when data is valid', () => {
    render(
      <TDPPriceChartPanel
        variables={variables}
        priceChartType={PriceChartType.LINE}
        displayPriceChartType={PriceChartType.LINE}
        setDisableCandlestickUI={vi.fn()}
        timePeriod={TimePeriod.DAY}
        currency={USDC_MAINNET}
      />,
    )
    expect(screen.getByTestId('tdp-price-chart')).toBeInTheDocument()
    expect(mockedUseTokenPriceChartPanel).toHaveBeenCalledWith(expect.objectContaining({ keepPreviousData: false }))
  })

  it('shows the no-data copy when the query succeeded but there is not enough data', () => {
    mockInvalid({ isError: false })

    renderPanel()

    expect(document.querySelector('[data-cy="chart-error-view"]')).toBeInTheDocument()
    expect(screen.getByTestId('chart-error-title')).toHaveTextContent('No pricing data available')
    expect(screen.getByTestId('chart-error-text')).toHaveTextContent(
      'There isn’t enough historical data for this token to show a chart.',
    )
  })

  it('keeps the error copy when the query failed', () => {
    mockInvalid({ isError: true })

    renderPanel()

    expect(screen.getByTestId('chart-error-title')).toHaveTextContent('Missing chart data')
    expect(screen.getByTestId('chart-error-text')).toHaveTextContent(
      'Unable to display historical data for the current token.',
    )
  })

  it('renders a bare skeleton while loading', () => {
    mockInvalid({ isError: false, loading: true })

    renderPanel()

    expect(screen.getByTestId('mock-chart-skeleton')).toBeInTheDocument()
    expect(document.querySelector('[data-cy="chart-error-view"]')).not.toBeInTheDocument()
  })

  it.each([
    [AuctionDisplayPhase.Live, true],
    [AuctionDisplayPhase.Ended, false],
    [AuctionDisplayPhase.Upcoming, false],
    [AuctionDisplayPhase.Unknown, false],
  ])('shows price discovery only during a live auction: phase=%s', (phase, showsPriceDiscovery) => {
    mockInvalid({ isError: false })

    render(
      <TDPPriceChartPanel
        variables={variables}
        priceChartType={PriceChartType.LINE}
        displayPriceChartType={PriceChartType.LINE}
        setDisableCandlestickUI={vi.fn()}
        timePeriod={TimePeriod.DAY}
        currency={USDC_MAINNET}
        auctionOnlyPhase={phase}
      />,
    )
    if (showsPriceDiscovery) {
      expect(screen.getByText('Price discovery in progress')).toBeInTheDocument()
      expect(screen.getByText('Check back once USDC’s auction ends')).toBeInTheDocument()
    } else {
      expect(screen.queryByText('Price discovery in progress')).toBeNull()
      expect(screen.queryByText('Check back once USDC’s auction ends')).toBeNull()
      expect(document.querySelector('[data-cy="chart-error-view"]')).toBeInTheDocument()
    }
  })
})
