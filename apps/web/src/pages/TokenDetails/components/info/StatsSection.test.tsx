import { useFeatureFlag } from '@universe/gating'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { useTokenMarketStats } from 'uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData'
import { useTokenSpotPrice } from 'uniswap/src/features/dataApi/tokenDetails/useTokenSpotPriceWrapper'
import { TestID } from 'uniswap/src/test/fixtures/testIDs'
import { StatsSection } from '~/pages/TokenDetails/components/info/StatsSection'
import { useTDPEffectiveCurrency } from '~/pages/TokenDetails/hooks/useTDPEffectiveCurrency'
import { useTDPStatsMarketSource } from '~/pages/TokenDetails/hooks/useTDPStatsMarketSource'
import { mocked } from '~/test-utils/mocked'
import { render, screen } from '~/test-utils/render'

vi.mock('@universe/gating', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/gating')>()),
  useFeatureFlag: vi.fn(),
}))

vi.mock('~/pages/TokenDetails/hooks/useTDPEffectiveCurrency', () => ({
  useTDPEffectiveCurrency: vi.fn(),
}))

vi.mock('~/pages/TokenDetails/hooks/useTDPStatsMarketSource', () => ({
  useTDPStatsMarketSource: vi.fn(),
}))

vi.mock('uniswap/src/features/dataApi/tokenDetails/useTokenSpotPriceWrapper', () => ({
  useTokenSpotPrice: vi.fn(),
}))

vi.mock('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/dataApi/tokenDetails/useTokenDetailsData')>()),
  useTokenMarketStats: vi.fn(),
}))

const POPULATED_STATS = {
  marketCap: 5_000_000_000,
  fdv: 10_000_000_000,
  volume: 250_000_000,
  high52w: 12.34,
  low52w: 4.56,
}

const EMPTY_STATS = {
  marketCap: undefined,
  fdv: undefined,
  volume: undefined,
  high52w: undefined,
  low52w: undefined,
}

const MARKET_SOURCE_AGGREGATED = {
  showAggregatedStats: true,
  filteredDeploymentMarket: undefined,
  networkFilterName: '',
  marketStatsInput: undefined,
}

describe('StatsSection', () => {
  beforeEach(() => {
    mocked(useFeatureFlag).mockReturnValue(false)
    mocked(useTDPEffectiveCurrency).mockReturnValue(USDC_MAINNET)
    mocked(useTokenSpotPrice).mockReturnValue(undefined)
    mocked(useTDPStatsMarketSource).mockReturnValue(MARKET_SOURCE_AGGREGATED)
  })

  it('renders the stats wrapper and all stat tiles when market data is populated', () => {
    // StatsSection.tsx renders `<tr>` directly under `<table>` (no `<tbody>`),
    // which trips React's DOM-nesting validator. Pre-existing in the component;
    // suppress so this test asserts the meaningful behavior (stat tiles + $ formatting).
    vi.spyOn(console, 'error').mockImplementation(() => {})
    mocked(useTokenMarketStats).mockReturnValue(POPULATED_STATS)

    const tokenQueryData = {
      market: { totalValueLocked: { value: 1_000_000_000 } },
    }

    render(<StatsSection tokenQueryData={tokenQueryData as never} />)

    expect(screen.getByTestId(TestID.TokenDetailsStats)).toBeVisible()
    expect(screen.getByTestId(TestID.TokenDetailsStatsTvl)).toHaveTextContent('$')
    expect(screen.getByTestId(TestID.TokenDetailsStatsMarketCap)).toHaveTextContent('$')
    expect(screen.getByTestId(TestID.TokenDetailsStatsFdv)).toHaveTextContent('$')
    expect(screen.getByTestId(TestID.TokenDetailsStatsVolume24h)).toHaveTextContent('$')
    expect(screen.getByTestId(TestID.TokenDetailsStats52wHigh)).toHaveTextContent('$')
    expect(screen.getByTestId(TestID.TokenDetailsStats52wLow)).toHaveTextContent('$')
  })

  it('shows the "no stats available" fallback when every stat is missing', () => {
    mocked(useTokenMarketStats).mockReturnValue(EMPTY_STATS)

    render(<StatsSection tokenQueryData={undefined} />)

    expect(screen.queryByTestId(TestID.TokenDetailsStats)).toBeNull()
    expect(screen.getByText('No stats available')).toBeVisible()
  })
})
