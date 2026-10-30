import type { PlainMessage } from '@bufbuild/protobuf'
import { onlineManager } from '@tanstack/react-query'
import {
  AuctionType,
  GetLatestCheckpointResponse,
  type Auction,
} from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { AuctionServiceClient } from 'uniswap/src/data/apiClients/dataApiService/auctions/AuctionServiceClient'
import { LaunchProvenanceMethod, type LaunchProvenance } from 'uniswap/src/features/dataApi/launchProvenance'
import { useTokenLaunchProvenance } from 'uniswap/src/features/dataApi/useTokenLaunchProvenance'
import { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import {
  type AuctionDisplayDataSources,
  useAuctionDisplayDataSources,
} from '~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources'
import { UNISWAP_CCA_LAUNCHPAD_ID } from '~/pages/Launches/launchesModel'
import { TokenProvenance, TokenProvenanceContent } from '~/pages/TokenDetails/components/info/TokenProvenance'
import type { TDPState } from '~/pages/TokenDetails/context/createTDPStore'
import { TokenDetailsAuctionDisplayProvider } from '~/pages/TokenDetails/context/TokenDetailsAuctionDisplayProvider'
import { TokenDetailsSourceState } from '~/pages/TokenDetails/context/tokenDetailsSourceState'
import { useTDPStore } from '~/pages/TokenDetails/context/useTDPStore'
import type { TokenDetailsAuctionSource } from '~/pages/TokenDetails/hooks/useTokenDetailsAuction'
import { mocked } from '~/test-utils/mocked'
import { act, fireEvent, render, renderWithUniswapContext, screen, waitFor } from '~/test-utils/render'
import { SERVED_CROWD_CCA_PROVENANCE, SERVED_CUSTOM_CCA_PROVENANCE } from '~/test-utils/tokenDetails/fixtures'

vi.mock('uniswap/src/data/apiClients/dataApiService/auctions/AuctionServiceClient', () => ({
  AuctionServiceClient: { getLatestCheckpoint: vi.fn() },
}))
vi.mock('~/pages/TokenDetails/components/auction/TokenDetailsAuctionListModal', () => ({
  TokenDetailsAuctionListModal: ({
    isOpen,
    auctions,
    onClose,
  }: {
    isOpen: boolean
    auctions: PlainMessage<Auction>[]
    onClose: () => void
  }) =>
    isOpen ? (
      <div data-testid={TestID.TokenDetailsAuctionListModal}>
        {auctions.map((entry) => (
          <span key={entry.address}>{entry.address}</span>
        ))}
        <button onClick={onClose}>close auction list</button>
      </div>
    ) : null,
}))

vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({ useTDPStore: vi.fn() }))
// deriveCurrencyRaisedState stays real: the sibling raise sum under test is derived by it.
vi.mock('~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources')>()),
  useAuctionDisplayDataSources: vi.fn(),
}))
// The creator's wallet card resolves ENS over RPC, which has no endpoint in tests.
vi.mock('uniswap/src/features/ens/api', async (importOriginal) => ({
  ...(await importOriginal<typeof import('uniswap/src/features/ens/api')>()),
  useENSName: vi.fn(() => ({ data: undefined, isLoading: false })),
  useENSAvatar: vi.fn(() => ({ data: undefined, isLoading: false })),
}))
vi.mock('uniswap/src/features/telemetry/send', () => ({ sendAnalyticsEvent: vi.fn() }))
vi.mock('uniswap/src/features/dataApi/useTokenLaunchProvenance', () => ({ useTokenLaunchProvenance: vi.fn() }))

beforeEach(() => {
  mocked(sendAnalyticsEvent).mockReset()
  // The auction refines the served record, so auction cases need the backend to have attributed the token.
  mocked(useTokenLaunchProvenance).mockReturnValue(SERVED_CUSTOM_CCA_PROVENANCE)
})

afterEach(() => {
  onlineManager.setOnline(true)
})

