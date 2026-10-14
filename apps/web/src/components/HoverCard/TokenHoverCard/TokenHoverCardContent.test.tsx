import type { UTCTimestamp } from 'lightweight-charts'
import { USDC_MAINNET } from 'uniswap/src/constants/tokens'
import { buildCurrencyInfo } from 'uniswap/src/features/dataApi/utils/buildCurrency'
import { currencyId } from 'uniswap/src/utils/currencyId'
import {
  TokenHoverCardContent,
  type TokenHoverCardContentProps,
} from '~/components/HoverCard/TokenHoverCard/TokenHoverCardContent'
import { render, screen } from '~/test-utils/render'

vi.mock('~/components/HoverCard/HoverCardContent', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/components/HoverCard/HoverCardContent')>()),
  HoverCardChart: ({ loading, data }: { loading: boolean; data?: unknown[] }) => (
    <div data-testid="hover-card-chart" data-loading={loading} data-points={data?.length ?? 0} />
  ),
}))

const point = (time: number, value: number) => ({
  time: time as UTCTimestamp,
  value,
  open: value,
  high: value,
  low: value,
  close: value,
})

const baseProps: TokenHoverCardContentProps = {
  currencyInfo: buildCurrencyInfo({
    currency: USDC_MAINNET,
    currencyId: currencyId(USDC_MAINNET),
    logoUrl: null,
    isSpam: false,
  }),
  price: 1.23,
  pricePercentChange: 8.33,
  priceAbsoluteChange: 0.09,
  priceData: [point(1, 1.1354), point(2, 1.23)],
  chartLoading: false,
  volume24hUsd: 188_800,
  tvlUsd: 2_300_000,
  statsLoading: false,
  onCopy: vi.fn(),
  onExpand: vi.fn(),
}

describe('TokenHoverCardContent', () => {
  it('shows the price with the daily change, the chart, 24H volume, and TVL', () => {
    render(<TokenHoverCardContent {...baseProps} />)

    expect(screen.getByText('$1.23')).toBeInTheDocument()
    expect(screen.getByText('today')).toBeInTheDocument()
    expect(screen.getByTestId('hover-card-chart')).toHaveAttribute('data-points', '2')
    // FiatTokenStats formatting, the same as the TDP stats section.
    expect(screen.getByText('$188.8K 24H vol')).toBeInTheDocument()
    expect(screen.getByText('$2.3M TVL')).toBeInTheDocument()
  })

  it('shows whichever of volume and TVL is known', () => {
    render(<TokenHoverCardContent {...baseProps} tvlUsd={undefined} />)

    expect(screen.getByText('$188.8K 24H vol')).toBeInTheDocument()
    expect(screen.queryByText(/TVL/)).not.toBeInTheDocument()
  })

  it('omits the stats row when neither volume nor TVL is known', () => {
    render(<TokenHoverCardContent {...baseProps} volume24hUsd={undefined} tvlUsd={undefined} />)

    expect(screen.getByText('$1.23')).toBeInTheDocument()
    expect(screen.queryByText(/24H vol/)).not.toBeInTheDocument()
    expect(screen.queryByText(/TVL/)).not.toBeInTheDocument()
  })

  it('keeps volume and TVL when the price series is missing', () => {
    render(
      <TokenHoverCardContent
        {...baseProps}
        price={undefined}
        pricePercentChange={undefined}
        priceAbsoluteChange={undefined}
        priceData={[]}
      />,
    )

    expect(screen.getByText('$188.8K 24H vol')).toBeInTheDocument()
    expect(screen.getByText('$2.3M TVL')).toBeInTheDocument()
    expect(screen.queryByText('Token data unavailable')).not.toBeInTheDocument()
  })

  it('renders the no-data treatment when nothing came back to show', () => {
    render(
      <TokenHoverCardContent
        {...baseProps}
        price={undefined}
        pricePercentChange={undefined}
        priceAbsoluteChange={undefined}
        priceData={[]}
        volume24hUsd={undefined}
        tvlUsd={undefined}
      />,
    )

    expect(screen.getByText('Token data unavailable')).toBeInTheDocument()
    expect(screen.queryByTestId('hover-card-chart')).not.toBeInTheDocument()
  })

  it('holds the no-data treatment while the stats are still loading', () => {
    render(
      <TokenHoverCardContent
        {...baseProps}
        price={undefined}
        pricePercentChange={undefined}
        priceAbsoluteChange={undefined}
        priceData={[]}
        volume24hUsd={undefined}
        tvlUsd={undefined}
        statsLoading
      />,
    )

    expect(screen.queryByText('Token data unavailable')).not.toBeInTheDocument()
  })
})
