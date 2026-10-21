import { Auction } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { GraphQLApi } from '@universe/api'
import { UniverseChainId } from '@universe/chains'
import type { ReactNode } from 'react'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { ChartType, DataQuality, PriceChartType } from '~/components/Charts/utils'
import { TimePeriod } from '~/data/util'
import {
  AuctionDisplayPhase,
  AuctionDisplayResult,
  PoolAvailability,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { useTokenPriceChartPanel } from '~/hooks/useTokenPriceChartPanel'
import { ChartSection } from '~/pages/TokenDetails/components/chart/ChartSection'
import {
  type TokenDetailsAuctionDisplayModel,
  useTokenDetailsAuctionDisplay,
} from '~/pages/TokenDetails/hooks/useTokenDetailsAuctionDisplay'
import { render } from '~/test-utils/render'

vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: vi.fn() }))
vi.mock('~/hooks/useTokenPriceChartPanel', () => ({ useTokenPriceChartPanel: vi.fn() }))
vi.mock('~/pages/TokenDetails/hooks/useTokenDetailsAuctionDisplay', () => ({
  useTokenDetailsAuctionDisplay: vi.fn(),
}))
vi.mock('~/pages/TokenDetails/hooks/useTDPMultichainAggregate', () => ({
  useTDPMultichainAggregate: () => ({ isMultichainAggregateView: false }),
}))
vi.mock('~/pages/TokenDetails/components/chart/ChartControls', () => ({ ChartControls: () => null }))
vi.mock('~/pages/TokenDetails/components/chart/TDPVolumeChartPanel', () => ({ TDPVolumeChartPanel: () => null }))
vi.mock('~/components/Charts/LoadingState', () => ({ ChartSkeleton: () => null }))
vi.mock('~/components/Charts/PriceChart', () => ({ PriceChart: () => null }))

const mockChartState = {
  chartType: ChartType.PRICE,
  timePeriod: TimePeriod.DAY,
  priceChartType: PriceChartType.LINE,
  disableCandlestickUI: false,
  setDisableCandlestickUI: vi.fn(),
}
vi.mock('~/pages/TokenDetails/components/chart/TDPChartStateContext', () => ({
  TDPChartStateProvider: ({ children }: { children: ReactNode }) => children,
  useTDPChartStateContext: () => mockChartState,
}))

const mockStore = {
  currency: USDC_MAINNET,
  currencyChain: GraphQLApi.Chain.Ethereum,
  pathTokenDbAddress: USDC_MAINNET.address,
}
vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({
  useTDPStore: (selector: (state: typeof mockStore) => unknown) => selector(mockStore),
}))

function mockChart({ loading = false, empty = true } = {}): void {
  vi.mocked(useTokenPriceChartPanel).mockReturnValue({
    pricePercentChange: undefined,
    stale: false,
    showInvalidSkeleton: empty,
    isError: false,
    priceQuery: {
      chartType: ChartType.PRICE,
      entries: [],
      loading,
      dataQuality: empty ? DataQuality.INVALID : DataQuality.VALID,
      disableCandlestickUI: false,
    },
  })
}

function mockDisplay(overrides: Partial<TokenDetailsAuctionDisplayModel> = {}): void {
  vi.mocked(useTokenDetailsAuctionDisplay).mockReturnValue({
    auction: new Auction({ address: '0x1111111111111111111111111111111111111111' }),
    chainId: UniverseChainId.Mainnet,
    launchMethod: LaunchProvenanceMethod.CustomAuction,
    provenance: undefined,
    phase: AuctionDisplayPhase.Live,
    result: AuctionDisplayResult.Unknown,
    poolAvailability: PoolAvailability.NoPool,
    shouldShowSwap: false,
    isInitialLoading: false,
    isAuctionOnlyPending: false,
    hasConfirmedPool: false,
    phaseEndsAtMs: undefined,
    currencyRaised: { status: 'idle' },
    currentBlock: { status: 'success', blockNumber: 150n },
    refetchCurrentBlock: vi.fn(),
    ...overrides,
  })
}