const AUCTION_ADDRESS = '0x1111111111111111111111111111111111111111'
/** A registry row that names our launchpad without recording the mechanism. */
const SERVED_UNCLASSIFIED_CCA: LaunchProvenance = {
  launchpad: { id: UNISWAP_CCA_LAUNCHPAD_ID, name: 'Uniswap CCA' },
  method: LaunchProvenanceMethod.Unknown,
}

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

function mockStore(
  auctionSource: TokenDetailsAuctionSource,
  chainId = UniverseChainId.Mainnet,
  address = auction.tokenAddress,
): void {
  const state = {
    currencyChainId: chainId,
    address,
    currency: new Token(chainId, address, 18),
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

  it('sums what live auctions have taken so far, without fetching their checkpoints', async () => {
    mockStore({
      status: TokenDetailsSourceState.Found,
      auction: { ...auction, totalBidVolumeUsd: '29' },
      auctions: [
        { ...auction, totalBidVolumeUsd: '29' },
        { ...sibling, totalBidVolumeUsd: '0' },
      ],
    })
    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)
    mockSiblingCheckpoints()

    render(<TokenProvenanceWithDisplay />)

    expect(screen.getByText('Auction history')).toBeInTheDocument()
    expect(screen.getByText('$29.00 raised')).toBeInTheDocument()
    // A live auction nobody has bid on is still one of the auctions the amount covers.
    expect(screen.getByText('2')).toBeInTheDocument()
    fireEvent.click(screen.getByRole('button', { name: 'Details' }))
    expect(screen.getByTestId(TestID.TokenDetailsAuctionListModal)).toBeInTheDocument()
    await waitFor(() => expect(AuctionServiceClient.getLatestCheckpoint).not.toHaveBeenCalled())
  })

  it('names the outcome of a lone auction that did not graduate instead of its refunded raise', () => {
    mockStore({
      status: TokenDetailsSourceState.Found,
      auction: { ...auction, requiredCurrencyRaised: '9000000000000000000' },
      auctions: [{ ...auction, requiredCurrencyRaised: '9000000000000000000' }],
    })
    mocked(useAuctionDisplayDataSources).mockReturnValue(ENDED_WITH_RAISE)

    render(<TokenProvenanceWithDisplay />)

    expect(screen.getByText('Failed to launch')).toBeInTheDocument()
    expect(screen.queryByText(/raised$/)).toBeNull()
    expect(screen.getByText('Details').closest('a')).toHaveAttribute(
      'href',
      `/explore/auctions/ethereum/${AUCTION_ADDRESS}`,
    )
  })

  it.each<TokenDetailsAuctionSource>([
    { status: TokenDetailsSourceState.Disabled },
    { status: TokenDetailsSourceState.Loading },
    { status: TokenDetailsSourceState.NotFound },
    { status: TokenDetailsSourceState.Error, error: new Error('Auction lookup failed') },
  ])('renders nothing when the auction source is $status', (auctionSource) => {
    mockStore(auctionSource)
    mocked(useTokenLaunchProvenance).mockReturnValue(undefined)
    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)

    render(<TokenProvenanceWithDisplay />)

    expect(screen.queryByTestId(TestID.TokenDetailsProvenance)).toBeNull()
    expect(sendAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('renders a served launch the page found no auction for', () => {
    mockStore({ status: TokenDetailsSourceState.NotFound })
    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)
    mocked(useTokenLaunchProvenance).mockReturnValue({
      launchpad: { id: 'pons', name: 'Pons', logoUrl: 'https://example.com/pons.png' },
      method: LaunchProvenanceMethod.InstantLaunch,
    })

    render(<TokenProvenanceWithDisplay />)

    expect(screen.getByText('Pons')).toBeInTheDocument()
    expect(screen.getByText('Instant Launch')).toBeInTheDocument()
    expect(screen.queryByText('Launched by')).toBeNull()
    expect(screen.queryByText('Auction history')).toBeNull()
    expect(sendAnalyticsEvent).toHaveBeenCalledWith(
      AuctionEventName.ProvenanceModuleViewed,
      expect.objectContaining({ launch_method: 'instant', auction_type: 'unknown' }),
    )
  })

  it('renders nothing for a token with no attributed launch and no auction', () => {
    mockStore({ status: TokenDetailsSourceState.NotFound })
    mocked(useTokenLaunchProvenance).mockReturnValue(undefined)
    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)

    render(<TokenProvenanceWithDisplay />)

    expect(screen.queryByTestId(TestID.TokenDetailsProvenance)).toBeNull()
    expect(sendAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('renders nothing for an auction the backend has not attributed', () => {
    mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction] })
    mocked(useAuctionDisplayDataSources).mockReturnValue(ENDED_WITH_RAISE)
    mocked(useTokenLaunchProvenance).mockReturnValue(undefined)

    render(<TokenProvenanceWithDisplay />)

    expect(screen.queryByTestId(TestID.TokenDetailsProvenance)).toBeNull()
    expect(sendAnalyticsEvent).not.toHaveBeenCalled()
  })

  it('renders creator, launchpad, date and final raise for an ended auction', () => {
    mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction] })
    mocked(useAuctionDisplayDataSources).mockReturnValue(ENDED_WITH_RAISE)

    render(<TokenProvenanceWithDisplay />)

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
    mocked(useTokenLaunchProvenance).mockReturnValue(SERVED_CROWD_CCA_PROVENANCE)

    render(<TokenProvenanceWithDisplay />)

    expect(screen.getByText('pools.xyz')).toBeInTheDocument()
    expect(screen.queryByText('Uniswap')).toBeNull()
    const details = screen.getByRole('link', { name: 'Details' })
    expect(details).toHaveAttribute('href', `https://pools.xyz/t/robinhood/${auction.tokenAddress}`)
    expect(details).toHaveAttribute('target', '_blank')
    fireEvent.click(details)
    expect(sendAnalyticsEvent).not.toHaveBeenCalledWith(
      AuctionEventName.TokenDetailsToAuctionDetailsClicked,
      expect.anything(),
    )
  })

  it.each([
    [AuctionType.CUSTOM, SERVED_CUSTOM_CCA_PROVENANCE, 'Custom Auction'],
    [AuctionType.CROWD, SERVED_CROWD_CCA_PROVENANCE, 'Crowd Launch'],
  ])('shows the served method %s', (auctionType, served, label) => {
    mockStore({
      status: TokenDetailsSourceState.Found,
      auction: { ...auction, auctionType },
      auctions: [{ ...auction, auctionType }],
    })
    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)
    mocked(useTokenLaunchProvenance).mockReturnValue(served)

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
    mocked(useTokenLaunchProvenance).mockReturnValue(SERVED_UNCLASSIFIED_CCA)

    render(<TokenProvenanceWithDisplay />)

    expect(screen.getByTestId(TestID.TokenDetailsProvenance)).toBeInTheDocument()
    expect(screen.queryByText('Launch method')).toBeNull()
    expect(screen.queryByText('Custom Auction')).toBeNull()
    expect(screen.queryByText('Crowd Launch')).toBeNull()
    expect(screen.queryByTestId(TestID.LaunchMethodExplainerModal)).toBeNull()
  })

  it.each([
    [AuctionType.CUSTOM, SERVED_CUSTOM_CCA_PROVENANCE, 'Custom Auction', 'custom', 'auction_only', 'uniswap-cca'],
    [AuctionType.CROWD, SERVED_CROWD_CCA_PROVENANCE, 'Crowd Launch', 'crowd', 'trading', 'pools'],
  ] as const)(
    'renders and reports the served method %s',
    (auctionType, served, label, analyticsType, pageLayout, launchpad) => {
      mockStore({
        status: TokenDetailsSourceState.Found,
        auction: { ...auction, auctionType },
        auctions: [{ ...auction, auctionType }],
      })
      mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)
      mocked(useTokenLaunchProvenance).mockReturnValue(served)

      render(<TokenProvenanceWithDisplay />)

      expect(screen.getByTestId(TestID.TokenDetailsProvenanceLaunchMethod)).toHaveTextContent(label)
      expect(sendAnalyticsEvent).toHaveBeenCalledExactlyOnceWith(AuctionEventName.ProvenanceModuleViewed, {
        surface: 'tdp',
        chain_id: UniverseChainId.Mainnet,
        auction_type: analyticsType,
        launch_method: analyticsType,
        entry_point: 'tdp_provenance_module',
        has_auction_history: false,
        auction_phase: 'live',
        pool_availability: 'no_pool',
        page_layout: pageLayout,
        token_address: '0x3333333333333333333333333333333333333333',
        auction_address: AUCTION_ADDRESS,
        launchpad,
      })
    },
  )

  it('logs one settled impression across re-renders with only the allowed dimensions', () => {
    mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction] })
    mocked(useAuctionDisplayDataSources).mockReturnValue(ENDED_WITH_RAISE)

    const { rerender } = render(<TokenProvenanceWithDisplay />)
    rerender(<TokenProvenanceWithDisplay />)

    expect(sendAnalyticsEvent).toHaveBeenCalledExactlyOnceWith(AuctionEventName.ProvenanceModuleViewed, {
      surface: 'tdp',
      chain_id: UniverseChainId.Mainnet,
      auction_type: 'custom',
      launch_method: 'custom',
      entry_point: 'tdp_provenance_module',
      auction_phase: 'ended',
      pool_availability: 'has_pool',
      page_layout: 'trading',
      token_address: '0x3333333333333333333333333333333333333333',
      auction_address: AUCTION_ADDRESS,
      launchpad: UNISWAP_CCA_LAUNCHPAD_ID,
      has_auction_history: true,
    })
  })

  it('reports a second impression for another token from the same launchpad', () => {
    mocked(useTokenLaunchProvenance).mockReturnValue({
      launchpad: { id: 'bankr', name: 'Bankr' },
      method: LaunchProvenanceMethod.InstantLaunch,
    })
    // Two served tokens from one launchpad are one key unless the token scopes it, and navigating
    // between them does not remount the module.
    mockStore({ status: TokenDetailsSourceState.NotFound })
    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)
    const { rerender } = render(<TokenProvenanceWithDisplay />)
    expect(sendAnalyticsEvent).toHaveBeenCalledOnce()

    mockStore(
      { status: TokenDetailsSourceState.NotFound },
      UniverseChainId.Mainnet,
      '0x5555555555555555555555555555555555555555',
    )
    rerender(<TokenProvenanceWithDisplay />)

    expect(sendAnalyticsEvent).toHaveBeenCalledTimes(2)
  })

  it('keeps Unknown with no pool on the trading layout in the impression', () => {
    const unclassified = { ...auction, auctionType: AuctionType.UNSPECIFIED }
    mockStore({ status: TokenDetailsSourceState.Found, auction: unclassified, auctions: [unclassified] })
    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)
    mocked(useTokenLaunchProvenance).mockReturnValue(SERVED_UNCLASSIFIED_CCA)

    render(<TokenProvenanceWithDisplay />)

    expect(sendAnalyticsEvent).toHaveBeenCalledExactlyOnceWith(AuctionEventName.ProvenanceModuleViewed, {
      surface: 'tdp',
      chain_id: UniverseChainId.Mainnet,
      auction_type: 'unknown',
      launch_method: 'unknown',
      entry_point: 'tdp_provenance_module',
      auction_phase: 'live',
      pool_availability: 'no_pool',
      page_layout: 'trading',
      has_auction_history: false,
      token_address: '0x3333333333333333333333333333333333333333',
      auction_address: AUCTION_ADDRESS,
      launchpad: UNISWAP_CCA_LAUNCHPAD_ID,
    })
    expect(useAuctionDisplayDataSources).toHaveBeenCalledWith(
      expect.objectContaining({ tokenAddress: auction.tokenAddress }),
    )
  })

  it.each<Partial<AuctionDisplayDataSources>>([
    { currentBlock: { status: 'loading' } },
    { pools: { status: 'loading' } },
  ])('waits for loading phase and pool sources before sending one impression: %j', (loadingSource) => {
    mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction] })
    mocked(useAuctionDisplayDataSources).mockReturnValue({ ...LIVE, ...loadingSource })
    const { rerender } = render(<TokenProvenanceWithDisplay />)
    expect(sendAnalyticsEvent).not.toHaveBeenCalled()

    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)
    rerender(<TokenProvenanceWithDisplay />)
    expect(sendAnalyticsEvent).toHaveBeenCalledTimes(1)
  })

  it('holds a served impression until the auction lookup answers, so one visit stays one impression', () => {
    mocked(useTokenLaunchProvenance).mockReturnValue({
      launchpad: { id: 'uniswap-cca', name: 'Uniswap CCA Crowd Launch' },
      method: LaunchProvenanceMethod.CustomAuction,
    })
    // Served attribution renders the module while the lookup is still out, and the key it identifies
    // the visit by changes once the auction lands.
    mockStore({ status: TokenDetailsSourceState.Loading })
    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)
    const { rerender } = render(<TokenProvenanceWithDisplay />)
    expect(screen.getByTestId(TestID.TokenDetailsProvenance)).toBeInTheDocument()
    expect(sendAnalyticsEvent).not.toHaveBeenCalled()

    mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction] })
    rerender(<TokenProvenanceWithDisplay />)

    expect(sendAnalyticsEvent).toHaveBeenCalledExactlyOnceWith(
      AuctionEventName.ProvenanceModuleViewed,
      expect.objectContaining({ auction_type: 'custom', auction_phase: 'live' }),
    )
  })

  it('reports the rendered trading layout after a pool error', () => {
    mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction] })
    mocked(useAuctionDisplayDataSources).mockReturnValue({ ...LIVE, pools: { status: 'error' } })

    render(<TokenProvenanceWithDisplay />)

    expect(sendAnalyticsEvent).toHaveBeenCalledWith(
      AuctionEventName.ProvenanceModuleViewed,
      expect.objectContaining({ pool_availability: 'error', page_layout: 'trading' }),
    )
  })

  it.each<AuctionDisplayDataSources['pools']>([{ status: 'success', poolCount: 1 }, { status: 'error' }])(
    'does not count another impression when a failed pool lookup retries and settles as %j',
    (pools) => {
      mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction] })
      mocked(useAuctionDisplayDataSources).mockReturnValue({ ...LIVE, pools: { status: 'error' } })
      const { rerender } = render(<TokenProvenanceWithDisplay />)

      mocked(useAuctionDisplayDataSources).mockReturnValue({ ...LIVE, pools: { status: 'loading' } })
      rerender(<TokenProvenanceWithDisplay />)
      mocked(useAuctionDisplayDataSources).mockReturnValue({ ...ENDED_WITH_RAISE, pools })
      rerender(<TokenProvenanceWithDisplay />)

      expect(sendAnalyticsEvent).toHaveBeenCalledExactlyOnceWith(
        AuctionEventName.ProvenanceModuleViewed,
        expect.objectContaining({ auction_phase: 'live', pool_availability: 'error' }),
      )
    },
  )

  it('counts returning to an auction even when the intervening selection never finished loading', () => {
    mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction] })
    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)
    const { rerender } = render(<TokenProvenanceWithDisplay />)

    const otherAuction = { ...auction, address: '0x4444444444444444444444444444444444444444' }
    mockStore({ status: TokenDetailsSourceState.Found, auction: otherAuction, auctions: [otherAuction] })
    mocked(useAuctionDisplayDataSources).mockReturnValue({ ...LIVE, pools: { status: 'loading' } })
    rerender(<TokenProvenanceWithDisplay />)
    expect(sendAnalyticsEvent).toHaveBeenCalledTimes(1)

    mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction] })
    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)
    rerender(<TokenProvenanceWithDisplay />)

    expect(sendAnalyticsEvent).toHaveBeenCalledTimes(2)
  })

  it('starts a new visit after there is no selected auction, waiting for its display sources', () => {
    mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction] })
    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)
    const { rerender } = render(<TokenProvenanceWithDisplay />)

    mockStore({ status: TokenDetailsSourceState.Loading })
    rerender(<TokenProvenanceWithDisplay />)
    expect(sendAnalyticsEvent).toHaveBeenCalledTimes(1)

    mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction] })
    mocked(useAuctionDisplayDataSources).mockReturnValue({ ...LIVE, pools: { status: 'loading' } })
    rerender(<TokenProvenanceWithDisplay />)
    expect(sendAnalyticsEvent).toHaveBeenCalledTimes(1)

    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)
    rerender(<TokenProvenanceWithDisplay />)
    expect(sendAnalyticsEvent).toHaveBeenCalledTimes(2)
  })

  it('counts each chain selection even when the auction contract address is identical', () => {
    mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction] })
    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)
    const { rerender } = render(<TokenProvenanceWithDisplay />)

    mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction] }, UniverseChainId.Base)
    rerender(<TokenProvenanceWithDisplay />)
    mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction] })
    rerender(<TokenProvenanceWithDisplay />)

    expect(mocked(sendAnalyticsEvent).mock.calls.map(([, payload]) => payload)).toEqual([
      expect.objectContaining({ chain_id: UniverseChainId.Mainnet }),
      expect.objectContaining({ chain_id: UniverseChainId.Base }),
      expect.objectContaining({ chain_id: UniverseChainId.Mainnet }),
    ])
  })

  it('does not count an address casing change as another selection', () => {
    const address = '0xabcdefabcdefabcdefabcdefabcdefabcdefabcd'
    mockStore({
      status: TokenDetailsSourceState.Found,
      auction: { ...auction, address },
      auctions: [{ ...auction, address }],
    })
    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)
    const { rerender } = render(<TokenProvenanceWithDisplay />)

    mockStore({
      status: TokenDetailsSourceState.Found,
      auction: { ...auction, address: `0x${address.slice(2).toUpperCase()}` },
      auctions: [{ ...auction, address: `0x${address.slice(2).toUpperCase()}` }],
    })
    rerender(<TokenProvenanceWithDisplay />)

    expect(sendAnalyticsEvent).toHaveBeenCalledTimes(1)
  })

  it('records one selector opening per opening, with the displayed auction count', () => {
    mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction, sibling, auction] })
    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)

    render(<TokenProvenanceWithDisplay />)
    fireEvent.click(screen.getByRole('button', { name: 'Details' }))

    const selectorOpened = (): unknown[] =>
      mocked(sendAnalyticsEvent)
        .mock.calls.filter(([event]) => event === AuctionEventName.AuctionSelectorOpened)
        .map(([, payload]) => payload)
    expect(selectorOpened()).toEqual([
      {
        chain_id: UniverseChainId.Mainnet,
        token_address: expect.any(String),
        auction_count: 2,
        entry_point: 'tdp_provenance_module',
      },
    ])
    // Opening the selector is not a navigation: the ADP event belongs to selecting an auction.
    expect(sendAnalyticsEvent).not.toHaveBeenCalledWith(
      AuctionEventName.TokenDetailsToAuctionDetailsClicked,
      expect.anything(),
    )

    fireEvent.click(screen.getByText('close auction list'))
    fireEvent.click(screen.getByRole('button', { name: 'Details' }))
    expect(selectorOpened()).toHaveLength(2)
  })

  it('logs the allowed navigation event from the auction history Details link', () => {
    mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction] })
    mocked(useAuctionDisplayDataSources).mockReturnValue(ENDED_WITH_RAISE)

    render(<TokenProvenanceWithDisplay />)
    fireEvent.click(screen.getByText('Details'))

    expect(sendAnalyticsEvent).toHaveBeenCalledWith(AuctionEventName.TokenDetailsToAuctionDetailsClicked, {
      surface: 'tdp',
      chain_id: UniverseChainId.Mainnet,
      auction_type: 'custom',
      launch_method: 'custom',
      entry_point: 'tdp_provenance_module',
      auction_phase: 'ended',
      pool_availability: 'has_pool',
      page_layout: 'trading',
      token_address: '0x3333333333333333333333333333333333333333',
      auction_address: AUCTION_ADDRESS,
      launchpad: UNISWAP_CCA_LAUNCHPAD_ID,
      destination: 'auction_details',
    })
  })
  it('shows the served first trade and never the auction creation date', () => {
    mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction] })
    mocked(useAuctionDisplayDataSources).mockReturnValue(ENDED_WITH_RAISE)
    const { rerender } = render(<TokenProvenanceWithDisplay />)
    expect(screen.queryByText('First traded')).toBeNull()
    expect(screen.queryByText('Aug 8, 2026')).toBeNull()

    mocked(useTokenLaunchProvenance).mockReturnValue({
      launchpad: { id: 'uniswap-cca', name: 'Uniswap CCA Custom Launch' },
      method: LaunchProvenanceMethod.CustomAuction,
      firstTradedAt: new Date('2026-09-01T12:00:00Z'),
    })
    rerender(<TokenProvenanceWithDisplay />)

    expect(screen.getByText('First traded')).toBeInTheDocument()
    expect(screen.getByText('Sep 1, 2026')).toBeInTheDocument()
  })
  it('waits for the auction lookup before reporting an offline visit', () => {
    mockStore({ status: TokenDetailsSourceState.Loading })
    mocked(useTokenLaunchProvenance).mockReturnValue({
      launchpad: { id: 'uniswap-cca', name: 'Uniswap' },
      method: LaunchProvenanceMethod.CustomAuction,
    })
    mocked(useAuctionDisplayDataSources).mockReturnValue(LIVE)
    // Offline the display stops waiting on the lookup, so only its own status keeps the key off the
    // launchpad until the auction lands and makes it the auction's.
    onlineManager.setOnline(false)
    const { rerender } = render(<TokenProvenanceWithDisplay />)
    expect(sendAnalyticsEvent).not.toHaveBeenCalled()

    mockStore({ status: TokenDetailsSourceState.Found, auction, auctions: [auction] })
    act(() => onlineManager.setOnline(true))
    rerender(<TokenProvenanceWithDisplay />)

    expect(sendAnalyticsEvent).toHaveBeenCalledOnce()
  })
})

