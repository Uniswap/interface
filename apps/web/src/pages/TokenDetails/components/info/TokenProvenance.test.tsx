import type { PlainMessage } from '@bufbuild/protobuf'
import {
  AuctionType,
  GetLatestCheckpointResponse,
  type Auction,
} from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { AuctionServiceClient } from 'uniswap/src/data/apiClients/dataApiService/auctions/AuctionServiceClient'
import { LaunchProvenanceMethod, type LaunchProvenance } from 'uniswap/src/features/dataApi/launchProvenance'
import {
  type AuctionDisplayDataSources,
  useAuctionDisplayDataSources,
} from '~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources'
import { TokenProvenance, TokenProvenanceContent } from '~/pages/TokenDetails/components/info/TokenProvenance'
import type { TDPState } from '~/pages/TokenDetails/context/createTDPStore'
import { TokenDetailsAuctionDisplayProvider } from '~/pages/TokenDetails/context/TokenDetailsAuctionDisplayProvider'
import { TokenDetailsSourceState } from '~/pages/TokenDetails/context/tokenDetailsSourceState'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import type { TokenDetailsAuctionSource } from '~/pages/TokenDetails/hooks/useTokenDetailsAuction'
import { mocked } from '~/test-utils/mocked'
import { fireEvent, render, screen, waitFor } from '~/test-utils/render'

vi.mock('uniswap/src/data/apiClients/dataApiService/auctions/AuctionServiceClient', () => ({
  AuctionServiceClient: { getLatestCheckpoint: vi.fn() },
}))
vi.mock('~/pages/TokenDetails/components/auction/TokenDetailsAuctionListModal', () => ({
  TokenDetailsAuctionListModal: ({ isOpen, auctions }: { isOpen: boolean; auctions: PlainMessage<Auction>[] }) =>
    isOpen ? (
      <div data-testid={TestID.TokenDetailsAuctionListModal}>
        {auctions.map((entry) => (
          <span key={entry.address}>{entry.address}</span>
        ))}
      </div>
    ) : null,
}))

vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({ useTDPStore: vi.fn() }))
// deriveCurrencyRaisedState stays real: the sibling raise sum under test is derived by it.
vi.mock('~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources')>()),
  useAuctionDisplayDataSources: vi.fn(),
}))

const AUCTION_ADDRESS = '0x1111111111111111111111111111111111111111'

const auction = {
  chainId: UniverseChainId.Mainnet,
  address: AUCTION_ADDRESS,
  tokenAddress: '0x3333333333333333333333333333333333333333',
  creatorAddress: '0x2222222222222222222222222222222222222222',
  createdAt: '2026-08-08T12:00:00Z',
  isQuickLaunch: false,
  auctionType: AuctionType.CUSTOM,
  startBlock: '100',
  endBlock: '200',
  requiredCurrencyRaised: '1000000000000000000',
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
  refetchCheckpoint: vi.fn(),
}

const LIVE: AuctionDisplayDataSources = {
  currentBlock: { status: 'success', blockNumber: 150n },
  currencyRaised: { status: 'idle' },
  pools: { status: 'success', poolCount: 0 },
  refetchCurrentBlock: vi.fn(),
  refetchCheckpoint: vi.fn(),
}

