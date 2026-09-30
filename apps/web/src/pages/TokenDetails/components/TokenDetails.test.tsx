import type { PlainMessage } from '@bufbuild/protobuf'
import { AuctionType, type Auction } from '@uniswap/client-data-api/dist/data/v1/auction_pb'
import { Token } from '@uniswap/sdk-core'
import { UniverseChainId } from '@universe/chains'
import { TestID } from '@universe/test'
import type { ComponentProps, ReactNode } from 'react'
import { logger } from 'utilities/src/logger/logger'
import { TokenDetailsContent } from '~/pages/TokenDetails/components/TokenDetails'
import { TokenDetailsAuctionDisplayProvider } from '~/pages/TokenDetails/context/TokenDetailsAuctionDisplayProvider'
import { TokenDetailsSourceState } from '~/pages/TokenDetails/context/tokenDetailsSourceState'
import type { TokenDetailsAuctionSource } from '~/pages/TokenDetails/hooks/useTokenDetailsAuction'
import { mockMediaSize } from '~/test-utils/mockMediaSize'
import { render, screen, within } from '~/test-utils/render'
import type { TokenPoolState } from '~/types/tokenPool'

// `useMedia` drives `isDesktop`, which decides which of the two placements TokenDetailsContent
// hands the single warning card to: its own left panel, or TDPSwapComponent.
vi.mock('@universe/mycelium/theme-hooks-compat', async (importOriginal) => {
  const actual = await importOriginal<typeof import('@universe/mycelium/theme-hooks-compat')>()
  return { ...actual, useMedia: vi.fn() }
})

// Two bugs are guarded here. The first: below desktop the left panel rendered no warning at all,
// because only TDPSwapComponent (visually hidden there via a CSS `display` toggle, not unmounted)
// carried the card. The second: with a card in both places, smaller widths mounted two of them and
// doubled the card's Blockaid fee-comparison analytics. jsdom doesn't apply the Tailwind `display`
// utility classes Mycelium's `Flex` renders, so a hidden subtree still counts as mounted here —
// which is exactly what makes the one-card assertions below meaningful.
vi.mock('~/pages/TokenDetails/hooks/useTDPTokenWarningDisplay', () => ({
  useTDPTokenWarningDisplay: () => ({
    warningCard: <div data-testid="tdp-warning-card" />,
    warningModal: <div data-testid="tdp-warning-modal" />,
  }),
}))

// Renders whatever card it is handed, so a double mount would show up as two cards.
vi.mock('~/pages/TokenDetails/components/swap/TDPSwapComponent', () => ({
  TDPSwapComponent: ({ warningCard }: { warningCard?: ReactNode }) => <>Token swap{warningCard}</>,
}))
vi.mock('~/pages/TokenDetails/components/skeleton/Skeleton', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/pages/TokenDetails/components/skeleton/Skeleton')>()
  return {
    ...actual,
    TokenDetailsLayout: (props: ComponentProps<typeof actual.TokenDetailsLayout>) => (
      <actual.TokenDetailsLayout {...props} testID="tdp-layout" />
    ),
  }
})

const mockToken = new Token(
  UniverseChainId.Mainnet,
  '0xc02aaa39b223fe8d0a0e5c4f27ead9083c756cc2',
  18,
  'WETH',
  'Wrapped Ether',
)
let mockAuctionSource: TokenDetailsAuctionSource = { status: TokenDetailsSourceState.Disabled }
let mockPools: TokenPoolState = { status: 'loading' }
let mockBannerShouldThrow = false
let mockProvenanceShouldThrow = false
const mockAuction = {
  address: '0x1111111111111111111111111111111111111111',
  tokenAddress: mockToken.address,
  startBlock: '100',
  endBlock: '200',
  isQuickLaunch: false,
  createdAt: '2026-08-08T12:00:00Z',
} as PlainMessage<Auction>

