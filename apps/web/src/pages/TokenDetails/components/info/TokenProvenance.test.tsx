import type { PlainMessage } from '@bufbuild/protobuf'
import { AuctionType, type Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import {
  type AuctionDisplayDataSources,
  useAuctionDisplayDataSources,
} from '~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources'
import { TokenProvenance } from '~/pages/TokenDetails/components/info/TokenProvenance'
import type { TDPState } from '~/pages/TokenDetails/context/createTDPStore'
import { TokenDetailsAuctionDisplayProvider } from '~/pages/TokenDetails/context/TokenDetailsAuctionDisplayProvider'
import { TokenDetailsSourceState } from '~/pages/TokenDetails/context/tokenDetailsSourceState'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import type { TokenDetailsAuctionSource } from '~/pages/TokenDetails/hooks/useTokenDetailsAuction'
import { mocked } from '~/test-utils/mocked'
import { fireEvent, render, screen } from '~/test-utils/render'

vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({ useTDPStore: vi.fn() }))
vi.mock('~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources', () => ({
  useAuctionDisplayDataSources: vi.fn(),
}))

const AUCTION_ADDRESS = '0x1111111111111111111111111111111111111111'

const auction = {
  address: AUCTION_ADDRESS,
  tokenAddress: '0x3333333333333333333333333333333333333333',
  creatorAddress: '0x2222222222222222222222222222222222222222',
  createdAt: '2026-08-08T12:00:00Z',
  isQuickLaunch: false,
  startBlock: '100',
  endBlock: '200',
  currencyTokenDecimals: 18,
  currencyPriceUsd: '2000',
  xHandle: 'uniswap',
  xVerified: true,
} as PlainMessage<Auction>

const ENDED_WITH_RAISE: AuctionDisplayDataSources = {
  currentBlock: { status: 'success', blockNumber: 300n },
  currencyRaised: { status: 'success', currencyRaised: '5000000000000000000' },
  pools: { status: 'success', poolCount: 1 },
  refetchCurrentBlock: vi.fn(),
}

const LIVE: AuctionDisplayDataSources = {
  currentBlock: { status: 'success', blockNumber: 150n },
  currencyRaised: { status: 'idle' },
  pools: { status: 'success', poolCount: 0 },
  refetchCurrentBlock: vi.fn(),
}

function mockStore(auctionSource: TokenDetailsAuctionSource): void {
  const state = {
    currencyChainId: UniverseChainId.Mainnet,
    address: auction.tokenAddress,
    currency: new Token(UniverseChainId.Mainnet, auction.tokenAddress, 18),
    pageQueryLoading: false,
    auctionSource,
  } as TDPState
  mocked(useTDPStore).mockImplementation(((selector: (s: TDPState) => unknown) =>
    selector(state)) as typeof useTDPStore)
}

function TokenProvenanceWithDisplay(): JSX.Element {
  return (
    <TokenDetailsAuctionDisplayProvider>
      <TokenProvenance />
    </TokenDetailsAuctionDisplayProvider>
  )
}

describe('TokenProvenance', () => {
  it.each<TokenDetailsAuctionSource>([
    { status: TokenDetailsSourceState.Disabled },
    { status: TokenDetailsSourceState.Loading },
    { status: TokenDetailsSourceState.NotFound },
    { status: TokenDetailsSourceState.Error, error: new Error('Auction lookup failed') },
  ])('renders nothing when the auction source is $status', (auctionSource) => {
    mockStore(auctionSource)
    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)

    render(<TokenProvenanceWithDisplay />)

    expect(screen.queryByTestId(TestID.TokenDetailsProvenance)).toBeNull()
  })

  it('renders creator, launchpad, date and final raise for an ended auction', () => {
    mockStore({ status: TokenDetailsSourceState.Found, auction })
    mocked(useAuctionDisplayDataSources).mockReturnValue(ENDED_WITH_RAISE)

    render(<TokenProvenanceWithDisplay />)

    expect(screen.getByText('Info')).toBeInTheDocument()
    expect(screen.getByText('@uniswap').closest('a')).toHaveAttribute('href', 'https://x.com/uniswap')
    expect(screen.getByText('Uniswap')).toBeInTheDocument()
    expect(screen.getByText(/raised$/)).toBeInTheDocument()
    expect(screen.getByText('Details').closest('a')).toHaveAttribute(
      'href',
      `/explore/auctions/ethereum/${AUCTION_ADDRESS}`,
    )
  })

  it('omits the raise row while the auction is live', () => {
    mockStore({ status: TokenDetailsSourceState.Found, auction })
    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)

    render(<TokenProvenanceWithDisplay />)

    expect(screen.getByTestId(TestID.TokenDetailsProvenance)).toBeInTheDocument()
    expect(screen.queryByText(/raised/)).toBeNull()
    expect(screen.queryByText('Details')).toBeNull()
  })

  it.each([
    [AuctionType.CUSTOM, 'Custom auction'],
    [AuctionType.CROWD, 'Crowd Launch'],
  ])('shows the served method %s', (auctionType, label) => {
    mockStore({ status: TokenDetailsSourceState.Found, auction: { ...auction, auctionType } })
    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)

    render(<TokenProvenanceWithDisplay />)

    expect(screen.getByText('Launch method')).toBeInTheDocument()
    expect(screen.getByTestId(TestID.TokenDetailsProvenanceLaunchMethod)).toHaveTextContent(label)

    fireEvent.click(screen.getByTestId(TestID.TokenDetailsProvenanceLaunchMethod))
    expect(screen.getByTestId(TestID.LaunchMethodExplainerModal)).toBeInTheDocument()
  })

  it.each([false, true])('omits an unclassified method, with isQuickLaunch=%s', (isQuickLaunch) => {
    mockStore({ status: TokenDetailsSourceState.Found, auction: { ...auction, isQuickLaunch } })
    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)

    render(<TokenProvenanceWithDisplay />)

    expect(screen.getByTestId(TestID.TokenDetailsProvenance)).toBeInTheDocument()
    expect(screen.queryByText('Launch method')).toBeNull()
    expect(screen.queryByText('Custom auction')).toBeNull()
    expect(screen.queryByText('Crowd Launch')).toBeNull()
    expect(screen.queryByTestId(TestID.LaunchMethodExplainerModal)).toBeNull()
  })
})
