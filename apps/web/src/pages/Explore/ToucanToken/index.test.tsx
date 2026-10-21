import { FeatureFlags, useFeatureFlag } from '@universe/gating'
import { useParams } from 'react-router'
import { ToucanToken, shouldShowToucanIntroModal } from '~/pages/Explore/ToucanToken'
import { mocked } from '~/test-utils/mocked'
import { render, screen, waitFor } from '~/test-utils/render'

const { HEADER_PROBE, INTRO_BANNER_PROBE, STATS_BANNER_PROBE } = vi.hoisted(() => ({
  HEADER_PROBE: 'toucan-token-header-probe',
  INTRO_BANNER_PROBE: 'toucan-token-intro-banner-probe',
  STATS_BANNER_PROBE: 'toucan-token-stats-banner-probe',
}))

vi.mock('react-router', async () => {
  const actual = await vi.importActual('react-router')
  return {
    ...actual,
    default: actual,
    useParams: vi.fn(),
  }
})

// The global setup mock of this module omits useActiveAddress, which ToucanToken needs
vi.mock('uniswap/src/features/accounts/store/hooks', () => ({
  useConnectionStatus: vi.fn(() => ({ isConnecting: false })),
  useActiveAddress: vi.fn(() => undefined),
}))

// GetAuction is only reachable from useLoadAuctionDetails, which mounts inside the real
// AuctionStoreProvider. The provider is deliberately NOT mocked here: mocking it away would make
// `expect(mockGetAuctionQuery).not.toHaveBeenCalled()` unfalsifiable, since the only call site would
// be stubbed out along with it. Instead the network layer is stubbed and the real provider mounts,
// so the spy is genuinely reached whenever the route params are accepted.
//
// `auctionsResponse` controls what GetAuction settles with. While it is undefined the query is left
// disabled, so the page renders its loading tree; a test that needs a settled response sets it first.
let auctionsResponse: { auctions: unknown[] } | undefined

const mockGetAuctionQuery = vi.fn((input: { params?: unknown; enabled?: boolean }) => ({
  queryKey: ['mock-getAuction', input.params],
  queryFn: async () => auctionsResponse,
  enabled: Boolean(input.enabled) && auctionsResponse !== undefined,
}))

// The provider's other loaders (checkpoint, user bids, bid distribution, tick details) are inert:
// they are not what this suite is about, and leaving them enabled would hit the network.
function inertQuery(name: string) {
  return (input: { params?: unknown }) => ({
    queryKey: [`mock-${name}`, input.params],
    queryFn: async () => undefined,
    enabled: false,
  })
}

vi.mock('uniswap/src/data/apiClients/dataApiService/auctions/auctionQueries', () => ({
  auctionQueries: {
    getAuction: (...args: [{ params?: unknown; enabled?: boolean }]) => mockGetAuctionQuery(...args),
    getAuctionActivity: inertQuery('getAuctionActivity'),
    getBids: inertQuery('getBids'),
    getBidsByWallet: inertQuery('getBidsByWallet'),
    getClearingPriceHistory: inertQuery('getClearingPriceHistory'),
    getLatestCheckpoint: inertQuery('getLatestCheckpoint'),
    getTickDetails: inertQuery('getTickDetails'),
    listTopAuctions: inertQuery('listTopAuctions'),
  },
}))

// Heavy transaction subtrees (sagas) that vitest cannot parse and that are irrelevant here
vi.mock('~/features/Toucan/Auction/BidForm/BidForm', () => ({
  BidForm: () => null,
}))
vi.mock('~/features/Toucan/Auction/Bids/Bids', () => ({
  Bids: () => null,
}))
vi.mock('~/features/Toucan/Auction/Bids/WithdrawModal/WithdrawModal', () => ({
  WithdrawModal: () => null,
}))

// Placement probes: the header, the live countdown banner and the stats banner all self-gate on
// store data this suite never loads, so each is swapped for a marker that only records where the
// page mounted it.
vi.mock('~/features/Toucan/Auction/AuctionHeader', () => ({
  AuctionHeader: () => <div data-testid={HEADER_PROBE} />,
}))
vi.mock('~/features/Toucan/Auction/Banners/AuctionIntro/AuctionIntroBanner', () => ({
  AuctionIntroBanner: () => <div data-testid={INTRO_BANNER_PROBE} />,
}))
vi.mock('~/features/Toucan/Auction/Banners/AuctionStatsBanner/AuctionStatsBanner', () => ({
  AuctionStatsBanner: () => <div data-testid={STATS_BANNER_PROBE} />,
}))

