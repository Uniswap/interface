import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { TradeTokenBanner } from '~/features/Toucan/Auction/Banners/TradeTokenBanner'
import { useAuctionDisplayState } from '~/features/Toucan/Auction/hooks/useAuctionDisplayState'
import {
  AuctionDisplayPhase,
  AuctionDisplayResult,
  PoolAvailability,
  type AuctionDisplayState,
} from '~/features/Toucan/Auction/utils/resolveAuctionDisplayState'
import { getOwnStyleProp } from '~/test-utils/getOwnStyleProp'
import { fireEvent, render, screen } from '~/test-utils/render'

const mockNavigate = vi.fn()
const mockPrefetchAuction = vi.fn()
vi.mock('~/pages/TokenDetails/hooks/usePrefetchTokenDetailsAuction', () => ({
  usePrefetchTokenDetailsAuction: () => mockPrefetchAuction,
}))
vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}))
vi.mock('~/features/Toucan/Auction/hooks/useAuctionDisplayState', () => ({
  useAuctionDisplayState: vi.fn(),
}))

const TOKEN_ADDRESS = '0xE172e9B6cfBeeB5593bDcE3f077356FDb33af904'
const mockStoreState = {
  auctionDetails: { chainId: UniverseChainId.Mainnet, tokenAddress: TOKEN_ADDRESS, tokenSymbol: 'FOLD' },
  tokenColor: '#4C82FB',
}
vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}))

const LIVE_WITH_POOL: AuctionDisplayState = {
  phase: AuctionDisplayPhase.Live,
  result: AuctionDisplayResult.Unknown,
  poolAvailability: PoolAvailability.HasPool,
  shouldShowSwap: true,
}

describe('TradeTokenBanner', () => {
  beforeEach(() => {
    mockNavigate.mockReset()
    mockPrefetchAuction.mockClear()
    mockStoreState.auctionDetails.chainId = UniverseChainId.Mainnet
  })

  it('links to the token details page of the auctioned token', () => {
    vi.mocked(useAuctionDisplayState).mockReturnValue(LIVE_WITH_POOL)

    render(<TradeTokenBanner />)
    fireEvent.click(screen.getByText('Buy or sell FOLD'))

    expect(mockNavigate).toHaveBeenCalledTimes(1)
    expect(mockNavigate.mock.calls[0]?.[0]).toMatch(new RegExp(`^/explore/tokens/ethereum/${TOKEN_ADDRESS}$`, 'i'))
  })

  it('renders nothing while the pool lookup is still loading', () => {
    vi.mocked(useAuctionDisplayState).mockReturnValue({ ...LIVE_WITH_POOL, poolAvailability: PoolAvailability.Loading })

    render(<TradeTokenBanner />)

    expect(screen.queryByTestId(TestID.ToucanTradeTokenBanner)).toBeNull()
  })

  it('uses the route slug when the GraphQL chain name differs', () => {
    mockStoreState.auctionDetails.chainId = UniverseChainId.UnichainSepolia
    vi.mocked(useAuctionDisplayState).mockReturnValue(LIVE_WITH_POOL)

    render(<TradeTokenBanner />)
    fireEvent.click(screen.getByText('Buy or sell FOLD'))

    expect(mockNavigate).toHaveBeenCalledWith(`/explore/tokens/unichain_sepolia/${TOKEN_ADDRESS}`)
    expect(mockPrefetchAuction).toHaveBeenLastCalledWith({
      chainId: UniverseChainId.UnichainSepolia,
      tokenAddress: TOKEN_ADDRESS,
    })
  })

  it('warms the token auction lookup on hover, focus, and activation without navigating early', () => {
    vi.mocked(useAuctionDisplayState).mockReturnValue(LIVE_WITH_POOL)
    render(<TradeTokenBanner />)
    const button = screen.getByRole('button', { name: 'Buy or sell FOLD' })

    fireEvent.mouseEnter(button)
    fireEvent.focus(button)

    expect(mockPrefetchAuction).toHaveBeenCalledTimes(2)
    expect(mockNavigate).not.toHaveBeenCalled()

    fireEvent.click(button)

    expect(mockPrefetchAuction).toHaveBeenLastCalledWith({
      chainId: UniverseChainId.Mainnet,
      tokenAddress: TOKEN_ADDRESS,
    })
    expect(mockPrefetchAuction).toHaveBeenCalledTimes(3)
    expect(mockNavigate).toHaveBeenCalledTimes(1)
  })

  it('tints the trade link with the extracted token color', () => {
    vi.mocked(useAuctionDisplayState).mockReturnValue(LIVE_WITH_POOL)

    render(<TradeTokenBanner />)

    const banner = screen.getByTestId(TestID.ToucanTradeTokenBanner)
    expect(getOwnStyleProp(banner, 'backgroundColor')).toBe('#4C82FB14')
    expect(getOwnStyleProp(banner, 'borderColor')).toBe('#4C82FB14')
  })
})