vi.mock('~/pages/TokenDetails/context/useTDPStore', () => ({
  useTDPStore: (
    selector: (s: {
      tokenQuery: { data: undefined }
      currencyChainId: number
      multiChainMap: Record<string, never>
      marketDataLoading: boolean
      address: string
      currency: Token
      pageQueryLoading: boolean
      auctionSource: TokenDetailsAuctionSource
    }) => unknown,
  ) =>
    selector({
      tokenQuery: { data: undefined },
      currencyChainId: mockToken.chainId,
      multiChainMap: {},
      marketDataLoading: false,
      address: mockToken.address,
      currency: mockToken,
      pageQueryLoading: false,
      auctionSource: mockAuctionSource,
    }),
}))

vi.mock('~/features/Toucan/Auction/hooks/useAuctionDisplayDataSources', () => ({
  useAuctionDisplayDataSources: () => ({
    currentBlock: { status: 'success', blockNumber: 150n },
    currencyRaised: { status: 'idle' },
    pools: mockPools,
    refetchCurrentBlock: vi.fn(),
  }),
}))

vi.mock('~/pages/TokenDetails/hooks/useMultichainTokenEntries', () => ({
  useMultichainTokenEntries: () => [],
}))

vi.mock('uniswap/src/features/tokens/useCurrencyInfo', () => ({
  useCurrencyInfo: () => undefined,
}))

vi.mock('uniswap/src/features/chains/hooks/useEnabledChains', () => ({
  useEnabledChains: () => ({
    isTestnetModeEnabled: false,
    chains: [],
    gqlChains: [],
    defaultChainId: UniverseChainId.Mainnet,
  }),
}))

vi.mock('~/pages/TokenDetails/components/earn/useTokenDetailsEarnData', () => ({
  useTokenDetailsEarnData: () => ({
    balanceUsd: 0,
    earnPosition: undefined,
    earnVault: undefined,
    hasLoadedPositions: true,
    isError: false,
    isLoggedIn: false,
    projectedAnnualEarningsUsd: 0,
    refetch: vi.fn(),
    showEarnError: false,
    tokenSymbol: mockToken.symbol,
    userHasEarnPosition: false,
  }),
}))

vi.mock('~/pages/TokenDetails/components/earn/useTokenDetailsVaultShareData', () => ({
  useTokenDetailsVaultShareData: () => ({
    vault: undefined,
    underlyingCurrencyInfo: undefined,
    isLoggedIn: false,
    hasLoadedPositions: true,
    userHasPosition: false,
  }),
}))

vi.mock('~/pages/TokenDetails/hooks/useTDPRWAMatch', () => ({
  useTDPRWAMatch: () => undefined,
}))

vi.mock('uniswap/src/features/rwa/useLogRWATokenDetailsViewed', () => ({
  useLogRWATokenDetailsViewed: () => undefined,
}))

