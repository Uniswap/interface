import { UniverseChainId } from '@universe/chains'
import type { MediaState } from '@universe/mycelium/theme-hooks-compat'
import { beforeEach, describe, expect, it, vi } from 'vitest'
import { AuctionHeader } from '~/features/Toucan/Auction/AuctionHeader'
import type { AuctionLiquidityLockData } from '~/features/Toucan/Auction/hooks/useAuctionLiquidityLock'
import type { AuctionDetails } from '~/features/Toucan/Auction/store/types'
import { fireEvent, render, screen } from '~/test-utils/render'

const mockMedia = vi.fn<() => Partial<MediaState>>()
const mockPrefetchAuction = vi.fn()
const mockRedemption = { isRedeemable: false, realTokenAddress: undefined as string | undefined }

vi.mock('~/pages/TokenDetails/hooks/usePrefetchTokenDetailsAuction', () => ({
  usePrefetchTokenDetailsAuction: () => mockPrefetchAuction,
}))

// AuctionHeader reads useMedia from the mycelium compat; unconverted children still read ui/src.
// Both mocks feed the same state so the whole tree agrees on the viewport.
vi.mock('@universe/mycelium/theme-hooks-compat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/mycelium/theme-hooks-compat')>()
  return { ...actual, useMedia: () => mockMedia() }
})

vi.mock('ui/src', async (importOriginal) => {
  const actual = await importOriginal<typeof import('ui/src')>()
  return { ...actual, useMedia: () => mockMedia() }
})

const mockStoreState = {
  auctionDetails: null as AuctionDetails | null,
  currentBlockNumber: undefined as number | undefined,
}

vi.mock('~/features/Toucan/Auction/store/useAuctionStore', () => ({
  useAuctionStore: (selector: (state: typeof mockStoreState) => unknown) => selector(mockStoreState),
}))

const mockLock: Partial<AuctionLiquidityLockData> = {
  isLocked: true,
  isPermanentlyLocked: false,
  isBuybackEnabled: true,
  unlockDateFormatted: '12/31/2026',
  hasBurnedTokens: false,
}

vi.mock('~/features/Toucan/Auction/hooks/useAuctionLiquidityLock', () => ({
  useAuctionLiquidityLock: () => mockLock,
}))

vi.mock('~/features/Toucan/Auction/hooks/useAuctionRedemption', () => ({
  useAuctionRedemption: () => mockRedemption,
}))

vi.mock('~/features/Toucan/Auction/hooks/useIsQuickLaunchAuction', () => ({
  useIsQuickLaunchAuction: () => false,
}))

vi.mock('@universe/gating', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/gating')>()
  return { ...actual, useDynamicConfigValue: () => [] }
})

vi.mock('~/hooks/useHorizontalScrollFades', () => ({
  useHorizontalScrollFades: () => ({ scrollerRef: () => {}, edgeFades: { left: false, right: true } }),
}))

const SYMBOL = 'HOOD'
const CHAIN_ID = UniverseChainId.Base
const CHAIN_LABEL = 'Base'
const NETWORK_BADGE_TEST_ID = `network-logo-${CHAIN_ID}`
const TOKEN_ADDRESS = '0x208453956fC92c923A44fB8D21DAccCeaFe42D98'
const LOCKED_LABEL = 'Locked liquidity'
const BUYBACK_LABEL = 'Buyback enabled'

const DESKTOP: Partial<MediaState> = { sm: false, md: false }
const MOBILE_WEB: Partial<MediaState> = { sm: true, md: true }

function buildAuctionDetails(): AuctionDetails {
  return {
    auctionId: 'auction-1',
    chainId: CHAIN_ID,
    tokenAddress: TOKEN_ADDRESS,
    tokenSymbol: SYMBOL,
    tokenImageUrl: '',
  } as unknown as AuctionDetails
}

// The metadata row's scroller — the element carrying the horizontal scroll and the edge fade.
// Anything inside it shares the badge line; anything outside it sits on a line of its own.
function getScroller(container: HTMLElement): HTMLElement | null {
  return container.querySelector<HTMLElement>('.scrollbar-hidden')
}

/** Elements owning a non-empty text node directly — i.e. every rendered label. */
function getLabelElements(root: HTMLElement): HTMLElement[] {
  return Array.from(root.querySelectorAll<HTMLElement>('*')).filter((element) =>
    Array.from(element.childNodes).some((node) => node.nodeType === Node.TEXT_NODE && node.textContent?.trim()),
  )
}

function getOwnText(element: HTMLElement): string {
  return Array.from(element.childNodes)
    .filter((node) => node.nodeType === Node.TEXT_NODE)
    .map((node) => node.textContent?.trim())
    .join('')
}

// Style props compile to CSS classes that jsdom never resolves, so getComputedStyle reports
// nothing — the class is the only observable form the rendered nowrap takes here. Accepted
// spellings: Tamagui atomic, its `$platform-web` prefixed variant, and mycelium's Tailwind utility.
const NO_WRAP_CLASSES = ['_whiteSpace-nowrap', '_whiteSpace-_platformweb_nowrap', 'whitespace-nowrap']

function isNoWrap(element: HTMLElement): boolean {
  return NO_WRAP_CLASSES.some((className) => element.classList.contains(className))
}

/** The logo's chain badge, which stands in for the metadata row wherever that row names no network. */
function getLogoNetworkBadge(container: HTMLElement): HTMLElement | null {
  return container.querySelector<HTMLElement>(`[data-testid="token-logo"] [data-testid="${NETWORK_BADGE_TEST_ID}"]`)
}

