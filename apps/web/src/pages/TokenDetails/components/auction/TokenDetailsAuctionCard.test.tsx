import type { PlainMessage } from '@bufbuild/protobuf'
import type { Auction } from '@uniswap/client-launches/dist/data/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { AuctionEventName } from 'uniswap/src/features/telemetry/constants'
import { sendAnalyticsEvent } from 'uniswap/src/features/telemetry/send'
import { analytics } from 'utilities/src/telemetry/analytics/analytics'
import { afterEach, beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AuctionDisplayPhase,
  AuctionDisplayResult,
  PoolAvailability,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { TokenDetailsAuctionCard } from '~/pages/TokenDetails/components/auction/TokenDetailsAuctionCard'
import {
  type TokenDetailsAuctionDisplayModel,
  useTokenDetailsAuctionDisplay,
} from '~/pages/TokenDetails/hooks/useTokenDetailsAuctionDisplay'
import { mocked } from '~/test-utils/mocked'
import { act, fireEvent, render, screen } from '~/test-utils/render'

vi.unmock('uniswap/src/features/telemetry/Trace')
// Trace's web path does not use React Navigation; avoid loading its native ESM dependency tree.
vi.mock('@react-navigation/core', () => ({ useFocusEffect: vi.fn() }))

vi.mock('~/pages/TokenDetails/hooks/useTokenDetailsCcaAuctions', () => ({
  useTokenDetailsCcaAuctions: () => [AUCTION, AUCTION, AUCTION],
}))

const mockNavigate = vi.fn()
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}))
vi.mock('~/pages/TokenDetails/hooks/useTokenDetailsAuctionDisplay', () => ({
  useTokenDetailsAuctionDisplay: vi.fn(),
}))
vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({
  useTDPStore: (selector: (state: { tokenColor: string }) => unknown) => selector({ tokenColor: '#7482ff' }),
}))
vi.mock('uniswap/src/features/telemetry/send', () => ({
  sendAnalyticsEvent: vi.fn(),
}))

const AUCTION_ADDRESS = '0x1111111111111111111111111111111111111111'
const AUCTION = {
  address: AUCTION_ADDRESS,
  tokenAddress: '0x3333333333333333333333333333333333333333',
  isQuickLaunch: false,
  startBlock: '100',
  endBlock: '200',
} as PlainMessage<Auction>
const FOUR_HOURS_MS = 4 * 60 * 60 * 1000
const mockRefetchCurrentBlock = vi.fn()

function mockDisplay(overrides: Partial<TokenDetailsAuctionDisplayModel> = {}): void {
  mocked(useTokenDetailsAuctionDisplay).mockReturnValue({
    isInitialLoading: false,
    isAuctionOnlyPending: false,
    hasConfirmedPool: false,
    auction: AUCTION,
    chainId: UniverseChainId.Mainnet,
    launchMethod: LaunchProvenanceMethod.CustomAuction,
    provenance: undefined,
    phase: AuctionDisplayPhase.Live,
    result: AuctionDisplayResult.Unknown,
    poolAvailability: PoolAvailability.NoPool,
    shouldShowSwap: false,
    phaseEndsAtMs: Date.now() + FOUR_HOURS_MS,
    currencyRaised: { status: 'idle' },
    currentBlock: { status: 'success', blockNumber: 150n },
    refetchCurrentBlock: mockRefetchCurrentBlock,
    ...overrides,
  })
}