// The rest of the page body is irrelevant to this test — stub it out so the composition under
// test (warning card/modal across breakpoints) isn't affected by unrelated data requirements.
vi.mock('~/pages/TokenDetails/components/header/TDPBreadcrumb', () => ({ TDPBreadcrumb: () => null }))
vi.mock('~/pages/TokenDetails/components/header/TokenDetailsHeader', () => ({ TokenDetailsHeader: () => null }))
vi.mock('~/pages/TokenDetails/components/earn/TokenDetailsVaultShareBanner', () => ({
  TokenDetailsVaultShareBanner: () => null,
}))
vi.mock('~/pages/TokenDetails/components/chart/ChartSection', () => ({
  ChartSection: () => <div>Token chart</div>,
}))
vi.mock('~/pages/TokenDetails/components/auction/TokenDetailsAuctionCard', () => ({
  TokenDetailsAuctionCard: () => <div data-testid={TestID.TokenDetailsAuctionCard} />,
}))
vi.mock('~/pages/TokenDetails/components/auction/TokenDetailsAuctionBanner', async (importOriginal) => {
  const actual =
    await importOriginal<typeof import('~/pages/TokenDetails/components/auction/TokenDetailsAuctionBanner')>()
  return {
    ...actual,
    TokenDetailsAuctionBanner: () => {
      if (mockBannerShouldThrow) {
        throw new Error('auction banner failed')
      }
      return <actual.TokenDetailsAuctionBanner />
    },
  }
})
vi.mock('~/pages/TokenDetails/components/info/TokenProvenance', async (importOriginal) => {
  const actual = await importOriginal<typeof import('~/pages/TokenDetails/components/info/TokenProvenance')>()
  return {
    ...actual,
    TokenProvenance: () => {
      if (mockProvenanceShouldThrow) {
        throw new Error('auction provenance failed')
      }
      return <actual.TokenProvenance />
    },
  }
})
vi.mock('~/pages/TokenDetails/components/rwa/OffHoursLiquidityBanner', () => ({ OffHoursLiquidityBanner: () => null }))
vi.mock('~/pages/TokenDetails/components/earn/TokenDetailsEarnBanner', () => ({ TokenDetailsEarnBanner: () => null }))
vi.mock('~/pages/TokenDetails/components/balances/BalanceSummary', () => ({ BalanceSummary: () => null }))
vi.mock('~/pages/TokenDetails/components/info/BridgedAssetSection', () => ({ BridgedAssetSection: () => null }))
vi.mock('~/pages/TokenDetails/components/info/StatsSection', () => ({
  StatsSection: () => <div data-testid="tdp-stats" />,
}))
vi.mock('~/pages/TokenDetails/components/info/TokenDescription', () => ({ TokenDescription: () => null }))
vi.mock('~/pages/TokenDetails/components/activity/ActivitySection', () => ({
  ActivitySection: () => <div>Token activity</div>,
}))
vi.mock('~/pages/TokenDetails/components/rwa/MoreWaysToTrade', () => ({ MoreWaysToTrade: () => null }))
vi.mock('~/pages/TokenDetails/components/rwa/RelatedTokens', () => ({ RelatedTokens: () => null }))
vi.mock('~/pages/TokenDetails/components/earn/TokenDetailsEarnSection', () => ({ TokenDetailsEarnSection: () => null }))
vi.mock('~/pages/TokenDetails/components/performance/TokenPerformance', () => ({ TokenPerformance: () => null }))
vi.mock('~/components/NavBar/MobileBottomBar', () => ({
  MobileBottomBar: ({ children }: { children: ReactNode }) => <>{children}</>,
  TDPActionTabs: () => <div>Buy or sell token</div>,
}))

function TokenDetailsWithDisplay(): JSX.Element {
  return (
    <TokenDetailsAuctionDisplayProvider>
      <TokenDetailsContent isCompact={false} />
    </TokenDetailsAuctionDisplayProvider>
  )
}

