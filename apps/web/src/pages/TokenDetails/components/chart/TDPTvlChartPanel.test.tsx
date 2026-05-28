import { GraphQLApi } from '@universe/api'
import { UTCTimestamp } from 'lightweight-charts'
import type { ReactNode } from 'react'
import { ChartType, DataQuality } from '~/components/Charts/utils'
import { useTDPTVLChartData } from '~/pages/TokenDetails/components/chart/hooks'
import { TDPTvlChartPanel } from '~/pages/TokenDetails/components/chart/TDPTvlChartPanel'
import { render, screen } from '~/test-utils/render'

vi.mock('~/components/Charts/LoadingState', () => ({
  ChartSkeleton: function MockChartSkeleton({ errorText }: { errorText?: ReactNode }) {
    return (
      <div data-testid="mock-chart-skeleton">
        {errorText ? <div data-cy="chart-error-view">{errorText}</div> : null}
      </div>
    )
  },
}))

vi.mock('~/pages/TokenDetails/components/chart/hooks', () => ({
  useTDPTVLChartData: vi.fn(),
}))

vi.mock('~/components/Charts/StackedLineChart', () => ({
  LineChart: function MockLineChart() {
    return <div data-testid="tvl-line-chart" />
  },
}))

const variables = {
  chain: GraphQLApi.Chain.Ethereum,
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  duration: GraphQLApi.HistoryDuration.Day,
  multichain: false,
}

const mockedUseTDPTVLChartData = vi.mocked(useTDPTVLChartData)

describe('TDPTvlChartPanel', () => {
  beforeEach(() => {
    mockedUseTDPTVLChartData.mockReturnValue({
      chartType: ChartType.TVL,
      entries: [{ time: 1 as UTCTimestamp, values: [1] }],
      loading: false,
      dataQuality: DataQuality.INVALID,
    })
  })

  it('shows chart error view when data is invalid and not loading', () => {
    render(<TDPTvlChartPanel variables={variables} />)
    expect(document.querySelector('[data-cy="chart-error-view"]')).toBeInTheDocument()
  })

  it('renders LineChart when data is valid', () => {
    mockedUseTDPTVLChartData.mockReturnValue({
      chartType: ChartType.TVL,
      entries: [
        { time: 1 as UTCTimestamp, values: [1] },
        { time: 2 as UTCTimestamp, values: [2] },
        { time: 3 as UTCTimestamp, values: [3] },
      ],
      loading: false,
      dataQuality: DataQuality.VALID,
    })

    render(<TDPTvlChartPanel variables={variables} />)
    expect(screen.getByTestId('tvl-line-chart')).toBeInTheDocument()
  })
})
