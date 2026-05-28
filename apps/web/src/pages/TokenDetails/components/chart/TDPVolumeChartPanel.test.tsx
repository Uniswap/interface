import { GraphQLApi } from '@universe/api'
import { UTCTimestamp } from 'lightweight-charts'
import type { ReactNode } from 'react'
import { TimePeriod } from '~/appGraphql/data/util'
import { ChartType, DataQuality } from '~/components/Charts/utils'
import { useTDPVolumeChartData } from '~/pages/TokenDetails/components/chart/hooks'
import { TDPVolumeChartPanel } from '~/pages/TokenDetails/components/chart/TDPVolumeChartPanel'
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
  duration: GraphQLApi.HistoryDuration.Day,
  multichain: false,
}

const mockedUseTDPVolumeChartData = vi.mocked(useTDPVolumeChartData)

describe('TDPVolumeChartPanel', () => {
  beforeEach(() => {
    mockedUseTDPVolumeChartData.mockReturnValue({
      chartType: ChartType.VOLUME,
      entries: [{ time: 1 as UTCTimestamp, value: 1 }],
      loading: false,
      dataQuality: DataQuality.INVALID,
    })
  })

  it('shows chart error view when data is invalid and not loading', () => {
    render(<TDPVolumeChartPanel variables={variables} tokenColor="#fff" timePeriod={TimePeriod.DAY} />)
    expect(document.querySelector('[data-cy="chart-error-view"]')).toBeInTheDocument()
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