// Valid EIP-55 checksummed address (USDC mainnet) and its casing variants
const CHECKSUMMED_ADDRESS = '0xA0b86991c6218b36c1d19D4a2e9Eb0cE3606eB48'
const LOWERCASE_ADDRESS = '0xa0b86991c6218b36c1d19d4a2e9eb0ce3606eb48'
const UPPERCASE_ADDRESS = '0xA0B86991C6218B36C1D19D4A2E9EB0CE3606EB48'
const BAD_CHECKSUM_ADDRESS = '0xa0B86991c6218b36c1d19d4a2e9eb0ce3606eb48'

function renderWithParams({ chainName, auctionAddress }: { chainName?: string; auctionAddress?: string }) {
  mocked(useParams).mockReturnValue({ chainName, auctionAddress })
  return render(<ToucanToken />)
}

function expectNotFoundPage() {
  expect(screen.getByText('404')).toBeInTheDocument()
  expect(mockGetAuctionQuery).not.toHaveBeenCalled()
}

function expectAuctionPage() {
  // Reaching GetAuction is the observable difference between an accepted and a rejected route:
  // the provider only mounts once the guard passes.
  expect(mockGetAuctionQuery).toHaveBeenCalled()
  expect(screen.queryByText('404')).not.toBeInTheDocument()
}

describe('ToucanToken route param validation', () => {
  beforeEach(() => {
    auctionsResponse = undefined
    vi.clearAllMocks()
  })

  describe('valid addresses render the auction page', () => {
    it('accepts an all-lowercase address', () => {
      renderWithParams({ chainName: 'ethereum', auctionAddress: LOWERCASE_ADDRESS })
      expectAuctionPage()
    })

    it('accepts a checksummed address', () => {
      renderWithParams({ chainName: 'ethereum', auctionAddress: CHECKSUMMED_ADDRESS })
      expectAuctionPage()
    })

    it('accepts an all-uppercase address', () => {
      renderWithParams({ chainName: 'ethereum', auctionAddress: UPPERCASE_ADDRESS })
      expectAuctionPage()
    })

    it('accepts a mixed-case address with an invalid checksum (API lowercases addresses)', () => {
      renderWithParams({ chainName: 'ethereum', auctionAddress: BAD_CHECKSUM_ADDRESS })
      expectAuctionPage()
    })
  })

  describe('malformed addresses render a 404 without querying GetAuction', () => {
    it('rejects a truncated address', () => {
      renderWithParams({ chainName: 'ethereum', auctionAddress: '0xa0b86991c6218b36' })
      expectNotFoundPage()
    })

    it('rejects an address that is too long', () => {
      renderWithParams({ chainName: 'ethereum', auctionAddress: `${LOWERCASE_ADDRESS}ff` })
      expectNotFoundPage()
    })

    it('rejects a 42-character address containing non-hex characters', () => {
      renderWithParams({ chainName: 'ethereum', auctionAddress: `0x${'z'.repeat(40)}` })
      expectNotFoundPage()
    })

    it('rejects an address without a 0x prefix', () => {
      renderWithParams({ chainName: 'ethereum', auctionAddress: `00${LOWERCASE_ADDRESS.slice(2)}` })
      expectNotFoundPage()
    })

    // ethers' getAddress matches /^(0x)?[0-9a-fA-F]{40}$/ and prepends a missing `0x`, so a bare
    // 40-hex param is accepted by a checksum-only guard and then forwarded to GetAuction unprefixed.
    it('rejects a bare 40-hex address with no 0x prefix', () => {
      renderWithParams({ chainName: 'ethereum', auctionAddress: LOWERCASE_ADDRESS.slice(2) })
      expectNotFoundPage()
    })

    it('rejects a non-address string', () => {
      renderWithParams({ chainName: 'ethereum', auctionAddress: 'vitalik.eth' })
      expectNotFoundPage()
    })

    it('rejects a missing address', () => {
      renderWithParams({ chainName: 'ethereum', auctionAddress: undefined })
      expectNotFoundPage()
    })
  })

  describe('invalid chains render a 404 without querying GetAuction', () => {
    it('rejects an unknown chain name', () => {
      renderWithParams({ chainName: 'not-a-chain', auctionAddress: LOWERCASE_ADDRESS })
      expectNotFoundPage()
    })

    it('rejects a non-EVM chain', () => {
      renderWithParams({ chainName: 'solana', auctionAddress: LOWERCASE_ADDRESS })
      expectNotFoundPage()
    })

    it('rejects a missing chain name', () => {
      renderWithParams({ chainName: undefined, auctionAddress: LOWERCASE_ADDRESS })
      expectNotFoundPage()
    })
  })

  describe('a well-formed address the API does not know', () => {
    it('renders a 404 once GetAuction reports no auction', async () => {
      // GetAuction settles with an empty auction list, which drives the store to
      // AuctionDetailsLoadState.NotFound - the branch ToucanTokenContent renders <NotFound /> for.
      auctionsResponse = { auctions: [] }

      renderWithParams({ chainName: 'ethereum', auctionAddress: LOWERCASE_ADDRESS })

      // The guard accepts this address, so unlike the malformed cases the API really is queried.
      expect(mockGetAuctionQuery).toHaveBeenCalled()
      await waitFor(() => {
        expect(screen.getByText('404')).toBeInTheDocument()
      })
    })
  })
})

