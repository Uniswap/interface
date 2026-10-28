import { GraphQLApi } from '@universe/api'
import { TestID } from '@universe/test'
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
    hideErrorIcon,
  }: {
    errorTitle?: ReactNode
    errorText?: ReactNode
    hideErrorIcon?: boolean
  }) {
    return (
      <div data-testid="mock-chart-skeleton">
        {errorText ? (
          <div data-cy="chart-error-view" data-hide-error-icon={String(Boolean(hideErrorIcon))}>
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

type HeaderContent = ReactNode | (({ isHovering }: { isHovering: boolean }) => ReactNode)
const priceChartHeader = vi.hoisted(() => ({ isHovering: false }))

vi.mock('~/components/Charts/PriceChart', () => ({
  PriceChart: function MockPriceChart({
    additionalHeaderContent,
    blocksChartHover,
  }: {
    additionalHeaderContent?: HeaderContent
    blocksChartHover?: boolean
  }) {
    return (
      <div data-testid="tdp-price-chart" data-blocks-chart-hover={String(Boolean(blocksChartHover))}>
        {typeof additionalHeaderContent === 'function'
          ? additionalHeaderContent({ isHovering: priceChartHeader.isHovering })
          : additionalHeaderContent}
      </div>
    )
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
  priceConfidenceScore: undefined as number | undefined,
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

function renderPanel({
  auctionOnlyPhase,
  isAuctionOnlyPending,
  onPriceDiscoveryViewed,
}: {
  auctionOnlyPhase?: AuctionDisplayPhase
  isAuctionOnlyPending?: boolean
  onPriceDiscoveryViewed?: () => void
} = {}) {
  render(
    <TDPPriceChartPanel
      variables={variables}
      priceChartType={PriceChartType.LINE}
      displayPriceChartType={PriceChartType.LINE}
      setDisableCandlestickUI={vi.fn()}
      timePeriod={TimePeriod.DAY}
      currency={USDC_MAINNET}
      auctionOnlyPhase={auctionOnlyPhase}
      isAuctionOnlyPending={isAuctionOnlyPending}
      onPriceDiscoveryViewed={onPriceDiscoveryViewed}
    />,
  )
}

function mockValid({ priceConfidenceScore }: { priceConfidenceScore?: number } = {}) {
  mockedUseTokenPriceChartPanel.mockReturnValue({
    ...basePanel,
    priceConfidenceScore,
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
}

describe('TDPPriceChartPanel', () => {
  beforeEach(() => {
    priceChartHeader.isHovering = false
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

  it('shows the low confidence tag when the displayed price has a low confidence score', () => {
    mockValid({ priceConfidenceScore: 0.001 })

    renderPanel()

    expect(screen.getByTestId(TestID.LowPriceConfidenceTag)).toHaveTextContent('Low confidence')
    expect(screen.getByTestId(TestID.LowPriceConfidenceTag).closest('.hidden')).toBeNull()
    // So the tag's tooltip can be reached across the resting header.
    expect(screen.getByTestId('tdp-price-chart')).toHaveAttribute('data-blocks-chart-hover', 'true')
  })

  it('hides the low confidence tag while scrubbing the chart, keeping its tooltip trigger mounted', () => {
    mockValid({ priceConfidenceScore: 0.001 })
    priceChartHeader.isHovering = true

    renderPanel()

    // jsdom has no Tailwind stylesheet to compute `display: none` from, so check for its class.
    expect(screen.getByTestId(TestID.LowPriceConfidenceTag).closest('.hidden')).toBeInTheDocument()
  })

  it.each([
    ['confident', 0.9],
    ['unscored', undefined],
  ])('does not show the low confidence tag when the price is %s', (_, priceConfidenceScore) => {
    mockValid({ priceConfidenceScore })

    renderPanel()

    expect(screen.queryByTestId(TestID.LowPriceConfidenceTag)).not.toBeInTheDocument()
    expect(screen.getByTestId('tdp-price-chart')).toHaveAttribute('data-blocks-chart-hover', 'false')
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
    [AuctionDisplayPhase.Live, 'Price discovery in progress'],
    [AuctionDisplayPhase.Upcoming, 'Waiting for price discovery'],
  ])('explains the empty chart for an auction-only token: phase=%s', (phase, title) => {
    mockInvalid({ isError: false })

    renderPanel({ auctionOnlyPhase: phase })

    expect(screen.getByText(title)).toBeInTheDocument()
    expect(screen.getByText('Check back once USDC’s auction ends')).toBeInTheDocument()
    expect(document.querySelector('[data-cy="chart-error-view"]')).toHaveAttribute('data-hide-error-icon', 'true')
  })

  it('holds the bare skeleton while the auction-only question is still open', () => {
    mockInvalid({ isError: false })

    renderPanel({ isAuctionOnlyPending: true })

    expect(screen.getByTestId('mock-chart-skeleton')).toBeInTheDocument()
    expect(document.querySelector('[data-cy="chart-error-view"]')).not.toBeInTheDocument()
  })

  it('reports a failed query while the auction-only question is still open', () => {
    mockInvalid({ isError: true })

    renderPanel({ isAuctionOnlyPending: true })

    expect(screen.getByTestId('chart-error-title')).toHaveTextContent('Missing chart data')
  })

  it('names the chart empty once the auction lookup rules out an auction', () => {
    mockInvalid({ isError: false })

    renderPanel({ isAuctionOnlyPending: false })

    expect(screen.getByTestId('chart-error-title')).toHaveTextContent('No pricing data available')
  })

  it('keeps the error framing when the price query fails during a live auction', () => {
    mockInvalid({ isError: true })
    const onPriceDiscoveryViewed = vi.fn()

    renderPanel({ auctionOnlyPhase: AuctionDisplayPhase.Live, onPriceDiscoveryViewed })

    expect(screen.getByTestId('chart-error-title')).toHaveTextContent('Missing chart data')
    expect(screen.getByTestId('chart-error-text')).toHaveTextContent(
      'Unable to display historical data for the current token.',
    )
    expect(screen.queryByText('Price discovery in progress')).toBeNull()
    expect(onPriceDiscoveryViewed).not.toHaveBeenCalled()
  })

  it.each([AuctionDisplayPhase.Ended, AuctionDisplayPhase.Unknown])(
    'keeps the generic no-data copy outside price discovery: phase=%s',
    (phase) => {
      mockInvalid({ isError: false })

      renderPanel({ auctionOnlyPhase: phase })

      expect(screen.queryByText('Price discovery in progress')).toBeNull()
      expect(screen.queryByText('Waiting for price discovery')).toBeNull()
      expect(screen.queryByText('Check back once USDC’s auction ends')).toBeNull()
      expect(screen.getByTestId('chart-error-title')).toHaveTextContent('No pricing data available')
      expect(document.querySelector('[data-cy="chart-error-view"]')).toHaveAttribute('data-hide-error-icon', 'false')
    },
  )

  it.each([AuctionDisplayPhase.Live, AuctionDisplayPhase.Upcoming])(
    'renders the real chart when an auction-only token already has price history: phase=%s',
    (phase) => {
      renderPanel({ auctionOnlyPhase: phase })

      expect(screen.getByTestId('tdp-price-chart')).toBeInTheDocument()
      expect(screen.queryByText('Check back once USDC’s auction ends')).toBeNull()
    },
  )
})
