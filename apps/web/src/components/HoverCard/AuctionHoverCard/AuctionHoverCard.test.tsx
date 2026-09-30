import { UniverseChainId } from '@universe/chains'
import { logger } from 'utilities/src/logger/logger'
import {
  AuctionHoverCard,
  type AuctionHoverCardAuction,
} from '~/components/HoverCard/AuctionHoverCard/AuctionHoverCard'
import { useHoverCardState } from '~/components/HoverCard/HoverCard'
import { POPUP_MEDIUM_DISMISS_MS } from '~/components/Popups/constants'
import { popupRegistry } from '~/state/popups/registry'
import { PopupType } from '~/state/popups/types'
import { mocked } from '~/test-utils/mocked'
import { fireEvent, render, screen } from '~/test-utils/render'

const mockNavigate = vi.fn()

vi.mock('react-router', async (importOriginal) => ({
  ...(await importOriginal<typeof import('react-router')>()),
  useNavigate: () => mockNavigate,
}))

const useAuctionHoverCardData = vi.fn((_params: unknown) => ({
  fdvUsd: undefined,
  pricePercentChange: undefined,
  priceData: [],
  committedVolumeUsd: undefined,
  bidCount: undefined,
  loading: false,
}))

vi.mock('~/components/HoverCard/AuctionHoverCard/useAuctionHoverCardData', () => ({
  useAuctionHoverCardData: (params: unknown) => useAuctionHoverCardData(params),
}))

vi.mock('~/components/HoverCard/AuctionHoverCard/AuctionHoverCardContent', () => ({
  AuctionHoverCardContent: ({ onCopy, onExpand }: { onCopy?: () => void; onExpand: () => void }) => (
    <div data-testid="auction-hover-card-content" data-can-copy={onCopy !== undefined}>
      <button onClick={onExpand}>Expand</button>
    </div>
  ),
}))

vi.mock('@universe/mycelium', async (importOriginal) => ({
  ...(await importOriginal<typeof import('@universe/mycelium')>()),
  useIsTouchDevice: () => false,
}))

vi.mock('~/components/HoverCard/HoverCard', async (importOriginal) => ({
  ...(await importOriginal<typeof import('~/components/HoverCard/HoverCard')>()),
  useHoverCardState: vi.fn(),
}))

function mockHoverCardState(isOpen: boolean): void {
  mocked(useHoverCardState).mockReturnValue({
    isOpen,
    hasOpenIntent: isOpen,
    close: vi.fn(),
    onOpenChange: vi.fn(),
  })
}

beforeEach(() => {
  mockHoverCardState(true)
  useAuctionHoverCardData.mockClear()
  mockNavigate.mockClear()
})

describe('AuctionHoverCard navigation', () => {
  beforeEach(() => {
    vi.spyOn(logger, 'warn').mockImplementation(() => {})
    vi.spyOn(popupRegistry, 'addPopup').mockImplementation(() => {})
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it('opens the normalized auction URL and calls onNavigate when expanded', () => {
    const onNavigate = vi.fn()
    render(
      <AuctionHoverCard auction={auction} onNavigate={onNavigate}>
        <div>row</div>
      </AuctionHoverCard>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Expand' }))

    expect(mockNavigate).toHaveBeenCalledWith('/explore/auctions/ethereum/0x9084cb9a700a52909cbef3113db8bac01c01efd6')
    expect(onNavigate).toHaveBeenCalledOnce()
    expect(popupRegistry.addPopup).not.toHaveBeenCalled()
  })

  it('shows the navigation error instead of opening a malformed auction address', () => {
    render(
      <AuctionHoverCard auction={{ ...auction, auctionAddress: `0x${'g'.repeat(40)}` }}>
        <div>row</div>
      </AuctionHoverCard>,
    )

    fireEvent.click(screen.getByRole('button', { name: 'Expand' }))

    expect(mockNavigate).not.toHaveBeenCalled()
    expect(popupRegistry.addPopup).toHaveBeenCalledWith(
      { type: PopupType.Error, error: 'Unable to open auction' },
      'auction-navigation-error',
      POPUP_MEDIUM_DISMISS_MS,
    )
  })
})

const auction: AuctionHoverCardAuction = {
  chainId: UniverseChainId.Mainnet,
  auctionAddress: '0x9084CB9a700a52909Cbef3113dB8BaC01C01EfD6',
  tokenAddress: '0x9999B7E3cc6979223Ff1aF980b7D8B90B75d9999',
  tokenSymbol: 'FOO',
  tokenName: 'Foo',
  tokenLogoUrl: undefined,
  committedVolumeUsd: 188_800,
  uniqueBidderCount: 982,
}

function renderCard(auctionOverrides?: Partial<AuctionHoverCardAuction>) {
  return render(
    <AuctionHoverCard auction={{ ...auction, ...auctionOverrides }}>
      <div>row</div>
    </AuctionHoverCard>,
  )
}

describe('AuctionHoverCard', () => {
  it('stays closed until opened', () => {
    mockHoverCardState(false)
    renderCard()
    expect(screen.queryByTestId('auction-hover-card-content')).not.toBeInTheDocument()
    expect(useAuctionHoverCardData).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: false }))
  })

  it('fetches once opened', () => {
    renderCard()
    expect(screen.getByTestId('auction-hover-card-content')).toBeInTheDocument()
    expect(useAuctionHoverCardData).toHaveBeenLastCalledWith(expect.objectContaining({ enabled: true }))
  })

  it('offers copy only when the row carries a token address', () => {
    const { unmount } = renderCard()
    expect(screen.getByTestId('auction-hover-card-content')).toHaveAttribute('data-can-copy', 'true')
    unmount()

    renderCard({ tokenAddress: '' })
    expect(screen.getByTestId('auction-hover-card-content')).toHaveAttribute('data-can-copy', 'false')
  })
})