describe('TokenDetailsContent', () => {
  beforeEach(() => {
    mockAuctionSource = { status: TokenDetailsSourceState.Disabled }
    mockPools = { status: 'loading' }
    mockBannerShouldThrow = false
    mockProvenanceShouldThrow = false
  })

  afterEach(() => {
    vi.restoreAllMocks()
  })

  it.each(['sm', 'xxl'] as const)('uses initial auction loading without mounting Swap at %s', (mediaSize) => {
    mockMediaSize(mediaSize)
    mockAuctionSource = {
      status: TokenDetailsSourceState.Found,
      auction: { ...mockAuction, auctionType: AuctionType.CUSTOM },
    }
    const { container, rerender } = render(<TokenDetailsWithDisplay />)

    expect(screen.getByText('Token chart')).toBeInTheDocument()
    expect(screen.queryByText('Token swap')).toBeNull()
    expect(screen.queryByText('Buy or sell token')).toBeNull()
    expect(container.querySelector('[aria-busy="true"]')).not.toBeNull()

    mockPools = { status: 'success', poolCount: 1 }
    rerender(<TokenDetailsWithDisplay />)
    expect(screen.getByText('Token swap')).toBeInTheDocument()
    expect(container.querySelector('[aria-busy="true"]')).toBeNull()

    mockPools = { status: 'loading' }
    rerender(<TokenDetailsWithDisplay />)
    expect(screen.getByText('Token swap')).toBeInTheDocument()
    expect(container.querySelector('[aria-busy="true"]')).toBeNull()
  })

  it('keeps the normal chart and swap without provenance when the auction resolves as not found', () => {
    mockMediaSize('xxl')
    mockAuctionSource = { status: TokenDetailsSourceState.NotFound }

    render(<TokenDetailsWithDisplay />)

    expect(screen.getByText('Token chart')).toBeInTheDocument()
    expect(within(screen.getByTestId(TestID.TokenDetailsSwap)).getByText('Token swap')).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.TokenDetailsProvenance)).not.toBeInTheDocument()
    expect(screen.getByTestId('tdp-layout')).not.toHaveClass('mt-[24px]')
  })

  it('mounts exactly one warning card below desktop, in the left panel', () => {
    mockMediaSize('sm')

    render(<TokenDetailsWithDisplay />)

    // One card in total, and it is *not* the swap widget's placement — asserting only the count
    // would stay green if the two placement conditions were swapped.
    expect(screen.getAllByTestId('tdp-warning-card')).toHaveLength(1)
    expect(within(screen.getByTestId(TestID.TokenDetailsSwap)).queryAllByTestId('tdp-warning-card')).toHaveLength(0)
    expect(screen.getByTestId('tdp-warning-modal')).toBeInTheDocument()
  })

  it('mounts exactly one warning card at desktop, inside TDPSwapComponent', () => {
    // Above `xl`, so `isDesktop` is true and the card is handed to the swap widget instead. The
    // modal isn't gated on `isDesktop` — one instance serves whichever card is live, since both
    // placements share the same hook state.
    mockMediaSize('xxl')

    render(<TokenDetailsWithDisplay />)

    // One card in total, and it is the swap widget's placement that holds it.
    expect(screen.getAllByTestId('tdp-warning-card')).toHaveLength(1)
    expect(within(screen.getByTestId(TestID.TokenDetailsSwap)).getAllByTestId('tdp-warning-card')).toHaveLength(1)
    expect(screen.getByTestId('tdp-warning-modal')).toBeInTheDocument()
  })

  it.each([false, true])('preserves Swap and provenance for unknown method, isQuickLaunch=%s', (isQuickLaunch) => {
    mockMediaSize('sm')
    mockAuctionSource = { status: TokenDetailsSourceState.Found, auction: { ...mockAuction, isQuickLaunch } }
    mockPools = { status: 'success', poolCount: 0 }

    render(<TokenDetailsWithDisplay />)

    expect(screen.getByText('Token chart')).toBeInTheDocument()
    expect(screen.getByText('Token swap')).toBeInTheDocument()
    expect(screen.getByText('Buy or sell token')).toBeInTheDocument()
    expect(screen.getByTestId(TestID.TokenDetailsProvenance)).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.TokenDetailsAuctionCard)).toBeNull()
  })

  it.each(['sm', 'xxl'] as const)(
    'keeps ordinary trading after a Custom auction ends without a pool at %s',
    (mediaSize) => {
      mockMediaSize(mediaSize)
      mockAuctionSource = {
        status: TokenDetailsSourceState.Found,
        auction: { ...mockAuction, auctionType: AuctionType.CUSTOM, endBlock: '149' },
      }
      mockPools = { status: 'success', poolCount: 0 }

      render(<TokenDetailsWithDisplay />)

      expect(screen.getByText('Token chart')).toBeInTheDocument()
      expect(screen.getByText('Token swap')).toBeInTheDocument()
      expect(screen.getByText('Buy or sell token')).toBeInTheDocument()
      expect(screen.getByTestId(TestID.TokenDetailsProvenance)).toBeInTheDocument()
      expect(screen.queryByTestId(TestID.TokenDetailsAuctionCard)).toBeNull()
      expect(screen.getAllByTestId('tdp-warning-card')).toHaveLength(1)
    },
  )

  it.each(['sm', 'xxl'] as const)('replaces every Swap action for known Custom + NoPool at %s', (mediaSize) => {
    mockMediaSize(mediaSize)
    mockAuctionSource = {
      status: TokenDetailsSourceState.Found,
      auction: { ...mockAuction, auctionType: AuctionType.CUSTOM },
    }
    mockPools = { status: 'success', poolCount: 0 }

    render(<TokenDetailsWithDisplay />)

    const [auctionCard] = screen.getAllByTestId(TestID.TokenDetailsAuctionCard)
    expect(screen.getAllByTestId(TestID.TokenDetailsAuctionCard)).toHaveLength(1)
    expect(screen.queryByText('Token swap')).toBeNull()
    expect(screen.queryByText('Buy or sell token')).toBeNull()
    expect(screen.getAllByTestId('tdp-warning-card')).toHaveLength(1)
    expect(screen.getByTestId('tdp-warning-modal')).toBeInTheDocument()
    if (mediaSize === 'sm') {
      expect(auctionCard.compareDocumentPosition(screen.getByTestId('tdp-stats'))).toBe(
        Node.DOCUMENT_POSITION_FOLLOWING,
      )
    }
  })

  it('adds Live Custom context while preserving the full tradable page', () => {
    mockMediaSize('xxl')
    mockAuctionSource = {
      status: TokenDetailsSourceState.Found,
      auction: { ...mockAuction, auctionType: AuctionType.CUSTOM },
    }
    mockPools = { status: 'success', poolCount: 1 }

    render(<TokenDetailsWithDisplay />)

    expect(screen.getByTestId(TestID.TokenDetailsAuctionBanner)).toBeInTheDocument()
    expect(screen.getByTestId('tdp-layout')).toHaveClass('mt-[24px]')
    expect(screen.getByTestId(TestID.TokenDetailsProvenance)).toBeInTheDocument()
    expect(screen.getByText('Token chart')).toBeInTheDocument()
    expect(screen.getByText('Token swap')).toBeInTheDocument()
    expect(screen.getByText('Buy or sell token')).toBeInTheDocument()
    expect(screen.getByTestId('tdp-stats')).toBeInTheDocument()
    expect(screen.getByText('Token activity')).toBeInTheDocument()
    expect(screen.getAllByTestId('tdp-warning-card')).toHaveLength(1)
    expect(screen.getByTestId('tdp-warning-modal')).toBeInTheDocument()
    expect(screen.queryByTestId(TestID.TokenDetailsAuctionCard)).toBeNull()
  })

  it.each([
    ['banner', true],
    ['provenance', false],
  ] as const)(
    'contains a failing %s without removing normal features or the other auction section',
    (_section, failBanner) => {
      vi.spyOn(logger, 'error').mockImplementation(() => undefined)
      vi.spyOn(console, 'error').mockImplementation(() => undefined)
      mockMediaSize('xxl')
      mockAuctionSource = {
        status: TokenDetailsSourceState.Found,
        auction: { ...mockAuction, auctionType: AuctionType.CUSTOM },
      }
      mockPools = { status: 'success', poolCount: 1 }
      mockBannerShouldThrow = failBanner
      mockProvenanceShouldThrow = !failBanner

      render(<TokenDetailsWithDisplay />)

      const failedSection = failBanner ? TestID.TokenDetailsAuctionBanner : TestID.TokenDetailsProvenance
      const survivingSection = failBanner ? TestID.TokenDetailsProvenance : TestID.TokenDetailsAuctionBanner
      expect(screen.queryByTestId(failedSection)).toBeNull()
      expect(screen.getByTestId(survivingSection)).toBeInTheDocument()
      expect(screen.getByText('Token chart')).toBeInTheDocument()
      expect(screen.getByText('Token swap')).toBeInTheDocument()
      expect(screen.getByTestId('tdp-stats')).toBeInTheDocument()
      expect(screen.getByText('Token activity')).toBeInTheDocument()
      expect(screen.getAllByTestId('tdp-warning-card')).toHaveLength(1)
      expect(screen.getByTestId('tdp-warning-modal')).toBeInTheDocument()
    },
  )
})
