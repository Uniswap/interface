import { ProtocolVersion } from '@uniswap/client-data-api/dist/data/v1/poolTypes_pb'
import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { Chart } from '~/components/Charts/ChartModel'
import { DataQuality } from '~/components/Charts/utils'
import { WrappedLiquidityPositionRangeChart } from '~/features/Liquidity/charts/LiquidityPositionRangeChart/LiquidityPositionRangeChart'
import { useDensityChartData } from '~/features/Liquidity/charts/LiquidityRangeInput/hooks'
import { useLiquidityServicePoolPriceChartData } from '~/features/Liquidity/charts/useLiquidityServicePoolPriceChartData'
import { render, screen } from '~/test-utils/render'

vi.mock('use-resize-observer', () => ({ default: () => ({ ref: vi.fn(), width: 400 }) }))
vi.mock('~/components/Charts/ChartModel', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/components/Charts/ChartModel')>()),
  Chart: vi.fn(() => null),
}))
vi.mock('~/features/Liquidity/charts/useLiquidityServicePoolPriceChartData', () => ({
  useLiquidityServicePoolPriceChartData: vi.fn(),
}))
vi.mock('~/features/Liquidity/charts/LiquidityRangeInput/hooks', () => ({
  useDensityChartData: vi.fn(),
}))

const mockedChart = vi.mocked(Chart)
const mockedPriceData = vi.mocked(useLiquidityServicePoolPriceChartData)
const mockedDensityData = vi.mocked(useDensityChartData)

const TOKEN_A = new Token(UniverseChainId.Mainnet, '0x0000000000000000000000000000000000000001', 18, 'AAA')
const TOKEN_B = new Token(UniverseChainId.Mainnet, '0x0000000000000000000000000000000000000002', 18, 'BBB')

const PRICE_ENTRY = { time: 1_700_000_000, value: 1, open: 1, high: 1, low: 1, close: 1 }

function mockPriceData({ entries, loading }: { entries: (typeof PRICE_ENTRY)[]; loading: boolean }): void {
  mockedPriceData.mockReturnValue({
    entries,
    loading,
    dataQuality: entries.length ? DataQuality.VALID : DataQuality.INVALID,
  } as unknown as ReturnType<typeof useLiquidityServicePoolPriceChartData>)
}

function renderChart(): void {
  render(
    <WrappedLiquidityPositionRangeChart
      version={ProtocolVersion.V4}
      priceInverted={false}
      poolAddressOrId="0xpool"
      chainId={UniverseChainId.Mainnet}
      quoteCurrency={TOKEN_B}
      baseCurrency={TOKEN_A}
      sdkCurrencies={{ TOKEN0: TOKEN_A, TOKEN1: TOKEN_B }}
      priceOrdering={{}}
      height={440}
    />,
  )
}

describe('LiquidityPositionRangeChart', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mockedDensityData.mockReturnValue({ formattedData: undefined, isLoading: false } as unknown as ReturnType<
      typeof useDensityChartData
    >)
  })

  it('shows the chart-unavailable state when the pool has no price history', () => {
    mockPriceData({ entries: [], loading: false })
    renderChart()

    expect(screen.getByText('Chart unavailable')).toBeInTheDocument()
    expect(mockedChart).not.toHaveBeenCalled()
  })

  it('renders the price chart and no unavailable state when price history exists', () => {
    mockPriceData({ entries: [PRICE_ENTRY], loading: false })
    renderChart()

    expect(mockedChart).toHaveBeenCalled()
    expect(screen.queryByText('Chart unavailable')).toBeNull()
  })

  it('does not show the unavailable state while price history is still loading', () => {
    mockPriceData({ entries: [], loading: true })
    renderChart()

    expect(screen.queryByText('Chart unavailable')).toBeNull()
  })
})
