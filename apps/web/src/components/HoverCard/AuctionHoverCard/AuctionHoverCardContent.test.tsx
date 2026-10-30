import { UniverseChainId } from '@universe/chains'
import type { UTCTimestamp } from 'lightweight-charts'
import {
  AuctionHoverCardContent,
  type AuctionHoverCardContentProps,
} from '~/components/HoverCard/AuctionHoverCard/AuctionHoverCardContent'
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

const baseProps: AuctionHoverCardContentProps = {
  chainId: UniverseChainId.Mainnet,
  tokenAddress: '0x9999B7E3cc6979223Ff1aF980b7D8B90B75d9999',
  tokenSymbol: 'FOO',
  tokenName: 'Foo',
  fdvUsd: 1_230_000,
  pricePercentChange: 8.33,
  priceData: [point(1, 1.1354), point(2, 1.23)],
  committedVolumeUsd: 188_800,
  bidderCount: 16_741,
  loading: false,
  isCopied: false,
  onCopy: vi.fn(),
  onExpand: vi.fn(),
}

describe('AuctionHoverCardContent', () => {
  it('shows FDV as the labelled headline, the price chart, committed volume, and bidders', () => {
    render(<AuctionHoverCardContent {...baseProps} />)

    // The symbol also appears as the logo's fallback text.
    expect(screen.getAllByText('FOO').length).toBeGreaterThan(0)
    expect(screen.getByText('0x9999...9999')).toBeInTheDocument()
    // FiatTokenStats formatting, the same as the Explore auctions table's FDV column.
    expect(screen.getByText('$1.2M')).toBeInTheDocument()
    expect(screen.getByText('FDV')).toBeInTheDocument()
    expect(screen.queryByText('today')).not.toBeInTheDocument()
    expect(screen.getByText('$188.8K committed')).toBeInTheDocument()
    expect(screen.getByText('16,741 bidders')).toBeInTheDocument()
    expect(screen.getByTestId('hover-card-chart')).toHaveAttribute('data-points', '2')
  })

  it('falls back to the checkpoint bid count when the row has no distinct-bidder count', () => {
    render(<AuctionHoverCardContent {...baseProps} bidderCount={undefined} bidCount={1} />)

    expect(screen.getByText('1 bid')).toBeInTheDocument()
    expect(screen.queryByText(/bidders/)).not.toBeInTheDocument()
  })

  it('renders the no-data treatment under the identity when nothing came back to show', () => {
    render(
      <AuctionHoverCardContent
        {...baseProps}
        fdvUsd={undefined}
        pricePercentChange={undefined}
        priceData={[]}
        committedVolumeUsd={undefined}
        bidderCount={undefined}
      />,
    )

    expect(screen.getAllByText('FOO').length).toBeGreaterThan(0)
    expect(screen.queryByTestId('hover-card-chart')).not.toBeInTheDocument()
    expect(screen.queryByText(/committed/)).not.toBeInTheDocument()
  })

  it('keeps committed volume and bidders from the row when FDV and the chart are both missing', () => {
    render(<AuctionHoverCardContent {...baseProps} fdvUsd={undefined} pricePercentChange={undefined} priceData={[]} />)

    expect(screen.getByText('$188.8K committed')).toBeInTheDocument()
    expect(screen.getByText('16,741 bidders')).toBeInTheDocument()
    expect(screen.queryByText('$1.2M')).not.toBeInTheDocument()
    // No headline and no series: the stats stand alone rather than under a "chart unavailable" block.
    expect(screen.queryByTestId('hover-card-chart')).not.toBeInTheDocument()
  })

  it('keeps the chart region under the FDV headline when only the series is missing', () => {
    render(<AuctionHoverCardContent {...baseProps} priceData={[]} />)

    expect(screen.getByText('$1.2M')).toBeInTheDocument()
    expect(screen.getByTestId('hover-card-chart')).toHaveAttribute('data-points', '0')
  })

  it('shows the chart skeleton while loading even before any series is known', () => {
    render(<AuctionHoverCardContent {...baseProps} loading fdvUsd={undefined} priceData={[]} />)

    expect(screen.getByTestId('hover-card-chart')).toHaveAttribute('data-loading', 'true')
  })

  it('still charts the token price when the auction lookup came back empty', () => {
    render(
      <AuctionHoverCardContent
        {...baseProps}
        fdvUsd={undefined}
        committedVolumeUsd={undefined}
        bidderCount={undefined}
      />,
    )

    expect(screen.queryByText('$1.2M')).not.toBeInTheDocument()
    expect(screen.getByTestId('hover-card-chart')).toHaveAttribute('data-points', '2')
  })
})