function mockStore(auctionSource: TokenDetailsAuctionSource, chainId = UniverseChainId.Mainnet): void {
  const state = {
    currencyChainId: chainId,
    address: auction.tokenAddress,
    currency: new Token(chainId, auction.tokenAddress, 18),
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

const sibling = {
  ...auction,
  address: '0x4444444444444444444444444444444444444444',
  auctionType: AuctionType.CROWD,
  requiredCurrencyRaised: '100000000',
  currencyTokenDecimals: 6,
  currencyPriceUsd: '1',
}

function mockSiblingCheckpoints(): void {
  // Call counts are per-file here, so each test that asserts on them starts from zero.
  mocked(AuctionServiceClient.getLatestCheckpoint)
    .mockClear()
    .mockImplementation(
      async (params) =>
        new GetLatestCheckpointResponse({
          currencyRaised: params.address === auction.address ? '5000000000000000000' : '250000000',
        }),
    )
}

describe('TokenProvenance', () => {
  it('sums every ended auction and opens history from the deduplicated list', async () => {
    mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction, sibling, auction] })
    mocked(useAuctionDisplayDataSources).mockReturnValue(ENDED_WITH_RAISE)
    mockSiblingCheckpoints()

    render(<TokenProvenanceWithDisplay />)

    await waitFor(() => expect(screen.getByText(/raised$/)).toHaveTextContent('10.3K'))
    fireEvent.click(screen.getByRole('button', { name: 'Details' }))
    const modal = screen.getByTestId(TestID.TokenDetailsAuctionListModal)
    expect(modal).toHaveTextContent(auction.address)
    expect(modal).toHaveTextContent(sibling.address)
    expect(AuctionServiceClient.getLatestCheckpoint).toHaveBeenCalledTimes(2)
  })

  it('leaves out the refunded raise of a sibling that did not graduate', async () => {
    const failedSibling = { ...sibling, requiredCurrencyRaised: '1000000000' }
    mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction, failedSibling] })
    mocked(useAuctionDisplayDataSources).mockReturnValue(ENDED_WITH_RAISE)
    mockSiblingCheckpoints()

    render(<TokenProvenanceWithDisplay />)

    await waitFor(() => expect(AuctionServiceClient.getLatestCheckpoint).toHaveBeenCalledTimes(2))
    await waitFor(() => expect(screen.getByText(/raised$/)).toHaveTextContent(/\$10(\.0)?K raised/))
    expect(screen.getByText(/raised$/)).not.toHaveTextContent('10.3K')
  })

  it('counts an unclassified ended sibling in the total but keeps Details on the only CCA auction', async () => {
    mockStore({
      status: TokenDetailsSourceState.Found,
      auction,
      auctions: [auction, { ...sibling, auctionType: AuctionType.UNSPECIFIED }],
    })
    mocked(useAuctionDisplayDataSources).mockReturnValue(ENDED_WITH_RAISE)
    mockSiblingCheckpoints()

    render(<TokenProvenanceWithDisplay />)

    await waitFor(() => expect(screen.getByText(/raised$/)).toHaveTextContent('10.3K'))
    expect(AuctionServiceClient.getLatestCheckpoint).toHaveBeenCalledTimes(2)
    expect(screen.getByRole('link', { name: 'Details' })).toHaveAttribute(
      'href',
      `/explore/auctions/ethereum/${AUCTION_ADDRESS}`,
    )
    expect(screen.queryByRole('button', { name: 'Details' })).toBeNull()
  })

  it('keeps history reachable while the auctions are live, without fetching or summing them', async () => {
    mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction, sibling] })
    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)
    mockSiblingCheckpoints()

    render(<TokenProvenanceWithDisplay />)

    expect(screen.getByText('Auction history')).toBeInTheDocument()
    expect(screen.queryByText(/raised$/)).toBeNull()
    fireEvent.click(screen.getByRole('button', { name: 'Details' }))
    expect(screen.getByTestId(TestID.TokenDetailsAuctionListModal)).toBeInTheDocument()
    await waitFor(() => expect(AuctionServiceClient.getLatestCheckpoint).not.toHaveBeenCalled())
  })
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
    mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction] })
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
    expect(screen.getByText('Details').closest('a')).not.toHaveAttribute('target')
  })

  it('omits the raise row while the auction is live', () => {
    mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction] })
    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)

    render(<TokenProvenanceWithDisplay />)

    expect(screen.getByTestId(TestID.TokenDetailsProvenance)).toBeInTheDocument()
    expect(screen.queryByText(/raised/)).toBeNull()
    expect(screen.queryByText('Details')).toBeNull()
  })

  it('links an ended Crowd Launch to its pools.xyz token page', () => {
    mockStore(
      {
        status: TokenDetailsSourceState.Found,
        auction: { ...auction, auctionType: AuctionType.CROWD },
        auctions: [{ ...auction, auctionType: AuctionType.CROWD }],
      },
      UniverseChainId.Robinhood,
    )
    mocked(useAuctionDisplayDataSources).mockReturnValue(ENDED_WITH_RAISE)

    render(<TokenProvenanceWithDisplay />)

    const details = screen.getByRole('link', { name: 'Details' })
    expect(details).toHaveAttribute('href', `https://pools.xyz/t/robinhood/${auction.tokenAddress}`)
    expect(details).toHaveAttribute('target', '_blank')
  })

  it.each([
    [AuctionType.CUSTOM, 'Custom auction'],
    [AuctionType.CROWD, 'Crowd Launch'],
  ])('shows the served method %s', (auctionType, label) => {
    mockStore({
      status: TokenDetailsSourceState.Found,
      auction: { ...auction, auctionType },
      auctions: [{ ...auction, auctionType }],
    })
    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)

    render(<TokenProvenanceWithDisplay />)

    expect(screen.getByText('Launch method')).toBeInTheDocument()
    expect(screen.getByTestId(TestID.TokenDetailsProvenanceLaunchMethod)).toHaveTextContent(label)

    fireEvent.click(screen.getByTestId(TestID.TokenDetailsProvenanceLaunchMethod))
    expect(screen.getByTestId(TestID.LaunchMethodExplainerModal)).toBeInTheDocument()
  })

  it.each([false, true])('omits an unclassified method, with isQuickLaunch=%s', (isQuickLaunch) => {
    const unclassified = { ...auction, isQuickLaunch, auctionType: AuctionType.UNSPECIFIED }
    mockStore({ status: TokenDetailsSourceState.Found, auction: unclassified, auctions: [unclassified] })
    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)

    render(<TokenProvenanceWithDisplay />)

    expect(screen.getByTestId(TestID.TokenDetailsProvenance)).toBeInTheDocument()
    expect(screen.queryByText('Launch method')).toBeNull()
    expect(screen.queryByText('Custom auction')).toBeNull()
    expect(screen.queryByText('Crowd Launch')).toBeNull()
    expect(screen.queryByTestId(TestID.LaunchMethodExplainerModal)).toBeNull()
  })
})

