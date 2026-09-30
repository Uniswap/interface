import type { PlainMessage } from '@bufbuild/protobuf'
import type { Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuctionLaunchMethod } from '~/features/Toucan/Auction/utils/auctionLaunchMethod'
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
import { fireEvent, render, screen } from '~/test-utils/render'

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
    auction: AUCTION,
    chainId: UniverseChainId.Mainnet,
    launchMethod: AuctionLaunchMethod.Custom,
    phase: AuctionDisplayPhase.Live,
    result: AuctionDisplayResult.Unknown,
    poolAvailability: PoolAvailability.NoPool,
    shouldShowSwap: false,
    phaseEndsAtMs: Date.now() + FOUR_HOURS_MS,
    currencyRaised: { status: 'idle' },
    refetchCurrentBlock: mockRefetchCurrentBlock,
    ...overrides,
  })
}

describe('TokenDetailsAuctionCard', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockRefetchCurrentBlock.mockReset()
  })

  it('shows the live title, launch method pill and countdown, and links to the auction', () => {
    mockDisplay()

    render(<TokenDetailsAuctionCard />)

    expect(screen.getByText('Launch in progress')).toBeInTheDocument()
    expect(screen.getByText('Custom auction')).toBeInTheDocument()
    expect(screen.getByText(/^3h 59m 5\ds remaining$/)).toBeInTheDocument()
    expect(mockRefetchCurrentBlock).not.toHaveBeenCalled()

    fireEvent.click(screen.getByTestId(TestID.TokenDetailsAuctionCardViewAuction))
    expect(mockNavigate).toHaveBeenCalledWith(`/explore/auctions/ethereum/${AUCTION_ADDRESS}`)
  })

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
    mockDisplay({ auction: undefined, launchMethod: undefined, phase: AuctionDisplayPhase.Unknown })

    render(<TokenDetailsAuctionCard />)

    expect(screen.queryByTestId(TestID.TokenDetailsAuctionCard)).toBeNull()
  })

  it('renders nothing when the launch method is unknown', () => {
    mockDisplay({ launchMethod: undefined })

    render(<TokenDetailsAuctionCard />)

    expect(screen.queryByTestId(TestID.TokenDetailsAuctionCard)).toBeNull()
  })
})
