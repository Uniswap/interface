import { GraphQLApi } from '@universe/api'
import type { ReactNode } from 'react'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { TimePeriod } from '~/appGraphql/data/util'
import { ChartType, DataQuality, PriceChartType } from '~/components/Charts/utils'
import { useTokenPriceChartPanel } from '~/hooks/useTokenPriceChartPanel'
import { TDPPriceChartPanel } from '~/pages/TokenDetails/components/chart/TDPPriceChartPanel'
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

vi.mock('~/hooks/useTokenPriceChartPanel', () => ({
  useTokenPriceChartPanel: vi.fn(),
}))

vi.mock('~/pages/TokenDetails/hooks/useTDPPreferProjectMarketData', () => ({
  useTDPPreferProjectMarketData: vi.fn(() => false),
}))

vi.mock('~/components/Charts/PriceChart', () => ({
  PriceChart: function MockPriceChart() {
    return <div data-testid="tdp-price-chart" />
  },
}))

const variables = {
  chain: GraphQLApi.Chain.Ethereum,
  address: '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48',
  duration: GraphQLApi.HistoryDuration.Day,
  multichain: false,
}

const mockedUseTokenPriceChartPanel = vi.mocked(useTokenPriceChartPanel)

const basePanel = {
  pricePercentChange: undefined as number | undefined,
  stale: false,
}

describe('TDPPriceChartPanel', () => {
  beforeEach(() => {
    mockedUseTokenPriceChartPanel.mockReturnValue({
      ...basePanel,
      showInvalidSkeleton: false,
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
  })

  it('renders skeleton path when showInvalidSkeleton is true', () => {
    mockedUseTokenPriceChartPanel.mockReturnValue({
      ...basePanel,
      showInvalidSkeleton: true,
      priceQuery: {
        chartType: ChartType.PRICE,
        entries: [],
        loading: false,
        dataQuality: DataQuality.INVALID,
        disableCandlestickUI: false,
      },
    })

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
    expect(document.querySelector('[data-cy="chart-error-view"]')).toBeInTheDocument()
  })
})