describe('AuctionHeader', () => {
  beforeEach(() => {
    mockPrefetchAuction.mockClear()
    mockRedemption.isRedeemable = false
    mockRedemption.realTokenAddress = undefined
    mockStoreState.auctionDetails = buildAuctionDetails()
    mockMedia.mockReturnValue(DESKTOP)
  })

  it.each([false, true])('warms the token-link destination on interaction, redeemable=%s', (isRedeemable) => {
    const realTokenAddress = '0x1111111111111111111111111111111111111111'
    mockRedemption.isRedeemable = isRedeemable
    mockRedemption.realTokenAddress = realTokenAddress
    const { container } = render(<AuctionHeader />)
    const tokenAddress = isRedeemable ? realTokenAddress : TOKEN_ADDRESS
    const link = container.querySelector(`a[href*="${tokenAddress}"]`)
    expect(link).not.toBeNull()
    expect(mockPrefetchAuction).not.toHaveBeenCalled()

    fireEvent.mouseEnter(link as Element)
    fireEvent.focus(link as Element)
    fireEvent.pointerDown(link as Element)

    expect(mockPrefetchAuction).toHaveBeenCalledTimes(3)
    expect(mockPrefetchAuction).toHaveBeenLastCalledWith({ chainId: CHAIN_ID, tokenAddress })
  })

  // Hard rule from design: a badge label is single-line at every width — the row scrolls instead. The
  // guarantee has to sit on the text node itself, since an unshrinkable chip around a wrappable label
  // still wraps.
  describe('badge labels never wrap', () => {
    it.each([
      ['desktop', DESKTOP],
      ['mobile web', MOBILE_WEB],
    ])('keeps every metadata-row label on one line on %s', (_name, media) => {
      mockMedia.mockReturnValue(media)

      const { container } = render(<AuctionHeader />)
      const scroller = getScroller(container)
      expect(scroller).not.toBeNull()

      const labels = getLabelElements(scroller as HTMLElement)
      expect(labels.length).toBeGreaterThan(0)
      // Reported as the offending labels rather than a boolean, so a regression names what wrapped.
      expect(labels.filter((label) => !isNoWrap(label)).map(getOwnText)).toEqual([])
    })
  })

  // On mobile web the ticker shares the badges' line rather than taking one of its own, so it rides in
  // the same scroller with the same edge fade. Desktop keeps the ticker inline after the name.
  describe('mobile web ticker line', () => {
    beforeEach(() => {
      mockMedia.mockReturnValue(MOBILE_WEB)
    })

    it('puts the ticker in the badge carousel, ahead of the badges', () => {
      const { container } = render(<AuctionHeader />)

      const texts = getLabelElements(getScroller(container) as HTMLElement).map(getOwnText)
      expect(texts).toEqual([SYMBOL, LOCKED_LABEL, BUYBACK_LABEL])
    })

    it('renders the ticker once in the header — no separate subtitle line', () => {
      const { container } = render(<AuctionHeader />)

      // The breadcrumb trail names the token too; only the header's own copies are in scope here.
      const breadcrumb = container.querySelector('[aria-label="breadcrumb-nav"]')
      const tickers = getLabelElements(container).filter(
        (element) => getOwnText(element) === SYMBOL && !breadcrumb?.contains(element),
      )
      expect(tickers).toHaveLength(1)
      expect(getScroller(container)?.contains(tickers[0] ?? null)).toBe(true)
    })

    it('falls back to the subtitle line when the compact header drops the metadata row', () => {
      const { container } = render(<AuctionHeader isCompact />)

      expect(getScroller(container)).toBeNull()
      expect(screen.getByText(SYMBOL)).toBeInTheDocument()
    })
  })

  describe('desktop metadata row', () => {
    it('keeps the ticker out of the row and names the network in it', () => {
      const { container } = render(<AuctionHeader />)

      const texts = getLabelElements(getScroller(container) as HTMLElement).map(getOwnText)
      expect(texts).toContain(CHAIN_LABEL)
      expect(texts).not.toContain(SYMBOL)

      // The ticker is the title row's inline h2 at this width.
      expect(screen.getByRole('heading', { level: 2, name: SYMBOL })).toBeInTheDocument()
    })
  })

  // The network is named exactly once at every width: by the metadata row where that row is rendered,
  // by the logo's chain badge everywhere else — mobile web, where the row drops its network entry, and
  // the compact header, which drops the row altogether. The ticker joining the row on mweb doesn't
  // change which side names the network.
  describe('the network is named exactly once', () => {
    it('names it in the metadata row on desktop, with no badge on the logo', () => {
      const { container } = render(<AuctionHeader />)

      expect(getLogoNetworkBadge(container)).toBeNull()
      expect(getLabelElements(getScroller(container) as HTMLElement).map(getOwnText)).toContain(CHAIN_LABEL)
    })

    it('names it on the logo at $sm, where the row drops its network entry', () => {
      mockMedia.mockReturnValue(MOBILE_WEB)

      const { container } = render(<AuctionHeader />)

      expect(getLogoNetworkBadge(container)).toBeInTheDocument()
      expect(getLabelElements(getScroller(container) as HTMLElement).map(getOwnText)).not.toContain(CHAIN_LABEL)
    })

    it('names it on the logo in the compact desktop header, which has no metadata row', () => {
      const { container } = render(<AuctionHeader isCompact />)

      expect(getScroller(container)).toBeNull()
      expect(getLogoNetworkBadge(container)).toBeInTheDocument()
    })
  })
})
