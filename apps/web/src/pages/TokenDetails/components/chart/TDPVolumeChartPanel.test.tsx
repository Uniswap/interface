import { GraphQLApi } from '@universe/api'
import { UTCTimestamp } from 'lightweight-charts'
import type { ReactNode } from 'react'
import { HistoryDuration } from 'uniswap/src/features/dataApi/types'
import { ChartType, DataQuality } from '~/components/Charts/utils'
import { TimePeriod } from '~/data/util'
import { useTDPVolumeChartData } from '~/pages/TokenDetails/components/chart/hooks/useTDPVolumeChartData'
import { TDPVolumeChartPanel } from '~/pages/TokenDetails/components/chart/TDPVolumeChartPanel'
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

vi.mock('~/pages/TokenDetails/components/chart/hooks/useTDPVolumeChartData', () => ({
  useTDPVolumeChartData: vi.fn(),
}))

vi.mock('~/components/Charts/VolumeChart', () => ({
  VolumeChart: function MockVolumeChart() {
    return <div data-testid="volume-chart" />
  },
}))

const variables = {
  chain: GraphQLApi.Chain.Ethereum,
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  duration: HistoryDuration.Day,
  multichain: false,
}

const mockedUseTDPVolumeChartData = vi.mocked(useTDPVolumeChartData)

function mockInvalid({ isError, loading = false }: { isError: boolean; loading?: boolean }) {
  mockedUseTDPVolumeChartData.mockReturnValue({
    chartType: ChartType.VOLUME,
    entries: [{ time: 1 as UTCTimestamp, value: 1 }],
    loading,
    dataQuality: DataQuality.INVALID,
    isError,
  })
}

function renderPanel() {
  render(<TDPVolumeChartPanel variables={variables} tokenColor="#fff" timePeriod={TimePeriod.DAY} />)
}

describe('TDPVolumeChartPanel', () => {
  beforeEach(() => {
    mockInvalid({ isError: false })
  })

  it('shows the no-data copy when the query succeeded but there is not enough data', () => {
    renderPanel()

    expect(document.querySelector('[data-cy="chart-error-view"]')).toBeInTheDocument()
    expect(screen.getByTestId('chart-error-title')).toHaveTextContent('No volume data available')
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

  it('renders VolumeChart when data is valid', () => {
    mockedUseTDPVolumeChartData.mockReturnValue({
      chartType: ChartType.VOLUME,
      entries: [
        { time: 1 as UTCTimestamp, value: 1 },
        { time: 2 as UTCTimestamp, value: 2 },
        { time: 3 as UTCTimestamp, value: 3 },
      ],
      loading: false,
      dataQuality: DataQuality.VALID,
    })

    render(<TDPVolumeChartPanel variables={variables} tokenColor="#fff" timePeriod={TimePeriod.WEEK} />)
    expect(screen.getByTestId('volume-chart')).toBeInTheDocument()
  })
})