// Presentation fixtures are normalized data, not invented fields on the generated Token contract.
describe('TokenProvenanceContent', () => {
  const provenance: LaunchProvenance = {
    launchpad: { id: 'pons', name: 'Pons', logoUrl: 'https://example.com/pons.png' },
    method: LaunchProvenanceMethod.ThirdParty,
    firstTradedAt: new Date('2026-09-01T12:00:00Z'),
  }
  const NO_CREATOR = {
    name: '--',
    href: undefined,
    verified: false,
    avatarUrl: undefined,
    address: undefined,
    chainId: UniverseChainId.Mainnet,
  }

  it('opens the auction selector instead of navigating to the primary auction', () => {
    const onShowAuctions = vi.fn()
    render(
      <TokenProvenanceContent
        provenance={provenance}
        auctionData={{
          creator: NO_CREATOR,
          raised: {
            usd: 10250,
            failed: false,
            count: 2,
            destination: { href: '/primary-auction', isExternal: false },
          },
        }}
        onShowAuctions={onShowAuctions}
      />,
    )
    fireEvent.click(screen.getByRole('button', { name: 'Details' }))
    expect(onShowAuctions).toHaveBeenCalledOnce()
    expect(screen.queryByRole('link', { name: 'Details' })).toBeNull()
  })

  it('opens an external auction history in a new tab', () => {
    const onDetailsPress = vi.fn()
    render(
      <TokenProvenanceContent
        provenance={{ ...provenance, method: LaunchProvenanceMethod.CrowdLaunch }}
        onDetailsPress={onDetailsPress}
        auctionData={{
          creator: NO_CREATOR,
          raised: {
            usd: 10_000,
            failed: false,
            count: 1,
            destination: { href: `https://pools.xyz/t/robinhood/${auction.tokenAddress}`, isExternal: true },
          },
        }}
      />,
    )

    const details = screen.getByRole('link', { name: 'Details' })
    expect(details).toHaveAttribute('href', `https://pools.xyz/t/robinhood/${auction.tokenAddress}`)
    expect(details).toHaveAttribute('target', '_blank')
    expect(details).toHaveAttribute('rel', 'noopener noreferrer')
    fireEvent.click(details)
    expect(onDetailsPress).toHaveBeenCalledExactlyOnceWith('pools')
  })

  it('shows the auction history without a Details link when no page can be addressed', () => {
    render(
      <TokenProvenanceContent
        provenance={{ ...provenance, method: LaunchProvenanceMethod.CrowdLaunch }}
        auctionData={{
          creator: NO_CREATOR,
          raised: { usd: 10_000, failed: false, count: 1, destination: undefined },
        }}
      />,
    )

    expect(screen.getByText('Auction history')).toBeInTheDocument()
    expect(screen.queryByRole('link', { name: 'Details' })).toBeNull()
  })

  it('shows a $0 raise as $0, not the missing-stat dash', () => {
    render(
      <TokenProvenanceContent
        provenance={{ ...provenance, method: LaunchProvenanceMethod.InstantLaunch }}
        auctionData={{ creator: NO_CREATOR, raised: { usd: 0, failed: false, count: 7, destination: undefined } }}
      />,
    )

    expect(screen.getByText('$0 raised')).toBeInTheDocument()
  })

  it('falls back to the person icon when the creator avatar fails to load', () => {
    const avatarUrl = 'https://pbs.twimg.com/profile_images/stale.jpg'
    const { container } = render(
      <TokenProvenanceContent
        provenance={provenance}
        auctionData={{ creator: { ...NO_CREATOR, name: '@creator', avatarUrl }, raised: undefined }}
      />,
    )

    fireEvent.error(container.querySelector(`img[src="${avatarUrl}"]`) as HTMLImageElement)

    expect(container.querySelector(`img[src="${avatarUrl}"]`)).toBeNull()
  })

  it('opens the wallet hover card on the creator, even when an X handle is what it shows', async () => {
    // The card reads the wallet's portfolio, so it needs the Uniswap context the page has.
    renderWithUniswapContext(
      <TokenProvenanceContent
        provenance={provenance}
        auctionData={{
          creator: { ...NO_CREATOR, name: '@uniswap', href: 'https://x.com/uniswap', address: auction.creatorAddress },
          raised: undefined,
        }}
      />,
    )

    // The first hover mounts the card; hovering the popover trigger it adds then opens it.
    fireEvent.mouseEnter(screen.getByText('@uniswap'))
    const trigger = screen.getByText('@uniswap').closest('[data-slot="ui-popover-trigger"]') as HTMLElement
    fireEvent.mouseEnter(trigger)
    fireEvent.mouseMove(trigger)

    await waitFor(() => expect(screen.getByTestId(TestID.AddressHoverCardExplorerLink)).toBeVisible())
  })

  it('renders a third-party launchpad and date without inventing auction rows', () => {
    render(<TokenProvenanceContent provenance={provenance} />)

    expect(screen.getByText('Pons')).toBeInTheDocument()
    expect(screen.getByTestId(TestID.LaunchpadLogo)).toBeInTheDocument()
    expect(screen.getByText('First traded')).toBeInTheDocument()
    expect(screen.queryByText('Created by')).toBeNull()
    expect(screen.queryByText('Auction history')).toBeNull()
    expect(screen.queryByText('Launch method')).toBeNull()
    expect(sendAnalyticsEvent).not.toHaveBeenCalled()
  })

  it.each([
    [LaunchProvenanceMethod.CustomAuction, 'Custom Auction', 'Custom Auctions', /CCA protocol\.$/],
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

  it('keeps the launchpad while omitting an unknown method and an unserved first trade', () => {
    render(
      <TokenProvenanceContent
        provenance={{ ...provenance, method: LaunchProvenanceMethod.Unknown, firstTradedAt: undefined }}
      />,
    )

    expect(screen.getByText('Pons')).toBeInTheDocument()
    expect(screen.queryByText('First traded')).toBeNull()
    expect(screen.queryByTestId(TestID.TokenDetailsProvenanceLaunchMethod)).toBeNull()
  })

  it('sends the launchpad cell to the launchpad site when one is served', () => {
    render(
      <TokenProvenanceContent
        provenance={{ ...provenance, launchpad: { ...provenance.launchpad, url: 'https://pons.example' } }}
      />,
    )

    const link = screen.getByText('Pons').closest('a')
    expect(link).toHaveAttribute('href', 'https://pons.example')
    expect(link).toHaveAttribute('target', '_blank')
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