describe('ChartSection price-discovery impressions', () => {
  beforeEach(() => {
    vi.mocked(sendAnalyticsEvent).mockClear()
    mockChartState.chartType = ChartType.PRICE
    mockChartState.timePeriod = TimePeriod.DAY
    mockStore.pathTokenDbAddress = USDC_MAINNET.address
    mockDisplay()
    mockChart()
  })

  it('reports once after loading, across uncached time ranges and chart-tab remounts', () => {
    mockChart({ loading: true })
    const { rerender } = render(<ChartSection />)
    expect(sendAnalyticsEvent).not.toHaveBeenCalled()

    mockChart()
    rerender(<ChartSection />)
    expect(sendAnalyticsEvent).toHaveBeenCalledTimes(1)

    mockChartState.timePeriod = TimePeriod.WEEK
    mockChart({ loading: true })
    rerender(<ChartSection />)
    mockChart()
    rerender(<ChartSection />)
    mockChartState.chartType = ChartType.VOLUME
    rerender(<ChartSection />)
    mockChartState.chartType = ChartType.PRICE
    rerender(<ChartSection />)

    expect(sendAnalyticsEvent).toHaveBeenCalledExactlyOnceWith(AuctionEventName.ChartEmptyStateViewed, {
      surface: 'tdp',
      chain_id: UniverseChainId.Mainnet,
      auction_type: 'custom',
      launch_method: 'custom',
      entry_point: 'chart_empty_state',
      auction_phase: 'live',
      pool_availability: 'no_pool',
      page_layout: 'auction_only',
    })
  })

  it('reports an upcoming auction with its own phase', () => {
    mockDisplay({ phase: AuctionDisplayPhase.Upcoming, currentBlock: { status: 'success', blockNumber: 50n } })
    render(<ChartSection />)

    expect(sendAnalyticsEvent).toHaveBeenCalledExactlyOnceWith(
      AuctionEventName.ChartEmptyStateViewed,
      expect.objectContaining({ auction_phase: 'upcoming', page_layout: 'auction_only' }),
    )
  })

  it('starts a new impression for another token or auction, including a return visit', () => {
    const { rerender } = render(<ChartSection />)
    mockDisplay({
      auction: new Auction({ address: '0x2222222222222222222222222222222222222222' }),
    })
    rerender(<ChartSection />)
    expect(sendAnalyticsEvent).toHaveBeenCalledTimes(2)

    mockStore.pathTokenDbAddress = '0x3333333333333333333333333333333333333333'
    rerender(<ChartSection />)
    mockStore.pathTokenDbAddress = USDC_MAINNET.address
    rerender(<ChartSection />)
    expect(sendAnalyticsEvent).toHaveBeenCalledTimes(4)
  })

  it('shows the price panel during price discovery even when another type is selected', () => {
    // The type toggle is hidden here, so a selection made before the auction resolved would have no
    // way back to the placeholder.
    mockChartState.chartType = ChartType.VOLUME
    const { getByTestId } = render(<ChartSection />)

    expect(getByTestId(`tdp-${ChartType.PRICE}-chart-container`)).toBeInTheDocument()
    expect(sendAnalyticsEvent).toHaveBeenCalledOnce()
  })

  it('keeps the selected type once the token is trading', () => {
    mockDisplay({ poolAvailability: PoolAvailability.HasPool })
    mockChartState.chartType = ChartType.VOLUME
    const { getByTestId } = render(<ChartSection />)

    expect(getByTestId(`tdp-${ChartType.VOLUME}-chart-container`)).toBeInTheDocument()
  })

  it('does not report ordinary charts or the flag-disabled display', () => {
    mockChart({ empty: false })
    const { rerender } = render(<ChartSection />)
    mockDisplay({ auction: undefined, launchMethod: undefined, chainId: undefined })
    mockChart()
    rerender(<ChartSection />)

    expect(sendAnalyticsEvent).not.toHaveBeenCalled()
  })
})