describe('TokenDetailsAuctionCard', () => {
  afterEach(() => {
    vi.restoreAllMocks()
  })

  beforeEach(() => {
    mockNavigate.mockReset()
    mockRefetchCurrentBlock.mockReset()
    vi.mocked(sendAnalyticsEvent).mockClear()
  })

  it('shows the live title, launch method pill and countdown, and links to the auction', () => {
    mockDisplay()

    render(<TokenDetailsAuctionCard />)

    expect(screen.getByText('Launch in progress')).toBeInTheDocument()
    expect(screen.getByText('Custom Auction')).toBeInTheDocument()
    expect(screen.getByText(/^3h 59m 5\ds remaining$/)).toBeInTheDocument()
    expect(mockRefetchCurrentBlock).not.toHaveBeenCalled()

    fireEvent.click(screen.getByTestId(TestID.TokenDetailsAuctionCardViewAuction))
    expect(mockNavigate).toHaveBeenCalledWith(`/explore/auctions/ethereum/${AUCTION_ADDRESS}`)
    expect(sendAnalyticsEvent).toHaveBeenCalledWith(AuctionEventName.TokenDetailsToAuctionDetailsClicked, {
      surface: 'tdp',
      chain_id: UniverseChainId.Mainnet,
      auction_type: 'custom',
      launch_method: 'custom',
      entry_point: 'tdp_countdown_module',
      auction_count: 3,
      auction_phase: 'live',
      pool_availability: 'no_pool',
      page_layout: 'auction_only',
    })
  })

  it.each([AuctionDisplayPhase.Live, AuctionDisplayPhase.Upcoming])(
    'records one countdown impression when loading resolves to %s',
    async (phase) => {
      const sendEvent = vi.spyOn(analytics, 'sendEvent').mockImplementation(() => undefined)
      mockDisplay({ phase: AuctionDisplayPhase.Loading, phaseEndsAtMs: undefined })
      const { rerender } = render(<TokenDetailsAuctionCard />)
      expect(sendEvent).not.toHaveBeenCalledWith(AuctionEventName.AuctionBannerViewed, expect.anything())

      mockDisplay({ phase })
      rerender(<TokenDetailsAuctionCard />)
      // Let Trace's 50ms development dedupe expire before checking subsequent renders.
      await act(() => new Promise<void>((resolve) => setTimeout(resolve, 51)))
      rerender(<TokenDetailsAuctionCard />)

      const impressions = sendEvent.mock.calls.filter(([event]) => event === AuctionEventName.AuctionBannerViewed)
      expect(impressions).toHaveLength(1)
      expect(impressions[0]?.[1]).toMatchObject({
        surface: 'tdp',
        entry_point: 'tdp_countdown_module',
        auction_phase: phase.toLowerCase(),
        auction_count: 3,
      })
    },
  )

  it.each([AuctionDisplayPhase.Unknown, AuctionDisplayPhase.Ended])(
    'does not report an active countdown impression for %s',
    (phase) => {
      const sendEvent = vi.spyOn(analytics, 'sendEvent').mockImplementation(() => undefined)
      mockDisplay({ phase, phaseEndsAtMs: undefined })

      render(<TokenDetailsAuctionCard />)

      expect(sendEvent).not.toHaveBeenCalledWith(AuctionEventName.AuctionBannerViewed, expect.anything())
    },
  )

  it('re-reads the chain head once the countdown reaches zero instead of flipping the phase itself', () => {
    mockDisplay({ phaseEndsAtMs: Date.now() - 1 })

    render(<TokenDetailsAuctionCard />)

    expect(screen.getByText('Launch in progress')).toBeInTheDocument()
    expect(screen.getByText('0s remaining')).toBeInTheDocument()
    expect(mockRefetchCurrentBlock).toHaveBeenCalledTimes(1)
  })

  it('keeps the upcoming auction link without fabricating a start countdown', () => {
    mockDisplay({ phase: AuctionDisplayPhase.Upcoming, phaseEndsAtMs: undefined })

    render(<TokenDetailsAuctionCard />)

    expect(screen.getByText('Starting soon')).toBeInTheDocument()
    expect(screen.queryByText('Auction starts in')).toBeNull()
    expect(screen.getByTestId(TestID.TokenDetailsAuctionCardViewAuction)).toBeInTheDocument()
  })

  it('shows the upcoming countdown separately from its label', () => {
    mockDisplay({ phase: AuctionDisplayPhase.Upcoming })

    render(<TokenDetailsAuctionCard />)

    expect(screen.getByText('Starting soon')).toBeInTheDocument()
    expect(screen.getByText('Auction starts in')).toBeInTheDocument()
    expect(screen.getByText(/^3h 59m 5\ds$/)).toBeInTheDocument()
    expect(screen.queryByText(/remaining/)).toBeNull()
  })

  it('shows a minimal ended state without a countdown', () => {
    mockDisplay({ phase: AuctionDisplayPhase.Ended, phaseEndsAtMs: undefined })

    render(<TokenDetailsAuctionCard />)

    expect(screen.getByText('Auction ended')).toBeInTheDocument()
    expect(screen.queryByText(/remaining/)).toBeNull()
    expect(screen.getByTestId(TestID.TokenDetailsAuctionCardViewAuction)).toBeInTheDocument()
  })

  it('reports an unavailable status when the block read failed but keeps the auction link', () => {
    mockDisplay({ phase: AuctionDisplayPhase.Unknown, phaseEndsAtMs: undefined })

    render(<TokenDetailsAuctionCard />)

    expect(screen.getByText('Auction status unavailable')).toBeInTheDocument()
    expect(screen.queryByText(/remaining/)).toBeNull()
    expect(screen.getByTestId(TestID.TokenDetailsAuctionCardViewAuction)).toBeInTheDocument()
  })

  it('opens the launch method explainer from the pill', () => {
    mockDisplay()

    render(<TokenDetailsAuctionCard />)

    expect(screen.queryByText('Custom Auctions')).toBeNull()
    fireEvent.click(screen.getByTestId(TestID.TokenDetailsAuctionCardLaunchMethod))
    expect(screen.getByText('Custom Auctions')).toBeInTheDocument()
  })

  it('renders nothing without a resolved auction', () => {
    mockDisplay({
      auction: undefined,
      launchMethod: LaunchProvenanceMethod.Unknown,
      phase: AuctionDisplayPhase.Unknown,
    })

    render(<TokenDetailsAuctionCard />)

    expect(screen.queryByTestId(TestID.TokenDetailsAuctionCard)).toBeNull()
  })

  it('renders nothing when the launch method is unknown', () => {
    mockDisplay({ launchMethod: LaunchProvenanceMethod.Unknown })

    render(<TokenDetailsAuctionCard />)

    expect(screen.queryByTestId(TestID.TokenDetailsAuctionCard)).toBeNull()
  })
})
