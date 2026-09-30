import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { useTokenMarketStats, useTokenSpotPrice } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { StatsSection } from '~/pages/TokenDetails/components/info/StatsSection'
import type { TDPState } from '~/pages/TokenDetails/context/createTDPStore'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import { useTDPEffectiveCurrency } from '~/pages/TokenDetails/hooks/useTDPEffectiveCurrency'
import { useTDPMultichainAggregate } from '~/pages/TokenDetails/hooks/useTDPMultichainAggregate'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

vi.mock('~/pages/TokenDetails/hooks/useTDPEffectiveCurrency', () => ({
  useTDPEffectiveCurrency: vi.fn(),
}))

vi.mock('~/pages/TokenDetails/hooks/useTDPMultichainAggregate', () => ({
  useTDPMultichainAggregate: vi.fn(),
}))

vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({
  useTDPStore: vi.fn(),
}))

vi.mock('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData')>()),
  useTokenSpotPrice: vi.fn(),
  useTokenMarketStats: vi.fn(),
}))

const POPULATED_STATS = {
  marketCap: 5_000_000_000,
  fdv: 10_000_000_000,
  volume: 250_000_000,
  high52w: 12.34,
  low52w: 4.56,
  tvl: 1_000_000_000,
  isLoading: false,
}

const EMPTY_STATS = {
  marketCap: undefined,
  fdv: undefined,
  volume: undefined,
  high52w: undefined,
  low52w: undefined,
  tvl: undefined,
  isLoading: false,
}

function mockTDPState(state: Partial<TDPState>): void {
  mocked(useTDPStore).mockImplementation(((selector: (s: TDPState) => unknown) =>
    selector(state as TDPState)) as typeof useTDPStore)
}

describe('StatsSection', () => {
  beforeEach(() => {
    vi.clearAllMocks()
    mocked(useTDPEffectiveCurrency).mockReturnValue(USDC_MAINNET)
    mocked(useTokenSpotPrice).mockReturnValue(undefined)
    mocked(useTDPMultichainAggregate).mockReturnValue({ isMultichainAggregateView: true })
    mockTDPState({ selectedMultichainChainId: undefined })
  })

  it('renders the stats wrapper and all stat tiles when market data is populated', () => {
    // StatsSection.tsx renders `<tr>` directly under `<table>` (no `<tbody>`),
    // which trips React's DOM-nesting validator. Pre-existing in the component;
    // suppress so this test asserts the meaningful behavior (stat tiles + $ formatting).
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocked(useTokenMarketStats).mockReturnValue(POPULATED_STATS)

    render(<StatsSection />)

    expect(screen.getByTestId(TestID.TokenDetailsStats)).toBeVisible()
    expect(screen.getByTestId(TestID.TokenDetailsStatsTvl)).toHaveTextContent('$')
    expect(screen.getByTestId(TestID.TokenDetailsStatsMarketCap)).toHaveTextContent('$')
    expect(screen.getByTestId(TestID.TokenDetailsStatsFdv)).toHaveTextContent('$')
    expect(screen.getByTestId(TestID.TokenDetailsStatsVolume24h)).toHaveTextContent('$')
    expect(screen.getByTestId(TestID.TokenDetailsStats52wHigh)).toHaveTextContent('$')
    expect(screen.getByTestId(TestID.TokenDetailsStats52wLow)).toHaveTextContent('$')
  })

  it('renders market cap and FDV from the REST market stats', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocked(useTokenMarketStats).mockReturnValue({ ...EMPTY_STATS, marketCap: 1_234_576, fdv: 234_567 })

    render(<StatsSection />)

    expect(screen.getByTestId(`${TestID.TokenDetailsStatsMarketCap}-value`)).toHaveTextContent('$1.2M')
    expect(screen.getByTestId(`${TestID.TokenDetailsStatsFdv}-value`)).toHaveTextContent('$234.6K')
  })

  it('shows the "no stats available" fallback when every stat is missing', () => {
    mocked(useTokenMarketStats).mockReturnValue(EMPTY_STATS)

    render(<StatsSection />)

    expect(screen.queryByTestId(TestID.TokenDetailsStats)).toBeNull()
    expect(screen.getByText('No stats available')).toBeVisible()
  })

  it('renders the loading skeleton instead of the "no stats available" fallback while the market query is loading', () => {
    mocked(useTokenMarketStats).mockReturnValue({ ...EMPTY_STATS, isLoading: true })

    render(<StatsSection />)

    expect(screen.getByTestId('token-details-stats-loading')).toBeVisible()
    expect(screen.queryByTestId(TestID.TokenDetailsStats)).toBeNull()
    expect(screen.queryByText('No stats available')).toBeNull()
  })

  it('uses the REST spot price directly on the all-networks view', () => {
    // REST has no cross-chain aggregate price endpoint, so the per-chain REST price is
    // authoritative even on the aggregate view.
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocked(useTokenSpotPrice).mockReturnValue(123)
    mocked(useTokenMarketStats).mockReturnValue(POPULATED_STATS)

    render(<StatsSection />)

    expect(useTokenSpotPrice).toHaveBeenCalledWith(expect.any(String), { isMultichainAggregateView: true })
    expect(useTokenMarketStats).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        currentPriceOverride: 123,
        isMultichainAggregateView: true,
      }),
    )
  })

  it('scopes the price and market queries to the selected chain when not on the all-networks view', () => {
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocked(useTDPMultichainAggregate).mockReturnValue({ isMultichainAggregateView: false })
    mockTDPState({ selectedMultichainChainId: UniverseChainId.Mainnet })
    mocked(useTokenSpotPrice).mockReturnValue(123)
    mocked(useTokenMarketStats).mockReturnValue(POPULATED_STATS)

    render(<StatsSection />)

    expect(useTokenSpotPrice).toHaveBeenCalledWith(expect.any(String), { isMultichainAggregateView: false })
    expect(useTokenMarketStats).toHaveBeenCalledWith(
      expect.any(String),
      expect.objectContaining({
        currentPriceOverride: 123,
        isMultichainAggregateView: false,
      }),
    )
  })
})