describe('ToucanToken live countdown banner placement', () => {
  // A different auction from the suites above: the shared query client keeps their settled
  // "no auction" response cached under that address, which would render the 404 page here.
  const PLACEMENT_ADDRESS = '0x687cc38d8279df3352b64cf3ec1fe8e033933595'

  beforeEach(() => {
    auctionsResponse = undefined
    vi.clearAllMocks()
  })

  function getProbeOrder(): string[] {
    return [HEADER_PROBE, INTRO_BANNER_PROBE, STATS_BANNER_PROBE]
      .map((probe) => screen.getByTestId(probe))
      .sort((a, b) => (a.compareDocumentPosition(b) & Node.DOCUMENT_POSITION_FOLLOWING ? -1 : 1))
      .map((element) => element.dataset.testid ?? '')
  }

  it('sits in the page body above the stats with the TokenProvenance flag on', () => {
    mocked(useFeatureFlag).mockImplementation((flag) => flag === FeatureFlags.TokenProvenance)

    renderWithParams({ chainName: 'ethereum', auctionAddress: PLACEMENT_ADDRESS })

    expect(getProbeOrder()).toEqual([HEADER_PROBE, INTRO_BANNER_PROBE, STATS_BANNER_PROBE])
    expect(screen.getByTestId(STATS_BANNER_PROBE).parentElement?.style.overflowAnchor).toBe('none')
  })

  it('stays above the header with the flag off', () => {
    mocked(useFeatureFlag).mockReturnValue(false)

    renderWithParams({ chainName: 'ethereum', auctionAddress: PLACEMENT_ADDRESS })

    expect(getProbeOrder()).toEqual([INTRO_BANNER_PROBE, HEADER_PROBE, STATS_BANNER_PROBE])
    expect(screen.getByTestId(STATS_BANNER_PROBE).parentElement?.style.overflowAnchor).not.toBe('none')
  })
})

describe('shouldShowToucanIntroModal', () => {
  const WALLET = '0x1111111111111111111111111111111111111111'
  const base = {
    rehydrated: true,
    seenThisSession: false,
    walletAddress: undefined as string | undefined,
    hasSeenDisconnected: false,
    hasWalletSeen: false,
  }

  it('opens for a first-time visitor', () => {
    expect(shouldShowToucanIntroModal(base)).toBe(true)
  })

  it('stays closed until redux-persist has rehydrated, when both flags still read false', () => {
    expect(shouldShowToucanIntroModal({ ...base, rehydrated: false })).toBe(false)
  })

  it('stays closed for the rest of the session once dismissed', () => {
    expect(shouldShowToucanIntroModal({ ...base, seenThisSession: true })).toBe(false)
  })

  // The address is undefined for the first frames of a reconnect, so a visitor who dismissed while
  // connected is only recognised here by the disconnected flag.
  it('stays closed while a returning visitor reconnects', () => {
    expect(shouldShowToucanIntroModal({ ...base, hasSeenDisconnected: true })).toBe(false)
  })

  it('opens for a wallet that has not seen it, even once the disconnected flag is set', () => {
    expect(shouldShowToucanIntroModal({ ...base, walletAddress: WALLET, hasSeenDisconnected: true })).toBe(true)
    expect(
      shouldShowToucanIntroModal({ ...base, walletAddress: WALLET, hasSeenDisconnected: true, hasWalletSeen: true }),
    ).toBe(false)
  })
})