// Presentation fixtures are normalized data, not invented fields on the generated Token contract.
describe('TokenProvenanceContent', () => {
  const provenance: LaunchProvenance = {
    launchpad: { id: 'pons', name: 'Pons', logoUrl: 'https://example.com/pons.png' },
    method: LaunchProvenanceMethod.ThirdParty,
    launchedAt: new Date('2026-09-01T12:00:00Z'),
  }

  it('opens the auction selector instead of navigating to the primary auction', () => {
    const onShowAuctions = vi.fn()
    render(
      <TokenProvenanceContent
        provenance={provenance}
        auctionData={{
          creator: { name: '--', href: undefined, verified: false, avatarUrl: undefined },
          raised: { usd: 10250, destination: { href: '/primary-auction', isExternal: false } },
        }}
        onShowAuctions={onShowAuctions}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Details' }))
    expect(onShowAuctions).toHaveBeenCalledOnce()
    expect(screen.queryByRole('link', { name: 'Details' })).toBeNull()
  })

  it('opens an external auction history in a new tab', () => {
    render(
      <TokenProvenanceContent
        provenance={{ ...provenance, method: LaunchProvenanceMethod.CrowdLaunch }}
        auctionData={{
          creator: { name: '--', href: undefined, verified: false, avatarUrl: undefined },
          raised: {
            usd: 10_000,
            destination: { href: `https://pools.xyz/t/robinhood/${auction.tokenAddress}`, isExternal: true },
          },
        }}
      />,
    )

    const details = screen.getByRole('link', { name: 'Details' })
    expect(details).toHaveAttribute('href', `https://pools.xyz/t/robinhood/${auction.tokenAddress}`)
    expect(details).toHaveAttribute('target', '_blank')
    expect(details).toHaveAttribute('rel', 'noopener noreferrer')
  })

  it('shows the auction history without a Details link when no page can be addressed', () => {
    render(
      <TokenProvenanceContent
        provenance={{ ...provenance, method: LaunchProvenanceMethod.CrowdLaunch }}
        auctionData={{
          creator: { name: '--', href: undefined, verified: false, avatarUrl: undefined },
          raised: { usd: 10_000, destination: undefined },
        }}
      />,
    )

    expect(screen.getByText('Auction history')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Details' })).toBeNull()
  })

  it('renders a third-party launchpad and date without inventing auction rows', () => {
    render(<TokenProvenanceContent provenance={provenance} />)

    expect(screen.getByText('Pons')).toBeInTheDocument()
    expect(screen.getByTestId(TestID.LaunchpadLogo)).toBeInTheDocument()
    expect(screen.getByText('Launch date')).toBeInTheDocument()
    expect(screen.queryByText('Created by')).toBeNull()
    expect(screen.queryByText('Auction history')).toBeNull()
    expect(screen.queryByText('Launch method')).toBeNull()
  })

  it.each([
    [LaunchProvenanceMethod.CustomAuction, 'Custom auction', 'Custom Auctions', /CCA protocol\.$/],
    [LaunchProvenanceMethod.CrowdLaunch, 'Crowd Launch', 'Crowd Launches', /crowdfunding\. Launched via pools\.xyz\.$/],
    [LaunchProvenanceMethod.InstantLaunch, 'Instant Launch', 'Instant Launches', /bonding curve.*pools\.xyz\.$/],
  ])(
    'renders the known %s method and opens its explainer without changing launchpad identity',
    (method, label, title, description) => {
      render(<TokenProvenanceContent provenance={{ ...provenance, method }} />)

      expect(screen.getByText('Pons')).toBeInTheDocument()
      expect(screen.getByText(label)).toBeInTheDocument()
      expect(screen.queryByText(title)).toBeNull()
      fireEvent.click(screen.getByTestId(TestID.TokenDetailsProvenanceLaunchMethod))
      expect(screen.getByText(title)).toBeInTheDocument()
      expect(screen.getByText(description)).toBeInTheDocument()
    },
  )

  it('keeps the launchpad while omitting an unknown method and missing date', () => {
    render(
      <TokenProvenanceContent
        provenance={{ ...provenance, method: LaunchProvenanceMethod.Unknown, launchedAt: undefined }}
      />,
    )

    expect(screen.getByText('Pons')).toBeInTheDocument()
    expect(screen.getByText('--')).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.TokenDetailsProvenanceLaunchMethod)).toBeNull()
  })

  it('uses a served logo when the normalized launchpad supplies one', () => {
    render(
      <TokenProvenanceContent
        provenance={{ ...provenance, launchpad: { ...provenance.launchpad, id: 'uniswap-cca', name: 'Uniswap' } }}
      />,
    )

    expect(screen.getByTestId(TestID.LaunchpadLogo)).toBeInTheDocument()
  })

  it('falls back to the Uniswap mark only for the CCA launchpad without a served logo', () => {
    render(
      <TokenProvenanceContent
        provenance={{ ...provenance, launchpad: { id: 'uniswap-cca', name: 'Uniswap', logoUrl: undefined } }}
      />,
    )

    expect(screen.getByText('Uniswap')).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.LaunchpadLogo)).toBeNull()
  })
})
