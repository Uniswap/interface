import type { PlainMessage } from '@bufbuild/protobuf'
import type { Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { UniverseChainId } from '@universe/chains'
import { opacifyRaw } from '@universe/mycelium/theme-hooks-compat'
import { TestID } from '@universe/test'
import { LaunchProvenanceMethod } from 'uniswap/src/features/dataApi/launchProvenance'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import {
  AuctionDisplayPhase,
  AuctionDisplayResult,
  PoolAvailability,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { TokenDetailsAuctionBanner } from '~/pages/TokenDetails/components/auction/TokenDetailsAuctionBanner'
import {
  type TokenDetailsAuctionDisplayModel,
  useTokenDetailsAuctionDisplay,
} from '~/pages/TokenDetails/hooks/useTokenDetailsAuctionDisplay'
import { getOwnStyleProp } from '~/test-utils/getOwnStyleProp'
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
vi.mock('~/pages/TokenDetails/components/auction/TokenDetailsAuctionListEntry', () => ({
  TokenDetailsMoreAuctionsChip: () => <div data-testid={TestID.TokenDetailsMoreAuctionsChip} />,
}))

const AUCTION_ADDRESS = '0x1111111111111111111111111111111111111111'
const AUCTION = {
  address: AUCTION_ADDRESS,
  tokenAddress: '0x3333333333333333333333333333333333333333',
  isQuickLaunch: false,
  startBlock: '100',
  endBlock: '200',
} as PlainMessage<Auction>
const ONE_SECOND_MS = 1000
const SEVEN_DAYS_THIRTEEN_HOURS_MS = (7 * 24 + 13) * 60 * 60 * 1000

function mockDisplay(overrides: Partial<TokenDetailsAuctionDisplayModel> = {}): void {
  mocked(useTokenDetailsAuctionDisplay).mockReturnValue({
    auction: AUCTION,
    chainId: UniverseChainId.Mainnet,
    launchMethod: LaunchProvenanceMethod.CustomAuction,
    phase: AuctionDisplayPhase.Live,
    result: AuctionDisplayResult.Unknown,
    poolAvailability: PoolAvailability.HasPool,
    shouldShowSwap: true,
    isInitialLoading: false,
    phaseEndsAtMs: Date.now() + SEVEN_DAYS_THIRTEEN_HOURS_MS - ONE_SECOND_MS,
    currencyRaised: { status: 'idle' },
    currentBlock: { status: 'success', blockNumber: 150n },
    refetchCurrentBlock: vi.fn(),
    ...overrides,
  })
}

describe('TokenDetailsAuctionBanner', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
  })

  it('shows the live auction countdown and links to the auction page', () => {
    mockDisplay()

    render(<TokenDetailsAuctionBanner />)

    expect(screen.getByText('Auction in progress')).toBeInTheDocument()
    expect(screen.getByText(/^7d 12h 59m$/)).toBeInTheDocument()
    fireEvent.click(screen.getByTestId(TestID.TokenDetailsAuctionBanner))
    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate.mock.calls[0]?.[0]).toMatch(new RegExp(`^/explore/auctions/ethereum/${AUCTION_ADDRESS}$`, 'i'))
  })

  it('renders the more-auctions chip beside the label once the banner is live', () => {
    mockDisplay()

    render(<TokenDetailsAuctionBanner />)

    const chip = screen.getByTestId(TestID.TokenDetailsMoreAuctionsChip)
    expect(chip.parentElement).toBe(screen.getByText('Auction in progress').parentElement)
    expect(getOwnStyleProp(chip.parentElement!, 'gap')).toBe('$spacing16')
  })

  it('allows the countdown to wrap without shrinking it and uses the token accent', () => {
    mockDisplay()

    render(<TokenDetailsAuctionBanner />)

    const banner = screen.getByTestId(TestID.TokenDetailsAuctionBanner)
    const countdown = screen.getByText(/^7d 12h 59m$/)
    expect(getOwnStyleProp(banner, 'flexWrap')).toBe('wrap')
    expect(getOwnStyleProp(countdown.parentElement!, 'flexShrink')).toBe(0)
    expect(getOwnStyleProp(countdown.parentElement!, 'ml')).toBe('auto')
    expect(getOwnStyleProp(countdown, 'color')).toBe('#7482ff')
    expect(getOwnStyleProp(banner, 'backgroundColor')).toBe(opacifyRaw(8, '#7482ff'))
    expect(getOwnStyleProp(banner, 'borderColor')).toBe(opacifyRaw(8, '#7482ff'))
    expect(getOwnStyleProp(banner, 'borderRadius')).toBe('$rounded16')
  })

  it('reserves the initial live banner row without a button or navigation', () => {
    mockDisplay({ isInitialLoading: true, poolAvailability: PoolAvailability.Loading })

    render(<TokenDetailsAuctionBanner />)

    const banner = screen.getByTestId(TestID.TokenDetailsAuctionBanner)
    expect(banner).toHaveAttribute('aria-busy', 'true')
    expect(screen.getByText('Auction in progress')).toBeInTheDocument()
    expect(screen.queryByRole('button')).toBeNull()
    fireEvent.click(banner)
    expect(mockNavigate).not.toHaveBeenCalled()
  })

  it('keeps the same row spacing when the initial placeholder becomes the tradeable banner', () => {
    mockDisplay({ isInitialLoading: true, poolAvailability: PoolAvailability.Loading })
    const { rerender } = render(<TokenDetailsAuctionBanner />)
    const pendingRow = screen.getByTestId(TestID.TokenDetailsAuctionBanner)
    const spacing = ['px', 'py', 'gap'].map((prop) => getOwnStyleProp(pendingRow, prop))
    expect(spacing).toEqual(['$spacing16', '$spacing12', '$spacing16'])

    mockDisplay()
    rerender(<TokenDetailsAuctionBanner />)

    const resolvedRow = screen.getByTestId(TestID.TokenDetailsAuctionBanner)
    expect(['px', 'py', 'gap'].map((prop) => getOwnStyleProp(resolvedRow, prop))).toEqual(spacing)
    expect(resolvedRow).not.toHaveAttribute('aria-busy', 'true')
    fireEvent.click(resolvedRow)
    expect(mockNavigate).toHaveBeenCalledTimes(1)
  })

  it('does not insert a placeholder for a late pool lookup after ordinary content has rendered', () => {
    mockDisplay({ isInitialLoading: false, poolAvailability: PoolAvailability.Loading })

    render(<TokenDetailsAuctionBanner />)

    expect(screen.queryByTestId(TestID.TokenDetailsAuctionBanner)).toBeNull()
  })

  it('does not reserve a live-banner placeholder for an upcoming auction', () => {
    mockDisplay({
      isInitialLoading: true,
      phase: AuctionDisplayPhase.Upcoming,
      poolAvailability: PoolAvailability.Loading,
    })

    render(<TokenDetailsAuctionBanner />)

    expect(screen.queryByTestId(TestID.TokenDetailsAuctionBanner)).toBeNull()
  })

  it('removes the initial placeholder when a fresh response confirms there is no pool', () => {
    mockDisplay({ isInitialLoading: true, poolAvailability: PoolAvailability.Loading })
    const { rerender } = render(<TokenDetailsAuctionBanner />)
    expect(screen.getByTestId(TestID.TokenDetailsAuctionBanner)).toHaveAttribute('aria-busy', 'true')

    mockDisplay({ poolAvailability: PoolAvailability.NoPool, shouldShowSwap: false })
    rerender(<TokenDetailsAuctionBanner />)

    expect(screen.queryByTestId(TestID.TokenDetailsAuctionBanner)).toBeNull()
  })

  it('renders nothing for quick launches', () => {
    mockDisplay({ auction: { ...AUCTION, isQuickLaunch: true }, launchMethod: LaunchProvenanceMethod.CrowdLaunch })

    render(<TokenDetailsAuctionBanner />)

    expect(screen.queryByTestId(TestID.TokenDetailsAuctionBanner)).toBeNull()
  })

  it('renders nothing when the service has not classified the launch method', () => {
    mockDisplay({ launchMethod: LaunchProvenanceMethod.Unknown })

    render(<TokenDetailsAuctionBanner />)

    expect(screen.queryByTestId(TestID.TokenDetailsAuctionBanner)).toBeNull()
  })

  it('renders nothing before the auction starts', () => {
    mockDisplay({ phase: AuctionDisplayPhase.Upcoming, phaseEndsAtMs: undefined })

    render(<TokenDetailsAuctionBanner />)

    expect(screen.queryByTestId(TestID.TokenDetailsAuctionBanner)).toBeNull()
  })

  it('renders nothing when pool availability could not be confirmed', () => {
    mockDisplay({ poolAvailability: PoolAvailability.Error })

    render(<TokenDetailsAuctionBanner />)

    expect(screen.queryByTestId(TestID.TokenDetailsAuctionBanner)).toBeNull()
  })

  it('keeps the live banner and auction link when the end estimate is unavailable', () => {
    mockDisplay({ phaseEndsAtMs: undefined })

    render(<TokenDetailsAuctionBanner />)

    expect(screen.getByText('Auction in progress')).toBeInTheDocument()
    expect(screen.queryByText(/\d+[dhms]/)).toBeNull()
    fireEvent.click(screen.getByTestId(TestID.TokenDetailsAuctionBanner))
    expect(mockNavigate.mock.calls[0]?.[0]).toMatch(new RegExp(`^/explore/auctions/ethereum/${AUCTION_ADDRESS}$`, 'i'))
  })

  it('renders nothing once the auction has ended', () => {
    mockDisplay({ phase: AuctionDisplayPhase.Ended, result: AuctionDisplayResult.Successful, phaseEndsAtMs: undefined })

    render(<TokenDetailsAuctionBanner />)

    expect(screen.queryByTestId(TestID.TokenDetailsAuctionBanner)).toBeNull()
  })

  it('renders nothing while the token has no pool, where the side card takes over', () => {
    mockDisplay({ poolAvailability: PoolAvailability.NoPool, shouldShowSwap: false })

    render(<TokenDetailsAuctionBanner />)

    expect(screen.queryByTestId(TestID.TokenDetailsAuctionBanner)).toBeNull()
  })

  it('renders nothing without a resolved auction', () => {
    mockDisplay({
      auction: undefined,
      launchMethod: LaunchProvenanceMethod.Unknown,
      phase: AuctionDisplayPhase.Unknown,
      poolAvailability: PoolAvailability.Loading,
      phaseEndsAtMs: undefined,
    })

    render(<TokenDetailsAuctionBanner />)

    expect(screen.queryByTestId(TestID.TokenDetailsAuctionBanner)).toBeNull()
  })
})
